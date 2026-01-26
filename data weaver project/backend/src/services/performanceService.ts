/**
 * Performance Service
 * 
 * Provides performance optimization functionality with:
 * - Data sampling and aggregation for large datasets
 * - Concurrent user handling mechanisms
 * - Performance monitoring and optimization triggers
 * - Efficient data processing strategies
 * 
 * Requirements: 6.2, 6.4, 6.5
 */

import type { PigeonSighting, CryptoPricePoint, CorrelationResult } from '../types/index.js';

// Performance configuration
interface PerformanceConfig {
  maxDataPoints: number;
  samplingThreshold: number;
  aggregationWindow: number;
  concurrentUserLimit: number;
  renderingBatchSize: number;
  monitoringInterval: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  maxDataPoints: 1000,        // Maximum data points to render
  samplingThreshold: 5000,    // Start sampling above this many points
  aggregationWindow: 300000,  // 5 minutes aggregation window (ms)
  concurrentUserLimit: 100,   // Maximum concurrent users
  renderingBatchSize: 50,     // Process data in batches
  monitoringInterval: 30000   // Monitor performance every 30 seconds
};

// Performance metrics
interface PerformanceMetrics {
  activeUsers: number;
  dataPointsProcessed: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  lastOptimization: Date | null;
}

// Data sampling strategies
type SamplingStrategy = 'uniform' | 'adaptive' | 'peak-preserving';

// Aggregation methods
type AggregationMethod = 'average' | 'max' | 'min' | 'median' | 'sum';

export class PerformanceService {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private activeConnections = new Set<string>();
  private requestQueue = new Map<string, number>();
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      activeUsers: 0,
      dataPointsProcessed: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      lastOptimization: null
    };
    this.startMonitoring();
  }

  /**
   * Optimize pigeon data for rendering
   * Implements data sampling and aggregation for large datasets
   * Validates: Requirements 6.2
   */
  optimizePigeonData(
    data: PigeonSighting[],
    strategy: SamplingStrategy = 'adaptive'
  ): PigeonSighting[] {
    if (data.length <= this.config.maxDataPoints) {
      return data;
    }

    this.metrics.dataPointsProcessed += data.length;
    this.metrics.lastOptimization = new Date();

    switch (strategy) {
      case 'uniform':
        return this.uniformSampling(data);
      case 'adaptive':
        return this.adaptiveSampling(data);
      case 'peak-preserving':
        return this.peakPreservingSampling(data);
      default:
        return this.uniformSampling(data);
    }
  }

  /**
   * Optimize cryptocurrency data for rendering
   * Implements data sampling and aggregation for large datasets
   * Validates: Requirements 6.2
   */
  optimizeCryptoData(
    data: CryptoPricePoint[],
    strategy: SamplingStrategy = 'adaptive'
  ): CryptoPricePoint[] {
    if (data.length <= this.config.maxDataPoints) {
      return data;
    }

    this.metrics.dataPointsProcessed += data.length;
    this.metrics.lastOptimization = new Date();

    switch (strategy) {
      case 'uniform':
        return this.uniformSamplingCrypto(data);
      case 'adaptive':
        return this.adaptiveSamplingCrypto(data);
      case 'peak-preserving':
        return this.peakPreservingSamplingCrypto(data);
      default:
        return this.uniformSamplingCrypto(data);
    }
  }

  /**
   * Aggregate pigeon data by time windows
   * Reduces data points while preserving trends
   */
  aggregatePigeonData(
    data: PigeonSighting[],
    windowMs: number = this.config.aggregationWindow,
    method: AggregationMethod = 'average'
  ): PigeonSighting[] {
    if (data.length === 0) return data;

    // Group data by time windows and location
    const groups = new Map<string, PigeonSighting[]>();
    
    for (const sighting of data) {
      const windowStart = Math.floor(sighting.timestamp.getTime() / windowMs) * windowMs;
      const key = `${sighting.location}:${windowStart}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(sighting);
    }

    // Aggregate each group
    const aggregated: PigeonSighting[] = [];
    
    for (const [key, sightings] of groups) {
      const [location, windowStartStr] = key.split(':');
      const windowStart = new Date(parseInt(windowStartStr, 10));
      
      let aggregatedCount: number;
      switch (method) {
        case 'average':
          aggregatedCount = Math.round(
            sightings.reduce((sum, s) => sum + s.count, 0) / sightings.length
          );
          break;
        case 'max':
          aggregatedCount = Math.max(...sightings.map(s => s.count));
          break;
        case 'min':
          aggregatedCount = Math.min(...sightings.map(s => s.count));
          break;
        case 'sum':
          aggregatedCount = sightings.reduce((sum, s) => sum + s.count, 0);
          break;
        case 'median':
          const sorted = sightings.map(s => s.count).sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          aggregatedCount = sorted.length % 2 === 0 
            ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
            : sorted[mid];
          break;
        default:
          aggregatedCount = Math.round(
            sightings.reduce((sum, s) => sum + s.count, 0) / sightings.length
          );
      }

      // Use coordinates from the first sighting in the group
      const coordinates = sightings[0].coordinates;

      aggregated.push({
        location,
        count: aggregatedCount,
        timestamp: windowStart,
        coordinates
      });
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Aggregate cryptocurrency data by time windows
   */
  aggregateCryptoData(
    data: CryptoPricePoint[],
    windowMs: number = this.config.aggregationWindow,
    method: AggregationMethod = 'average'
  ): CryptoPricePoint[] {
    if (data.length === 0) return data;

    // Group data by time windows and symbol
    const groups = new Map<string, CryptoPricePoint[]>();
    
    for (const point of data) {
      const windowStart = Math.floor(point.timestamp.getTime() / windowMs) * windowMs;
      const key = `${point.symbol}:${windowStart}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(point);
    }

    // Aggregate each group
    const aggregated: CryptoPricePoint[] = [];
    
    for (const [key, points] of groups) {
      const [symbol, windowStartStr] = key.split(':');
      const windowStart = new Date(parseInt(windowStartStr, 10));
      
      let aggregatedPrice: number;
      switch (method) {
        case 'average':
          aggregatedPrice = points.reduce((sum, p) => sum + p.price, 0) / points.length;
          break;
        case 'max':
          aggregatedPrice = Math.max(...points.map(p => p.price));
          break;
        case 'min':
          aggregatedPrice = Math.min(...points.map(p => p.price));
          break;
        case 'median':
          const sorted = points.map(p => p.price).sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          aggregatedPrice = sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
          break;
        default:
          aggregatedPrice = points.reduce((sum, p) => sum + p.price, 0) / points.length;
      }

      // Aggregate volume and market cap if available
      const volume = points.some(p => p.volume !== undefined)
        ? points.reduce((sum, p) => sum + (p.volume || 0), 0) / points.length
        : undefined;
      
      const marketCap = points.some(p => p.marketCap !== undefined)
        ? points.reduce((sum, p) => sum + (p.marketCap || 0), 0) / points.length
        : undefined;

      aggregated.push({
        symbol,
        price: aggregatedPrice,
        volume,
        marketCap,
        timestamp: windowStart
      });
    }

    return aggregated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Handle concurrent user connections
   * Implements rate limiting and connection management
   * Validates: Requirements 6.4
   */
  handleUserConnection(userId: string): { allowed: boolean; queuePosition?: number } {
    // Check if user is already connected
    if (this.activeConnections.has(userId)) {
      return { allowed: true };
    }

    // Check concurrent user limit
    if (this.activeConnections.size >= this.config.concurrentUserLimit) {
      // Add to queue
      const queuePosition = this.requestQueue.size + 1;
      this.requestQueue.set(userId, Date.now());
      return { allowed: false, queuePosition };
    }

    // Allow connection
    this.activeConnections.add(userId);
    this.metrics.activeUsers = this.activeConnections.size;
    return { allowed: true };
  }

  /**
   * Remove user connection
   */
  removeUserConnection(userId: string): void {
    this.activeConnections.delete(userId);
    this.requestQueue.delete(userId);
    this.metrics.activeUsers = this.activeConnections.size;

    // Process queue if space available
    this.processQueue();
  }

  /**
   * Process queued connections
   */
  private processQueue(): void {
    if (this.activeConnections.size >= this.config.concurrentUserLimit) {
      return;
    }

    // Get oldest queued user
    let oldestUser: string | null = null;
    let oldestTime = Infinity;

    for (const [userId, timestamp] of this.requestQueue) {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestUser = userId;
      }
    }

    if (oldestUser) {
      this.requestQueue.delete(oldestUser);
      this.activeConnections.add(oldestUser);
      this.metrics.activeUsers = this.activeConnections.size;
    }
  }

  /**
   * Batch process data for efficient rendering
   * Prevents UI blocking and flickering
   * Validates: Requirements 6.5
   */
  async batchProcessData<T>(
    data: T[],
    processor: (batch: T[]) => Promise<T[]>,
    batchSize: number = this.config.renderingBatchSize
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const processedBatch = await processor(batch);
      results.push(...processedBatch);
      
      // Allow other operations to run
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return results;
  }

  /**
   * Uniform sampling - evenly spaced data points
   */
  private uniformSampling(data: PigeonSighting[]): PigeonSighting[] {
    const step = Math.ceil(data.length / this.config.maxDataPoints);
    const sampled: PigeonSighting[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    
    return sampled;
  }

  /**
   * Adaptive sampling - preserves important data points
   */
  private adaptiveSampling(data: PigeonSighting[]): PigeonSighting[] {
    if (data.length <= this.config.maxDataPoints) return data;

    // Calculate variance to identify important points
    const counts = data.map(d => d.count);
    const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
    const threshold = mean + Math.sqrt(variance);

    // Keep high-variance points and sample the rest
    const important: PigeonSighting[] = [];
    const regular: PigeonSighting[] = [];

    for (const sighting of data) {
      if (sighting.count > threshold) {
        important.push(sighting);
      } else {
        regular.push(sighting);
      }
    }

    // Sample regular points to fit remaining budget
    const remainingBudget = this.config.maxDataPoints - important.length;
    const sampledRegular = remainingBudget > 0 
      ? this.uniformSampling(regular).slice(0, remainingBudget)
      : [];

    return [...important, ...sampledRegular]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Peak-preserving sampling - maintains local maxima and minima
   */
  private peakPreservingSampling(data: PigeonSighting[]): PigeonSighting[] {
    if (data.length <= this.config.maxDataPoints) return data;

    const peaks: PigeonSighting[] = [];
    
    // Find local peaks and valleys
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].count;
      const curr = data[i].count;
      const next = data[i + 1].count;
      
      // Local maximum or minimum
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        peaks.push(data[i]);
      }
    }

    // Add first and last points
    peaks.unshift(data[0]);
    peaks.push(data[data.length - 1]);

    // If still too many points, uniform sample the peaks
    return peaks.length > this.config.maxDataPoints
      ? this.uniformSampling(peaks)
      : peaks;
  }

  /**
   * Uniform sampling for crypto data
   */
  private uniformSamplingCrypto(data: CryptoPricePoint[]): CryptoPricePoint[] {
    const step = Math.ceil(data.length / this.config.maxDataPoints);
    const sampled: CryptoPricePoint[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    
    return sampled;
  }

  /**
   * Adaptive sampling for crypto data
   */
  private adaptiveSamplingCrypto(data: CryptoPricePoint[]): CryptoPricePoint[] {
    if (data.length <= this.config.maxDataPoints) return data;

    // Calculate price volatility to identify important points
    const prices = data.map(d => d.price);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const threshold = Math.sqrt(variance) * 0.5; // 0.5 standard deviations

    // Keep high-volatility points and sample the rest
    const important: CryptoPricePoint[] = [];
    const regular: CryptoPricePoint[] = [];

    for (let i = 0; i < data.length; i++) {
      const price = data[i].price;
      const deviation = Math.abs(price - mean);
      
      if (deviation > threshold) {
        important.push(data[i]);
      } else {
        regular.push(data[i]);
      }
    }

    // Sample regular points to fit remaining budget
    const remainingBudget = this.config.maxDataPoints - important.length;
    const sampledRegular = remainingBudget > 0 
      ? this.uniformSamplingCrypto(regular).slice(0, remainingBudget)
      : [];

    return [...important, ...sampledRegular]
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Peak-preserving sampling for crypto data
   */
  private peakPreservingSamplingCrypto(data: CryptoPricePoint[]): CryptoPricePoint[] {
    if (data.length <= this.config.maxDataPoints) return data;

    const peaks: CryptoPricePoint[] = [];
    
    // Find local peaks and valleys in price
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].price;
      const curr = data[i].price;
      const next = data[i + 1].price;
      
      // Local maximum or minimum
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        peaks.push(data[i]);
      }
    }

    // Add first and last points
    peaks.unshift(data[0]);
    peaks.push(data[data.length - 1]);

    // If still too many points, uniform sample the peaks
    return peaks.length > this.config.maxDataPoints
      ? this.uniformSamplingCrypto(peaks)
      : peaks;
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.monitoringInterval);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    // Update memory usage (mock implementation)
    this.metrics.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    // Update CPU usage (mock implementation)
    this.metrics.cpuUsage = Math.random() * 100; // Mock CPU usage
    
    // Clean up old queue entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [userId, timestamp] of this.requestQueue) {
      if (timestamp < fiveMinutesAgo) {
        this.requestQueue.delete(userId);
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceMetrics & {
    config: PerformanceConfig;
    queueSize: number;
    connectionIds: string[];
  } {
    return {
      ...this.metrics,
      config: this.config,
      queueSize: this.requestQueue.size,
      connectionIds: Array.from(this.activeConnections)
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Health check for performance service
   */
  async healthCheck(): Promise<{ status: string; metrics: any }> {
    try {
      const stats = this.getStats();
      const isHealthy = stats.activeUsers < stats.config.concurrentUserLimit * 0.9 &&
                       stats.memoryUsage < 1000; // Less than 1GB

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        metrics: {
          activeUsers: stats.activeUsers,
          memoryUsage: `${stats.memoryUsage.toFixed(2)} MB`,
          queueSize: stats.queueSize,
          lastOptimization: stats.lastOptimization
        }
      };
    } catch (error) {
      return {
        status: 'error',
        metrics: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Shutdown performance service
   */
  shutdown(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    this.activeConnections.clear();
    this.requestQueue.clear();
  }
}

// Export singleton instance
let _performanceService: PerformanceService | null = null;

export const performanceService = {
  getInstance(): PerformanceService {
    if (!_performanceService) {
      _performanceService = new PerformanceService();
    }
    return _performanceService;
  },
  
  // Delegate methods for convenience
  optimizePigeonData: (data: PigeonSighting[], strategy?: SamplingStrategy) => 
    performanceService.getInstance().optimizePigeonData(data, strategy),
  optimizeCryptoData: (data: CryptoPricePoint[], strategy?: SamplingStrategy) => 
    performanceService.getInstance().optimizeCryptoData(data, strategy),
  aggregatePigeonData: (data: PigeonSighting[], windowMs?: number, method?: AggregationMethod) => 
    performanceService.getInstance().aggregatePigeonData(data, windowMs, method),
  aggregateCryptoData: (data: CryptoPricePoint[], windowMs?: number, method?: AggregationMethod) => 
    performanceService.getInstance().aggregateCryptoData(data, windowMs, method),
  handleUserConnection: (userId: string) => 
    performanceService.getInstance().handleUserConnection(userId),
  removeUserConnection: (userId: string) => 
    performanceService.getInstance().removeUserConnection(userId),
  batchProcessData: <T>(data: T[], processor: (batch: T[]) => Promise<T[]>, batchSize?: number) => 
    performanceService.getInstance().batchProcessData(data, processor, batchSize),
  getStats: () => performanceService.getInstance().getStats(),
  updateConfig: (config: Partial<PerformanceConfig>) => 
    performanceService.getInstance().updateConfig(config),
  shutdown: () => performanceService.getInstance().shutdown()
};