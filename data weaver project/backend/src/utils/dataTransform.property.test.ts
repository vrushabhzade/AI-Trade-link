/**
 * Property-based tests for data transformation utilities
 * **Feature: pigeon-crypto-dashboard, Property 6: Geographic aggregation accuracy**
 * **Validates: Requirements 2.4**
 * **Feature: pigeon-crypto-dashboard, Property 3: Temporal alignment consistency**
 * **Validates: Requirements 1.4**
 */

import * as fc from 'fast-check';
import { 
  aggregatePigeonByGeography, 
  extractUrbanArea, 
  alignDataTemporally,
  TimeBucket,
  filterByTimeRange
} from './dataTransform';
import { PigeonSighting, CryptoPricePoint } from '../types/index';

describe('Property-Based Tests for Data Transformation', () => {
  describe('Temporal Alignment Consistency', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 3: Temporal alignment consistency**
     * **Validates: Requirements 1.4**
     * 
     * Property: For any time period selection, both pigeon data and cryptocurrency data 
     * should update to display the exact same time range, maintaining temporal synchronization
     */
    it('should maintain temporal synchronization between pigeon and crypto data', () => {
      fc.assert(
        fc.property(
          // Generate pigeon sightings with random timestamps
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              location: fc.constantFrom('Central Park, NYC', 'Golden Gate Park, SF', 'Millennium Park, Chicago'),
              count: fc.integer({ min: 1, max: 100 }),
              coordinates: fc.option(
                fc.record({
                  lat: fc.float({ min: Math.fround(-90) }),
                  lng: fc.float({ min: Math.fround(-180) })
                }),
                { nil: undefined }
              )
            }),
            { minLength: 5, maxLength: 50 }
          ),
          // Generate crypto price points with random timestamps
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000) }),
              volume: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000) }), { nil: undefined }),
              marketCap: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1000000000) }), { nil: undefined })
            }),
            { minLength: 5, maxLength: 50 }
          ),
          // Generate time bucket for alignment
          fc.constantFrom(TimeBucket.FIFTEEN_MINUTES, TimeBucket.HOURLY, TimeBucket.DAILY),
          (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[], bucket: TimeBucket) => {
            // Perform temporal alignment
            const { alignedPigeonData, alignedCryptoData } = alignDataTemporally(
              pigeonData,
              cryptoData,
              bucket
            );

            // Property 1: Both datasets should have the same number of time points
            expect(alignedPigeonData.length).toBe(alignedCryptoData.length);

            // Property 2: All timestamps should be exactly aligned
            for (let i = 0; i < alignedPigeonData.length; i++) {
              expect(alignedPigeonData[i].timestamp.getTime()).toBe(
                alignedCryptoData[i].timestamp.getTime()
              );
            }

            // Property 3: All timestamps should be rounded to the time bucket
            for (const sighting of alignedPigeonData) {
              const rounded = Math.floor(sighting.timestamp.getTime() / bucket) * bucket;
              expect(sighting.timestamp.getTime()).toBe(rounded);
            }

            for (const pricePoint of alignedCryptoData) {
              const rounded = Math.floor(pricePoint.timestamp.getTime() / bucket) * bucket;
              expect(pricePoint.timestamp.getTime()).toBe(rounded);
            }

            // Property 4: Aligned data should only contain timestamps that exist in both original datasets
            const pigeonTimestamps = new Set(
              pigeonData.map(p => Math.floor(p.timestamp.getTime() / bucket) * bucket)
            );
            const cryptoTimestamps = new Set(
              cryptoData.map(c => Math.floor(c.timestamp.getTime() / bucket) * bucket)
            );
            const commonTimestamps = new Set(
              [...pigeonTimestamps].filter(t => cryptoTimestamps.has(t))
            );

            for (const sighting of alignedPigeonData) {
              expect(commonTimestamps.has(sighting.timestamp.getTime())).toBe(true);
            }

            for (const pricePoint of alignedCryptoData) {
              expect(commonTimestamps.has(pricePoint.timestamp.getTime())).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 3: Temporal alignment consistency**
     * **Validates: Requirements 1.4**
     * 
     * Property: Time range filtering should maintain synchronization between datasets
     */
    it('should maintain synchronization when filtering by time range', () => {
      fc.assert(
        fc.property(
          // Generate aligned datasets first
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
              location: fc.constantFrom('Park A', 'Park B', 'Park C'),
              count: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 10, maxLength: 30 }
          ),
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
              symbol: fc.constantFrom('BTC', 'ETH'),
              price: fc.float({ min: Math.fround(100), max: Math.fround(50000) })
            }),
            { minLength: 10, maxLength: 30 }
          ),
          // Generate time range for filtering
          fc.record({
            start: fc.date({ min: new Date('2023-03-01'), max: new Date('2023-06-01') }),
            end: fc.date({ min: new Date('2023-07-01'), max: new Date('2023-10-01') })
          }),
          (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[], timeRange) => {
            // Ensure start is before end
            if (timeRange.start >= timeRange.end) {
              return; // Skip invalid time ranges
            }

            // First align the data temporally
            const { alignedPigeonData, alignedCryptoData } = alignDataTemporally(
              pigeonData,
              cryptoData,
              TimeBucket.HOURLY
            );

            // Then filter both by the same time range
            const filteredPigeonData = filterByTimeRange(
              alignedPigeonData,
              timeRange.start,
              timeRange.end
            );

            const filteredCryptoData = filterByTimeRange(
              alignedCryptoData,
              timeRange.start,
              timeRange.end
            );

            // Property: After filtering, both datasets should still have the same timestamps
            expect(filteredPigeonData.length).toBe(filteredCryptoData.length);

            for (let i = 0; i < filteredPigeonData.length; i++) {
              expect(filteredPigeonData[i].timestamp.getTime()).toBe(
                filteredCryptoData[i].timestamp.getTime()
              );
            }

            // Property: All filtered timestamps should be within the specified range
            for (const sighting of filteredPigeonData) {
              expect(sighting.timestamp >= timeRange.start).toBe(true);
              expect(sighting.timestamp <= timeRange.end).toBe(true);
            }

            for (const pricePoint of filteredCryptoData) {
              expect(pricePoint.timestamp >= timeRange.start).toBe(true);
              expect(pricePoint.timestamp <= timeRange.end).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 3: Temporal alignment consistency**
     * **Validates: Requirements 1.4**
     * 
     * Property: Temporal alignment should be deterministic and consistent
     */
    it('should produce consistent results when called multiple times with same data', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
              location: fc.string({ minLength: 1, maxLength: 20 }),
              count: fc.integer({ min: 1, max: 100 })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
              symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000) })
            }),
            { minLength: 3, maxLength: 20 }
          ),
          fc.constantFrom(TimeBucket.HOURLY, TimeBucket.DAILY),
          (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[], bucket: TimeBucket) => {
            // Call alignment function twice with the same data
            const result1 = alignDataTemporally(pigeonData, cryptoData, bucket);
            const result2 = alignDataTemporally(pigeonData, cryptoData, bucket);

            // Property: Results should be identical
            expect(result1.alignedPigeonData.length).toBe(result2.alignedPigeonData.length);
            expect(result1.alignedCryptoData.length).toBe(result2.alignedCryptoData.length);

            // Compare timestamps and data
            for (let i = 0; i < result1.alignedPigeonData.length; i++) {
              expect(result1.alignedPigeonData[i].timestamp.getTime()).toBe(
                result2.alignedPigeonData[i].timestamp.getTime()
              );
              expect(result1.alignedPigeonData[i].count).toBe(
                result2.alignedPigeonData[i].count
              );
            }

            for (let i = 0; i < result1.alignedCryptoData.length; i++) {
              expect(result1.alignedCryptoData[i].timestamp.getTime()).toBe(
                result2.alignedCryptoData[i].timestamp.getTime()
              );
              expect(result1.alignedCryptoData[i].price).toBe(
                result2.alignedCryptoData[i].price
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 3: Temporal alignment consistency**
     * **Validates: Requirements 1.4**
     * 
     * Property: Temporal alignment should handle edge cases without breaking synchronization
     */
    it('should handle edge cases while maintaining temporal synchronization', () => {
      fc.assert(
        fc.property(
          // Generate edge case scenarios
          fc.oneof(
            // Empty datasets
            fc.constant({ pigeonData: [], cryptoData: [] }),
            // Single data point in each
            fc.record({
              pigeonData: fc.array(
                fc.record({
                  timestamp: fc.date({ min: new Date('2023-06-01'), max: new Date('2023-06-02') }),
                  location: fc.constant('Test Park'),
                  count: fc.integer({ min: 1, max: 10 })
                }),
                { minLength: 1, maxLength: 1 }
              ),
              cryptoData: fc.array(
                fc.record({
                  timestamp: fc.date({ min: new Date('2023-06-01'), max: new Date('2023-06-02') }),
                  symbol: fc.constant('BTC'),
                  price: fc.float({ min: 1000, max: 50000 })
                }),
                { minLength: 1, maxLength: 1 }
              )
            }),
            // No overlapping timestamps
            fc.record({
              pigeonData: fc.array(
                fc.record({
                  timestamp: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-03-01') }),
                  location: fc.constant('Early Park'),
                  count: fc.integer({ min: 1, max: 10 })
                }),
                { minLength: 1, maxLength: 5 }
              ),
              cryptoData: fc.array(
                fc.record({
                  timestamp: fc.date({ min: new Date('2023-06-01'), max: new Date('2023-08-01') }),
                  symbol: fc.constant('BTC'),
                  price: fc.float({ min: 1000, max: 50000 })
                }),
                { minLength: 1, maxLength: 5 }
              )
            })
          ),
          fc.constantFrom(TimeBucket.HOURLY, TimeBucket.DAILY),
          (datasets, bucket: TimeBucket) => {
            const { pigeonData, cryptoData } = datasets;

            // Should not throw an error
            const { alignedPigeonData, alignedCryptoData } = alignDataTemporally(
              pigeonData,
              cryptoData,
              bucket
            );

            // Property: Results should always be arrays
            expect(Array.isArray(alignedPigeonData)).toBe(true);
            expect(Array.isArray(alignedCryptoData)).toBe(true);

            // Property: Both arrays should have the same length (even if 0)
            expect(alignedPigeonData.length).toBe(alignedCryptoData.length);

            // Property: If there are results, timestamps should be synchronized
            for (let i = 0; i < alignedPigeonData.length; i++) {
              expect(alignedPigeonData[i].timestamp.getTime()).toBe(
                alignedCryptoData[i].timestamp.getTime()
              );
            }

            // Property: Results should be sorted by timestamp
            for (let i = 1; i < alignedPigeonData.length; i++) {
              expect(alignedPigeonData[i].timestamp.getTime()).toBeGreaterThanOrEqual(
                alignedPigeonData[i - 1].timestamp.getTime()
              );
            }

            for (let i = 1; i < alignedCryptoData.length; i++) {
              expect(alignedCryptoData[i].timestamp.getTime()).toBeGreaterThanOrEqual(
                alignedCryptoData[i - 1].timestamp.getTime()
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Geographic Aggregation Accuracy', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 6: Geographic aggregation accuracy**
     * **Validates: Requirements 2.4**
     * 
     * Property: For any pigeon sighting data that includes location information, 
     * the system should correctly aggregate counts by urban area or city without data loss
     */
    it('should preserve total count when aggregating by geography', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              location: fc.oneof(
                // Comma-separated format: "Location, City"
                fc.tuple(
                  fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(',')),
                  fc.constantFrom('NYC', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle')
                ).map(([place, city]) => `${place}, ${city}`),
                // City-first format: "City Location"
                fc.tuple(
                  fc.constantFrom('NYC', 'SF', 'LA', 'Chicago', 'Boston', 'Seattle'),
                  fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(','))
                ).map(([city, place]) => `${city} ${place}`),
                // Simple city name
                fc.constantFrom('NYC', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle')
              ),
              count: fc.integer({ min: 1, max: 100 }),
              coordinates: fc.option(
                fc.record({
                  lat: fc.float({ min: -90, max: 90 }),
                  lng: fc.float({ min: -180, max: 180 })
                }),
                { nil: undefined }
              )
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (sightings: PigeonSighting[]) => {
            // Calculate total count before aggregation
            const totalCountBefore = sightings.reduce((sum, sighting) => sum + sighting.count, 0);
            
            // Perform geographic aggregation
            const aggregated = aggregatePigeonByGeography(sightings);
            
            // Calculate total count after aggregation
            const totalCountAfter = aggregated.reduce((sum, sighting) => sum + sighting.count, 0);
            
            // Property: Total count should be preserved (no data loss)
            expect(totalCountAfter).toBe(totalCountBefore);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 6: Geographic aggregation accuracy**
     * **Validates: Requirements 2.4**
     * 
     * Property: Aggregation should group sightings from the same urban area correctly
     */
    it('should correctly group sightings by urban area', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              location: fc.oneof(
                fc.constant('Central Park, NYC'),
                fc.constant('Times Square, NYC'),
                fc.constant('Golden Gate Park, San Francisco'),
                fc.constant('Marina District, San Francisco'),
                fc.constant('Millennium Park, Chicago'),
                fc.constant('Navy Pier, Chicago')
              ),
              count: fc.integer({ min: 1, max: 50 }),
              coordinates: fc.option(
                fc.record({
                  lat: fc.float({ min: -90, max: 90 }),
                  lng: fc.float({ min: -180, max: 180 })
                }),
                { nil: undefined }
              )
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (sightings: PigeonSighting[]) => {
            const aggregated = aggregatePigeonByGeography(sightings);
            
            // Property: Each urban area should appear only once in the result
            const urbanAreas = aggregated.map(s => s.location);
            const uniqueUrbanAreas = new Set(urbanAreas);
            expect(urbanAreas.length).toBe(uniqueUrbanAreas.size);
            
            // Property: Count for each urban area should equal sum of original counts for that area
            for (const aggregatedSighting of aggregated) {
              const originalSightingsForArea = sightings.filter(s => 
                extractUrbanArea(s.location) === aggregatedSighting.location
              );
              const expectedCount = originalSightingsForArea.reduce((sum, s) => sum + s.count, 0);
              expect(aggregatedSighting.count).toBe(expectedCount);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 6: Geographic aggregation accuracy**
     * **Validates: Requirements 2.4**
     * 
     * Property: Aggregation should handle edge cases without losing data
     */
    it('should handle edge cases in location strings without data loss', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              location: fc.oneof(
                fc.constant(''),
                fc.constant('   '),
                fc.constant('Unknown Location'),
                fc.constant('NYC'),
                fc.constant('San Francisco, CA, USA'),
                fc.constant('Park, NYC, NY'),
                fc.string({ minLength: 0, maxLength: 100 })
              ),
              count: fc.integer({ min: 1, max: 50 }),
              coordinates: fc.option(
                fc.record({
                  lat: fc.float({ min: -90, max: 90 }),
                  lng: fc.float({ min: -180, max: 180 })
                }),
                { nil: undefined }
              )
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (sightings: PigeonSighting[]) => {
            const totalCountBefore = sightings.reduce((sum, sighting) => sum + sighting.count, 0);
            
            // Should not throw an error
            const aggregated = aggregatePigeonByGeography(sightings);
            
            // Should preserve total count even with edge cases
            const totalCountAfter = aggregated.reduce((sum, sighting) => sum + sighting.count, 0);
            expect(totalCountAfter).toBe(totalCountBefore);
            
            // Should produce valid results
            expect(Array.isArray(aggregated)).toBe(true);
            expect(aggregated.length).toBeGreaterThan(0);
            
            // All results should have valid structure
            for (const result of aggregated) {
              expect(typeof result.location).toBe('string');
              expect(typeof result.count).toBe('number');
              expect(result.count).toBeGreaterThan(0);
              expect(result.timestamp instanceof Date).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 6: Geographic aggregation accuracy**
     * **Validates: Requirements 2.4**
     * 
     * Property: Aggregation should maintain temporal ordering (earliest timestamp per area)
     */
    it('should use earliest timestamp for each urban area', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
              location: fc.constantFrom(
                'Central Park, NYC',
                'Times Square, NYC',
                'Golden Gate Park, San Francisco'
              ),
              count: fc.integer({ min: 1, max: 20 }),
              coordinates: fc.option(
                fc.record({
                  lat: fc.float({ min: -90, max: 90 }),
                  lng: fc.float({ min: -180, max: 180 })
                }),
                { nil: undefined }
              )
            }),
            { minLength: 2, maxLength: 15 }
          ),
          (sightings: PigeonSighting[]) => {
            const aggregated = aggregatePigeonByGeography(sightings);
            
            // Property: Each aggregated result should use the earliest timestamp for that urban area
            for (const aggregatedSighting of aggregated) {
              const originalSightingsForArea = sightings.filter(s => 
                extractUrbanArea(s.location) === aggregatedSighting.location
              );
              
              if (originalSightingsForArea.length > 0) {
                const earliestTimestamp = originalSightingsForArea
                  .map(s => s.timestamp)
                  .sort((a, b) => a.getTime() - b.getTime())[0];
                
                expect(aggregatedSighting.timestamp.getTime()).toBe(earliestTimestamp.getTime());
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});