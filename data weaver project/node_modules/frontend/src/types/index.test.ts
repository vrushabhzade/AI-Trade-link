/**
 * Basic tests to ensure frontend types are working correctly
 */

import type { PigeonSighting, CryptoPricePoint, DashboardData } from './index';

describe('Frontend Types', () => {
  it('should create valid PigeonSighting object', () => {
    const sighting: PigeonSighting = {
      timestamp: new Date('2023-12-01T10:00:00Z'),
      location: 'Central Park, NYC',
      count: 15,
      coordinates: { lat: 40.7829, lng: -73.9654 }
    };

    expect(sighting.count).toBe(15);
    expect(sighting.location).toBe('Central Park, NYC');
    expect(sighting.coordinates?.lat).toBe(40.7829);
  });

  it('should create valid CryptoPricePoint object', () => {
    const pricePoint: CryptoPricePoint = {
      timestamp: new Date('2023-12-01T10:00:00Z'),
      symbol: 'BTC',
      price: 42000.50,
      volume: 1000000,
      marketCap: 800000000000
    };

    expect(pricePoint.symbol).toBe('BTC');
    expect(pricePoint.price).toBe(42000.50);
    expect(pricePoint.volume).toBe(1000000);
  });

  it('should create valid DashboardData object', () => {
    const dashboardData: DashboardData = {
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
      correlations: [],
      metadata: {
        lastUpdated: new Date(),
        dataQuality: 'real'
      }
    };

    expect(dashboardData.pigeonData).toHaveLength(1);
    expect(dashboardData.cryptoData).toHaveLength(1);
    expect(dashboardData.metadata.dataQuality).toBe('real');
  });
});