/**
 * Data transformation and normalization utilities
 * Handles temporal alignment, aggregation, and data processing
 */

import type { PigeonSighting, CryptoPricePoint, DashboardData } from '../types/index';

/**
 * Time bucket intervals for data aggregation
 */
export enum TimeBucket {
  FIFTEEN_MINUTES = 15 * 60 * 1000,
  HOURLY = 60 * 60 * 1000,
  DAILY = 24 * 60 * 60 * 1000,
  WEEKLY = 7 * 24 * 60 * 60 * 1000
}

/**
 * Rounds a timestamp down to the start of the time bucket
 */
export function roundToTimeBucket(timestamp: Date, bucket: TimeBucket): Date {
  const time = timestamp.getTime();
  const rounded = Math.floor(time / bucket) * bucket;
  return new Date(rounded);
}

/**
 * Aggregates pigeon sightings by time buckets and optionally by location
 */
export function aggregatePigeonData(
  sightings: PigeonSighting[], 
  bucket: TimeBucket,
  groupByLocation: boolean = false
): PigeonSighting[] {
  const aggregated = new Map<string, PigeonSighting>();

  sightings.forEach(sighting => {
    const roundedTime = roundToTimeBucket(sighting.timestamp, bucket);
    const key = groupByLocation 
      ? `${roundedTime.getTime()}-${sighting.location}`
      : roundedTime.getTime().toString();

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.count += sighting.count;
    } else {
      aggregated.set(key, {
        timestamp: roundedTime,
        location: groupByLocation ? sighting.location : 'aggregated',
        count: sighting.count,
        coordinates: sighting.coordinates
      });
    }
  });

  return Array.from(aggregated.values()).sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );
}

/**
 * Aggregates cryptocurrency price data by time buckets using OHLCV methodology
 */
export function aggregateCryptoData(
  pricePoints: CryptoPricePoint[], 
  bucket: TimeBucket
): CryptoPricePoint[] {
  const aggregated = new Map<string, {
    timestamp: Date;
    symbol: string;
    prices: number[];
    volumes: number[];
    marketCaps: number[];
  }>();

  pricePoints.forEach(point => {
    const roundedTime = roundToTimeBucket(point.timestamp, bucket);
    const key = `${roundedTime.getTime()}-${point.symbol}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.prices.push(point.price);
      if (point.volume !== undefined) existing.volumes.push(point.volume);
      if (point.marketCap !== undefined) existing.marketCaps.push(point.marketCap);
    } else {
      aggregated.set(key, {
        timestamp: roundedTime,
        symbol: point.symbol,
        prices: [point.price],
        volumes: point.volume !== undefined ? [point.volume] : [],
        marketCaps: point.marketCap !== undefined ? [point.marketCap] : []
      });
    }
  });

  return Array.from(aggregated.values()).map(group => ({
    timestamp: group.timestamp,
    symbol: group.symbol,
    price: calculateVolumeWeightedAverage(group.prices, group.volumes),
    volume: group.volumes.length > 0 ? group.volumes.reduce((a, b) => a + b, 0) : undefined,
    marketCap: group.marketCaps.length > 0 
      ? group.marketCaps.reduce((a, b) => a + b, 0) / group.marketCaps.length 
      : undefined
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Calculates volume-weighted average price, falls back to simple average if no volumes
 */
function calculateVolumeWeightedAverage(prices: number[], volumes: number[]): number {
  if (volumes.length === 0 || volumes.length !== prices.length) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  const totalVolume = volumes.reduce((a, b) => a + b, 0);
  if (totalVolume === 0) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  const weightedSum = prices.reduce((sum, price, index) => 
    sum + (price * volumes[index]), 0
  );

  return weightedSum / totalVolume;
}

/**
 * Aligns pigeon and crypto data to common time intervals
 */
export function alignDataTemporally(
  pigeonData: PigeonSighting[],
  cryptoData: CryptoPricePoint[],
  bucket: TimeBucket = TimeBucket.HOURLY
): { alignedPigeonData: PigeonSighting[], alignedCryptoData: CryptoPricePoint[] } {
  const aggregatedPigeon = aggregatePigeonData(pigeonData, bucket);
  const aggregatedCrypto = aggregateCryptoData(cryptoData, bucket);

  // Aggregate crypto data further by timestamp only (combining all symbols)
  const cryptoByTimestamp = new Map<number, CryptoPricePoint[]>();
  aggregatedCrypto.forEach(crypto => {
    const timestamp = crypto.timestamp.getTime();
    if (!cryptoByTimestamp.has(timestamp)) {
      cryptoByTimestamp.set(timestamp, []);
    }
    cryptoByTimestamp.get(timestamp)!.push(crypto);
  });

  // Create single crypto entry per timestamp by averaging prices across symbols
  const temporallyAggregatedCrypto: CryptoPricePoint[] = Array.from(cryptoByTimestamp.entries()).map(([timestamp, cryptos]) => {
    const avgPrice = cryptos.reduce((sum, c) => sum + c.price, 0) / cryptos.length;
    const totalVolume = cryptos.reduce((sum, c) => sum + (c.volume || 0), 0);
    const avgMarketCap = cryptos.reduce((sum, c) => sum + (c.marketCap || 0), 0) / cryptos.length;
    const symbols = cryptos.map(c => c.symbol).join(',');
    
    return {
      timestamp: new Date(timestamp),
      symbol: symbols, // Combined symbol names
      price: avgPrice,
      volume: totalVolume > 0 ? totalVolume : undefined,
      marketCap: avgMarketCap > 0 ? avgMarketCap : undefined
    };
  }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Find common time range
  const pigeonTimes = new Set(aggregatedPigeon.map(p => p.timestamp.getTime()));
  const cryptoTimes = new Set(temporallyAggregatedCrypto.map(c => c.timestamp.getTime()));
  const commonTimes = new Set([...pigeonTimes].filter(t => cryptoTimes.has(t)));

  const alignedPigeonData = aggregatedPigeon.filter(p => 
    commonTimes.has(p.timestamp.getTime())
  );

  const alignedCryptoData = temporallyAggregatedCrypto.filter(c => 
    commonTimes.has(c.timestamp.getTime())
  );

  return { alignedPigeonData, alignedCryptoData };
}

/**
 * Normalizes price data for visual comparison (0-1 scale)
 */
export function normalizePriceData(pricePoints: CryptoPricePoint[]): CryptoPricePoint[] {
  if (pricePoints.length === 0) return [];

  const prices = pricePoints.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  if (priceRange === 0) {
    return pricePoints.map(p => ({ ...p, price: 0.5 }));
  }

  return pricePoints.map(point => ({
    ...point,
    price: (point.price - minPrice) / priceRange
  }));
}

/**
 * Normalizes pigeon count data for visual comparison (0-1 scale)
 */
export function normalizePigeonData(sightings: PigeonSighting[]): PigeonSighting[] {
  if (sightings.length === 0) return [];

  const counts = sightings.map(s => s.count);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const countRange = maxCount - minCount;

  if (countRange === 0) {
    return sightings.map(s => ({ ...s, count: 0.5 }));
  }

  return sightings.map(sighting => ({
    ...sighting,
    count: (sighting.count - minCount) / countRange
  }));
}

/**
 * Filters data by time range
 */
export function filterByTimeRange<T extends { timestamp: Date }>(
  data: T[],
  startTime: Date,
  endTime: Date
): T[] {
  return data.filter(item => 
    item.timestamp >= startTime && item.timestamp <= endTime
  );
}

/**
 * Aggregates pigeon sightings by geographic urban area or city
 * Extracts city/urban area from location strings and aggregates counts
 */
export function aggregatePigeonByGeography(
  sightings: PigeonSighting[]
): PigeonSighting[] {
  const geographicAggregation = new Map<string, {
    count: number;
    timestamps: Date[];
    coordinates?: { lat: number; lng: number };
  }>();

  sightings.forEach(sighting => {
    // Extract urban area/city from location string
    const urbanArea = extractUrbanArea(sighting.location);
    
    if (geographicAggregation.has(urbanArea)) {
      const existing = geographicAggregation.get(urbanArea)!;
      existing.count += sighting.count;
      existing.timestamps.push(sighting.timestamp);
      // Keep first coordinates if available
      if (!existing.coordinates && sighting.coordinates) {
        existing.coordinates = sighting.coordinates;
      }
    } else {
      geographicAggregation.set(urbanArea, {
        count: sighting.count,
        timestamps: [sighting.timestamp],
        coordinates: sighting.coordinates
      });
    }
  });

  return Array.from(geographicAggregation.entries()).map(([urbanArea, data]) => ({
    timestamp: data.timestamps.sort((a, b) => a.getTime() - b.getTime())[0], // Use earliest timestamp
    location: urbanArea,
    count: data.count,
    coordinates: data.coordinates
  })).sort((a, b) => b.count - a.count); // Sort by count descending
}

/**
 * Extracts urban area or city name from location string
 * Handles common location formats like "Park Name, City" or "City, State"
 */
export function extractUrbanArea(location: string): string {
  if (!location || typeof location !== 'string') {
    return 'Unknown';
  }

  const trimmed = location.trim();
  
  // Handle formats like "Central Park, NYC" or "Golden Gate Park, San Francisco"
  const parts = trimmed.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // Return the city part (second element)
    return parts[1];
  }
  
  // If no comma, try to extract city from common patterns
  // Handle formats like "NYC Central Park" or "San Francisco Marina"
  const cityPatterns = [
    /^(NYC|New York City|Manhattan|Brooklyn|Queens|Bronx|Staten Island)/i,
    /^(San Francisco|SF)/i,
    /^(Los Angeles|LA)/i,
    /^(Chicago)/i,
    /^(Boston)/i,
    /^(Seattle)/i,
    /^(Portland)/i,
    /^(Denver)/i,
    /^(Austin)/i,
    /^(Miami)/i
  ];

  for (const pattern of cityPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If no pattern matches, return the first word as potential city
  const firstWord = trimmed.split(' ')[0];
  return firstWord || 'Unknown';
}

/**
 * Filters pigeon data by geographic region
 */
export function filterPigeonByRegion(
  sightings: PigeonSighting[],
  regions: string[]
): PigeonSighting[] {
  if (regions.length === 0) return sightings;
  
  return sightings.filter(sighting => 
    regions.some(region => 
      sighting.location.toLowerCase().includes(region.toLowerCase())
    )
  );
}

/**
 * Filters crypto data by symbols
 */
export function filterCryptoBySymbols(
  pricePoints: CryptoPricePoint[],
  symbols: string[]
): CryptoPricePoint[] {
  if (symbols.length === 0) return pricePoints;
  
  const normalizedSymbols = symbols.map(s => s.toLowerCase());
  return pricePoints.filter(point => 
    normalizedSymbols.includes(point.symbol.toLowerCase())
  );
}

/**
 * Interpolates missing data points using linear interpolation
 */
export function interpolateMissingData<T extends { timestamp: Date; [key: string]: any }>(
  data: T[],
  valueKey: string,
  bucket: TimeBucket
): T[] {
  if (data.length < 2) return data;

  const sortedData = [...data].sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  );

  const interpolated: T[] = [];
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    interpolated.push(sortedData[i]);
    
    const current = sortedData[i];
    const next = sortedData[i + 1];
    const timeDiff = next.timestamp.getTime() - current.timestamp.getTime();
    
    // If there's a gap larger than the bucket size, interpolate
    if (timeDiff > bucket) {
      const steps = Math.floor(timeDiff / bucket);
      const valueStep = (next[valueKey] - current[valueKey]) / (steps + 1);
      
      for (let step = 1; step <= steps; step++) {
        const interpolatedTime = new Date(current.timestamp.getTime() + (step * bucket));
        const interpolatedValue = current[valueKey] + (valueStep * step);
        
        interpolated.push({
          ...current,
          timestamp: interpolatedTime,
          [valueKey]: interpolatedValue
        } as T);
      }
    }
  }
  
  interpolated.push(sortedData[sortedData.length - 1]);
  return interpolated;
}

/**
 * Calculates basic statistics for a dataset
 */
export interface DataStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  count: number;
}

export function calculateStatistics(values: number[]): DataStatistics {
  if (values.length === 0) {
    return { mean: 0, median: 0, standardDeviation: 0, min: 0, max: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    standardDeviation,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: values.length
  };
}