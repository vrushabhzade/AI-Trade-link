import { calculateHaversineDistance, validateCoordinates, formatCoordinates } from '../../utils/geospatial';

interface LocationPoint {
  latitude: number;
  longitude: number;
}

describe('LocationService', () => {
  const testLocation: LocationPoint = {
    latitude: 40.7128,
    longitude: -74.0060, // New York City
  };

  const testLocation2: LocationPoint = {
    latitude: 34.0522,
    longitude: -118.2437, // Los Angeles
  };

  describe('calculateDistance', () => {
    it('should calculate distance between two points', async () => {
      // Mock the database query for this test
      const mockDistance = calculateHaversineDistance(testLocation, testLocation2);
      expect(mockDistance).toBeGreaterThan(0);
      expect(mockDistance).toBeCloseTo(3935.75, 0); // Approximate distance between NYC and LA
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validateCoordinates(testLocation)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
      expect(validateCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates correctly', () => {
      const formatted = formatCoordinates(testLocation, 4);
      expect(formatted).toMatch(/40\.7128°N, 74\.006°W/);
    });
  });
});

describe('Geospatial Utils', () => {
  const testLocation: LocationPoint = {
    latitude: 40.7128,
    longitude: -74.0060, // New York City
  };

  describe('calculateHaversineDistance', () => {
    it('should calculate distance between same points as 0', () => {
      const distance = calculateHaversineDistance(testLocation, testLocation);
      expect(distance).toBe(0);
    });

    it('should calculate distance between different points', () => {
      const testLocation1: LocationPoint = { latitude: 0, longitude: 0 };
      const testLocation2: LocationPoint = { latitude: 1, longitude: 1 };
      const distance = calculateHaversineDistance(testLocation1, testLocation2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(157.23, 1); // Approximate distance
    });
  });

  describe('validateCoordinates', () => {
    it('should validate latitude bounds', () => {
      expect(validateCoordinates({ latitude: -90, longitude: 0 })).toBe(true);
      expect(validateCoordinates({ latitude: 90, longitude: 0 })).toBe(true);
      expect(validateCoordinates({ latitude: -91, longitude: 0 })).toBe(false);
      expect(validateCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    });

    it('should validate longitude bounds', () => {
      expect(validateCoordinates({ latitude: 0, longitude: -180 })).toBe(true);
      expect(validateCoordinates({ latitude: 0, longitude: 180 })).toBe(true);
      expect(validateCoordinates({ latitude: 0, longitude: -181 })).toBe(false);
      expect(validateCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
    });
  });
});