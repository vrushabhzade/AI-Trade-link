import * as fc from 'fast-check';
import { negotiationService, NegotiationService } from '../negotiationService';
import { prisma } from '../../config/database';
import { NegotiationStatus } from '@prisma/client';

// Mock Prisma client
jest.mock('../../config/database', () => ({
  prisma: {
    negotiation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      $queryRawUnsafe: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  },
}));

// Mock price analysis service
jest.mock('../priceAnalysisService', () => ({
  getPriceAnalysisService: () => ({
    suggestCounterOffer: jest.fn().mockResolvedValue({
      suggestedPrice: 100,
      messageTemplate: 'Test suggestion',
      acceptanceProbability: 75,
      rationale: 'Test rationale',
      alternativeSuggestions: ['Alternative 1', 'Alternative 2']
    })
  })
}));

describe('NegotiationService Property Tests', () => {
  let service: NegotiationService;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    service = new NegotiationService();
    jest.clearAllMocks();
  });

  // Property-based test generators
  const negotiationDataGenerator = fc.record({
    productId: fc.uuid(),
    buyerId: fc.uuid(),
    vendorId: fc.uuid(),
    initialPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    buyerLanguage: fc.constantFrom('en', 'es', 'fr', 'hi', 'ar'),
    vendorLanguage: fc.constantFrom('en', 'es', 'fr', 'hi', 'ar'),
  });

  const negotiationGenerator = fc.record({
    id: fc.uuid(),
    productId: fc.uuid(),
    buyerId: fc.uuid(),
    vendorId: fc.uuid(),
    status: fc.constantFrom('ACTIVE', 'ACCEPTED', 'REJECTED', 'EXPIRED'),
    initialPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    currentOffer: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    finalPrice: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(1000) })),
    buyerLanguage: fc.constantFrom('en', 'es', 'fr', 'hi', 'ar'),
    vendorLanguage: fc.constantFrom('en', 'es', 'fr', 'hi', 'ar'),
    expiresAt: fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
    createdAt: fc.date({ max: new Date() }),
    updatedAt: fc.date({ max: new Date() }),
  });

  const priceOfferGenerator = fc.record({
    negotiationId: fc.uuid(),
    amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
    userId: fc.uuid(),
  });

  // Feature: tradelink-marketplace, Property 10: Negotiation Flow Integrity
  describe('Property 10: Negotiation Flow Integrity', () => {
    it('should maintain negotiation state consistency throughout the lifecycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          negotiationDataGenerator,
          fc.array(priceOfferGenerator, { minLength: 0, maxLength: 10 }),
          fc.constantFrom('accept', 'reject', 'expire'),
          async (initialData, offers, finalAction) => {
            // Mock initial negotiation creation
            const mockNegotiation = {
              ...initialData,
              id: 'test-negotiation-id',
              status: NegotiationStatus.ACTIVE,
              currentOffer: initialData.initialPrice,
              finalPrice: null,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              createdAt: new Date(),
              updatedAt: new Date(),
              product: { id: initialData.productId, currency: 'USD' },
              buyer: { id: initialData.buyerId, fullName: 'Test Buyer' },
              vendor: { 
                id: initialData.vendorId, 
                user: { id: 'vendor-user-id', fullName: 'Test Vendor' } 
              },
              messages: []
            };

            mockPrisma.negotiation.create.mockResolvedValue(mockNegotiation);
            mockPrisma.negotiation.findUnique.mockResolvedValue(mockNegotiation);
            mockPrisma.negotiation.findFirst.mockResolvedValue(mockNegotiation);

            // Property 1: Negotiation creation should preserve initial data
            const createdNegotiation = await service.createNegotiation(initialData);
            
            expect(createdNegotiation.productId).toBe(initialData.productId);
            expect(createdNegotiation.buyerId).toBe(initialData.buyerId);
            expect(createdNegotiation.vendorId).toBe(initialData.vendorId);
            expect(parseFloat(createdNegotiation.initialPrice.toString())).toBe(initialData.initialPrice);
            expect(createdNegotiation.status).toBe(NegotiationStatus.ACTIVE);

            // Property 2: Counter offers should update current offer but preserve initial price
            let currentNegotiation = { ...mockNegotiation };
            for (const offer of offers) {
              const updatedNegotiation = {
                ...currentNegotiation,
                currentOffer: offer.amount,
                updatedAt: new Date()
              };
              
              mockPrisma.negotiation.update.mockResolvedValue(updatedNegotiation);
              
              const result = await service.makeCounterOffer(currentNegotiation.id, offer.amount);
              
              // Current offer should be updated
              expect(parseFloat(result.currentOffer?.toString() || '0')).toBe(offer.amount);
              // Initial price should remain unchanged
              expect(parseFloat(result.initialPrice.toString())).toBe(initialData.initialPrice);
              // Status should remain active during counter offers
              expect(result.status).toBe(NegotiationStatus.ACTIVE);
              
              currentNegotiation = updatedNegotiation;
            }

            // Property 3: Final actions should change status appropriately
            let finalNegotiation;
            if (finalAction === 'accept') {
              const acceptedNegotiation = {
                ...currentNegotiation,
                status: NegotiationStatus.ACCEPTED,
                finalPrice: currentNegotiation.currentOffer,
                updatedAt: new Date()
              };
              
              mockPrisma.negotiation.update.mockResolvedValue(acceptedNegotiation);
              
              finalNegotiation = await service.acceptNegotiation(
                currentNegotiation.id, 
                parseFloat(currentNegotiation.currentOffer.toString())
              );
              
              expect(finalNegotiation.status).toBe(NegotiationStatus.ACCEPTED);
              expect(finalNegotiation.finalPrice).toBeDefined();
              
            } else if (finalAction === 'reject') {
              const rejectedNegotiation = {
                ...currentNegotiation,
                status: NegotiationStatus.REJECTED,
                updatedAt: new Date()
              };
              
              mockPrisma.negotiation.update.mockResolvedValue(rejectedNegotiation);
              
              finalNegotiation = await service.rejectNegotiation(currentNegotiation.id);
              
              expect(finalNegotiation.status).toBe(NegotiationStatus.REJECTED);
              
            } else if (finalAction === 'expire') {
              const expiredNegotiation = {
                ...currentNegotiation,
                status: NegotiationStatus.EXPIRED,
                updatedAt: new Date()
              };
              
              mockPrisma.negotiation.update.mockResolvedValue(expiredNegotiation);
              
              finalNegotiation = await service.expireNegotiation(currentNegotiation.id);
              
              expect(finalNegotiation.status).toBe(NegotiationStatus.EXPIRED);
            }

            // Property 4: Final negotiation should preserve all original data
            if (finalNegotiation) {
              expect(finalNegotiation.productId).toBe(initialData.productId);
              expect(finalNegotiation.buyerId).toBe(initialData.buyerId);
              expect(finalNegotiation.vendorId).toBe(initialData.vendorId);
              expect(parseFloat(finalNegotiation.initialPrice.toString())).toBe(initialData.initialPrice);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain price consistency during negotiation flow', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
          fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }), { minLength: 1, maxLength: 5 }),
          async (initialPrice, counterOffers) => {
            const negotiationId = 'test-negotiation-id';
            
            // Mock negotiation with initial price
            const mockNegotiation = {
              id: negotiationId,
              initialPrice,
              currentOffer: initialPrice,
              status: NegotiationStatus.ACTIVE,
              updatedAt: new Date()
            };

            mockPrisma.negotiation.findUnique.mockResolvedValue(mockNegotiation);

            // Property: All counter offers should be positive and preserve initial price
            let currentOffer = initialPrice;
            for (const offer of counterOffers) {
              const updatedNegotiation = {
                ...mockNegotiation,
                currentOffer: offer,
                updatedAt: new Date()
              };
              
              mockPrisma.negotiation.update.mockResolvedValue(updatedNegotiation);
              
              const result = await service.makeCounterOffer(negotiationId, offer);
              
              // All prices should be positive
              expect(parseFloat(result.currentOffer?.toString() || '0')).toBeGreaterThan(0);
              expect(parseFloat(result.initialPrice.toString())).toBeGreaterThan(0);
              
              // Initial price should never change
              expect(parseFloat(result.initialPrice.toString())).toBe(initialPrice);
              
              // Current offer should be updated
              expect(parseFloat(result.currentOffer?.toString() || '0')).toBe(offer);
              
              currentOffer = offer;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle negotiation expiration correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (expiredCount) => {
            // Mock expired negotiations
            mockPrisma.negotiation.updateMany.mockResolvedValue({ count: expiredCount });
            mockPrisma.negotiation.findMany.mockResolvedValue(
              Array.from({ length: expiredCount }, (_, i) => ({
                id: `expired-${i}`,
                status: NegotiationStatus.EXPIRED,
                updatedAt: new Date()
              }))
            );

            // Property: Expiration should return the correct count
            const result = await service.expireOldNegotiations();
            
            expect(result).toBe(expiredCount);
            expect(mockPrisma.negotiation.updateMany).toHaveBeenCalledWith({
              where: {
                status: NegotiationStatus.ACTIVE,
                expiresAt: {
                  lt: expect.any(Date)
                }
              },
              data: {
                status: NegotiationStatus.EXPIRED
              }
            });

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate negotiation statistics correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            total: fc.integer({ min: 0, max: 1000 }),
            active: fc.integer({ min: 0, max: 100 }),
            accepted: fc.integer({ min: 0, max: 100 }),
            rejected: fc.integer({ min: 0, max: 100 }),
            expired: fc.integer({ min: 0, max: 100 })
          }),
          fc.constantFrom('buyer', 'vendor'),
          async (counts, role) => {
            const userId = 'test-user-id';
            
            // Mock count queries
            mockPrisma.negotiation.count
              .mockResolvedValueOnce(counts.total)
              .mockResolvedValueOnce(counts.active)
              .mockResolvedValueOnce(counts.accepted)
              .mockResolvedValueOnce(counts.rejected)
              .mockResolvedValueOnce(counts.expired);

            // Property: Statistics should match mocked counts
            const stats = await service.getNegotiationStats(userId, role as 'buyer' | 'vendor');
            
            expect(stats.total).toBe(counts.total);
            expect(stats.active).toBe(counts.active);
            expect(stats.accepted).toBe(counts.accepted);
            expect(stats.rejected).toBe(counts.rejected);
            expect(stats.expired).toBe(counts.expired);

            // Property: All counts should be non-negative
            expect(stats.total).toBeGreaterThanOrEqual(0);
            expect(stats.active).toBeGreaterThanOrEqual(0);
            expect(stats.accepted).toBeGreaterThanOrEqual(0);
            expect(stats.rejected).toBeGreaterThanOrEqual(0);
            expect(stats.expired).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain negotiation integrity during concurrent operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              action: fc.constantFrom('counter_offer', 'accept', 'reject'),
              amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
              userId: fc.uuid()
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (operations) => {
            const negotiationId = 'test-negotiation-id';
            const initialPrice = 100;
            
            let mockNegotiation: any = {
              id: negotiationId,
              initialPrice,
              currentOffer: initialPrice,
              status: NegotiationStatus.ACTIVE,
              updatedAt: new Date()
            };

            mockPrisma.negotiation.findUnique.mockResolvedValue(mockNegotiation);
            mockPrisma.negotiation.findFirst.mockResolvedValue(mockNegotiation);

            // Property: Each operation should maintain data integrity
            for (const operation of operations) {
              if (mockNegotiation.status !== NegotiationStatus.ACTIVE) {
                // Skip operations on non-active negotiations
                continue;
              }

              if (operation.action === 'counter_offer') {
                const updatedNegotiation = {
                  ...mockNegotiation,
                  currentOffer: operation.amount,
                  updatedAt: new Date()
                };
                
                mockPrisma.negotiation.update.mockResolvedValue(updatedNegotiation);
                
                const result = await service.makeCounterOffer(negotiationId, operation.amount);
                
                // Property: Counter offer should update current offer but preserve initial price
                expect(parseFloat(result.currentOffer?.toString() || '0')).toBe(operation.amount);
                expect(parseFloat(result.initialPrice.toString())).toBe(initialPrice);
                expect(result.status).toBe(NegotiationStatus.ACTIVE);
                
                mockNegotiation = updatedNegotiation;
                
              } else if (operation.action === 'accept') {
                const acceptedNegotiation = {
                  ...mockNegotiation,
                  status: NegotiationStatus.ACCEPTED,
                  finalPrice: mockNegotiation.currentOffer,
                  updatedAt: new Date()
                };
                
                mockPrisma.negotiation.update.mockResolvedValue(acceptedNegotiation);
                
                const result = await service.acceptNegotiation(negotiationId, operation.amount);
                
                // Property: Accept should set final status and price
                expect(result.status).toBe(NegotiationStatus.ACCEPTED);
                expect(result.finalPrice).toBeDefined();
                expect(parseFloat(result.initialPrice.toString())).toBe(initialPrice);
                
                mockNegotiation = acceptedNegotiation;
                
              } else if (operation.action === 'reject') {
                const rejectedNegotiation = {
                  ...mockNegotiation,
                  status: NegotiationStatus.REJECTED,
                  updatedAt: new Date()
                };
                
                mockPrisma.negotiation.update.mockResolvedValue(rejectedNegotiation);
                
                const result = await service.rejectNegotiation(negotiationId);
                
                // Property: Reject should set final status
                expect(result.status).toBe(NegotiationStatus.REJECTED);
                expect(parseFloat(result.initialPrice.toString())).toBe(initialPrice);
                
                mockNegotiation = rejectedNegotiation;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for specific examples and edge cases
  describe('Unit Tests', () => {
    it('should create negotiation with default expiration', async () => {
      const negotiationData = {
        productId: 'product-1',
        buyerId: 'buyer-1',
        vendorId: 'vendor-1',
        initialPrice: 100,
        buyerLanguage: 'en',
        vendorLanguage: 'es'
      };

      const mockNegotiation = {
        ...negotiationData,
        id: 'negotiation-1',
        status: NegotiationStatus.ACTIVE,
        currentOffer: 100,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.negotiation.create.mockResolvedValue(mockNegotiation);

      const result = await service.createNegotiation(negotiationData);

      expect(result.id).toBe('negotiation-1');
      expect(result.status).toBe(NegotiationStatus.ACTIVE);
      expect(mockPrisma.negotiation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'product-1',
          buyerId: 'buyer-1',
          vendorId: 'vendor-1',
          initialPrice: 100,
          currentOffer: 100,
          buyerLanguage: 'en',
          vendorLanguage: 'es',
          expiresAt: expect.any(Date)
        }),
        include: expect.any(Object)
      });
    });

    it('should handle negotiation not found', async () => {
      mockPrisma.negotiation.findUnique.mockResolvedValue(null);

      const result = await service.getNegotiationById('non-existent');

      expect(result).toBeNull();
    });

    it('should get AI suggestions for negotiation', async () => {
      const mockNegotiation = {
        id: 'negotiation-1',
        productId: 'product-1',
        buyerId: 'buyer-1',
        vendorId: 'vendor-1',
        initialPrice: 100,
        currentOffer: 90,
        buyerLanguage: 'en',
        vendorLanguage: 'es',
        messages: [
          { priceOffer: 100, createdAt: new Date(), senderId: 'buyer-1' },
          { priceOffer: 90, createdAt: new Date(), senderId: 'vendor-1' }
        ]
      };

      mockPrisma.negotiation.findUnique.mockResolvedValue(mockNegotiation);

      const suggestions = await service.getResponseSuggestions('negotiation-1', 'vendor-1');

      expect(suggestions).toEqual({
        suggestedPrice: 100,
        messageTemplate: 'Test suggestion',
        acceptanceProbability: 75,
        rationale: 'Test rationale',
        alternativeSuggestions: ['Alternative 1', 'Alternative 2']
      });
    });
  });
});