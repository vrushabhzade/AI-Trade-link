/**
 * Pigeon Data Service
 * 
 * Provides pigeon sighting data with the following features:
 * - Primary integration with eBird API (Cornell Lab of Ornithology)
 * - Mock data generator with realistic urban patterns
 * - Geographic aggregation functionality for urban areas
 * - Fallback mechanisms when real data is unavailable
 * - Rate limiting and caching mechanisms
 */

import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { PigeonSighting, APIError } from '../types/index.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';
import { errorHandlingService, type ErrorContext } from './errorHandlingService.js';

// Urban areas configuration for geographic aggregation
export const URBAN_AREAS = {
  'new-york': { 
    name: 'New York City', 
    lat: 40.7128, 
    lng: -74.0060, 
    radius: 50, // km
    regionCode: 'US-NY-109' // eBird region code for NYC
  },
  'london': { 
    name: 'London', 
    lat: 51.5074, 
    lng: -0.1278, 
    radius: 40,
    regionCode: 'GB-ENG-LND'
  },
  'tokyo': { 
    name: 'Tokyo', 
    lat: 35.6762, 
    lng: 139.6503, 
    radius: 45,
    regionCode: 'JP-13'
  },
  'paris': { 
    name: 'Paris', 
    lat: 48.8566, 
    lng: 2.3522, 
    radius: 30,
    regionCode: 'FR-IDF'
  },
  'berlin': { 
    name: 'Berlin', 
    lat: 52.5200, 
    lng: 13.4050, 
    radius: 35,
    regionCode: 'DE-BE'
  }
} as const;

export type UrbanArea = keyof typeof URBAN_AREAS;

// eBird API response interfaces
interface eBirdObservation {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  obsValid: boolean;
  obsReviewed: boolean;
  locationPrivate: boolean;
}

interface eBirdRegionInfo {
  code: string;
  name: string;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Mock data generation parameters
interface MockDataParams {
  baseCount: number;
  seasonalVariation: number;
  dailyVariation: number;
  weatherFactor: number;
  urbanDensityFactor: number;
}

// Cache entry structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class PigeonDataService {
  private eBirdClient: AxiosInstance;
  private cache = new Map<string, CacheEntry<any>>();
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  // Rate limiting configuration for eBird API
  private readonly eBirdRateLimit = {
    maxRequests: 100, // eBird allows 100 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    retryAfterMs: 60 * 60 * 1000 // Wait 1 hour before retry
  };

  // Pigeon species codes from eBird taxonomy
  private readonly pigeonSpeciesCodes = [
    'rocpig', // Rock Pigeon (Columba livia) - most common urban pigeon
    'eutdov', // Eurasian Collared-Dove (Streptopelia decaocto)
    'moudov', // Mourning Dove (Zenaida macroura)
    'bandov', // Band-tailed Pigeon (Patagioenas fasciata)
    'woodov'  // White-winged Dove (Zenaida asiatica)
  ];

  constructor() {
    // Initialize eBird client
    this.eBirdClient = axios.create({
      baseURL: 'https://api.ebird.org/v2',
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'X-eBirdApiToken': process.env.EBIRD_API_KEY || '',
        'User-Agent': 'PigeonCryptoDashboard/1.0'
      }
    });

    // Set up response interceptors for error handling
    this.setupInterceptors();
  }

  /**
   * Get current pigeon sightings for specified urban areas
   */
  async getCurrentSightings(areas: UrbanArea[]): Promise<PigeonSighting[]> {
    const cacheKey = cacheService.generatePigeonKey(areas);
    
    // Check cache first (15-minute expiry for current sightings)
    const cached = await cacheService.getCachedPigeonData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try eBird API first
      const sightings = await this.getCurrentSightingsFromeBird(areas);
      
      // Cache and persist the results
      await cacheService.cachePigeonData(cacheKey, sightings);
      await persistenceService.storePigeonData(sightings);
      
      return sightings;
    } catch (error) {
      console.warn('eBird API failed, using mock data:', error);
      
      // Fallback to mock data
      const mockSightings = await this.generateMockSightings(areas);
      
      // Cache and persist the mock data
      await cacheService.cachePigeonData(cacheKey, mockSightings);
      await persistenceService.storePigeonData(mockSightings);
      
      return mockSightings;
    }
  }

  /**
   * Get historical pigeon sighting data
   */
  async getHistoricalSightings(
    areas: UrbanArea[],
    days: number = 7
  ): Promise<PigeonSighting[]> {
    const cacheKey = cacheService.generatePigeonKey(areas, days);
    
    // Check cache first (1-hour expiry for historical data)
    const cached = await cacheService.getCachedPigeonData(cacheKey);
    if (cached) {
      return cached;
    }

    // Check persistence layer for historical data
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    try {
      const persistedData = await persistenceService.getPigeonData(areas, startDate, endDate);
      if (persistedData.length > 0) {
        // Cache the persisted data
        await cacheService.cachePigeonData(cacheKey, persistedData);
        return persistedData;
      }
    } catch (error) {
      console.warn('Failed to retrieve persisted pigeon data:', error);
    }

    try {
      // Try eBird API first
      const sightings = await this.getHistoricalSightingsFromeBird(areas, days);
      
      // Cache and persist the results
      await cacheService.cachePigeonData(cacheKey, sightings);
      await persistenceService.storePigeonData(sightings);
      
      return sightings;
    } catch (error) {
      console.warn('eBird historical data failed, using mock data:', error);
      
      // Fallback to mock historical data
      const mockSightings = await this.generateHistoricalMockSightings(areas, days);
      
      // Cache and persist the mock data
      await cacheService.cachePigeonData(cacheKey, mockSightings);
      await persistenceService.storePigeonData(mockSightings);
      
      return mockSightings;
    }
  }

  /**
   * Get aggregated pigeon counts by urban area
   */
  async getAggregatedCounts(
    areas: UrbanArea[],
    timeRange: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{ [area: string]: PigeonSighting[] }> {
    const sightings = await this.getCurrentSightings(areas);
    
    // Group sightings by area and aggregate by time range
    const aggregated: { [area: string]: PigeonSighting[] } = {};
    
    for (const area of areas) {
      const areaSightings = sightings.filter(s => s.location === URBAN_AREAS[area].name);
      aggregated[area] = this.aggregateByTimeRange(areaSightings, timeRange);
    }
    
    return aggregated;
  }

  /**
   * Get current sightings from eBird API
   */
  private async getCurrentSightingsFromeBird(areas: UrbanArea[]): Promise<PigeonSighting[]> {
    if (!process.env.EBIRD_API_KEY) {
      throw new Error('eBird API key not configured');
    }

    if (!this.checkRateLimit('ebird')) {
      throw new Error('eBird rate limit exceeded');
    }

    const allSightings: PigeonSighting[] = [];
    
    for (const area of areas) {
      const areaConfig = URBAN_AREAS[area];
      
      try {
        // Get recent observations for pigeon species in this region
        const response: AxiosResponse<eBirdObservation[]> = await this.eBirdClient.get('/data/obs/geo/recent', {
          params: {
            lat: areaConfig.lat,
            lng: areaConfig.lng,
            dist: areaConfig.radius,
            back: 7, // Last 7 days
            includeProvisional: true,
            maxResults: 200
          }
        });

        this.updateRateLimit('ebird');

        // Filter for pigeon species and convert to our format
        const pigeonObservations = response.data.filter(obs => 
          this.pigeonSpeciesCodes.includes(obs.speciesCode) && 
          obs.obsValid &&
          obs.howMany && obs.howMany > 0
        );

        const areaSightings = pigeonObservations.map(obs => ({
          timestamp: new Date(obs.obsDt),
          location: areaConfig.name,
          count: obs.howMany || 1,
          coordinates: { lat: obs.lat, lng: obs.lng }
        }));

        allSightings.push(...areaSightings);
        
      } catch (error) {
        console.warn(`Failed to fetch eBird data for ${area}:`, error);
        // Continue with other areas even if one fails
      }
    }

    if (allSightings.length === 0) {
      throw new Error('No pigeon sightings found from eBird API');
    }

    return this.aggregateByLocation(allSightings);
  }

  /**
   * Get historical sightings from eBird API
   */
  private async getHistoricalSightingsFromeBird(areas: UrbanArea[], days: number): Promise<PigeonSighting[]> {
    if (!process.env.EBIRD_API_KEY) {
      throw new Error('eBird API key not configured');
    }

    if (!this.checkRateLimit('ebird')) {
      throw new Error('eBird rate limit exceeded');
    }

    const allSightings: PigeonSighting[] = [];
    const maxDays = Math.min(days, 30); // eBird API limits historical data to 30 days
    
    for (const area of areas) {
      const areaConfig = URBAN_AREAS[area];
      
      try {
        // Get historical observations for pigeon species in this region
        const response: AxiosResponse<eBirdObservation[]> = await this.eBirdClient.get('/data/obs/geo/recent', {
          params: {
            lat: areaConfig.lat,
            lng: areaConfig.lng,
            dist: areaConfig.radius,
            back: maxDays,
            includeProvisional: true,
            maxResults: 500
          }
        });

        this.updateRateLimit('ebird');

        // Filter for pigeon species and convert to our format
        const pigeonObservations = response.data.filter(obs => 
          this.pigeonSpeciesCodes.includes(obs.speciesCode) && 
          obs.obsValid &&
          obs.howMany && obs.howMany > 0
        );

        const areaSightings = pigeonObservations.map(obs => ({
          timestamp: new Date(obs.obsDt),
          location: areaConfig.name,
          count: obs.howMany || 1,
          coordinates: { lat: obs.lat, lng: obs.lng }
        }));

        allSightings.push(...areaSightings);
        
      } catch (error) {
        console.warn(`Failed to fetch historical eBird data for ${area}:`, error);
        // Continue with other areas even if one fails
      }
    }

    if (allSightings.length === 0) {
      throw new Error('No historical pigeon sightings found from eBird API');
    }

    return this.aggregateByLocation(allSightings);
  }

  /**
   * Generate realistic mock pigeon sighting data
   */
  private async generateMockSightings(areas: UrbanArea[]): Promise<PigeonSighting[]> {
    const sightings: PigeonSighting[] = [];
    const now = new Date();
    
    for (const area of areas) {
      const areaConfig = URBAN_AREAS[area];
      const params = this.getMockDataParams(area);
      
      // Generate sightings for the last 24 hours with hourly intervals
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(now.getTime() - (hour * 60 * 60 * 1000));
        const count = this.calculateMockCount(timestamp, params);
        
        if (count > 0) {
          sightings.push({
            timestamp,
            location: areaConfig.name,
            count,
            coordinates: this.generateRandomCoordinates(areaConfig)
          });
        }
      }
    }
    
    return sightings;
  }

  /**
   * Generate historical mock pigeon sighting data
   */
  private async generateHistoricalMockSightings(areas: UrbanArea[], days: number): Promise<PigeonSighting[]> {
    const sightings: PigeonSighting[] = [];
    const now = new Date();
    
    for (const area of areas) {
      const areaConfig = URBAN_AREAS[area];
      const params = this.getMockDataParams(area);
      
      // Generate daily sightings for the specified number of days
      for (let day = 0; day < days; day++) {
        // Generate multiple sightings per day (every 4 hours)
        for (let hour = 0; hour < 24; hour += 4) {
          const timestamp = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) - (hour * 60 * 60 * 1000));
          const count = this.calculateMockCount(timestamp, params);
          
          if (count > 0) {
            sightings.push({
              timestamp,
              location: areaConfig.name,
              count,
              coordinates: this.generateRandomCoordinates(areaConfig)
            });
          }
        }
      }
    }
    
    return sightings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get mock data parameters for different urban areas
   */
  private getMockDataParams(area: UrbanArea): MockDataParams {
    const baseParams: { [key in UrbanArea]: MockDataParams } = {
      'new-york': {
        baseCount: 25,
        seasonalVariation: 0.3,
        dailyVariation: 0.4,
        weatherFactor: 0.2,
        urbanDensityFactor: 1.5
      },
      'london': {
        baseCount: 18,
        seasonalVariation: 0.4,
        dailyVariation: 0.3,
        weatherFactor: 0.3,
        urbanDensityFactor: 1.2
      },
      'tokyo': {
        baseCount: 15,
        seasonalVariation: 0.2,
        dailyVariation: 0.3,
        weatherFactor: 0.1,
        urbanDensityFactor: 1.1
      },
      'paris': {
        baseCount: 20,
        seasonalVariation: 0.3,
        dailyVariation: 0.4,
        weatherFactor: 0.2,
        urbanDensityFactor: 1.3
      },
      'berlin': {
        baseCount: 16,
        seasonalVariation: 0.4,
        dailyVariation: 0.3,
        weatherFactor: 0.3,
        urbanDensityFactor: 1.1
      }
    };
    
    return baseParams[area];
  }

  /**
   * Calculate realistic mock pigeon count based on time and parameters
   */
  private calculateMockCount(timestamp: Date, params: MockDataParams): number {
    const hour = timestamp.getHours();
    const dayOfYear = Math.floor((timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Base count
    let count = params.baseCount;
    
    // Seasonal variation (more pigeons in spring/summer)
    const seasonalFactor = 1 + params.seasonalVariation * Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI / 2);
    count *= seasonalFactor;
    
    // Daily variation (peak activity in morning and evening)
    const dailyFactor = 1 + params.dailyVariation * (
      Math.sin((hour / 24) * 2 * Math.PI - Math.PI / 2) * 0.5 +
      Math.sin((hour / 12) * 2 * Math.PI) * 0.3
    );
    count *= dailyFactor;
    
    // Urban density factor
    count *= params.urbanDensityFactor;
    
    // Add some randomness
    count *= (0.7 + Math.random() * 0.6);
    
    // Weather factor (simplified - assume some days have less activity)
    if (Math.random() < 0.2) {
      count *= (1 - params.weatherFactor);
    }
    
    return Math.max(0, Math.round(count));
  }

  /**
   * Generate random coordinates within an urban area
   */
  private generateRandomCoordinates(areaConfig: typeof URBAN_AREAS[UrbanArea]): { lat: number; lng: number } {
    // Generate coordinates within the area radius (simplified circular distribution)
    const radiusInDegrees = areaConfig.radius / 111; // Rough conversion km to degrees
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusInDegrees;
    
    return {
      lat: areaConfig.lat + distance * Math.cos(angle),
      lng: areaConfig.lng + distance * Math.sin(angle)
    };
  }

  /**
   * Aggregate sightings by location to avoid duplicates
   */
  private aggregateByLocation(sightings: PigeonSighting[]): PigeonSighting[] {
    const aggregated = new Map<string, PigeonSighting>();
    
    for (const sighting of sightings) {
      const key = `${sighting.location}-${sighting.timestamp.toISOString().split('T')[0]}`;
      const existing = aggregated.get(key);
      
      if (existing) {
        existing.count += sighting.count;
      } else {
        aggregated.set(key, { ...sighting });
      }
    }
    
    return Array.from(aggregated.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Aggregate sightings by time range
   */
  private aggregateByTimeRange(sightings: PigeonSighting[], timeRange: 'hour' | 'day' | 'week'): PigeonSighting[] {
    const aggregated = new Map<string, PigeonSighting>();
    
    for (const sighting of sightings) {
      let key: string;
      let aggregatedTimestamp: Date;
      
      switch (timeRange) {
        case 'hour':
          aggregatedTimestamp = new Date(sighting.timestamp);
          aggregatedTimestamp.setMinutes(0, 0, 0);
          key = aggregatedTimestamp.toISOString();
          break;
        case 'day':
          aggregatedTimestamp = new Date(sighting.timestamp);
          aggregatedTimestamp.setHours(0, 0, 0, 0);
          key = aggregatedTimestamp.toISOString().split('T')[0];
          break;
        case 'week':
          aggregatedTimestamp = new Date(sighting.timestamp);
          const dayOfWeek = aggregatedTimestamp.getDay();
          aggregatedTimestamp.setDate(aggregatedTimestamp.getDate() - dayOfWeek);
          aggregatedTimestamp.setHours(0, 0, 0, 0);
          key = `week-${aggregatedTimestamp.toISOString().split('T')[0]}`;
          break;
      }
      
      const existing = aggregated.get(key);
      if (existing) {
        existing.count += sighting.count;
      } else {
        aggregated.set(key, {
          timestamp: aggregatedTimestamp,
          location: sighting.location,
          count: sighting.count,
          coordinates: sighting.coordinates
        });
      }
    }
    
    return Array.from(aggregated.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Check if we're within rate limits for eBird API
   */
  private checkRateLimit(api: 'ebird'): boolean {
    const now = Date.now();
    const rateLimitData = this.requestCounts.get(api);

    if (!rateLimitData || now > rateLimitData.resetTime) {
      // Reset the counter
      this.requestCounts.set(api, {
        count: 0,
        resetTime: now + this.eBirdRateLimit.windowMs
      });
      return true;
    }

    return rateLimitData.count < this.eBirdRateLimit.maxRequests;
  }

  /**
   * Update rate limit counter after making a request
   */
  private updateRateLimit(api: 'ebird'): void {
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
    this.eBirdClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 429) {
          throw new Error('eBird rate limit exceeded');
        }
        if (error.response?.status === 401) {
          throw new Error('eBird API key invalid or missing');
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
  getRateLimitStatus(): { ebird: any } {
    return {
      ebird: this.requestCounts.get('ebird') || { count: 0, resetTime: 0 }
    };
  }

  /**
   * Get supported urban areas
   */
  getSupportedAreas(): typeof URBAN_AREAS {
    return URBAN_AREAS;
  }
}

// Export singleton instance (lazy initialization)
let _pigeonService: PigeonDataService | null = null;

export const pigeonService = {
  getInstance(): PigeonDataService {
    if (!_pigeonService) {
      _pigeonService = new PigeonDataService();
    }
    return _pigeonService;
  },
  
  // Delegate methods for convenience
  getCurrentSightings: (areas: UrbanArea[]) => pigeonService.getInstance().getCurrentSightings(areas),
  getHistoricalSightings: (areas: UrbanArea[], days?: number) => pigeonService.getInstance().getHistoricalSightings(areas, days),
  getAggregatedCounts: (areas: UrbanArea[], timeRange?: 'hour' | 'day' | 'week') => pigeonService.getInstance().getAggregatedCounts(areas, timeRange),
  clearCache: () => pigeonService.getInstance().clearCache(),
  getCacheStats: () => pigeonService.getInstance().getCacheStats(),
  getRateLimitStatus: () => pigeonService.getInstance().getRateLimitStatus(),
  getSupportedAreas: () => pigeonService.getInstance().getSupportedAreas()
};