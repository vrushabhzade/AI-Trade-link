/**
 * Data Aggregation and Correlation Engine
 * 
 * Provides correlation analysis between pigeon sighting data and cryptocurrency prices with:
 * - Temporal alignment logic for combining datasets
 * - Statistical correlation calculation using time-series methods
 * - Correlation threshold detection and highlighting
 * - Humorous commentary generator for correlation patterns
 */

import type { PigeonSighting, CryptoPricePoint, CorrelationResult, DashboardData } from '../types/index.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';

// Time alignment configuration
interface TimeAlignmentConfig {
  bucketSize: 'minute' | 'hour' | 'day';
  tolerance: number; // milliseconds
}

// Aligned data point for correlation analysis
interface AlignedDataPoint {
  timestamp: Date;
  pigeonCount: number;
  cryptoPrice: number;
  location: string;
  cryptoSymbol: string;
}

// Correlation analysis result
interface CorrelationAnalysis {
  coefficient: number;
  pValue: number;
  sampleSize: number;
  timeRange: { start: Date; end: Date };
  significance: 'high' | 'medium' | 'low' | 'none';
  highlighted: boolean;
}

// Humorous commentary templates
const CORRELATION_COMMENTARY = {
  high_positive: [
    "🐦 Breaking: Local pigeons apparently have insider trading knowledge! When pigeon counts soar, so does {crypto}!",
    "📈 Economists baffled: Pigeon population growth strongly correlates with {crypto} gains. Are birds the new financial advisors?",
    "🚀 Market Alert: {crypto} and pigeon sightings moving in perfect harmony. Coincidence? We think not!",
    "💰 Investment tip: Follow the pigeons! High pigeon activity predicts {crypto} moon missions.",
    "🔮 Mystical correlation detected: More pigeons = higher {crypto} prices. Ancient bird wisdom confirmed!"
  ],
  high_negative: [
    "📉 Plot twist: Pigeons are apparently {crypto} bears! More birds = lower prices. Who knew?",
    "🐦 Conspiracy theory: Pigeons are secretly shorting {crypto}. The evidence is undeniable!",
    "💸 Market mystery: As pigeon populations rise, {crypto} takes a dive. Are birds bad for business?",
    "📊 Shocking discovery: Pigeons and {crypto} prices move in opposite directions. Nature's hedge fund?",
    "🎭 The great pigeon paradox: More feathered friends means fewer {crypto} gains. Life is strange!"
  ],
  medium_positive: [
    "🐦 Mild correlation alert: Pigeons and {crypto} seem to be casual friends. Not best buddies, but they hang out.",
    "📈 Interesting pattern: {crypto} and pigeon counts show some synchronization. Probably just a coincidence... probably.",
    "🤔 Hmm, curious: There's a moderate connection between bird activity and {crypto} performance.",
    "📊 Statistical whisper: Pigeons and {crypto} are somewhat aligned. The universe has a sense of humor."
  ],
  medium_negative: [
    "📉 Moderate anti-correlation: Pigeons and {crypto} are like that couple that argues but stays together.",
    "🐦 Mild tension detected: As pigeons increase, {crypto} shows some resistance. Drama in the data!",
    "📊 Gentle opposition: Pigeons and {crypto} prices prefer to go their separate ways, but not dramatically."
  ],
  low: [
    "🤷 Correlation status: Pigeons and {crypto} are basically strangers passing in the night.",
    "📊 Statistical shrug: No meaningful relationship between birds and {crypto}. They're just doing their own thing.",
    "🐦 Independence day: Pigeons and {crypto} prices are living their best separate lives.",
    "📈 Random walk confirmed: {crypto} and pigeon counts are as related as pizza and quantum physics."
  ]
};

export class CorrelationService {
  private cache = new Map<string, { data: any; timestamp: number; expiresAt: number }>();

  /**
   * Aggregate and correlate pigeon and cryptocurrency data
   */
  async aggregateAndCorrelate(
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[],
    config: TimeAlignmentConfig = { bucketSize: 'hour', tolerance: 30 * 60 * 1000 }
  ): Promise<DashboardData> {
    // Generate cache key based on data characteristics
    const cacheKey = this.generateCorrelationCacheKey(pigeonData, cryptoData, config);
    
    // Check cache first
    const cached = await cacheService.getCachedCorrelationData(cacheKey);
    if (cached) {
      return {
        pigeonData,
        cryptoData,
        correlations: cached,
        metadata: {
          lastUpdated: new Date(),
          dataQuality: this.determineDataQuality(pigeonData, cryptoData)
        }
      };
    }

    // Temporal alignment
    const alignedData = this.alignDataTemporally(pigeonData, cryptoData, config);
    
    // Calculate correlations for each crypto-location pair
    const correlations = this.calculateCorrelations(alignedData);
    
    // Cache the correlation results
    await cacheService.cacheCorrelationData(cacheKey, correlations);
    
    // Store correlations in persistence layer
    try {
      for (const correlation of correlations) {
        // Extract crypto and location from aligned data
        const cryptoSymbol = cryptoData[0]?.symbol || 'unknown';
        const pigeonLocation = pigeonData[0]?.location || 'unknown';
        await persistenceService.storeCorrelationData([correlation], cryptoSymbol, pigeonLocation);
      }
    } catch (error) {
      console.warn('Failed to persist correlation data:', error);
    }
    
    // Generate metadata
    const metadata = {
      lastUpdated: new Date(),
      dataQuality: this.determineDataQuality(pigeonData, cryptoData)
    };

    return {
      pigeonData,
      cryptoData,
      correlations,
      metadata
    };
  }

  /**
   * Align pigeon and crypto data temporally for correlation analysis
   */
  private alignDataTemporally(
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[],
    config: TimeAlignmentConfig
  ): AlignedDataPoint[] {
    const alignedPoints: AlignedDataPoint[] = [];
    
    // Create time buckets based on configuration
    const timeBuckets = this.createTimeBuckets(pigeonData, cryptoData, config.bucketSize);
    
    for (const bucket of timeBuckets) {
      // Aggregate pigeon data for this time bucket
      const pigeonAggregates = this.aggregatePigeonDataForBucket(pigeonData, bucket, config.tolerance);
      
      // Aggregate crypto data for this time bucket
      const cryptoAggregates = this.aggregateCryptoDataForBucket(cryptoData, bucket, config.tolerance);
      
      // Create aligned data points for all combinations
      for (const pigeonAggregate of pigeonAggregates) {
        for (const cryptoAggregate of cryptoAggregates) {
          alignedPoints.push({
            timestamp: bucket,
            pigeonCount: pigeonAggregate.count,
            cryptoPrice: cryptoAggregate.price,
            location: pigeonAggregate.location,
            cryptoSymbol: cryptoAggregate.symbol
          });
        }
      }
    }
    
    return alignedPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Create time buckets for alignment
   */
  private createTimeBuckets(
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[],
    bucketSize: 'minute' | 'hour' | 'day'
  ): Date[] {
    const allTimestamps = [
      ...pigeonData.map(p => p.timestamp),
      ...cryptoData.map(c => c.timestamp)
    ];

    if (allTimestamps.length === 0) return [];

    const minTime = new Date(Math.min(...allTimestamps.map(t => t.getTime())));
    const maxTime = new Date(Math.max(...allTimestamps.map(t => t.getTime())));
    
    const buckets: Date[] = [];
    const current = new Date(minTime);
    
    // Align to bucket boundaries
    this.alignToBucketBoundary(current, bucketSize);
    
    while (current <= maxTime) {
      buckets.push(new Date(current));
      this.incrementBucket(current, bucketSize);
    }
    
    return buckets;
  }

  /**
   * Align timestamp to bucket boundary
   */
  private alignToBucketBoundary(date: Date, bucketSize: 'minute' | 'hour' | 'day'): void {
    switch (bucketSize) {
      case 'minute':
        date.setSeconds(0, 0);
        break;
      case 'hour':
        date.setMinutes(0, 0, 0);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
    }
  }

  /**
   * Increment date by bucket size
   */
  private incrementBucket(date: Date, bucketSize: 'minute' | 'hour' | 'day'): void {
    switch (bucketSize) {
      case 'minute':
        date.setMinutes(date.getMinutes() + 1);
        break;
      case 'hour':
        date.setHours(date.getHours() + 1);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
    }
  }

  /**
   * Aggregate pigeon data for a time bucket
   */
  private aggregatePigeonDataForBucket(
    pigeonData: PigeonSighting[],
    bucket: Date,
    tolerance: number
  ): { location: string; count: number }[] {
    const bucketStart = bucket.getTime();
    const bucketEnd = bucketStart + tolerance;
    
    const relevantData = pigeonData.filter(p => {
      const time = p.timestamp.getTime();
      return time >= bucketStart && time < bucketEnd;
    });
    
    // Group by location and sum counts
    const locationAggregates = new Map<string, number>();
    
    for (const sighting of relevantData) {
      const current = locationAggregates.get(sighting.location) || 0;
      locationAggregates.set(sighting.location, current + sighting.count);
    }
    
    return Array.from(locationAggregates.entries()).map(([location, count]) => ({
      location,
      count
    }));
  }

  /**
   * Aggregate crypto data for a time bucket
   */
  private aggregateCryptoDataForBucket(
    cryptoData: CryptoPricePoint[],
    bucket: Date,
    tolerance: number
  ): { symbol: string; price: number }[] {
    const bucketStart = bucket.getTime();
    const bucketEnd = bucketStart + tolerance;
    
    const relevantData = cryptoData.filter(c => {
      const time = c.timestamp.getTime();
      return time >= bucketStart && time < bucketEnd;
    });
    
    // Group by symbol and average prices
    const symbolAggregates = new Map<string, { sum: number; count: number }>();
    
    for (const price of relevantData) {
      const current = symbolAggregates.get(price.symbol) || { sum: 0, count: 0 };
      symbolAggregates.set(price.symbol, {
        sum: current.sum + price.price,
        count: current.count + 1
      });
    }
    
    return Array.from(symbolAggregates.entries()).map(([symbol, aggregate]) => ({
      symbol,
      price: aggregate.count > 0 ? aggregate.sum / aggregate.count : 0
    }));
  }

  /**
   * Calculate correlations between aligned data points
   */
  private calculateCorrelations(alignedData: AlignedDataPoint[]): CorrelationResult[] {
    const correlations: CorrelationResult[] = [];
    
    // Group by location-crypto pairs
    const pairs = new Map<string, AlignedDataPoint[]>();
    
    for (const point of alignedData) {
      const key = `${point.location}-${point.cryptoSymbol}`;
      if (!pairs.has(key)) {
        pairs.set(key, []);
      }
      pairs.get(key)!.push(point);
    }
    
    // Calculate correlation for each pair
    for (const [pairKey, points] of pairs) {
      if (points.length < 3) continue; // Need at least 3 points for meaningful correlation
      
      const analysis = this.calculatePearsonCorrelation(points);
      const [location, cryptoSymbol] = pairKey.split('-');
      
      const correlation: CorrelationResult = {
        coefficient: analysis.coefficient,
        pValue: analysis.pValue,
        timeRange: {
          start: new Date(Math.min(...points.map(p => p.timestamp.getTime()))),
          end: new Date(Math.max(...points.map(p => p.timestamp.getTime())))
        },
        significance: analysis.significance
      };
      
      correlations.push(correlation);
    }
    
    return correlations;
  }

  /**
   * Calculate Pearson correlation coefficient with statistical significance
   */
  private calculatePearsonCorrelation(points: AlignedDataPoint[]): CorrelationAnalysis {
    const n = points.length;
    
    if (n < 2) {
      return {
        coefficient: 0,
        pValue: 1,
        sampleSize: n,
        timeRange: { start: new Date(), end: new Date() },
        significance: 'none',
        highlighted: false
      };
    }
    
    const pigeonCounts = points.map(p => p.pigeonCount);
    const cryptoPrices = points.map(p => p.cryptoPrice);
    
    // Calculate means
    const meanPigeon = pigeonCounts.reduce((sum, val) => sum + val, 0) / n;
    const meanCrypto = cryptoPrices.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate correlation coefficient
    let numerator = 0;
    let denomPigeon = 0;
    let denomCrypto = 0;
    
    for (let i = 0; i < n; i++) {
      const pigeonDiff = pigeonCounts[i] - meanPigeon;
      const cryptoDiff = cryptoPrices[i] - meanCrypto;
      
      numerator += pigeonDiff * cryptoDiff;
      denomPigeon += pigeonDiff * pigeonDiff;
      denomCrypto += cryptoDiff * cryptoDiff;
    }
    
    const denominator = Math.sqrt(denomPigeon * denomCrypto);
    const coefficient = denominator === 0 ? 0 : numerator / denominator;
    
    // Calculate p-value using t-distribution approximation
    const tStatistic = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const pValue = this.calculatePValue(tStatistic, n - 2);
    
    // Determine significance
    const significance = this.determineSignificance(Math.abs(coefficient), pValue);
    const highlighted = Math.abs(coefficient) >= 0.7;
    
    return {
      coefficient,
      pValue,
      sampleSize: n,
      timeRange: {
        start: new Date(Math.min(...points.map(p => p.timestamp.getTime()))),
        end: new Date(Math.max(...points.map(p => p.timestamp.getTime())))
      },
      significance,
      highlighted
    };
  }

  /**
   * Calculate p-value using t-distribution approximation
   */
  private calculatePValue(tStatistic: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation (for demonstration)
    // In production, you'd use a proper statistical library
    const absT = Math.abs(tStatistic);
    
    if (degreesOfFreedom < 1) return 1;
    if (absT > 3) return 0.001;
    if (absT > 2.5) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1.5) return 0.1;
    
    return 0.2;
  }

  /**
   * Determine statistical significance level
   */
  private determineSignificance(
    coefficient: number,
    pValue: number
  ): 'high' | 'medium' | 'low' | 'none' {
    if (coefficient >= 0.7 && pValue <= 0.01) return 'high';
    if (coefficient >= 0.5 && pValue <= 0.05) return 'medium';
    if (coefficient >= 0.3 && pValue <= 0.1) return 'low';
    return 'none';
  }

  /**
   * Generate humorous commentary for correlation patterns
   */
  generateCorrelationCommentary(
    coefficient: number,
    cryptoSymbol: string,
    location: string
  ): string {
    const absCoeff = Math.abs(coefficient);
    let templates: string[];
    
    if (absCoeff >= 0.7) {
      templates = coefficient > 0 ? CORRELATION_COMMENTARY.high_positive : CORRELATION_COMMENTARY.high_negative;
    } else if (absCoeff >= 0.5) {
      templates = coefficient > 0 ? CORRELATION_COMMENTARY.medium_positive : CORRELATION_COMMENTARY.medium_negative;
    } else {
      templates = CORRELATION_COMMENTARY.low;
    }
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template.replace(/{crypto}/g, cryptoSymbol).replace(/{location}/g, location);
  }

  /**
   * Get correlation highlights for visualization
   */
  getCorrelationHighlights(correlations: CorrelationResult[]): {
    highlighted: CorrelationResult[];
    commentary: string[];
  } {
    const highlighted = correlations.filter(c => Math.abs(c.coefficient) >= 0.7);
    const commentary = highlighted.map(c => 
      this.generateCorrelationCommentary(c.coefficient, 'crypto', 'location')
    );
    
    return { highlighted, commentary };
  }

  /**
   * Determine overall data quality
   */
  private determineDataQuality(
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[]
  ): 'real' | 'mock' | 'mixed' {
    // This is a simplified implementation
    // In practice, you'd check metadata or source indicators
    const hasPigeonData = pigeonData.length > 0;
    const hasCryptoData = cryptoData.length > 0;
    
    if (!hasPigeonData && !hasCryptoData) return 'mock';
    if (hasPigeonData && hasCryptoData) return 'mixed';
    return 'real';
  }

  /**
   * Generate cache key for correlation data
   */
  private generateCorrelationCacheKey(
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[],
    config: TimeAlignmentConfig
  ): string {
    const pigeonLocations = [...new Set(pigeonData.map(p => p.location))].sort();
    const cryptoSymbols = [...new Set(cryptoData.map(c => c.symbol))].sort();
    const timeRange = pigeonData.length > 0 && cryptoData.length > 0 
      ? Math.max(
          Math.max(...pigeonData.map(p => p.timestamp.getTime())) - Math.min(...pigeonData.map(p => p.timestamp.getTime())),
          Math.max(...cryptoData.map(c => c.timestamp.getTime())) - Math.min(...cryptoData.map(c => c.timestamp.getTime()))
        )
      : 0;
    
    return `${cryptoSymbols.join(',')}-${pigeonLocations.join(',')}-${config.bucketSize}-${Math.floor(timeRange / (24 * 60 * 60 * 1000))}d`;
  }

  /**
   * Clear correlation cache
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
}

// Export singleton instance
let _correlationService: CorrelationService | null = null;

export const correlationService = {
  getInstance(): CorrelationService {
    if (!_correlationService) {
      _correlationService = new CorrelationService();
    }
    return _correlationService;
  },
  
  // Delegate methods for convenience
  aggregateAndCorrelate: (
    pigeonData: PigeonSighting[],
    cryptoData: CryptoPricePoint[],
    config?: any
  ) => correlationService.getInstance().aggregateAndCorrelate(pigeonData, cryptoData, config),
  
  generateCorrelationCommentary: (
    coefficient: number,
    cryptoSymbol: string,
    location: string
  ) => correlationService.getInstance().generateCorrelationCommentary(coefficient, cryptoSymbol, location),
  
  getCorrelationHighlights: (correlations: CorrelationResult[]) => 
    correlationService.getInstance().getCorrelationHighlights(correlations),
  
  clearCache: () => correlationService.getInstance().clearCache(),
  getCacheStats: () => correlationService.getInstance().getCacheStats()
};