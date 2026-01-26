/**
 * Cache Service for TradeLink Marketplace
 * Implements caching strategies for improved performance
 * Requirements: System performance optimization
 */

import { createClient, RedisClientType } from 'redis';

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Redis connection failed after 10 retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const fresh = await fetchFn();
    
    // Cache the result
    await this.set(key, fresh, ttl);
    
    return fresh;
  }

  /**
   * Increment a counter in cache
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flushAll(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Cache key generators for consistent naming
export const CacheKeys = {
  // Product caching
  product: (id: string) => `product:${id}`,
  productsByCategory: (category: string, language: string) => 
    `products:category:${category}:lang:${language}`,
  productSearch: (query: string, language: string) => 
    `products:search:${query}:lang:${language}`,
  
  // Vendor caching
  vendor: (id: string) => `vendor:${id}`,
  vendorProducts: (vendorId: string) => `vendor:${vendorId}:products`,
  vendorsNearby: (lat: number, lng: number, radius: number) => 
    `vendors:nearby:${lat}:${lng}:${radius}`,
  
  // Translation caching
  translation: (text: string, from: string, to: string) => 
    `translation:${from}:${to}:${Buffer.from(text).toString('base64').substring(0, 50)}`,
  
  // Negotiation caching
  negotiation: (id: string) => `negotiation:${id}`,
  userNegotiations: (userId: string, status?: string) => 
    status ? `negotiations:user:${userId}:${status}` : `negotiations:user:${userId}`,
  
  // User caching
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  
  // Price analysis caching
  priceAnalysis: (productId: string) => `price:analysis:${productId}`,
  marketData: (category: string) => `market:data:${category}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
};

// Singleton instance
export const cacheService = new CacheService();
