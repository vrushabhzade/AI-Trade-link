/**
 * Cache Service using Redis
 * 
 * Provides caching functionality with:
 * - Redis integration for fast data retrieval
 * - Cache invalidation strategies
 * - TTL (Time To Live) management
 * - Fallback to in-memory cache when Redis unavailable
 */

import type { PigeonSighting, CryptoPricePoint, CorrelationResult, UserPreferences } from '../types/index.js';

// Cache configuration
interface CacheConfig {
  ttl: {
    crypto: number;      // 5 minutes
    pigeon: number;      // 10 minutes
    correlation: number; // 15 minutes
    preferences: number; // 24 hours
  };
  maxMemoryItems: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: {
    crypto: 5 * 60 * 1000,      // 5 minutes
    pigeon: 10 * 60 * 1000,     // 10 minutes
    correlation: 15 * 60 * 1000, // 15 minutes
    preferences: 24 * 60 * 60 * 1000 // 24 hours
  },
  maxMemoryItems: 1000
};

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

// In-memory fallback cache
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxItems: number;

  constructor(maxItems: number = 1000) {
    this.maxItems = maxItems;
  }

  set<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key
    };

    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxItems) {
      this.cleanup();
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If still too many items, remove oldest
    if (this.cache.size >= this.maxItems) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxItems * 0.1));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats(): { size: number; maxItems: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxItems: this.maxItems,
      keys: Array.from(this.cache.keys())
    };
  }
}

export class CacheService {
  private config: CacheConfig;
  private memoryCache: MemoryCache;
  private redisAvailable = false;
  private redisClient: any = null; // Would be Redis client in production

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new MemoryCache(this.config.maxMemoryItems);
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection (mock implementation)
   */
  private async initializeRedis(): Promise<void> {
    try {
      // In production, this would initialize actual Redis client
      // For now, we'll use in-memory cache as fallback
      console.log('Redis not configured, using in-memory cache fallback');
      this.redisAvailable = false;
    } catch (error) {
      console.warn('Redis connection failed, using in-memory cache:', error);
      this.redisAvailable = false;
    }
  }

  /**
   * Cache cryptocurrency data
   */
  async cacheCryptoData(key: string, data: CryptoPricePoint[]): Promise<void> {
    const cacheKey = `crypto:${key}`;
    await this.set(cacheKey, data, this.config.ttl.crypto);
  }

  /**
   * Get cached cryptocurrency data
   */
  async getCachedCryptoData(key: string): Promise<CryptoPricePoint[] | null> {
    const cacheKey = `crypto:${key}`;
    return await this.get<CryptoPricePoint[]>(cacheKey);
  }

  /**
   * Cache pigeon sighting data
   */
  async cachePigeonData(key: string, data: PigeonSighting[]): Promise<void> {
    const cacheKey = `pigeon:${key}`;
    await this.set(cacheKey, data, this.config.ttl.pigeon);
  }

  /**
   * Get cached pigeon sighting data
   */
  async getCachedPigeonData(key: string): Promise<PigeonSighting[] | null> {
    const cacheKey = `pigeon:${key}`;
    return await this.get<PigeonSighting[]>(cacheKey);
  }

  /**
   * Cache correlation results
   */
  async cacheCorrelationData(key: string, data: CorrelationResult[]): Promise<void> {
    const cacheKey = `correlation:${key}`;
    await this.set(cacheKey, data, this.config.ttl.correlation);
  }

  /**
   * Get cached correlation results
   */
  async getCachedCorrelationData(key: string): Promise<CorrelationResult[] | null> {
    const cacheKey = `correlation:${key}`;
    return await this.get<CorrelationResult[]>(cacheKey);
  }

  /**
   * Cache user preferences
   */
  async cacheUserPreferences(sessionId: string, preferences: UserPreferences): Promise<void> {
    const cacheKey = `preferences:${sessionId}`;
    await this.set(cacheKey, preferences, this.config.ttl.preferences);
  }

  /**
   * Get cached user preferences
   */
  async getCachedUserPreferences(sessionId: string): Promise<UserPreferences | null> {
    const cacheKey = `preferences:${sessionId}`;
    return await this.get<UserPreferences>(cacheKey);
  }

  /**
   * Generic set method
   */
  private async set<T>(key: string, data: T, ttl: number): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      try {
        // Redis implementation would go here
        await this.redisClient.setex(key, Math.floor(ttl / 1000), JSON.stringify(data));
        return;
      } catch (error) {
        console.warn('Redis set failed, falling back to memory cache:', error);
      }
    }

    // Fallback to memory cache
    this.memoryCache.set(key, data, ttl);
  }

  /**
   * Generic get method
   */
  private async get<T>(key: string): Promise<T | null> {
    if (this.redisAvailable && this.redisClient) {
      try {
        // Redis implementation would go here
        const result = await this.redisClient.get(key);
        return result ? JSON.parse(result) : null;
      } catch (error) {
        console.warn('Redis get failed, falling back to memory cache:', error);
      }
    }

    // Fallback to memory cache
    return this.memoryCache.get<T>(key);
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.warn('Redis delete failed:', error);
      }
    }

    return this.memoryCache.delete(key);
  }

  /**
   * Clear cache by pattern
   */
  async clearByPattern(pattern: string): Promise<number> {
    let cleared = 0;

    if (this.redisAvailable && this.redisClient) {
      try {
        // Redis pattern deletion would go here
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          cleared = await this.redisClient.del(...keys);
        }
      } catch (error) {
        console.warn('Redis pattern clear failed:', error);
      }
    }

    // Clear from memory cache
    const memoryStats = this.memoryCache.getStats();
    const matchingKeys = memoryStats.keys.filter(key => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(key);
    });

    matchingKeys.forEach(key => {
      if (this.memoryCache.delete(key)) {
        cleared++;
      }
    });

    return cleared;
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.flushall();
      } catch (error) {
        console.warn('Redis flush failed:', error);
      }
    }

    this.memoryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    redis: { available: boolean; connected: boolean };
    memory: { size: number; maxItems: number; keys: string[] };
    config: CacheConfig;
  } {
    return {
      redis: {
        available: this.redisAvailable,
        connected: this.redisClient !== null
      },
      memory: this.memoryCache.getStats(),
      config: this.config
    };
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const stats = this.getStats();
      const memoryHealthy = stats.memory.size < stats.memory.maxItems * 0.9;
      
      let redisHealthy = true;
      if (this.redisClient) {
        try {
          await this.redisClient.ping();
        } catch (error) {
          redisHealthy = false;
        }
      }

      const isHealthy = memoryHealthy && (redisHealthy || !this.redisAvailable);

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          redis: {
            available: this.redisAvailable,
            healthy: redisHealthy
          },
          memory: {
            size: stats.memory.size,
            maxSize: stats.memory.maxItems,
            healthy: memoryHealthy
          }
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    this.memoryCache.cleanup();
  }

  /**
   * Generate cache key for crypto data
   */
  static generateCryptoKey(cryptos: string[], days?: number): string {
    const cryptoStr = cryptos.sort().join(',');
    return days ? `${cryptoStr}:${days}d` : cryptoStr;
  }

  /**
   * Generate cache key for pigeon data
   */
  static generatePigeonKey(areas: string[], days?: number): string {
    const areaStr = areas.sort().join(',');
    return days ? `${areaStr}:${days}d` : areaStr;
  }

  /**
   * Generate cache key for correlation data
   */
  static generateCorrelationKey(crypto: string, area: string, days?: number): string {
    return days ? `${crypto}:${area}:${days}d` : `${crypto}:${area}`;
  }
}

// Export singleton instance
let _cacheService: CacheService | null = null;

export const cacheService = {
  getInstance(): CacheService {
    if (!_cacheService) {
      _cacheService = new CacheService();
    }
    return _cacheService;
  },
  
  // Delegate methods for convenience
  cacheCryptoData: (key: string, data: CryptoPricePoint[]) => 
    cacheService.getInstance().cacheCryptoData(key, data),
  getCachedCryptoData: (key: string) => 
    cacheService.getInstance().getCachedCryptoData(key),
  cachePigeonData: (key: string, data: PigeonSighting[]) => 
    cacheService.getInstance().cachePigeonData(key, data),
  getCachedPigeonData: (key: string) => 
    cacheService.getInstance().getCachedPigeonData(key),
  cacheCorrelationData: (key: string, data: CorrelationResult[]) => 
    cacheService.getInstance().cacheCorrelationData(key, data),
  getCachedCorrelationData: (key: string) => 
    cacheService.getInstance().getCachedCorrelationData(key),
  cacheUserPreferences: (sessionId: string, preferences: UserPreferences) => 
    cacheService.getInstance().cacheUserPreferences(sessionId, preferences),
  getCachedUserPreferences: (sessionId: string) => 
    cacheService.getInstance().getCachedUserPreferences(sessionId),
  delete: (key: string) => cacheService.getInstance().delete(key),
  clearByPattern: (pattern: string) => cacheService.getInstance().clearByPattern(pattern),
  clearAll: () => cacheService.getInstance().clearAll(),
  getStats: () => cacheService.getInstance().getStats(),
  healthCheck: () => cacheService.getInstance().healthCheck(),
  cleanup: () => cacheService.getInstance().cleanup(),
  
  // Static utility methods
  generateCryptoKey: CacheService.generateCryptoKey,
  generatePigeonKey: CacheService.generatePigeonKey,
  generateCorrelationKey: CacheService.generateCorrelationKey
};