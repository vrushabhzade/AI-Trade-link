/**
 * Tests for data transformation and normalization utilities
 */

import {
  TimeBucket,
  roundToTimeBucket,
  aggregatePigeonData,
  aggregateCryptoData,
  alignDataTemporally,
  normalizePriceData,
  normalizePigeonData,
  filterByTimeRange,
  filterPigeonByRegion,
  filterCryptoBySymbols,
  calculateStatistics,
  aggregatePigeonByGeography,
  extractUrbanArea
} from './dataTransform';
import { PigeonSighting, CryptoPricePoint } from '../types/index';

describe('Data Transformation Utilities', () => {
  describe('roundToTimeBucket', () => {
    it('should round timestamp down to start of hour', () => {
      const timestamp = new Date('2023-12-01T10:30:45Z');
      const rounded = roundToTimeBucket(timestamp, TimeBucket.HOURLY);
      
      expect(rounded.getUTCMinutes()).toBe(0);
      expect(rounded.getUTCSeconds()).toBe(0);
      expect(rounded.getUTCHours()).toBe(10);
    });

    it('should round timestamp down to start of 15-minute bucket', () => {
      const timestamp = new Date('2023-12-01T10:37:30Z');
      const rounded = roundToTimeBucket(timestamp, TimeBucket.FIFTEEN_MINUTES);
      
      // 37 minutes should round down to 30 (the start of the 30-45 minute bucket)
      expect(rounded.getUTCMinutes()).toBe(30);
      expect(rounded.getUTCSeconds()).toBe(0);
    });
  });

  describe('aggregatePigeonData', () => {
    it('should aggregate pigeon sightings by time bucket', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date('2023-12-01T10:15:00Z'),
          location: 'Park A',
          count: 5
        },
        {
          timestamp: new Date('2023-12-01T10:45:00Z'),
          location: 'Park A',
          count: 3
        }
      ];

      const aggregated = aggregatePigeonData(sightings, TimeBucket.HOURLY);
      
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].count).toBe(8);
      expect(aggregated[0].location).toBe('aggregated');
    });

    it('should group by location when specified', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date('2023-12-01T10:15:00Z'),
          location: 'Park A',
          count: 5
        },
        {
          timestamp: new Date('2023-12-01T10:45:00Z'),
          location: 'Park B',
          count: 3
        }
      ];

      const aggregated = aggregatePigeonData(sightings, TimeBucket.HOURLY, true);
      
      expect(aggregated).toHaveLength(2);
      expect(aggregated.find(s => s.location === 'Park A')?.count).toBe(5);
      expect(aggregated.find(s => s.location === 'Park B')?.count).toBe(3);
    });
  });

  describe('aggregateCryptoData', () => {
    it('should aggregate crypto prices using volume-weighted average', () => {
      const pricePoints: CryptoPricePoint[] = [
        {
          timestamp: new Date('2023-12-01T10:15:00Z'),
          symbol: 'BTC',
          price: 40000,
          volume: 100
        },
        {
          timestamp: new Date('2023-12-01T10:45:00Z'),
          symbol: 'BTC',
          price: 42000,
          volume: 200
        }
      ];

      const aggregated = aggregateCryptoData(pricePoints, TimeBucket.HOURLY);
      
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].symbol).toBe('BTC');
      expect(aggregated[0].volume).toBe(300);
      // Volume-weighted average: (40000*100 + 42000*200) / 300 = 41333.33
      expect(aggregated[0].price).toBeCloseTo(41333.33, 2);
    });

    it('should use simple average when no volume data', () => {
      const pricePoints: CryptoPricePoint[] = [
        {
          timestamp: new Date('2023-12-01T10:15:00Z'),
          symbol: 'BTC',
          price: 40000
        },
        {
          timestamp: new Date('2023-12-01T10:45:00Z'),
          symbol: 'BTC',
          price: 42000
        }
      ];

      const aggregated = aggregateCryptoData(pricePoints, TimeBucket.HOURLY);
      
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].price).toBe(41000); // Simple average
    });
  });

  describe('alignDataTemporally', () => {
    it('should align pigeon and crypto data to common timestamps', () => {
      const pigeonData: PigeonSighting[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          location: 'Park A',
          count: 5
        },
        {
          timestamp: new Date('2023-12-01T11:00:00Z'),
          location: 'Park A',
          count: 8
        }
      ];

      const cryptoData: CryptoPricePoint[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          symbol: 'BTC',
          price: 40000
        },
        {
          timestamp: new Date('2023-12-01T12:00:00Z'), // Different time
          symbol: 'BTC',
          price: 42000
        }
      ];

      const { alignedPigeonData, alignedCryptoData } = alignDataTemporally(
        pigeonData, 
        cryptoData, 
        TimeBucket.HOURLY
      );

      expect(alignedPigeonData).toHaveLength(1);
      expect(alignedCryptoData).toHaveLength(1);
      expect(alignedPigeonData[0].timestamp.getTime()).toBe(
        alignedCryptoData[0].timestamp.getTime()
      );
    });
  });

  describe('normalizePriceData', () => {
    it('should normalize prices to 0-1 scale', () => {
      const pricePoints: CryptoPricePoint[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          symbol: 'BTC',
          price: 40000
        },
        {
          timestamp: new Date('2023-12-01T11:00:00Z'),
          symbol: 'BTC',
          price: 50000
        }
      ];

      const normalized = normalizePriceData(pricePoints);
      
      expect(normalized[0].price).toBe(0); // Min value
      expect(normalized[1].price).toBe(1); // Max value
    });

    it('should handle single price point', () => {
      const pricePoints: CryptoPricePoint[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          symbol: 'BTC',
          price: 40000
        }
      ];

      const normalized = normalizePriceData(pricePoints);
      
      expect(normalized[0].price).toBe(0.5); // Default for single point
    });
  });

  describe('filterByTimeRange', () => {
    it('should filter data by time range', () => {
      const data = [
        { timestamp: new Date('2023-12-01T09:00:00Z'), value: 1 },
        { timestamp: new Date('2023-12-01T10:00:00Z'), value: 2 },
        { timestamp: new Date('2023-12-01T11:00:00Z'), value: 3 }
      ];

      const filtered = filterByTimeRange(
        data,
        new Date('2023-12-01T09:30:00Z'),
        new Date('2023-12-01T10:30:00Z')
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].value).toBe(2);
    });
  });

  describe('aggregatePigeonByGeography', () => {
    it('should aggregate pigeon sightings by urban area', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          location: 'Central Park, NYC',
          count: 5
        },
        {
          timestamp: new Date('2023-12-01T11:00:00Z'),
          location: 'Times Square, NYC',
          count: 3
        },
        {
          timestamp: new Date('2023-12-01T12:00:00Z'),
          location: 'Golden Gate Park, San Francisco',
          count: 8
        }
      ];

      const aggregated = aggregatePigeonByGeography(sightings);
      
      expect(aggregated).toHaveLength(2);
      
      const nycData = aggregated.find(s => s.location === 'NYC');
      const sfData = aggregated.find(s => s.location === 'San Francisco');
      
      expect(nycData?.count).toBe(8); // 5 + 3
      expect(sfData?.count).toBe(8);
    });

    it('should handle locations without commas', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date(),
          location: 'NYC Central Park',
          count: 5
        },
        {
          timestamp: new Date(),
          location: 'SF Marina',
          count: 3
        }
      ];

      const aggregated = aggregatePigeonByGeography(sightings);
      
      expect(aggregated).toHaveLength(2);
      expect(aggregated.some(s => s.location === 'NYC')).toBe(true);
      expect(aggregated.some(s => s.location === 'SF')).toBe(true);
    });

    it('should preserve coordinates from first sighting', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date('2023-12-01T10:00:00Z'),
          location: 'Central Park, NYC',
          count: 5,
          coordinates: { lat: 40.7829, lng: -73.9654 }
        },
        {
          timestamp: new Date('2023-12-01T11:00:00Z'),
          location: 'Times Square, NYC',
          count: 3,
          coordinates: { lat: 40.7580, lng: -73.9855 }
        }
      ];

      const aggregated = aggregatePigeonByGeography(sightings);
      
      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].coordinates).toEqual({ lat: 40.7829, lng: -73.9654 });
    });
  });

  describe('extractUrbanArea', () => {
    it('should extract city from comma-separated location', () => {
      expect(extractUrbanArea('Central Park, NYC')).toBe('NYC');
      expect(extractUrbanArea('Golden Gate Park, San Francisco')).toBe('San Francisco');
      expect(extractUrbanArea('Hyde Park, London')).toBe('London');
    });

    it('should handle city patterns without commas', () => {
      expect(extractUrbanArea('NYC Central Park')).toBe('NYC');
      expect(extractUrbanArea('San Francisco Marina')).toBe('San Francisco');
      expect(extractUrbanArea('LA Downtown')).toBe('LA');
    });

    it('should handle edge cases', () => {
      expect(extractUrbanArea('')).toBe('Unknown');
      expect(extractUrbanArea('   ')).toBe('Unknown');
      expect(extractUrbanArea('SingleWord')).toBe('SingleWord');
    });
  });

  describe('filterPigeonByRegion', () => {
    it('should filter pigeon data by region', () => {
      const sightings: PigeonSighting[] = [
        {
          timestamp: new Date(),
          location: 'Central Park, NYC',
          count: 5
        },
        {
          timestamp: new Date(),
          location: 'Golden Gate Park, SF',
          count: 3
        }
      ];

      const filtered = filterPigeonByRegion(sightings, ['NYC']);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].location).toContain('NYC');
    });
  });

  describe('filterCryptoBySymbols', () => {
    it('should filter crypto data by symbols', () => {
      const pricePoints: CryptoPricePoint[] = [
        {
          timestamp: new Date(),
          symbol: 'BTC',
          price: 40000
        },
        {
          timestamp: new Date(),
          symbol: 'ETH',
          price: 2500
        }
      ];

      const filtered = filterCryptoBySymbols(pricePoints, ['BTC']);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe('BTC');
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate correct statistics', () => {
      const values = [1, 2, 3, 4, 5];
      const stats = calculateStatistics(values);
      
      expect(stats.mean).toBe(3);
      expect(stats.median).toBe(3);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(5);
      expect(stats.count).toBe(5);
      expect(stats.standardDeviation).toBeCloseTo(1.414, 2);
    });

    it('should handle empty array', () => {
      const stats = calculateStatistics([]);
      
      expect(stats.mean).toBe(0);
      expect(stats.count).toBe(0);
    });
  });
});