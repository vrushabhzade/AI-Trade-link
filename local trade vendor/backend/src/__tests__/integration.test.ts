/**
 * End-to-End Integration Tests for TradeLink Marketplace
 * Tests complete user flows from registration to transaction completion
 * Requirements: Complete system integration
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index';

const prisma = new PrismaClient();

describe('TradeLink E2E Integration Tests', () => {
  let buyerToken: string;
  let vendorToken: string;
  let buyerId: string;
  let vendorId: string;
  let productId: string;
  let negotiationId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.message.deleteMany({});
    await prisma.negotiation.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['buyer@test.com', 'vendor@test.com']
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. User Registration and Authentication Flow', () => {
    it('should register a buyer successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'buyer@test.com',
          password: 'BuyerPass123!',
          fullName: 'Test Buyer',
          role: 'buyer',
          preferredLanguage: 'en',
          location: {
            city: 'New York',
            country: 'USA',
            coordinates: [-74.006, 40.7128]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('buyer@test.com');
      expect(response.body.data.user.role).toBe('buyer');
      buyerId = response.body.data.user.id;
    });

    it('should register a vendor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'vendor@test.com',
          password: 'VendorPass123!',
          fullName: 'Test Vendor',
          role: 'vendor',
          preferredLanguage: 'es',
          location: {
            city: 'Madrid',
            country: 'Spain',
            coordinates: [-3.7038, 40.4168]
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.role).toBe('vendor');
      vendorId = response.body.data.user.id;
    });

    it('should login buyer and receive JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'BuyerPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      buyerToken = response.body.data.token;
    });

    it('should login vendor and receive JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'vendor@test.com',
          password: 'VendorPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      vendorToken = response.body.data.token;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('2. Vendor Profile and Product Management', () => {
    it('should create vendor profile', async () => {
      const response = await request(app)
        .post('/api/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          businessName: {
            en: 'Fresh Produce Market',
            es: 'Mercado de Productos Frescos'
          },
          description: {
            en: 'Quality fresh fruits and vegetables',
            es: 'Frutas y verduras frescas de calidad'
          },
          address: 'Calle Mayor 123, Madrid',
          location: {
            type: 'Point',
            coordinates: [-3.7038, 40.4168]
          },
          languages: ['en', 'es']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vendor).toHaveProperty('id');
    });

    it('should create a product with multilingual content', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          name: {
            en: 'Organic Tomatoes',
            es: 'Tomates Orgánicos'
          },
          description: {
            en: 'Fresh organic tomatoes from local farms',
            es: 'Tomates orgánicos frescos de granjas locales'
          },
          category: 'vegetables',
          basePrice: 3.99,
          currency: 'USD',
          unit: 'kg',
          quantityAvailable: 100,
          images: ['https://example.com/tomato.jpg']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product).toHaveProperty('id');
      expect(response.body.data.product.name).toHaveProperty('en');
      expect(response.body.data.product.name).toHaveProperty('es');
      productId = response.body.data.product.id;
    });

    it('should update product inventory', async () => {
      const response = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          quantityAvailable: 150
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.quantityAvailable).toBe(150);
    });
  });

  describe('3. Product Discovery and Search', () => {
    it('should search products with multilingual support', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({
          query: 'tomato',
          language: 'en'
        })
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          category: 'vegetables',
          language: 'en'
        })
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should get product details in preferred language', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .query({ language: 'es' })
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name.es).toBe('Tomates Orgánicos');
    });
  });

  describe('4. Price Negotiation Flow', () => {
    it('should initiate a negotiation', async () => {
      const response = await request(app)
        .post('/api/negotiations')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          productId: productId,
          initialOffer: 3.50,
          message: 'Can you offer a better price for bulk purchase?',
          quantity: 50
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.negotiation).toHaveProperty('id');
      expect(response.body.data.negotiation.status).toBe('active');
      negotiationId = response.body.data.negotiation.id;
    });

    it('should get AI-powered counter-offer suggestion for vendor', async () => {
      const response = await request(app)
        .get(`/api/negotiations/${negotiationId}/suggest-counter`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestion).toHaveProperty('suggestedPrice');
      expect(response.body.data.suggestion).toHaveProperty('rationale');
    });

    it('should send counter-offer from vendor', async () => {
      const response = await request(app)
        .post(`/api/negotiations/${negotiationId}/respond`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          action: 'counter',
          counterOffer: 3.75,
          message: 'I can offer 3.75 per kg for 50kg order'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.negotiation.currentOffer).toBe(3.75);
    });

    it('should accept counter-offer from buyer', async () => {
      const response = await request(app)
        .post(`/api/negotiations/${negotiationId}/respond`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          action: 'accept',
          message: 'Great! I accept this price.'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.negotiation.status).toBe('accepted');
      expect(response.body.data.negotiation.finalPrice).toBe(3.75);
    });
  });

  describe('5. Real-time Chat with Translation', () => {
    it('should send message in negotiation chat', async () => {
      const response = await request(app)
        .post(`/api/negotiations/${negotiationId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          text: 'When can I pick up the order?',
          originalLanguage: 'en'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toHaveProperty('id');
      expect(response.body.data.message.originalText).toBe('When can I pick up the order?');
    });

    it('should retrieve chat history with translations', async () => {
      const response = await request(app)
        .get(`/api/negotiations/${negotiationId}/messages`)
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.messages)).toBe(true);
      expect(response.body.data.messages.length).toBeGreaterThan(0);
    });
  });

  describe('6. Transaction Completion', () => {
    let transactionId: string;

    it('should create transaction from accepted negotiation', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          negotiationId: negotiationId,
          quantity: 50,
          deliveryAddress: '123 Main St, New York, NY 10001',
          paymentMethod: 'credit_card'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction).toHaveProperty('id');
      expect(response.body.data.transaction.status).toBe('pending');
      expect(response.body.data.transaction.totalAmount).toBe(187.5); // 3.75 * 50
      transactionId = response.body.data.transaction.id;
    });

    it('should update transaction status', async () => {
      const response = await request(app)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          status: 'confirmed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.status).toBe('confirmed');
    });

    it('should verify inventory was updated after transaction', async () => {
      const response = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Inventory should be reduced by 50 (from 150 to 100)
      expect(response.body.data.product.quantityAvailable).toBe(100);
    });

    it('should get transaction history for buyer', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
      expect(response.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('should get transaction history for vendor', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.transactions)).toBe(true);
    });
  });

  describe('7. User Profile Management', () => {
    it('should update buyer language preference', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          preferredLanguage: 'es'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.preferredLanguage).toBe('es');
    });

    it('should update buyer location', async () => {
      const response = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          location: {
            city: 'Los Angeles',
            country: 'USA',
            coordinates: [-118.2437, 34.0522]
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.location.city).toBe('Los Angeles');
    });
  });

  describe('8. Authorization and Security', () => {
    it('should reject unauthorized access to protected routes', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ language: 'en' });

      expect(response.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', 'Bearer invalid_token')
        .query({ language: 'en' });

      expect(response.status).toBe(401);
    });

    it('should prevent buyer from creating products', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: { en: 'Test Product' },
          category: 'test',
          basePrice: 10
        });

      expect(response.status).toBe(403);
    });
  });
});
