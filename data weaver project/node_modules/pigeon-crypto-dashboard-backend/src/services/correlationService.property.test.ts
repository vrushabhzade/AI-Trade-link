/**
 * Property-based tests for CorrelationService
 * **Feature: pigeon-crypto-dashboard, Property 9: Correlation calculation accuracy**
 * **Validates: Requirements 4.1, 4.5**
 * 
 * **Feature: pigeon-crypto-dashboard, Property 10: Correlation highlighting consistency**
 * **Validates: Requirements 4.2**
 */

import fc from 'fast-check';
import { CorrelationService } from './correlationService.js';
import type { PigeonSighting, CryptoPricePoint } from '../types/index.js';

describe('CorrelationService Property Tests', () => {
  let service: CorrelationService;

  beforeEach(() => {
    service = new CorrelationService();
    service.clearCache();
  });

  describe('Property 9: Correlation calculation accuracy', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 9: Correlation calculation accuracy**
     * **Validates: Requirements 4.1, 4.5**
     * 
     * For any pair of pigeon and cryptocurrency datasets, the system should calculate 
     * statistically valid correlation coefficients using appropriate time-series methods
     */
    it('should calculate valid correlation coefficients for any dataset pair', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate pigeon sighting data
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
              location: fc.constantFrom('New York City', 'London', 'Tokyo', 'Paris', 'Berlin'),
              count: fc.integer({ min: 1, max: 100 }),
              coordinates: fc.record({
                lat: fc.float({ min: -90, max: 90 }),
                lng: fc.float({ min: -180, max: 180 })
              })
            }),
            { minLength: 5, maxLength: 50 }
          ),
          // Generate crypto price data
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }),
              symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
              price: fc.float({ min: 0.01, max: 100000 }),
              volume: fc.option(fc.float({ min: 0, max: 1000000 })),
              marketCap: fc.option(fc.float({ min: 0, max: 1000000000 }))
            }),
            { minLength: 5, maxLength: 50 }
          ),
          async (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[]) => {
            const dashboardData = await service.aggregateAndCorrelate(pigeonData, cryptoData);

            // Property: Correlation coefficients should be valid numbers between -1 and 1
            dashboardData.correlations.forEach(correlation => {
              expect(typeof correlation.coefficient).toBe('number');
              expect(correlation.coefficient).toBeGreaterThanOrEqual(-1);
              expect(correlation.coefficient).toBeLessThanOrEqual(1);
              expect(isNaN(correlation.coefficient)).toBe(false);
              expect(isFinite(correlation.coefficient)).toBe(true);
            });

            // Property: P-values should be valid probabilities between 0 and 1
            dashboardData.correlations.forEach(correlation => {
              expect(typeof correlation.pValue).toBe('number');
              expect(correlation.pValue).toBeGreaterThanOrEqual(0);
              expect(correlation.pValue).toBeLessThanOrEqual(1);
              expect(isNaN(correlation.pValue)).toBe(false);
              expect(isFinite(correlation.pValue)).toBe(true);
            });

            // Property: Time ranges should be valid and ordered
            dashboardData.correlations.forEach(correlation => {
              expect(correlation.timeRange.start).toBeInstanceOf(Date);
              expect(correlation.timeRange.end).toBeInstanceOf(Date);
              expect(correlation.timeRange.start.getTime()).toBeLessThanOrEqual(
                correlation.timeRange.end.getTime()
              );
            });

            // Property: Significance levels should be valid categories
            dashboardData.correlations.forEach(correlation => {
              expect(['high', 'medium', 'low', 'none']).toContain(correlation.significance);
            });

            // Property: Dashboard data should have consistent structure
            expect(Array.isArray(dashboardData.pigeonData)).toBe(true);
            expect(Array.isArray(dashboardData.cryptoData)).toBe(true);
            expect(Array.isArray(dashboardData.correlations)).toBe(true);
            expect(dashboardData.metadata).toHaveProperty('lastUpdated');
            expect(dashboardData.metadata).toHaveProperty('dataQuality');
            expect(dashboardData.metadata.lastUpdated).toBeInstanceOf(Date);
            expect(['real', 'mock', 'mixed']).toContain(dashboardData.metadata.dataQuality);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle perfect correlations correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 20 }), // number of data points
          fc.float({ min: 1, max: 100 }), // base pigeon count
          fc.float({ min: 100, max: 10000 }), // base crypto price
          fc.float({ min: 0.1, max: 10 }), // correlation factor
          async (numPoints: number, basePigeonCount: number, baseCryptoPrice: number, factor: number) => {
            // Generate perfectly correlated data
            const baseTime = new Date('2025-06-01').getTime();
            const pigeonData: PigeonSighting[] = [];
            const cryptoData: CryptoPricePoint[] = [];

            for (let i = 0; i < numPoints; i++) {
              const timestamp = new Date(baseTime + i * 60 * 60 * 1000); // hourly intervals
              const pigeonCount = basePigeonCount + i * 2; // linear increase
              const cryptoPrice = baseCryptoPrice + i * factor; // correlated increase

              pigeonData.push({
                timestamp,
                location: 'Test City',
                count: Math.round(pigeonCount),
                coordinates: { lat: 40.7128, lng: -74.0060 }
              });

              cryptoData.push({
                timestamp,
                symbol: 'TEST',
                price: cryptoPrice
              });
            }

            const dashboardData = await service.aggregateAndCorrelate(pigeonData, cryptoData);

            // Property: Perfect positive correlation should yield coefficient close to 1
            if (dashboardData.correlations.length > 0) {
              const correlation = dashboardData.correlations[0];
              expect(correlation.coefficient).toBeGreaterThan(0.8); // Should be very high
              expect(correlation.coefficient).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle anti-correlated data correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 20 }), // number of data points
          fc.float({ min: 10, max: 100 }), // base pigeon count
          fc.float({ min: 1000, max: 10000 }), // base crypto price
          async (numPoints: number, basePigeonCount: number, baseCryptoPrice: number) => {
            // Generate anti-correlated data
            const baseTime = new Date('2025-06-01').getTime();
            const pigeonData: PigeonSighting[] = [];
            const cryptoData: CryptoPricePoint[] = [];

            for (let i = 0; i < numPoints; i++) {
              const timestamp = new Date(baseTime + i * 60 * 60 * 1000);
              const pigeonCount = basePigeonCount + i * 3; // increasing
              const cryptoPrice = baseCryptoPrice - i * 50; // decreasing

              pigeonData.push({
                timestamp,
                location: 'Test City',
                count: Math.round(pigeonCount),
                coordinates: { lat: 40.7128, lng: -74.0060 }
              });

              cryptoData.push({
                timestamp,
                symbol: 'TEST',
                price: Math.max(cryptoPrice, 1) // ensure positive price
              });
            }

            const dashboardData = await service.aggregateAndCorrelate(pigeonData, cryptoData);

            // Property: Perfect negative correlation should yield coefficient close to -1
            if (dashboardData.correlations.length > 0) {
              const correlation = dashboardData.correlations[0];
              expect(correlation.coefficient).toBeLessThan(-0.8); // Should be very negative
              expect(correlation.coefficient).toBeGreaterThanOrEqual(-1);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle empty or insufficient data gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              timestamp: fc.date(),
              location: fc.string({ minLength: 1, maxLength: 20 }),
              count: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 2 }
          ),
          fc.array(
            fc.record({
              timestamp: fc.date(),
              symbol: fc.string({ minLength: 1, maxLength: 5 }),
              price: fc.float({ min: 0.01, max: 1000 })
            }),
            { minLength: 0, maxLength: 2 }
          ),
          async (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[]) => {
            const dashboardData = await service.aggregateAndCorrelate(pigeonData, cryptoData);

            // Property: Should handle insufficient data without crashing
            expect(Array.isArray(dashboardData.correlations)).toBe(true);
            expect(dashboardData.metadata).toHaveProperty('lastUpdated');
            expect(dashboardData.metadata.lastUpdated).toBeInstanceOf(Date);

            // Property: With insufficient data, correlations should be empty or have default values
            dashboardData.correlations.forEach(correlation => {
              expect(typeof correlation.coefficient).toBe('number');
              expect(isFinite(correlation.coefficient)).toBe(true);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Property 10: Correlation highlighting consistency', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 10: Correlation highlighting consistency**
     * **Validates: Requirements 4.2**
     * 
     * For any correlation coefficient that exceeds 0.7 or falls below -0.7, 
     * the system should apply consistent visual highlighting to those time periods
     */
    it('should consistently highlight correlations above threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0.7, max: 1.0 }), // high positive correlation
          fc.float({ min: -1.0, max: -0.7 }), // high negative correlation
          fc.float({ min: -0.69, max: 0.69 }), // low correlation
          async (highPos: number, highNeg: number, low: number) => {
            // Create mock correlation results with known coefficients
            const mockCorrelations = [
              {
                coefficient: highPos,
                pValue: 0.01,
                timeRange: { start: new Date(), end: new Date() },
                significance: 'high' as const
              },
              {
                coefficient: highNeg,
                pValue: 0.01,
                timeRange: { start: new Date(), end: new Date() },
                significance: 'high' as const
              },
              {
                coefficient: low,
                pValue: 0.1,
                timeRange: { start: new Date(), end: new Date() },
                significance: 'low' as const
              }
            ];

            const highlights = service.getCorrelationHighlights(mockCorrelations);

            // Property: High correlations (|r| >= 0.7) should be highlighted
            const highCorrelations = mockCorrelations.filter(c => Math.abs(c.coefficient) >= 0.7);
            const lowCorrelations = mockCorrelations.filter(c => Math.abs(c.coefficient) < 0.7);

            expect(highlights.highlighted.length).toBe(highCorrelations.length);
            expect(highlights.highlighted.length).toBeGreaterThan(0);

            // Property: All highlighted correlations should meet the threshold
            highlights.highlighted.forEach(correlation => {
              expect(Math.abs(correlation.coefficient)).toBeGreaterThanOrEqual(0.7);
            });

            // Property: Commentary should be generated for highlighted correlations
            expect(highlights.commentary.length).toBe(highlights.highlighted.length);
            highlights.commentary.forEach(comment => {
              expect(typeof comment).toBe('string');
              expect(comment.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate appropriate commentary for different correlation strengths', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: -1, max: 1 }), // any correlation coefficient
          fc.constantFrom('BTC', 'ETH', 'DOGE'), // crypto symbol
          fc.constantFrom('New York', 'London', 'Tokyo'), // location
          async (coefficient: number, cryptoSymbol: string, location: string) => {
            const commentary = service.generateCorrelationCommentary(coefficient, cryptoSymbol, location);

            // Property: Commentary should always be a non-empty string
            expect(typeof commentary).toBe('string');
            expect(commentary.length).toBeGreaterThan(0);

            // Property: Commentary should contain the crypto symbol
            expect(commentary).toContain(cryptoSymbol);

            // Property: Commentary should reflect the correlation strength
            const absCoeff = Math.abs(coefficient);
            if (absCoeff >= 0.7) {
              // High correlation should have more dramatic language
              expect(commentary.toLowerCase()).toMatch(/(breaking|alert|shocking|baffled|mystery)/);
            } else if (absCoeff >= 0.5) {
              // Medium correlation should have moderate language
              expect(commentary.toLowerCase()).toMatch(/(interesting|curious|moderate|mild)/);
            } else {
              // Low correlation should have casual language
              expect(commentary.toLowerCase()).toMatch(/(shrug|strangers|separate|random)/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain highlighting consistency across multiple calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              coefficient: fc.float({ min: -1, max: 1 }),
              pValue: fc.float({ min: 0, max: 1 }),
              timeRange: fc.record({
                start: fc.date(),
                end: fc.date()
              }),
              significance: fc.constantFrom('high', 'medium', 'low', 'none')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (correlations) => {
            // Call highlighting multiple times with same data
            const highlights1 = service.getCorrelationHighlights(correlations);
            const highlights2 = service.getCorrelationHighlights(correlations);
            const highlights3 = service.getCorrelationHighlights(correlations);

            // Property: Results should be consistent across calls
            expect(highlights1.highlighted.length).toBe(highlights2.highlighted.length);
            expect(highlights2.highlighted.length).toBe(highlights3.highlighted.length);

            // Property: Same correlations should be highlighted each time
            const getHighlightedCoeffs = (h: any) => h.highlighted.map((c: any) => c.coefficient).sort();
            expect(getHighlightedCoeffs(highlights1)).toEqual(getHighlightedCoeffs(highlights2));
            expect(getHighlightedCoeffs(highlights2)).toEqual(getHighlightedCoeffs(highlights3));

            // Property: All highlighted items should meet the threshold consistently
            [highlights1, highlights2, highlights3].forEach(h => {
              h.highlighted.forEach((correlation: any) => {
                expect(Math.abs(correlation.coefficient)).toBeGreaterThanOrEqual(0.7);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Temporal Alignment Properties', () => {
    it('should maintain data integrity during temporal alignment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-01-02') }),
              location: fc.constantFrom('Test City'),
              count: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-01-02') }),
              symbol: fc.constantFrom('TEST'),
              price: fc.float({ min: 100, max: 1000 })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          async (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[]) => {
            const originalPigeonCount = pigeonData.reduce((sum, p) => sum + p.count, 0);
            const originalCryptoCount = cryptoData.length;

            const dashboardData = await service.aggregateAndCorrelate(pigeonData, cryptoData);

            // Property: Original data should be preserved in the result
            expect(dashboardData.pigeonData).toEqual(pigeonData);
            expect(dashboardData.cryptoData).toEqual(cryptoData);

            // Property: Metadata should reflect the processing
            expect(dashboardData.metadata.lastUpdated).toBeInstanceOf(Date);
            expect(['real', 'mock', 'mixed']).toContain(dashboardData.metadata.dataQuality);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});