/**
 * Property-based tests for PigeonDataService
 * **Feature: pigeon-crypto-dashboard, Property 7: Comprehensive fallback behavior**
 * **Validates: Requirements 2.2, 2.5**
 */

import fc from 'fast-check';
import { PigeonDataService, URBAN_AREAS, type UrbanArea } from './pigeonService.js';
import type { PigeonSighting } from '../types/index.js';

// Mock axios to simulate API failures
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    interceptors: {
      response: {
        use: jest.fn()
      }
    }
  }))
}));

describe('PigeonDataService Property Tests', () => {
  let service: PigeonDataService;

  beforeEach(() => {
    service = new PigeonDataService();
    service.clearCache();
  });

  describe('Property 7: Comprehensive fallback behavior', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 7: Comprehensive fallback behavior**
     * **Validates: Requirements 2.2, 2.5**
     * 
     * For any data source failure (pigeon or cryptocurrency), the system should display 
     * appropriate error messages and continue functioning with cached data, mock data, or both
     */
    it('should always provide fallback data when API fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random combinations of urban areas
          fc.subarray(Object.keys(URBAN_AREAS) as UrbanArea[], { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 1, max: 30 }), // days for historical data
          async (areas: UrbanArea[], days: number) => {
            // Mock axios to simulate API failure
            const mockAxios = require('axios');
            const mockGet = jest.fn().mockRejectedValue(new Error('API failure'));
            mockAxios.create.mockReturnValue({
              get: mockGet,
              interceptors: {
                response: {
                  use: jest.fn()
                }
              }
            });

            // Create a new service instance to use the mocked axios
            const testService = new PigeonDataService();

            // Test current sightings fallback
            const currentSightings = await testService.getCurrentSightings(areas);
            
            // Property: Should always return an array (never throw or return null/undefined)
            expect(Array.isArray(currentSightings)).toBe(true);
            
            // Property: Should return valid pigeon sighting objects
            currentSightings.forEach(sighting => {
              expect(sighting).toHaveProperty('timestamp');
              expect(sighting).toHaveProperty('location');
              expect(sighting).toHaveProperty('count');
              expect(sighting.timestamp).toBeInstanceOf(Date);
              expect(typeof sighting.location).toBe('string');
              expect(typeof sighting.count).toBe('number');
              expect(sighting.count).toBeGreaterThan(0);
            });

            // Property: Locations should match requested areas
            const returnedLocations = new Set(currentSightings.map(s => s.location));
            const expectedLocations = new Set(areas.map(area => URBAN_AREAS[area].name));
            
            // All returned locations should be from requested areas
            returnedLocations.forEach(location => {
              expect(expectedLocations.has(location)).toBe(true);
            });

            // Test historical sightings fallback
            const historicalSightings = await testService.getHistoricalSightings(areas, days);
            
            // Property: Should always return an array
            expect(Array.isArray(historicalSightings)).toBe(true);
            
            // Property: Should return valid pigeon sighting objects
            historicalSightings.forEach(sighting => {
              expect(sighting).toHaveProperty('timestamp');
              expect(sighting).toHaveProperty('location');
              expect(sighting).toHaveProperty('count');
              expect(sighting.timestamp).toBeInstanceOf(Date);
              expect(typeof sighting.location).toBe('string');
              expect(typeof sighting.count).toBe('number');
              expect(sighting.count).toBeGreaterThan(0);
            });

            // Property: Historical data should be within requested time range
            if (historicalSightings.length > 0) {
              const now = new Date();
              const earliestAllowed = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
              
              historicalSightings.forEach(sighting => {
                expect(sighting.timestamp.getTime()).toBeGreaterThanOrEqual(earliestAllowed.getTime());
                expect(sighting.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
              });
            }

            // Property: Service should remain functional after API failure
            const cacheStats = testService.getCacheStats();
            expect(typeof cacheStats.size).toBe('number');
            expect(Array.isArray(cacheStats.keys)).toBe(true);

            const rateLimitStatus = testService.getRateLimitStatus();
            expect(rateLimitStatus).toHaveProperty('ebird');
            expect(typeof rateLimitStatus.ebird.count).toBe('number');
            expect(typeof rateLimitStatus.ebird.resetTime).toBe('number');
          }
        ),
        { numRuns: 100 } // Run 100 iterations as specified in design document
      );
    });

    it('should handle empty area arrays gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant([]), // Empty array
          async (areas: UrbanArea[]) => {
            // Mock axios to simulate API failure
            const mockAxios = require('axios');
            const mockGet = jest.fn().mockRejectedValue(new Error('API failure'));
            mockAxios.create.mockReturnValue({
              get: mockGet,
              interceptors: {
                response: {
                  use: jest.fn()
                }
              }
            });

            const testService = new PigeonDataService();

            // Should not throw an error even with empty areas
            const sightings = await testService.getCurrentSightings(areas);
            
            // Property: Should always return an array
            expect(Array.isArray(sightings)).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should provide consistent fallback behavior across multiple calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.subarray(Object.keys(URBAN_AREAS) as UrbanArea[], { minLength: 1, maxLength: 3 }),
          async (areas: UrbanArea[]) => {
            // Mock axios to simulate consistent API failure
            const mockAxios = require('axios');
            const mockGet = jest.fn().mockRejectedValue(new Error('Consistent API failure'));
            mockAxios.create.mockReturnValue({
              get: mockGet,
              interceptors: {
                response: {
                  use: jest.fn()
                }
              }
            });

            const testService = new PigeonDataService();

            // Make multiple calls
            const firstCall = await testService.getCurrentSightings(areas);
            const secondCall = await testService.getCurrentSightings(areas);

            // Property: Both calls should succeed (return arrays)
            expect(Array.isArray(firstCall)).toBe(true);
            expect(Array.isArray(secondCall)).toBe(true);

            // Property: Second call should return cached data (should be identical)
            expect(firstCall).toEqual(secondCall);

            // Property: Both results should have valid structure
            [firstCall, secondCall].forEach(sightings => {
              sightings.forEach(sighting => {
                expect(sighting).toHaveProperty('timestamp');
                expect(sighting).toHaveProperty('location');
                expect(sighting).toHaveProperty('count');
                expect(sighting.count).toBeGreaterThan(0);
              });
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate realistic mock data when APIs are unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.subarray(Object.keys(URBAN_AREAS) as UrbanArea[], { minLength: 1, maxLength: 5 }),
          async (areas: UrbanArea[]) => {
            // Mock axios to simulate API unavailability
            const mockAxios = require('axios');
            const mockGet = jest.fn().mockRejectedValue(new Error('Service unavailable'));
            mockAxios.create.mockReturnValue({
              get: mockGet,
              interceptors: {
                response: {
                  use: jest.fn()
                }
              }
            });

            const testService = new PigeonDataService();
            const sightings = await testService.getCurrentSightings(areas);

            // Property: Mock data should be realistic
            sightings.forEach(sighting => {
              // Counts should be reasonable for urban pigeon populations
              expect(sighting.count).toBeGreaterThan(0);
              expect(sighting.count).toBeLessThan(1000);

              // Timestamps should be recent
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
              expect(sighting.timestamp.getTime()).toBeGreaterThanOrEqual(oneDayAgo.getTime());
              expect(sighting.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());

              // Coordinates should be within reasonable bounds for requested areas
              if (sighting.coordinates) {
                const { lat, lng } = sighting.coordinates;
                expect(lat).toBeGreaterThan(-90);
                expect(lat).toBeLessThan(90);
                expect(lng).toBeGreaterThan(-180);
                expect(lng).toBeLessThan(180);
              }
            });

            // Property: Should have data for requested areas
            const locations = new Set(sightings.map(s => s.location));
            const expectedLocations = new Set(areas.map(area => URBAN_AREAS[area].name));
            
            // At least some of the requested areas should have data
            let hasMatchingLocation = false;
            locations.forEach(location => {
              if (expectedLocations.has(location)) {
                hasMatchingLocation = true;
              }
            });
            
            if (areas.length > 0) {
              expect(hasMatchingLocation).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});