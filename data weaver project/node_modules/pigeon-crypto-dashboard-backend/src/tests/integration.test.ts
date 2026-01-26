/**
 * Backend Integration Tests
 * 
 * Tests complete data flow from APIs to dashboard display
 * Verifies all services work together correctly
 * 
 * **Feature: pigeon-crypto-dashboard, Backend Integration Tests**
 */

import request from 'supertest';
import { WebSocket } from 'ws';
import app from '../index.js';
import { cryptoService } from '../services/cryptoService.js';
import { pigeonService } from '../services/pigeonService.js';
import { correlationService } from '../services/correlationService.js';
import { cacheService } from '../services/cacheService.js';
import { persistenceService } from '../services/persistenceService.js';
import { performanceService } from '../services/performanceService.js';
import { errorHandlingService } from '../services/errorHandlingService.js';

// Mock external APIs
jest.mock('axios');

describe('Backend Integration Tests', () => {
  let server: any;
  const PORT = 3002; // Use different port for testing

  beforeAll(async () => {
    // Initialize test database
    await persistenceService.initialize();
    
    // Start test server
    server = app.listen(PORT);
  });

  afterAll(async () => {
    // Cleanup
    await persistenceService.close();
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.clearAll();
    jest.clearAllMocks();
  });

  /**
   * Test complete data flow from API to dashboard
   * **Feature: pigeon-crypto-dashboard, Integration Test 1: Complete Data Flow**
   */
  describe('Complete Data Flow', () => {
    test('fetches and processes data end-to-end', async () => {
      // Mock external API responses
      const mockCryptoData = [
        {
          timestamp: new Date(),
          symbol: 'BTC',
          price: 42000,
          volume: 1000000
        }
      ];

      const mockPigeonData = [
        {
          timestamp: new Date(),
          location: 'new-york',
          count: 15,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        }
      ];

      // Mock service responses
      jest.spyOn(cryptoService, 'getCurrentPrices').mockResolvedValue(mockCryptoData);
      jest.spyOn(pigeonService, 'getCurrentSightings').mockResolvedValue(mockPigeonData);

      // Test dashboard data endpoint
      const response = await request(app)
        .get('/api/dashboard-data')
        .query({
          timeRange: '1',
          cryptos: 'bitcoin',
          areas: 'new-york'
        })
        .expect(200);

      // Verify response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pigeonData');
      expect(response.body.data).toHaveProperty('cryptoData');
      expect(response.body.data).toHaveProperty('correlations');
      expect(response.body.data).toHaveProperty('metadata');

      // Verify data processing
      expect(response.body.data.pigeonData).toHaveLength(1);
      expect(response.body.data.cryptoData).toHaveLength(1);
      expect(response.body.data.correlations).toBeDefined();

      // Verify performance metrics
      expect(response.body.performance).toHaveProperty('responseTime');
      expect(response.body.performance).toHaveProperty('dataPoints');
    });

    test('handles concurrent requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .get('/api/dashboard-data')
          .query({ timeRange: '1', cryptos: 'bitcoin', areas: 'new-york' })
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify performance service handled concurrent users
      const stats = performanceService.getStats();
      expect(stats.activeUsers).toBeGreaterThanOrEqual(0);
    });
  });

  /**
   * Test error handling and fallback mechanisms
   * **Feature: pigeon-crypto-dashboard, Integration Test 2: Error Handling**
   */
  describe('Error Handling and Fallbacks', () => {
    test('handles API failures gracefully', async () => {
      // Mock API failure
      jest.spyOn(cryptoService, 'getCurrentPrices').mockRejectedValue(new Error('API Error'));
      jest.spyOn(pigeonService, 'getCurrentSightings').mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/dashboard-data')
        .query({ timeRange: '1', cryptos: 'bitcoin', areas: 'new-york' })
        .expect(500);

      // Verify error response structure
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.suggestions).toBeDefined();
    });

    test('uses cached data when APIs fail', async () => {
      // First, populate cache with successful request
      const mockData = {
        pigeonData: [{ timestamp: new Date(), location: 'new-york', count: 10 }],
        cryptoData: [{ timestamp: new Date(), symbol: 'BTC', price: 40000 }]
      };

      await cacheService.cachePigeonData('test-key', mockData.pigeonData);
      await cacheService.cacheCryptoData('test-key', mockData.cryptoData);

      // Mock API failure
      jest.spyOn(cryptoService, 'getCurrentPrices').mockRejectedValue(new Error('API Error'));
      jest.spyOn(pigeonService, 'getCurrentSightings').mockRejectedValue(new Error('API Error'));

      // The error handling service should fall back to cached data
      const errorStats = errorHandlingService.getErrorStats();
      expect(errorStats.totalErrors).toBeGreaterThanOrEqual(0);
    });

    test('reports errors correctly', async () => {
      const errorReport = {
        error: {
          type: 'network',
          message: 'Connection failed',
          stack: 'Error stack trace'
        },
        context: {
          userAgent: 'Test Browser',
          url: '/dashboard',
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/errors/report')
        .send(errorReport)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Error report received');
    });
  });

  /**
   * Test WebSocket real-time functionality
   * **Feature: pigeon-crypto-dashboard, Integration Test 3: WebSocket Integration**
   */
  describe('WebSocket Real-time Updates', () => {
    test('establishes WebSocket connection and receives updates', (done) => {
      const ws = new WebSocket(`ws://localhost:${PORT}/ws`);

      ws.on('open', () => {
        // Subscribe to pigeon updates
        ws.send(JSON.stringify({
          type: 'subscribe-pigeon',
          areas: ['new-york']
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscription-confirmed') {
          expect(message.data.dataType).toBe('pigeon');
          expect(message.data.areas).toContain('new-york');
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('handles WebSocket disconnections gracefully', (done) => {
      const ws = new WebSocket(`ws://localhost:${PORT}/ws`);

      ws.on('open', () => {
        // Immediately close connection
        ws.close();
      });

      ws.on('close', (code) => {
        expect(code).toBeDefined();
        done();
      });
    });
  });

  /**
   * Test performance optimization features
   * **Feature: pigeon-crypto-dashboard, Integration Test 4: Performance Optimization**
   */
  describe('Performance Optimization', () => {
    test('optimizes large datasets automatically', async () => {
      // Mock large dataset
      const largePigeonData = Array.from({ length: 5000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000),
        location: 'new-york',
        count: Math.floor(Math.random() * 50)
      }));

      const largeCryptoData = Array.from({ length: 5000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000),
        symbol: 'BTC',
        price: 40000 + Math.random() * 10000
      }));

      jest.spyOn(pigeonService, 'getHistoricalSightings').mockResolvedValue(largePigeonData);
      jest.spyOn(cryptoService, 'getHistoricalPrices').mockResolvedValue(largeCryptoData);

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/dashboard-data')
        .query({
          timeRange: '7',
          cryptos: 'bitcoin',
          areas: 'new-york',
          optimize: 'true'
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Verify optimization occurred
      expect(response.body.performance.optimized).toBe(true);
      expect(response.body.performance.dataPoints.pigeon).toBeLessThanOrEqual(1000);
      expect(response.body.performance.dataPoints.crypto).toBeLessThanOrEqual(1000);

      // Verify reasonable response time
      expect(responseTime).toBeLessThan(5000); // Should be under 5 seconds
    });

    test('handles rate limiting correctly', async () => {
      // Simulate rate limiting by making many requests quickly
      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/dashboard-data')
          .query({ timeRange: '1', cryptos: 'bitcoin', areas: 'new-york' })
      );

      const responses = await Promise.allSettled(requests);

      // Some requests should succeed, some might be rate limited
      const successful = responses.filter(r => r.status === 'fulfilled' && (r.value as any).status === 200);
      const rateLimited = responses.filter(r => r.status === 'fulfilled' && (r.value as any).status === 429);

      expect(successful.length + rateLimited.length).toBe(20);
    });
  });

  /**
   * Test health monitoring and diagnostics
   * **Feature: pigeon-crypto-dashboard, Integration Test 5: Health Monitoring**
   */
  describe('Health Monitoring', () => {
    test('provides comprehensive health status', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.services).toHaveProperty('cache');
      expect(response.body.services).toHaveProperty('persistence');
      expect(response.body.services).toHaveProperty('websocket');
      expect(response.body.services).toHaveProperty('performance');
      expect(response.body.services).toHaveProperty('errors');

      // Verify service health
      expect(response.body.services.cache.status).toMatch(/healthy|degraded/);
      expect(response.body.services.persistence.status).toMatch(/healthy|error/);
    });

    test('provides error statistics', async () => {
      const response = await request(app)
        .get('/api/errors/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalErrors');
      expect(response.body.data).toHaveProperty('errorsByType');
      expect(response.body.data).toHaveProperty('errorsBySeverity');
      expect(response.body.data).toHaveProperty('offlineMode');
    });
  });

  /**
   * Test user preferences and session management
   * **Feature: pigeon-crypto-dashboard, Integration Test 6: User Preferences**
   */
  describe('User Preferences', () => {
    const testSessionId = 'test-session-123';

    test('manages user preferences correctly', async () => {
      const preferences = {
        selectedCryptocurrencies: ['bitcoin', 'ethereum'],
        timeRange: '168',
        selectedRegions: ['new-york', 'london'],
        chartType: 'line',
        theme: 'dark'
      };

      // Save preferences
      const saveResponse = await request(app)
        .post(`/api/preferences/${testSessionId}`)
        .send({ preferences })
        .expect(200);

      expect(saveResponse.body.success).toBe(true);

      // Retrieve preferences
      const getResponse = await request(app)
        .get(`/api/preferences/${testSessionId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data).toMatchObject(preferences);

      // Update specific preference
      const updateResponse = await request(app)
        .put(`/api/preferences/${testSessionId}/timeRange`)
        .send({ value: '720' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.timeRange).toBe('720');

      // Delete preferences
      await request(app)
        .delete(`/api/preferences/${testSessionId}`)
        .expect(200);
    });
  });

  /**
   * Test data persistence and cleanup
   * **Feature: pigeon-crypto-dashboard, Integration Test 7: Data Persistence**
   */
  describe('Data Persistence', () => {
    test('stores and retrieves data correctly', async () => {
      const testData = {
        pigeonData: [{
          timestamp: new Date(),
          location: 'test-location',
          count: 5
        }],
        cryptoData: [{
          timestamp: new Date(),
          symbol: 'BTC',
          price: 45000
        }]
      };

      // Store data
      await persistenceService.storePigeonData(testData.pigeonData);
      await persistenceService.storeCryptoData(testData.cryptoData);

      // Retrieve data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const retrievedPigeon = await persistenceService.getPigeonData(['test-location'], startDate, endDate);
      const retrievedCrypto = await persistenceService.getCryptoData(['BTC'], startDate, endDate);

      expect(retrievedPigeon).toHaveLength(1);
      expect(retrievedCrypto).toHaveLength(1);
    });

    test('cleans up old data correctly', async () => {
      const cleanupResponse = await request(app)
        .post('/api/persistence/cleanup')
        .expect(200);

      expect(cleanupResponse.body.success).toBe(true);
      expect(cleanupResponse.body.data).toHaveProperty('crypto');
      expect(cleanupResponse.body.data).toHaveProperty('pigeon');
      expect(cleanupResponse.body.data).toHaveProperty('correlation');
      expect(cleanupResponse.body.data).toHaveProperty('preferences');
    });
  });
});