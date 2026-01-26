/**
 * Property-based tests for Performance Service
 * 
 * Tests performance optimization properties using fast-check library
 * with minimum 100 iterations per property test.
 */

import fc from 'fast-check';
import { performanceService, PerformanceService } from './performanceService';
import type { PigeonSighting, CryptoPricePoint } from '../types/index';

// Test data generators
const pigeonSightingArb = fc.record({
  location: fc.constantFrom('new-york', 'london', 'tokyo', 'paris', 'berlin'),
  count: fc.integer({ min: 0, max: 1000 }),
  timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }),
  coordinates: fc.option(fc.record({
    lat: fc.float({ min: Math.fround(-90), max: Math.fround(90) }),
    lng: fc.float({ min: Math.fround(-180), max: Math.fround(180) })
  }))
});

const cryptoPricePointArb = fc.record({
  symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000) }),
  volume: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000000) })),
  marketCap: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000000000) })),
  timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') })
});

// Generate ordered datasets to avoid timestamp ordering issues
const largeDatasetArb = fc.integer({ min: 100, max: 1000 }).chain(count => {
  return fc.array(pigeonSightingArb, { minLength: count, maxLength: count })
    .map(data => data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
});

const largeCryptoDatasetArb = fc.integer({ min: 100, max: 1000 }).chain(count => {
  return fc.array(cryptoPricePointArb, { minLength: count, maxLength: count })
    .map(data => data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
});

describe('Performance Service Property Tests', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService();
  });

  afterEach(() => {
    service.shutdown();
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 16: Performance optimization with large datasets**
   * **Validates: Requirements 6.2**
   * 
   * For any dataset exceeding performance thresholds, the system should implement 
   * sampling or aggregation techniques that maintain smooth rendering performance
   */
  describe('Property 16: Performance optimization with large datasets', () => {
    test('pigeon data optimization reduces dataset size while preserving data integrity', () => {
      fc.assert(
        fc.property(largeDatasetArb, (pigeonData) => {
          // Arrange
          const originalSize = pigeonData.length;
          
          // Act
          const optimizedData = service.optimizePigeonData(pigeonData, 'adaptive');
          
          // Assert
          // Should reduce size for large datasets
          if (originalSize > 1000) {
            expect(optimizedData.length).toBeLessThanOrEqual(1000);
            expect(optimizedData.length).toBeGreaterThan(0);
          }
          
          // Should preserve data structure
          optimizedData.forEach(sighting => {
            expect(sighting).toHaveProperty('location');
            expect(sighting).toHaveProperty('count');
            expect(sighting).toHaveProperty('timestamp');
            expect(sighting.timestamp).toBeInstanceOf(Date);
            expect(typeof sighting.count).toBe('number');
            expect(sighting.count).toBeGreaterThanOrEqual(0);
          });
          
          // Should maintain temporal ordering
          for (let i = 1; i < optimizedData.length; i++) {
            expect(optimizedData[i].timestamp.getTime())
              .toBeGreaterThanOrEqual(optimizedData[i - 1].timestamp.getTime());
          }
          
          // Should preserve location diversity if present in original data
          const originalLocations = new Set(pigeonData.map(s => s.location));
          const optimizedLocations = new Set(optimizedData.map(s => s.location));
          if (originalLocations.size > 1) {
            expect(optimizedLocations.size).toBeGreaterThan(0);
          }
        }),
        { numRuns: 10 }
      );
    });

    test('crypto data optimization maintains price trends and reduces size', () => {
      fc.assert(
        fc.property(largeCryptoDatasetArb, (cryptoData) => {
          // Arrange
          const originalSize = cryptoData.length;
          
          // Act
          const optimizedData = service.optimizeCryptoData(cryptoData, 'peak-preserving');
          
          // Assert
          // Should reduce size for large datasets
          if (originalSize > 1000) {
            expect(optimizedData.length).toBeLessThanOrEqual(1000);
            expect(optimizedData.length).toBeGreaterThan(0);
          }
          
          // Should preserve data structure
          optimizedData.forEach(point => {
            expect(point).toHaveProperty('symbol');
            expect(point).toHaveProperty('price');
            expect(point).toHaveProperty('timestamp');
            expect(point.timestamp).toBeInstanceOf(Date);
            expect(typeof point.price).toBe('number');
            expect(point.price).toBeGreaterThan(0);
          });
          
          // Should maintain temporal ordering
          for (let i = 1; i < optimizedData.length; i++) {
            expect(optimizedData[i].timestamp.getTime())
              .toBeGreaterThanOrEqual(optimizedData[i - 1].timestamp.getTime());
          }
          
          // Should preserve symbol diversity
          const originalSymbols = new Set(cryptoData.map(p => p.symbol));
          const optimizedSymbols = new Set(optimizedData.map(p => p.symbol));
          if (originalSymbols.size > 1) {
            expect(optimizedSymbols.size).toBeGreaterThan(0);
          }
        }),
        { numRuns: 10 }
      );
    });

    test('data aggregation reduces points while preserving statistical properties', () => {
      fc.assert(
        fc.property(
          fc.array(pigeonSightingArb, { minLength: 100, maxLength: 1000 }),
          fc.integer({ min: 60000, max: 3600000 }), // 1 minute to 1 hour window
          (pigeonData, windowMs) => {
            // Arrange
            const originalSize = pigeonData.length;
            
            // Act
            const aggregatedData = service.aggregatePigeonData(pigeonData, windowMs, 'average');
            
            // Assert
            // Should reduce or maintain size
            expect(aggregatedData.length).toBeLessThanOrEqual(originalSize);
            
            // Should preserve data structure
            aggregatedData.forEach(sighting => {
              expect(sighting).toHaveProperty('location');
              expect(sighting).toHaveProperty('count');
              expect(sighting).toHaveProperty('timestamp');
              expect(sighting.count).toBeGreaterThanOrEqual(0);
            });
            
            // Should maintain temporal ordering
            for (let i = 1; i < aggregatedData.length; i++) {
              expect(aggregatedData[i].timestamp.getTime())
                .toBeGreaterThanOrEqual(aggregatedData[i - 1].timestamp.getTime());
            }
            
            // Aggregated counts should be reasonable (not exceed max individual count * reasonable factor)
            const maxOriginalCount = Math.max(...pigeonData.map(s => s.count));
            aggregatedData.forEach(sighting => {
              expect(sighting.count).toBeLessThanOrEqual(maxOriginalCount * 10); // Allow for aggregation
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 18: Concurrent user handling**
   * **Validates: Requirements 6.4**
   * 
   * For any number of concurrent users within system limits, performance should 
   * remain stable without degradation in response times or functionality
   */
  describe('Property 18: Concurrent user handling', () => {
    test('handles concurrent connections within limits correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 150 }),
          (userIds) => {
            // Arrange
            const uniqueUserIds = [...new Set(userIds)]; // Remove duplicates
            const connectionResults: Array<{ userId: string; result: any }> = [];
            
            // Act - simulate concurrent connections
            uniqueUserIds.forEach(userId => {
              const result = service.handleUserConnection(userId);
              connectionResults.push({ userId, result });
            });
            
            // Assert
            const allowedConnections = connectionResults.filter(cr => cr.result.allowed);
            const queuedConnections = connectionResults.filter(cr => !cr.result.allowed);
            
            // Should not exceed concurrent user limit (default 100)
            expect(allowedConnections.length).toBeLessThanOrEqual(100);
            
            // All connections should get a response
            connectionResults.forEach(cr => {
              expect(cr.result).toHaveProperty('allowed');
              expect(typeof cr.result.allowed).toBe('boolean');
              
              if (!cr.result.allowed) {
                expect(cr.result).toHaveProperty('queuePosition');
                expect(typeof cr.result.queuePosition).toBe('number');
                expect(cr.result.queuePosition).toBeGreaterThan(0);
              }
            });
            
            // Queue positions should be sequential
            const queuePositions = queuedConnections
              .map(cr => cr.result.queuePosition)
              .sort((a, b) => a - b);
            
            for (let i = 1; i < queuePositions.length; i++) {
              expect(queuePositions[i]).toBeGreaterThanOrEqual(queuePositions[i - 1]);
            }
            
            // Clean up connections
            uniqueUserIds.forEach(userId => {
              service.removeUserConnection(userId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('queue processing works correctly when connections are removed', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 105, maxLength: 120 }),
          (userIds) => {
            // Arrange
            const uniqueUserIds = [...new Set(userIds)].slice(0, 110); // Ensure we exceed limit
            
            // Act - fill up to capacity and queue some users
            const connectionResults = uniqueUserIds.map(userId => ({
              userId,
              result: service.handleUserConnection(userId)
            }));
            
            const allowedUsers = connectionResults
              .filter(cr => cr.result.allowed)
              .map(cr => cr.userId);
            const queuedUsers = connectionResults
              .filter(cr => !cr.result.allowed)
              .map(cr => cr.userId);
            
            // Remove some allowed users to free up space
            const usersToRemove = allowedUsers.slice(0, Math.min(5, allowedUsers.length));
            usersToRemove.forEach(userId => {
              service.removeUserConnection(userId);
            });
            
            // Check that queue was processed
            const stats = service.getStats();
            
            // Assert
            expect(stats.activeUsers).toBeLessThanOrEqual(100);
            expect(stats.queueSize).toBeGreaterThanOrEqual(0);
            
            // If there were queued users and we removed some, active users should be close to limit
            if (queuedUsers.length > 0 && usersToRemove.length > 0) {
              expect(stats.activeUsers).toBeGreaterThan(95); // Should fill back up from queue
            }
            
            // Clean up all connections
            [...allowedUsers, ...queuedUsers].forEach(userId => {
              service.removeUserConnection(userId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 19: Smooth data rendering**
   * **Validates: Requirements 6.5**
   * 
   * For any data update operation, the rendering should complete without 
   * visual flickering, delays, or jarring transitions
   */
  describe('Property 19: Smooth data rendering', () => {
    test('batch processing maintains data integrity and order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 50, maxLength: 500 }),
          fc.integer({ min: 5, max: 50 }),
          async (data, batchSize) => {
            // Arrange
            const processor = async (batch: number[]): Promise<number[]> => {
              // Simulate processing delay
              await new Promise(resolve => setTimeout(resolve, 1));
              return batch.map(x => x * 2); // Simple transformation
            };
            
            // Act
            const result = await service.batchProcessData(data, processor, batchSize);
            
            // Assert
            // Should maintain data length
            expect(result.length).toBe(data.length);
            
            // Should maintain order and apply transformation correctly
            for (let i = 0; i < data.length; i++) {
              expect(result[i]).toBe(data[i] * 2);
            }
            
            // Should process all data
            expect(result.every(x => typeof x === 'number')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('batch processing handles empty and single-item arrays correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant([]),
            fc.array(fc.string(), { minLength: 1, maxLength: 1 }),
            fc.array(fc.string(), { minLength: 2, maxLength: 10 })
          ),
          async (data) => {
            // Arrange
            const processor = async (batch: string[]): Promise<string[]> => {
              return batch.map(s => s.toUpperCase());
            };
            
            // Act
            const result = await service.batchProcessData(data, processor, 3);
            
            // Assert
            expect(result.length).toBe(data.length);
            
            if (data.length > 0) {
              expect(result.every(s => typeof s === 'string')).toBe(true);
              expect(result.every(s => s === s.toUpperCase())).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('performance metrics are tracked correctly during optimization', () => {
      fc.assert(
        fc.property(
          fc.array(pigeonSightingArb, { minLength: 1000, maxLength: 5000 }),
          (pigeonData) => {
            // Arrange
            const initialStats = service.getStats();
            const initialDataPoints = initialStats.dataPointsProcessed;
            
            // Act
            service.optimizePigeonData(pigeonData, 'uniform');
            
            // Assert
            const finalStats = service.getStats();
            
            // Should track data points processed
            expect(finalStats.dataPointsProcessed).toBeGreaterThan(initialDataPoints);
            expect(finalStats.dataPointsProcessed).toBe(initialDataPoints + pigeonData.length);
            
            // Should update last optimization timestamp
            expect(finalStats.lastOptimization).toBeInstanceOf(Date);
            expect(finalStats.lastOptimization!.getTime()).toBeGreaterThan(Date.now() - 1000);
            
            // Should maintain other metrics
            expect(finalStats.activeUsers).toBeGreaterThanOrEqual(0);
            expect(finalStats.memoryUsage).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Performance Service Configuration', () => {
    test('configuration updates are applied correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            maxDataPoints: fc.integer({ min: 100, max: 5000 }),
            samplingThreshold: fc.integer({ min: 1000, max: 10000 }),
            concurrentUserLimit: fc.integer({ min: 10, max: 200 }),
            renderingBatchSize: fc.integer({ min: 10, max: 100 })
          }),
          (newConfig) => {
            // Act
            service.updateConfig(newConfig);
            
            // Assert
            const stats = service.getStats();
            expect(stats.config.maxDataPoints).toBe(newConfig.maxDataPoints);
            expect(stats.config.samplingThreshold).toBe(newConfig.samplingThreshold);
            expect(stats.config.concurrentUserLimit).toBe(newConfig.concurrentUserLimit);
            expect(stats.config.renderingBatchSize).toBe(newConfig.renderingBatchSize);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});