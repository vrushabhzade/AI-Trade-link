/**
 * Cryptocurrency Data Service
 * 
 * Provides cryptocurrency price data with the following features:
 * - Primary integration with CoinGecko API
 * - Fallback integration with CoinMarketCap API
 * - Rate limiting and caching mechanisms
 * - Support for multiple cryptocurrencies (Bitcoin, Ethereum, Dogecoin)
 * - Error handling and retry logic
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { CryptoPricePoint, APIError } from '../types/index.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';
import { errorHandlingService, type ErrorContext } from './errorHandlingService.js';

// Supported cryptocurrencies
export const SUPPORTED_CRYPTOS = {
  bitcoin: { symbol: 'BTC', coinGeckoId: 'bitcoin', cmcId: '1' },
  ethereum: { symbol: 'ETH', coinGeckoId: 'ethereum', cmcId: '1027' },
  dogecoin: { symbol: 'DOGE', coinGeckoId: 'dogecoin', cmcId: '74' }
} as const;

export type SupportedCrypto = keyof typeof SUPPORTED_CRYPTOS;

// API response interfaces
interface CoinGeckoPrice {
  [key: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    last_updated_at?: number;
  };
}

interface CoinGeckoHistoricalData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface CoinMarketCapQuote {
  data: {
    [key: string]: {
      quote: {
        USD: {
          price: number;
          volume_24h: number;
          market_cap: number;
          last_updated: string;
        };
      };
    };
  };
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CryptocurrencyService {
  private coinGeckoClient: AxiosInstance;
  private coinMarketCapClient: AxiosInstance;
  private cache = new Map<string, CacheEntry<any>>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  // Rate limiting configurations
  private readonly coinGeckoRateLimit: RateLimitConfig = {
    maxRequests: 50, // CoinGecko free tier: 50 calls/minute
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 60 * 1000 // Wait 1 minute before retry
  };
  
  private readonly coinMarketCapRateLimit: RateLimitConfig = {
    maxRequests: 333, // CoinMarketCap free tier: 333 calls/month (roughly 10/day)
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    retryAfterMs: 60 * 60 * 1000 // Wait 1 hour before retry
  };

  constructor() {
    // Initialize CoinGecko client
    this.coinGeckoClient = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PigeonCryptoDashboard/1.0'
      }
    });

    // Initialize CoinMarketCap client (fallback)
    this.coinMarketCapClient = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com/v1',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '',
        'User-Agent': 'PigeonCryptoDashboard/1.0'
      }
    });

    // Set up response interceptors for error handling
    this.setupInterceptors();
  }

  /**
   * Get current prices for specified cryptocurrencies
   * Implements graceful degradation and retry logic (Requirements 2.5, 3.5)
   */
  async getCurrentPrices(cryptos: SupportedCrypto[]): Promise<CryptoPricePoint[]> {
    const context: ErrorContext = {
      service: 'CryptocurrencyService',
      operation: 'getCurrentPrices',
      timestamp: new Date(),
      metadata: { cryptos }
    };

    return errorHandlingService.executeWithRetry(
      async () => {
        const cacheKey = cacheService.generateCryptoKey(cryptos);
        
        // Check cache first (5-minute expiry for current prices)
        const cached = await cacheService.getCachedCryptoData(cacheKey);
        if (cached) {
          return cached;
        }

        // Try CoinGecko first
        let prices: CryptoPricePoint[];
        try {
          prices = await this.getCurrentPricesFromCoinGecko(cryptos);
        } catch (error) {
          console.warn('CoinGecko failed, trying CoinMarketCap fallback:', error);
          // Try CoinMarketCap as fallback
          prices = await this.getCurrentPricesFromCoinMarketCap(cryptos);
        }
        
        // Cache the results
        await cacheService.cacheCryptoData(cacheKey, prices);
        
        // Store in persistence layer for historical analysis
        await persistenceService.storeCryptoData(prices);
        
        return prices;
      },
      context,
      {
        maxAttempts: 3,
        baseDelayMs: 2000,
        maxDelayMs: 10000
      },
      {
        useCachedData: true,
        usePersistedData: true,
        useMockData: true,
        maxCacheAge: 30 * 60 * 1000, // 30 minutes for current prices
        maxPersistedAge: 2 * 60 * 60 * 1000 // 2 hours for current prices
      }
    );
  }

  /**
   * Get historical price data for a cryptocurrency
   * Implements graceful degradation and retry logic (Requirements 2.5, 3.5)
   */
  async getHistoricalPrices(
    crypto: SupportedCrypto,
    days: number = 7
  ): Promise<CryptoPricePoint[]> {
    const context: ErrorContext = {
      service: 'CryptocurrencyService',
      operation: 'getHistoricalPrices',
      timestamp: new Date(),
      metadata: { crypto, days }
    };

    return errorHandlingService.executeWithRetry(
      async () => {
        const cacheKey = cacheService.generateCryptoKey([crypto], days);
        
        // Check cache first (1-hour expiry for historical data)
        const cached = await cacheService.getCachedCryptoData(cacheKey);
        if (cached) {
          return cached;
        }

        // Check persistence layer for historical data
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
        
        try {
          const persistedData = await persistenceService.getCryptoData([crypto], startDate, endDate);
          if (persistedData.length > 0) {
            // Cache the persisted data
            await cacheService.cacheCryptoData(cacheKey, persistedData);
            return persistedData;
          }
        } catch (error) {
          console.warn('Failed to retrieve persisted crypto data:', error);
        }

        // Try CoinGecko API
        const prices = await this.getHistoricalPricesFromCoinGecko(crypto, days);
        
        // Cache and persist the results
        await cacheService.cacheCryptoData(cacheKey, prices);
        await persistenceService.storeCryptoData(prices);
        
        return prices;
      },
      context,
      {
        maxAttempts: 2,
        baseDelayMs: 3000,
        maxDelayMs: 15000
      },
      {
        useCachedData: true,
        usePersistedData: true,
        useMockData: true,
        maxCacheAge: 60 * 60 * 1000, // 1 hour for historical data
        maxPersistedAge: 24 * 60 * 60 * 1000 // 24 hours for historical data
      }
    );
  }

  /**
   * Get current prices from CoinGecko API
   */
  private async getCurrentPricesFromCoinGecko(cryptos: SupportedCrypto[]): Promise<CryptoPricePoint[]> {
    if (!this.checkRateLimit('coingecko')) {
      throw new Error('CoinGecko rate limit exceeded');
    }

    const ids = cryptos.map(crypto => SUPPORTED_CRYPTOS[crypto].coinGeckoId).join(',');
    
    const response: AxiosResponse<CoinGeckoPrice> = await this.coinGeckoClient.get('/simple/price', {
      params: {
        ids,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_last_updated_at: true
      }
    });

    this.updateRateLimit('coingecko');

    const now = new Date();
    return cryptos.map(crypto => {
      const coinData = response.data[SUPPORTED_CRYPTOS[crypto].coinGeckoId];
      if (!coinData) {
        throw new Error(`No data found for ${crypto}`);
      }

      return {
        timestamp: coinData.last_updated_at ? new Date(coinData.last_updated_at * 1000) : now,
        symbol: SUPPORTED_CRYPTOS[crypto].symbol,
        price: coinData.usd,
        volume: coinData.usd_24h_vol,
        marketCap: coinData.usd_market_cap
      };
    });
  }

  /**
   * Get current prices from CoinMarketCap API (fallback)
   */
  private async getCurrentPricesFromCoinMarketCap(cryptos: SupportedCrypto[]): Promise<CryptoPricePoint[]> {
    if (!process.env.COINMARKETCAP_API_KEY) {
      throw new Error('CoinMarketCap API key not configured');
    }

    if (!this.checkRateLimit('coinmarketcap')) {
      throw new Error('CoinMarketCap rate limit exceeded');
    }

    const ids = cryptos.map(crypto => SUPPORTED_CRYPTOS[crypto].cmcId).join(',');
    
    const response: AxiosResponse<CoinMarketCapQuote> = await this.coinMarketCapClient.get('/cryptocurrency/quotes/latest', {
      params: {
        id: ids,
        convert: 'USD'
      }
    });

    this.updateRateLimit('coinmarketcap');

    return cryptos.map(crypto => {
      const coinData = response.data.data[SUPPORTED_CRYPTOS[crypto].cmcId];
      if (!coinData) {
        throw new Error(`No data found for ${crypto}`);
      }

      const quote = coinData.quote.USD;
      return {
        timestamp: new Date(quote.last_updated),
        symbol: SUPPORTED_CRYPTOS[crypto].symbol,
        price: quote.price,
        volume: quote.volume_24h,
        marketCap: quote.market_cap
      };
    });
  }

  /**
   * Get historical prices from CoinGecko API
   */
  private async getHistoricalPricesFromCoinGecko(crypto: SupportedCrypto, days: number): Promise<CryptoPricePoint[]> {
    if (!this.checkRateLimit('coingecko')) {
      throw new Error('CoinGecko rate limit exceeded');
    }

    const coinId = SUPPORTED_CRYPTOS[crypto].coinGeckoId;
    
    const response: AxiosResponse<CoinGeckoHistoricalData> = await this.coinGeckoClient.get(`/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days.toString(),
        interval: days > 90 ? 'daily' : 'hourly'
      }
    });

    this.updateRateLimit('coingecko');

    const { prices, market_caps, total_volumes } = response.data;
    
    return prices.map((pricePoint, index) => ({
      timestamp: new Date(pricePoint[0]),
      symbol: SUPPORTED_CRYPTOS[crypto].symbol,
      price: pricePoint[1],
      volume: total_volumes[index] ? total_volumes[index][1] : undefined,
      marketCap: market_caps[index] ? market_caps[index][1] : undefined
    }));
  }

  /**
   * Check if we're within rate limits for a given API
   */
  private checkRateLimit(api: 'coingecko' | 'coinmarketcap'): boolean {
    const config = api === 'coingecko' ? this.coinGeckoRateLimit : this.coinMarketCapRateLimit;
    const now = Date.now();
    const rateLimitData = this.requestCounts.get(api);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset the counter
      this.requestCounts.set(api, {
        count: 0,
        resetTime: now + config.windowMs
      });
      return true;
    }

    return rateLimitData.count < config.maxRequests;
  }

  /**
   * Update rate limit counter after making a request
   */
  private updateRateLimit(api: 'coingecko' | 'coinmarketcap'): void {
    const rateLimitData = this.requestCounts.get(api);
    if (rateLimitData) {
      rateLimitData.count++;
    }
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string, maxAge: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with expiration
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Setup axios interceptors for error handling
   */
  private setupInterceptors(): void {
    // CoinGecko interceptor
    this.coinGeckoClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 429) {
          throw new Error('CoinGecko rate limit exceeded');
        }
        throw error;
      }
    );

    // CoinMarketCap interceptor
    this.coinMarketCapClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 429) {
          throw new Error('CoinMarketCap rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('CoinMarketCap API key invalid or missing');
        }
        throw error;
      }
    );
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { coingecko: any; coinmarketcap: any } {
    return {
      coingecko: this.requestCounts.get('coingecko') || { count: 0, resetTime: 0 },
      coinmarketcap: this.requestCounts.get('coinmarketcap') || { count: 0, resetTime: 0 }
    };
  }
}

// Export singleton instance (lazy initialization)
let _cryptoService: CryptocurrencyService | null = null;

export const cryptoService = {
  getInstance(): CryptocurrencyService {
    if (!_cryptoService) {
      _cryptoService = new CryptocurrencyService();
    }
    return _cryptoService;
  },
  
  // Delegate methods for convenience
  getCurrentPrices: (cryptos: SupportedCrypto[]) => cryptoService.getInstance().getCurrentPrices(cryptos),
  getHistoricalPrices: (crypto: SupportedCrypto, days?: number) => cryptoService.getInstance().getHistoricalPrices(crypto, days),
  clearCache: () => cryptoService.getInstance().clearCache(),
  getCacheStats: () => cryptoService.getInstance().getCacheStats(),
  getRateLimitStatus: () => cryptoService.getInstance().getRateLimitStatus()
};