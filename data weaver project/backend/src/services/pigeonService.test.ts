/**
 * Unit tests for PigeonDataService
 * Tests the pigeon data service functionality including eBird API integration,
 * mock data generation, and geographic aggregation
 */

import { PigeonDataService, URBAN_AREAS, type UrbanArea } from './pigeonService.js';
import type { PigeonSighting } from '../types/index.js';

// Mock axios to avoid real API calls during testing
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

describe('PigeonDataService', () => {
  let service: PigeonDataService;

  beforeEach(() => {
    service = new PigeonDataService();
    // Clear any cached data between tests
    service.clearCache();
  });

  describe('Mock Data Generation', () => {
    it('should generate realistic mock pigeon sightings for urban areas', async () => {
      const areas: UrbanArea[] = ['new-york', 'london'];
      const sightings = await service.getCurrentSightings(areas);

      expect(sightings).toBeDefined();
      expect(Array.isArray(sightings)).toBe(true);
      expect(sightings.length).toBeGreaterThan(0);

      // Check that sightings have required properties
      sightings.forEach(sighting => {
        expect(sighting).toHaveProperty('timestamp');
        expect(sighting).toHaveProperty('location');
        expect(sighting).toHaveProperty('count');
        expect(sighting.timestamp).toBeInstanceOf(Date);
        expect(typeof sighting.location).toBe('string');
        expect(typeof sighting.count).toBe('number');
        expect(sighting.count).toBeGreaterThan(0);
      });

      // Check that locations match requested areas
      const locations = sightings.map(s => s.location);
      const expectedLocations = areas.map(area => URBAN_AREAS[area].name);
      locations.forEach(location => {
        expect(expectedLocations).toContain(location);
      });
    });

    it('should generate historical mock data with proper time ordering', async () => {
      const areas: UrbanArea[] = ['tokyo'];
      const days = 3;
      const sightings = await service.getHistoricalSightings(areas, days);

      expect(sightings).toBeDefined();
      expect(Array.isArray(sightings)).toBe(true);
      expect(sightings.length).toBeGreaterThan(0);

      // Check that sightings are ordered by timestamp
      for (let i = 1; i < sightings.length; i++) {
        expect(sightings[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          sightings[i - 1].timestamp.getTime()
        );
      }

      // Check that all sightings are within the requested time range
      const now = new Date();
      const earliestAllowed = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      sightings.forEach(sighting => {
        expect(sighting.timestamp.getTime()).toBeGreaterThanOrEqual(earliestAllowed.getTime());
        expect(sighting.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });

    it('should generate coordinates within urban area boundaries', async () => {
      const areas: UrbanArea[] = ['paris'];
      const sightings = await service.getCurrentSightings(areas);

      expect(sightings.length).toBeGreaterThan(0);

      sightings.forEach(sighting => {
        if (sighting.coordinates) {
          const areaConfig = URBAN_AREAS['paris'];
          const { lat, lng } = sighting.coordinates;
          
          // Check that coordinates are reasonable (within rough bounds of Paris area)
          expect(lat).toBeGreaterThan(areaConfig.lat - 1);
          expect(lat).toBeLessThan(areaConfig.lat + 1);
          expect(lng).toBeGreaterThan(areaConfig.lng - 1);
          expect(lng).toBeLessThan(areaConfig.lng + 1);
        }
      });
    });
  });

  describe('Geographic Aggregation', () => {
    it('should aggregate pigeon counts by urban area', async () => {
      const areas: UrbanArea[] = ['new-york', 'berlin'];
      const aggregated = await service.getAggregatedCounts(areas, 'day');

      expect(aggregated).toBeDefined();
      expect(typeof aggregated).toBe('object');

      // Check that we have data for each requested area
      areas.forEach(area => {
        expect(aggregated).toHaveProperty(area);
        expect(Array.isArray(aggregated[area])).toBe(true);
      });

      // Check that aggregated data has proper structure
      Object.values(aggregated).forEach(areaSightings => {
        areaSightings.forEach(sighting => {
          expect(sighting).toHaveProperty('timestamp');
          expect(sighting).toHaveProperty('location');
          expect(sighting).toHaveProperty('count');
          expect(sighting.count).toBeGreaterThan(0);
        });
      });
    });

    it('should handle different time range aggregations', async () => {
      const areas: UrbanArea[] = ['london'];
      
      const hourlyAggregated = await service.getAggregatedCounts(areas, 'hour');
      const dailyAggregated = await service.getAggregatedCounts(areas, 'day');
      const weeklyAggregated = await service.getAggregatedCounts(areas, 'week');

      expect(hourlyAggregated).toBeDefined();
      expect(dailyAggregated).toBeDefined();
      expect(weeklyAggregated).toBeDefined();

      // Hourly should generally have more data points than daily
      const hourlyCount = hourlyAggregated['london']?.length || 0;
      const dailyCount = dailyAggregated['london']?.length || 0;
      const weeklyCount = weeklyAggregated['london']?.length || 0;

      expect(hourlyCount).toBeGreaterThanOrEqual(dailyCount);
      expect(dailyCount).toBeGreaterThanOrEqual(weeklyCount);
    });
  });

  describe('Caching', () => {
    it('should cache results and return cached data on subsequent calls', async () => {
      const areas: UrbanArea[] = ['tokyo'];
      
      // First call - should generate new data
      const firstResult = await service.getCurrentSightings(areas);
      const cacheStats1 = service.getCacheStats();
      
      // Second call - should return cached data
      const secondResult = await service.getCurrentSightings(areas);
      const cacheStats2 = service.getCacheStats();

      expect(firstResult).toEqual(secondResult);
      expect(cacheStats2.size).toBeGreaterThanOrEqual(cacheStats1.size);
    });

    it('should clear cache when requested', () => {
      // Add some data to cache by making a call
      service.getCurrentSightings(['new-york']);
      
      const statsBeforeClear = service.getCacheStats();
      expect(statsBeforeClear.size).toBeGreaterThan(0);

      service.clearCache();
      
      const statsAfterClear = service.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
      expect(statsAfterClear.keys).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit status', () => {
      const rateLimitStatus = service.getRateLimitStatus();
      
      expect(rateLimitStatus).toBeDefined();
      expect(rateLimitStatus).toHaveProperty('ebird');
      expect(rateLimitStatus.ebird).toHaveProperty('count');
      expect(rateLimitStatus.ebird).toHaveProperty('resetTime');
      expect(typeof rateLimitStatus.ebird.count).toBe('number');
      expect(typeof rateLimitStatus.ebird.resetTime).toBe('number');
    });
  });

  describe('Supported Areas', () => {
    it('should return all supported urban areas', () => {
      const supportedAreas = service.getSupportedAreas();
      
      expect(supportedAreas).toBeDefined();
      expect(typeof supportedAreas).toBe('object');
      
      // Check that all expected areas are present
      const expectedAreas = ['new-york', 'london', 'tokyo', 'paris', 'berlin'];
      expectedAreas.forEach(area => {
        expect(supportedAreas).toHaveProperty(area);
        expect(supportedAreas[area as UrbanArea]).toHaveProperty('name');
        expect(supportedAreas[area as UrbanArea]).toHaveProperty('lat');
        expect(supportedAreas[area as UrbanArea]).toHaveProperty('lng');
        expect(supportedAreas[area as UrbanArea]).toHaveProperty('radius');
        expect(supportedAreas[area as UrbanArea]).toHaveProperty('regionCode');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle empty area arrays gracefully', async () => {
      const sightings = await service.getCurrentSightings([]);
      
      expect(sightings).toBeDefined();
      expect(Array.isArray(sightings)).toBe(true);
      // Should return empty array or handle gracefully
    });

    it('should handle invalid time ranges for historical data', async () => {
      const areas: UrbanArea[] = ['new-york'];
      
      // Test with 0 days (should handle gracefully)
      const sightings = await service.getHistoricalSightings(areas, 0);
      expect(sightings).toBeDefined();
      expect(Array.isArray(sightings)).toBe(true);
    });
  });

  describe('Data Quality', () => {
    it('should generate realistic pigeon counts', async () => {
      const areas: UrbanArea[] = ['new-york'];
      const sightings = await service.getCurrentSightings(areas);

      sightings.forEach(sighting => {
        // Pigeon counts should be reasonable (not negative, not extremely high)
        expect(sighting.count).toBeGreaterThan(0);
        expect(sighting.count).toBeLessThan(1000); // Reasonable upper bound
      });
    });

    it('should generate timestamps within reasonable bounds', async () => {
      const areas: UrbanArea[] = ['london'];
      const sightings = await service.getCurrentSightings(areas);
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      sightings.forEach(sighting => {
        expect(sighting.timestamp.getTime()).toBeGreaterThanOrEqual(oneDayAgo.getTime());
        expect(sighting.timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });
});