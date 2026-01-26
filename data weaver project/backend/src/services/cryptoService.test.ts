/**
 * Unit tests for CryptocurrencyService
 * Tests core functionality, error handling, rate limiting, and caching
 */

import { CryptocurrencyService, SUPPORTED_CRYPTOS, type SupportedCrypto } from './cryptoService';
import axios from 'axios';
import * as fc from 'fast-check';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CryptocurrencyService', () => {
  let service: CryptocurrencyService;
  let mockCoinGeckoClient: any;
  let mockCoinMarketCapClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios.create to return mock clients
    mockCoinGeckoClient = {
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };
    
    mockCoinMarketCapClient = {
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };

    mockedAxios.create
      .mockReturnValueOnce(mockCoinGeckoClient)
      .mockReturnValueOnce(mockCoinMarketCapClient);

    service = new CryptocurrencyService();
  });

  describe('getCurrentPrices', () => {
    it('should fetch current prices from CoinGecko successfully', async () => {
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 45000,
            usd_market_cap: 850000000000,
            usd_24h_vol: 25000000000,
            last_updated_at: 1640995200
          },
          ethereum: {
            usd: 3500,
            usd_market_cap: 420000000000,
            usd_24h_vol: 15000000000,
            last_updated_at: 1640995200
          }
        }
      };

      mockCoinGeckoClient.get.mockResolvedValue(mockResponse);

      const result = await service.getCurrentPrices(['bitcoin', 'ethereum']);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        symbol: 'BTC',
        price: 45000,
        volume: 25000000000,
        marketCap: 850000000000
      });
      expect(result[1]).toMatchObject({
        symbol: 'ETH',
        price: 3500,
        volume: 15000000000,
        marketCap: 420000000000
      });
    });

    it('should fallback to CoinMarketCap when CoinGecko fails', async () => {
      // Mock CoinGecko failure
      mockCoinGeckoClient.get.mockRejectedValue(new Error('CoinGecko API error'));

      // Mock CoinMarketCap success
      const mockCMCResponse = {
        data: {
          data: {
            '1': {
              quote: {
                USD: {
                  price: 45000,
                  volume_24h: 25000000000,
                  market_cap: 850000000000,
                  last_updated: '2022-01-01T00:00:00.000Z'
                }
              }
            }
          }
        }
      };

      mockCoinMarketCapClient.get.mockResolvedValue(mockCMCResponse);

      // Set environment variable for API key
      process.env.COINMARKETCAP_API_KEY = 'test-key';

      const result = await service.getCurrentPrices(['bitcoin']);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        symbol: 'BTC',
        price: 45000,
        volume: 25000000000,
        marketCap: 850000000000
      });
    });

    it('should throw error when both APIs fail', async () => {
      mockCoinGeckoClient.get.mockRejectedValue(new Error('CoinGecko error'));
      mockCoinMarketCapClient.get.mockRejectedValue(new Error('CoinMarketCap error'));

      process.env.COINMARKETCAP_API_KEY = 'test-key';

      await expect(service.getCurrentPrices(['bitcoin']))
        .rejects.toThrow('Unable to fetch cryptocurrency prices from any source');
    });

    it('should handle missing cryptocurrency data gracefully', async () => {
      const mockResponse = {
        data: {
          // Missing bitcoin data
        }
      };

      mockCoinGeckoClient.get.mockResolvedValue(mockResponse);

      await expect(service.getCurrentPrices(['bitcoin']))
        .rejects.toThrow('Unable to fetch cryptocurrency prices from any source');
    });
  });

  describe('getHistoricalPrices', () => {
    it('should fetch historical prices from CoinGecko', async () => {
      const mockResponse = {
        data: {
          prices: [
            [1640995200000, 45000],
            [1641081600000, 46000]
          ],
          market_caps: [
            [1640995200000, 850000000000],
            [1641081600000, 870000000000]
          ],
          total_volumes: [
            [1640995200000, 25000000000],
            [1641081600000, 26000000000]
          ]
        }
      };

      mockCoinGeckoClient.get.mockResolvedValue(mockResponse);

      const result = await service.getHistoricalPrices('bitcoin', 7);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        symbol: 'BTC',
        price: 45000,
        volume: 25000000000,
        marketCap: 850000000000
      });
      expect(result[1]).toMatchObject({
        symbol: 'BTC',
        price: 46000,
        volume: 26000000000,
        marketCap: 870000000000
      });
    });

    it('should return empty array when historical data fails', async () => {
      mockCoinGeckoClient.get.mockRejectedValue(new Error('API error'));

      const result = await service.getHistoricalPrices('bitcoin', 7);

      expect(result).toEqual([]);
    });
  });

  describe('caching', () => {
    it('should return cached data when available', async () => {
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 45000,
            usd_market_cap: 850000000000,
            usd_24h_vol: 25000000000,
            last_updated_at: 1640995200
          }
        }
      };

      mockCoinGeckoClient.get.mockResolvedValue(mockResponse);

      // First call should hit the API
      const result1 = await service.getCurrentPrices(['bitcoin']);
      expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await service.getCurrentPrices(['bitcoin']);
      expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(1);

      expect(result1).toEqual(result2);
    });

    it('should clear cache when requested', async () => {
      const mockResponse = {
        data: {
          bitcoin: {
            usd: 45000,
            last_updated_at: 1640995200
          }
        }
      };

      mockCoinGeckoClient.get.mockResolvedValue(mockResponse);

      // First call
      await service.getCurrentPrices(['bitcoin']);
      expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second call should hit API again
      await service.getCurrentPrices(['bitcoin']);
      expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('rate limiting', () => {
    it('should track rate limit status', () => {
      const status = service.getRateLimitStatus();
      
      expect(status).toHaveProperty('coingecko');
      expect(status).toHaveProperty('coinmarketcap');
      expect(status.coingecko).toMatchObject({
        count: expect.any(Number),
        resetTime: expect.any(Number)
      });
    });
  });

  describe('supported cryptocurrencies', () => {
    it('should have correct configuration for supported cryptos', () => {
      expect(SUPPORTED_CRYPTOS.bitcoin).toEqual({
        symbol: 'BTC',
        coinGeckoId: 'bitcoin',
        cmcId: '1'
      });

      expect(SUPPORTED_CRYPTOS.ethereum).toEqual({
        symbol: 'ETH',
        coinGeckoId: 'ethereum',
        cmcId: '1027'
      });

      expect(SUPPORTED_CRYPTOS.dogecoin).toEqual({
        symbol: 'DOGE',
        coinGeckoId: 'dogecoin',
        cmcId: '74'
      });
    });
  });

  describe('error handling', () => {
    it('should handle CoinMarketCap API key missing', async () => {
      mockCoinGeckoClient.get.mockRejectedValue(new Error('CoinGecko error'));
      delete process.env.COINMARKETCAP_API_KEY;

      await expect(service.getCurrentPrices(['bitcoin']))
        .rejects.toThrow('Unable to fetch cryptocurrency prices from any source');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: pigeon-crypto-dashboard, Property 4: Multi-cryptocurrency support**
     * **Validates: Requirements 3.2**
     * 
     * For any valid cryptocurrency symbol (Bitcoin, Ethereum, Dogecoin), 
     * the system should successfully fetch, display, and style the data alongside pigeon information
     */
    describe('Property 4: Multi-cryptocurrency support', () => {
      beforeEach(() => {
        // Clear cache before each property test
        service.clearCache();
        // Reset mocks
        jest.clearAllMocks();
        mockCoinGeckoClient.get.mockClear();
        mockCoinMarketCapClient.get.mockClear();
      });

      it('should handle any combination of supported cryptocurrencies', async () => {
        await fc.assert(fc.asyncProperty(
          fc.subarray(Object.keys(SUPPORTED_CRYPTOS) as SupportedCrypto[], { minLength: 1 }),
          async (cryptos) => {
            // Mock successful response for all requested cryptos
            const mockData: any = {};
            cryptos.forEach(crypto => {
              mockData[SUPPORTED_CRYPTOS[crypto].coinGeckoId] = {
                usd: Math.random() * 100000 + 0.01, // Simple random price
                usd_market_cap: Math.random() * 1000000000 + 1000000,
                usd_24h_vol: Math.random() * 50000000 + 100000,
                last_updated_at: Math.floor(Date.now() / 1000)
              };
            });

            mockCoinGeckoClient.get.mockResolvedValue({ data: mockData });

            const result = await service.getCurrentPrices(cryptos);

            // Property: Result should contain exactly the requested cryptocurrencies
            expect(result).toHaveLength(cryptos.length);
            
            // Property: Each result should have the correct symbol
            const resultSymbols = result.map(r => r.symbol).sort();
            const expectedSymbols = cryptos.map(c => SUPPORTED_CRYPTOS[c].symbol).sort();
            expect(resultSymbols).toEqual(expectedSymbols);

            // Property: Each result should have valid price data
            result.forEach(pricePoint => {
              expect(pricePoint.price).toBeGreaterThan(0);
              expect(pricePoint.timestamp).toBeInstanceOf(Date);
              expect(typeof pricePoint.symbol).toBe('string');
              expect(pricePoint.symbol.length).toBeGreaterThan(0);
            });

            // Property: All supported crypto symbols should be present
            cryptos.forEach(crypto => {
              const expectedSymbol = SUPPORTED_CRYPTOS[crypto].symbol;
              expect(result.some(r => r.symbol === expectedSymbol)).toBe(true);
            });
          }
        ), { numRuns: 20 }); // Reduced runs to avoid rate limiting issues
      });

      it('should maintain consistent data structure for all supported cryptocurrencies', async () => {
        await fc.assert(fc.asyncProperty(
          fc.constantFrom(...Object.keys(SUPPORTED_CRYPTOS) as SupportedCrypto[]),
          async (crypto) => {
            // Mock successful response for the crypto
            const mockData: any = {};
            mockData[SUPPORTED_CRYPTOS[crypto].coinGeckoId] = {
              usd: Math.random() * 100000 + 0.01,
              usd_market_cap: Math.random() * 1000000000 + 1000000,
              usd_24h_vol: Math.random() * 50000000 + 100000,
              last_updated_at: Math.floor(Date.now() / 1000)
            };

            mockCoinGeckoClient.get.mockResolvedValue({ data: mockData });

            const result = await service.getCurrentPrices([crypto]);

            // Property: Single crypto should return exactly one result
            expect(result).toHaveLength(1);
            
            const pricePoint = result[0];
            
            // Property: Result should have correct symbol mapping
            expect(pricePoint.symbol).toBe(SUPPORTED_CRYPTOS[crypto].symbol);
            
            // Property: All required fields should be present and valid
            expect(pricePoint.price).toBeGreaterThan(0);
            expect(pricePoint.timestamp).toBeInstanceOf(Date);
            expect(typeof pricePoint.symbol).toBe('string');
            expect(pricePoint.symbol.length).toBeGreaterThan(0);
            
            // Property: Optional fields should be numbers if present
            if (pricePoint.volume !== undefined) {
              expect(typeof pricePoint.volume).toBe('number');
              expect(pricePoint.volume).toBeGreaterThan(0);
            }
            if (pricePoint.marketCap !== undefined) {
              expect(typeof pricePoint.marketCap).toBe('number');
              expect(pricePoint.marketCap).toBeGreaterThan(0);
            }
          }
        ), { numRuns: 20 });
      });
    });

    /**
     * **Feature: pigeon-crypto-dashboard, Property 8: Rate limiting and caching resilience**
     * **Validates: Requirements 3.5**
     * 
     * For any API rate limit condition, the system should implement throttling and caching 
     * strategies that maintain functionality without exceeding limits
     */
    describe('Property 8: Rate limiting and caching resilience', () => {
      it('should use caching to reduce API calls for repeated requests', async () => {
        await fc.assert(fc.asyncProperty(
          fc.constantFrom(...Object.keys(SUPPORTED_CRYPTOS) as SupportedCrypto[]),
          async (crypto) => {
            // Clear cache and reset mocks for each test
            service.clearCache();
            jest.clearAllMocks();
            mockCoinGeckoClient.get.mockClear();

            // Mock successful response
            const mockData: any = {};
            mockData[SUPPORTED_CRYPTOS[crypto].coinGeckoId] = {
              usd: Math.random() * 100000 + 0.01,
              usd_market_cap: Math.random() * 1000000000 + 1000000,
              usd_24h_vol: Math.random() * 50000000 + 100000,
              last_updated_at: Math.floor(Date.now() / 1000)
            };

            mockCoinGeckoClient.get.mockResolvedValue({ data: mockData });

            // Make first request
            const result1 = await service.getCurrentPrices([crypto]);
            
            // Make second request (should use cache)
            const result2 = await service.getCurrentPrices([crypto]);

            // Property: Both requests should return the same data
            expect(result1).toEqual(result2);
            
            // Property: API should only be called once (second request uses cache)
            expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(1);
            
            // Property: Results should have correct structure
            expect(result1).toHaveLength(1);
            expect(result1[0].symbol).toBe(SUPPORTED_CRYPTOS[crypto].symbol);
            expect(result1[0].price).toBeGreaterThan(0);
          }
        ), { numRuns: 10 });
      });

      it('should fallback to CoinMarketCap when CoinGecko fails', async () => {
        await fc.assert(fc.asyncProperty(
          fc.constantFrom(...Object.keys(SUPPORTED_CRYPTOS) as SupportedCrypto[]),
          async (crypto) => {
            // Clear cache and reset mocks for each test
            service.clearCache();
            jest.clearAllMocks();
            mockCoinGeckoClient.get.mockClear();
            mockCoinMarketCapClient.get.mockClear();

            // Mock CoinGecko failure
            mockCoinGeckoClient.get.mockRejectedValue(new Error('CoinGecko rate limit exceeded'));

            // Mock successful CoinMarketCap response with correct structure
            const mockCMCData = {
              data: {
                data: {
                  [SUPPORTED_CRYPTOS[crypto].cmcId]: {
                    quote: {
                      USD: {
                        price: Math.random() * 100000 + 0.01,
                        volume_24h: Math.random() * 50000000 + 100000,
                        market_cap: Math.random() * 1000000000 + 1000000,
                        last_updated: new Date().toISOString()
                      }
                    }
                  }
                }
              }
            };

            mockCoinMarketCapClient.get.mockResolvedValue(mockCMCData);

            // Set API key for CoinMarketCap
            process.env.COINMARKETCAP_API_KEY = 'test-key';

            const result = await service.getCurrentPrices([crypto]);

            // Property: Should successfully get data despite CoinGecko failure
            expect(result).toHaveLength(1);
            
            // Property: Result should have correct structure from fallback API
            const pricePoint = result[0];
            expect(pricePoint.symbol).toBe(SUPPORTED_CRYPTOS[crypto].symbol);
            expect(pricePoint.price).toBeGreaterThan(0);
            expect(pricePoint.timestamp).toBeInstanceOf(Date);
            
            // Property: Should have tried both APIs
            expect(mockCoinGeckoClient.get).toHaveBeenCalled();
            expect(mockCoinMarketCapClient.get).toHaveBeenCalled();
          }
        ), { numRuns: 5 });
      });

      it('should maintain cache consistency across cache clear operations', async () => {
        await fc.assert(fc.asyncProperty(
          fc.constantFrom(...Object.keys(SUPPORTED_CRYPTOS) as SupportedCrypto[]),
          async (crypto) => {
            // Clear cache and reset mocks for each test
            service.clearCache();
            jest.clearAllMocks();
            mockCoinGeckoClient.get.mockClear();

            // Mock response data
            const mockData: any = {};
            mockData[SUPPORTED_CRYPTOS[crypto].coinGeckoId] = {
              usd: Math.random() * 100000 + 0.01,
              usd_market_cap: Math.random() * 1000000000 + 1000000,
              usd_24h_vol: Math.random() * 50000000 + 100000,
              last_updated_at: Math.floor(Date.now() / 1000)
            };

            mockCoinGeckoClient.get.mockResolvedValue({ data: mockData });

            // First request - should hit API
            const result1 = await service.getCurrentPrices([crypto]);
            
            // Clear cache
            service.clearCache();
            
            // Reset mock for second call
            mockCoinGeckoClient.get.mockResolvedValue({ data: mockData });
            
            // Second request after cache clear - should hit API again
            const result2 = await service.getCurrentPrices([crypto]);

            // Property: Both results should have same structure and values
            expect(result1).toHaveLength(1);
            expect(result2).toHaveLength(1);
            expect(result1[0].symbol).toBe(result2[0].symbol);
            expect(result1[0].price).toBe(result2[0].price);
            
            // Property: API should be called twice (once before and once after cache clear)
            expect(mockCoinGeckoClient.get).toHaveBeenCalledTimes(2);
          }
        ), { numRuns: 5 });
      });
    });
  });
});