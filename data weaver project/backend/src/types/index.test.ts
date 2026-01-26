/**
 * Tests for core data models and validation functions
 */

import { 
  validatePigeonSighting, 
  validateCryptoPricePoint, 
  validateCorrelationResult, 
  validateDashboardData 
} from '../validation/index';
import { PigeonSighting, CryptoPricePoint, CorrelationResult, DashboardData } from './index';

describe('Data Model Validation', () => {
  describe('validatePigeonSighting', () => {
    it('should validate a correct pigeon sighting', () => {
      const validSighting: PigeonSighting = {
        timestamp: new Date('2023-12-01T10:00:00Z'),
        location: 'Central Park, NYC',
        count: 15,
        coordinates: { lat: 40.7829, lng: -73.9654 }
      };

      const result = validatePigeonSighting(validSighting);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid pigeon sighting data', () => {
      const invalidSighting = {
        timestamp: 'invalid-date',
        location: '',
        count: -5,
        coordinates: { lat: 200, lng: -200 }
      };

      const result = validatePigeonSighting(invalidSighting);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept pigeon sighting without coordinates', () => {
      const sighting = {
        timestamp: new Date(),
        location: 'Times Square',
        count: 8
      };

      const result = validatePigeonSighting(sighting);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCryptoPricePoint', () => {
    it('should validate a correct crypto price point', () => {
      const validPrice: CryptoPricePoint = {
        timestamp: new Date('2023-12-01T10:00:00Z'),
        symbol: 'BTC',
        price: 42000.50,
        volume: 1000000,
        marketCap: 800000000000
      };

      const result = validateCryptoPricePoint(validPrice);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid crypto price data', () => {
      const invalidPrice = {
        timestamp: null,
        symbol: '',
        price: -100,
        volume: 'invalid'
      };

      const result = validateCryptoPricePoint(invalidPrice);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept crypto price without optional fields', () => {
      const price = {
        timestamp: new Date(),
        symbol: 'ETH',
        price: 2500.75
      };

      const result = validateCryptoPricePoint(price);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCorrelationResult', () => {
    it('should validate a correct correlation result', () => {
      const validCorrelation: CorrelationResult = {
        coefficient: 0.75,
        pValue: 0.05,
        timeRange: {
          start: new Date('2023-12-01T00:00:00Z'),
          end: new Date('2023-12-01T23:59:59Z')
        },
        significance: 'high'
      };

      const result = validateCorrelationResult(validCorrelation);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject correlation with invalid coefficient', () => {
      const invalidCorrelation = {
        coefficient: 1.5, // Invalid: > 1
        pValue: 0.05,
        timeRange: {
          start: new Date('2023-12-01T00:00:00Z'),
          end: new Date('2023-12-01T23:59:59Z')
        },
        significance: 'high'
      };

      const result = validateCorrelationResult(invalidCorrelation);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('coefficient'))).toBe(true);
    });

    it('should reject correlation with end time before start time', () => {
      const invalidCorrelation = {
        coefficient: 0.5,
        pValue: 0.05,
        timeRange: {
          start: new Date('2023-12-02T00:00:00Z'),
          end: new Date('2023-12-01T00:00:00Z') // End before start
        },
        significance: 'medium'
      };

      const result = validateCorrelationResult(invalidCorrelation);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('end must be after'))).toBe(true);
    });
  });

  describe('validateDashboardData', () => {
    it('should validate complete dashboard data', () => {
      const validDashboard: DashboardData = {
        pigeonData: [{
          timestamp: new Date('2023-12-01T10:00:00Z'),
          location: 'Central Park',
          count: 10
        }],
        cryptoData: [{
          timestamp: new Date('2023-12-01T10:00:00Z'),
          symbol: 'BTC',
          price: 42000
        }],
        correlations: [{
          coefficient: 0.5,
          pValue: 0.1,
          timeRange: {
            start: new Date('2023-12-01T00:00:00Z'),
            end: new Date('2023-12-01T23:59:59Z')
          },
          significance: 'medium'
        }],
        metadata: {
          lastUpdated: new Date(),
          dataQuality: 'real'
        }
      };

      const result = validateDashboardData(validDashboard);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject dashboard data with invalid nested objects', () => {
      const invalidDashboard = {
        pigeonData: [{ invalid: 'data' }],
        cryptoData: [{ also: 'invalid' }],
        correlations: [],
        metadata: {
          lastUpdated: 'not-a-date',
          dataQuality: 'invalid-quality'
        }
      };

      const result = validateDashboardData(invalidDashboard);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});