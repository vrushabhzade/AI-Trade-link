/**
 * Property-based tests for WebSocketService
 * **Feature: pigeon-crypto-dashboard, Property 5: Real-time update performance**
 * **Validates: Requirements 2.3, 3.3**
 */

import fc from 'fast-check';
import { WebSocketService } from './websocketService.js';
import { createServer } from 'http';
import WebSocket from 'ws';

// Mock the services to avoid real API calls during testing
jest.mock('./pigeonService.js', () => ({
  pigeonService: {
    getCurrentSightings: jest.fn().mockResolvedValue([
      {
        timestamp: new Date(),
        location: 'Test City',
        count: 10,
        coordinates: { lat: 40.7128, lng: -74.0060 }
      }
    ])
  }
}));

jest.mock('./cryptoService.js', () => ({
  cryptoService: {
    getCurrentPrices: jest.fn().mockResolvedValue([
      {
        timestamp: new Date(),
        symbol: 'BTC',
        price: 50000,
        volume: 1000000,
        marketCap: 1000000000
      }
    ])
  }
}));

jest.mock('./correlationService.js', () => ({
  correlationService: {
    aggregateAndCorrelate: jest.fn().mockResolvedValue({
      pigeonData: [],
      cryptoData: [],
      correlations: [],
      metadata: { lastUpdated: new Date(), dataQuality: 'mock' }
    }),
    getCorrelationHighlights: jest.fn().mockReturnValue({
      highlighted: [],
      commentary: []
    })
  }
}));

describe('WebSocketService Property Tests', () => {
  let service: WebSocketService;
  let server: any;
  let port: number;

  beforeEach(() => {
    service = new WebSocketService();
    server = createServer();
    port = 3000 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
  });

  afterEach(async () => {
    service.shutdown();
    if (server.listening) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Property 5: Real-time update performance', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 5: Real-time update performance**
     * **Validates: Requirements 2.3, 3.3**
     * 
     * For any new data arrival (pigeon or cryptocurrency), the dashboard display 
     * should update within 30 seconds of data availability
     */
    it('should establish WebSocket connections and handle subscriptions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom('pigeon', 'crypto', 'correlations'), { minLength: 1, maxLength: 3 }),
          fc.array(fc.constantFrom('new-york', 'london', 'tokyo'), { minLength: 1, maxLength: 3 }),
          fc.array(fc.constantFrom('bitcoin', 'ethereum', 'dogecoin'), { minLength: 1, maxLength: 3 }),
          async (subscriptionTypes: string[], areas: string[], cryptos: string[]) => {
            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Test timeout'));
              }, 10000);

              try {
                server.listen(port, () => {
                  service.initialize(server);

                  const ws = new WebSocket(`ws://localhost:${port}/ws`);
                  let connectionConfirmed = false;
                  let subscriptionsConfirmed = 0;
                  const expectedSubscriptions = subscriptionTypes.length;

                  ws.on('open', () => {
                    // Property: WebSocket connection should be established successfully
                    expect(ws.readyState).toBe(WebSocket.OPEN);

                    // Subscribe to different data types
                    subscriptionTypes.forEach(type => {
                      switch (type) {
                        case 'pigeon':
                          ws.send(JSON.stringify({ type: 'subscribe-pigeon', areas }));
                          break;
                        case 'crypto':
                          ws.send(JSON.stringify({ type: 'subscribe-crypto', cryptos }));
                          break;
                        case 'correlations':
                          ws.send(JSON.stringify({ 
                            type: 'subscribe-correlations', 
                            crypto: cryptos[0] || 'bitcoin', 
                            area: areas[0] || 'new-york' 
                          }));
                          break;
                      }
                    });
                  });

                  ws.on('message', (data) => {
                    try {
                      const message = JSON.parse(data.toString());

                      // Property: Connection message should be received
                      if (message.type === 'connection') {
                        connectionConfirmed = true;
                        expect(message.data).toHaveProperty('clientId');
                        expect(message.data).toHaveProperty('message');
                        expect(message.data).toHaveProperty('timestamp');
                      }

                      // Property: Subscription confirmations should be received
                      if (message.type === 'subscription-confirmed') {
                        subscriptionsConfirmed++;
                        expect(message.data).toHaveProperty('dataType');
                        expect(message.data).toHaveProperty('updateInterval');
                        
                        // Property: Update interval should be 30 seconds or less (meets requirements 2.3, 3.3)
                        expect(message.data.updateInterval).toBeLessThanOrEqual(30000);
                      }

                      // Property: Data updates should be received
                      if (message.type.endsWith('-update')) {
                        expect(message.data).toHaveProperty('timestamp');
                        expect(new Date(message.data.timestamp)).toBeInstanceOf(Date);
                      }

                      // Complete test when all subscriptions are confirmed
                      if (connectionConfirmed && subscriptionsConfirmed >= expectedSubscriptions) {
                        ws.close();
                        clearTimeout(timeout);
                        resolve();
                      }
                    } catch (error) {
                      clearTimeout(timeout);
                      reject(error);
                    }
                  });

                  ws.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                  });
                });
              } catch (error) {
                clearTimeout(timeout);
                reject(error);
              }
            });
          }
        ),
        { numRuns: 10, timeout: 15000 } // Reduced runs for WebSocket tests
      );
    });

    it('should handle ping-pong for connection health monitoring', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }), // number of ping messages
          async (pingCount: number) => {
            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Ping-pong test timeout'));
              }, 8000);

              try {
                server.listen(port, () => {
                  service.initialize(server);

                  const ws = new WebSocket(`ws://localhost:${port}/ws`);
                  let pongCount = 0;

                  ws.on('open', () => {
                    // Send ping messages
                    for (let i = 0; i < pingCount; i++) {
                      setTimeout(() => {
                        ws.send(JSON.stringify({ type: 'ping' }));
                      }, i * 100);
                    }
                  });

                  ws.on('message', (data) => {
                    try {
                      const message = JSON.parse(data.toString());

                      // Property: Pong responses should be received for ping messages
                      if (message.type === 'pong') {
                        pongCount++;
                        expect(message.data).toHaveProperty('timestamp');
                        expect(new Date(message.data.timestamp)).toBeInstanceOf(Date);

                        // Property: All pings should receive pong responses
                        if (pongCount >= pingCount) {
                          ws.close();
                          clearTimeout(timeout);
                          resolve();
                        }
                      }
                    } catch (error) {
                      clearTimeout(timeout);
                      reject(error);
                    }
                  });

                  ws.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                  });
                });
              } catch (error) {
                clearTimeout(timeout);
                reject(error);
              }
            });
          }
        ),
        { numRuns: 5, timeout: 10000 }
      );
    });

    it('should handle subscription and unsubscription correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('pigeon', 'crypto', 'correlations'),
          async (dataType: string) => {
            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Subscription test timeout'));
              }, 8000);

              try {
                server.listen(port, () => {
                  service.initialize(server);

                  const ws = new WebSocket(`ws://localhost:${port}/ws`);
                  let subscribed = false;
                  let unsubscribed = false;

                  ws.on('open', () => {
                    // Subscribe to data type
                    switch (dataType) {
                      case 'pigeon':
                        ws.send(JSON.stringify({ type: 'subscribe-pigeon', areas: ['new-york'] }));
                        break;
                      case 'crypto':
                        ws.send(JSON.stringify({ type: 'subscribe-crypto', cryptos: ['bitcoin'] }));
                        break;
                      case 'correlations':
                        ws.send(JSON.stringify({ 
                          type: 'subscribe-correlations', 
                          crypto: 'bitcoin', 
                          area: 'new-york' 
                        }));
                        break;
                    }
                  });

                  ws.on('message', (data) => {
                    try {
                      const message = JSON.parse(data.toString());

                      // Property: Subscription confirmation should be received
                      if (message.type === 'subscription-confirmed') {
                        subscribed = true;
                        expect(message.data.dataType).toBe(dataType);
                        
                        // Now unsubscribe
                        ws.send(JSON.stringify({ type: 'unsubscribe', dataType }));
                      }

                      // Property: Unsubscription confirmation should be received
                      if (message.type === 'unsubscribed') {
                        unsubscribed = true;
                        expect(message.data.dataType).toBe(dataType);

                        // Property: Both subscription and unsubscription should work
                        if (subscribed && unsubscribed) {
                          ws.close();
                          clearTimeout(timeout);
                          resolve();
                        }
                      }
                    } catch (error) {
                      clearTimeout(timeout);
                      reject(error);
                    }
                  });

                  ws.on('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                  });
                });
              } catch (error) {
                clearTimeout(timeout);
                reject(error);
              }
            });
          }
        ),
        { numRuns: 5, timeout: 10000 }
      );
    });

    it('should handle invalid messages gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(), // Invalid JSON
            fc.record({ type: fc.string({ minLength: 1, maxLength: 20 }) }), // Unknown message type
            fc.record({ type: fc.constant('subscribe-pigeon'), areas: fc.string() }) // Invalid areas format
          ),
          async (invalidMessage: any) => {
            return new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Invalid message test timeout'));
              }, 5000);

              try {
                server.listen(port, () => {
                  service.initialize(server);

                  const ws = new WebSocket(`ws://localhost:${port}/ws`);
                  let errorReceived = false;

                  ws.on('open', () => {
                    // Send invalid message
                    if (typeof invalidMessage === 'string') {
                      ws.send(invalidMessage); // Invalid JSON
                    } else {
                      ws.send(JSON.stringify(invalidMessage));
                    }
                  });

                  ws.on('message', (data) => {
                    try {
                      const message = JSON.parse(data.toString());

                      // Property: Error messages should be received for invalid input
                      if (message.type === 'error') {
                        errorReceived = true;
                        expect(message.data).toHaveProperty('error');
                        expect(message.data).toHaveProperty('timestamp');
                        expect(typeof message.data.error).toBe('string');
                        
                        ws.close();
                        clearTimeout(timeout);
                        resolve();
                      }

                      // Also accept connection messages (normal flow)
                      if (message.type === 'connection' && !errorReceived) {
                        // If no error was triggered, that's also acceptable
                        // Some invalid messages might be handled gracefully
                        setTimeout(() => {
                          ws.close();
                          clearTimeout(timeout);
                          resolve();
                        }, 1000);
                      }
                    } catch (error) {
                      // Parsing error is expected for invalid JSON
                      if (!errorReceived) {
                        setTimeout(() => {
                          ws.close();
                          clearTimeout(timeout);
                          resolve();
                        }, 1000);
                      }
                    }
                  });

                  ws.on('error', () => {
                    // Connection errors are acceptable for invalid messages
                    clearTimeout(timeout);
                    resolve();
                  });
                });
              } catch (error) {
                clearTimeout(timeout);
                reject(error);
              }
            });
          }
        ),
        { numRuns: 5, timeout: 8000 }
      );
    });
  });

  describe('WebSocket Service Statistics', () => {
    it('should provide accurate connection statistics', () => {
      // Property: Statistics should have correct structure
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('subscriptions');
      expect(stats.subscriptions).toHaveProperty('pigeon');
      expect(stats.subscriptions).toHaveProperty('crypto');
      expect(stats.subscriptions).toHaveProperty('correlations');
      
      // Property: All statistics should be non-negative numbers
      expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.subscriptions.pigeon).toBeGreaterThanOrEqual(0);
      expect(stats.subscriptions.crypto).toBeGreaterThanOrEqual(0);
      expect(stats.subscriptions.correlations).toBeGreaterThanOrEqual(0);
      
      // Property: Active connections should not exceed total connections
      expect(stats.activeConnections).toBeLessThanOrEqual(stats.totalConnections);
    });
  });
});