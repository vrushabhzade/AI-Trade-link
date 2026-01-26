/**
 * Query Optimization Utilities for TradeLink Marketplace
 * Provides optimized database query patterns
 * Requirements: System performance optimization
 */

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Pagination helper with cursor-based pagination for better performance
 */
export interface PaginationOptions {
  cursor?: string;
  take?: number;
  skip?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

/**
 * Create optimized pagination query
 */
export function createPaginationQuery<T extends { id: string }>(
  options: PaginationOptions
): Prisma.SelectSubset<any, any> {
  const { cursor, take = 20, skip = 0 } = options;

  const query: any = {
    take: take + 1, // Fetch one extra to check if there are more
    skip: cursor ? 1 : skip, // Skip cursor itself
  };

  if (cursor) {
    query.cursor = { id: cursor };
  }

  return query;
}

/**
 * Process paginated results
 */
export function processPaginatedResults<T extends { id: string }>(
  results: T[],
  take: number
): PaginatedResult<T> {
  const hasMore = results.length > take;
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

  return {
    data,
    nextCursor,
    hasMore,
  };
}

/**
 * Optimized product search query with proper indexing
 */
export function buildProductSearchQuery(params: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: string;
  isActive?: boolean;
  language: string;
}): Prisma.ProductWhereInput {
  const { query, category, minPrice, maxPrice, vendorId, isActive = true } = params;

  const where: Prisma.ProductWhereInput = {
    isActive,
  };

  if (vendorId) {
    where.vendorId = vendorId;
  }

  if (category) {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {};
    if (minPrice !== undefined) {
      where.basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.basePrice.lte = maxPrice;
    }
  }

  // Multilingual search using JSONB
  if (query) {
    where.OR = [
      {
        name: {
          path: ['en'],
          string_contains: query,
        },
      },
      {
        name: {
          path: ['es'],
          string_contains: query,
        },
      },
      {
        name: {
          path: ['hi'],
          string_contains: query,
        },
      },
      {
        description: {
          path: ['en'],
          string_contains: query,
        },
      },
    ];
  }

  return where;
}

/**
 * Optimized negotiation query with proper joins
 */
export function buildNegotiationQuery(params: {
  userId: string;
  userRole: 'buyer' | 'vendor';
  status?: string;
  includeProduct?: boolean;
  includeMessages?: boolean;
}): any {
  const { userId, userRole, status, includeProduct = true, includeMessages = false } = params;

  const where: any = {};
  
  if (userRole === 'buyer') {
    where.buyerId = userId;
  } else {
    where.vendorId = userId;
  }

  if (status) {
    where.status = status;
  }

  const include: any = {};

  if (includeProduct) {
    include.product = {
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        currency: true,
        images: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            rating: true,
          },
        },
      },
    };
  }

  if (includeMessages) {
    include.messages = {
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit messages for performance
    };
  }

  return { where, include };
}

/**
 * Batch loading helper to prevent N+1 queries
 */
export class DataLoader<K, V> {
  private cache: Map<K, Promise<V>>;
  private batchLoadFn: (keys: K[]) => Promise<V[]>;
  private maxBatchSize: number;

  constructor(
    batchLoadFn: (keys: K[]) => Promise<V[]>,
    options: { maxBatchSize?: number } = {}
  ) {
    this.cache = new Map();
    this.batchLoadFn = batchLoadFn;
    this.maxBatchSize = options.maxBatchSize || 100;
  }

  async load(key: K): Promise<V> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const promise = this.batchLoadFn([key]).then((results) => results[0]);
    this.cache.set(key, promise);
    return promise;
  }

  async loadMany(keys: K[]): Promise<V[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  clear(key: K): void {
    this.cache.delete(key);
  }

  clearAll(): void {
    this.cache.clear();
  }
}

/**
 * Create vendor data loader for batch loading
 */
export function createVendorLoader(prisma: PrismaClient) {
  return new DataLoader<string, any>(async (vendorIds) => {
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds as string[] } },
      select: {
        id: true,
        businessName: true,
        rating: true,
        verified: true,
        avatarUrl: true,
      },
    });

    // Map results back to original order
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    return vendorIds.map((id) => vendorMap.get(id as string));
  });
}

/**
 * Create product data loader for batch loading
 */
export function createProductLoader(prisma: PrismaClient) {
  return new DataLoader<string, any>(async (productIds) => {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds as string[] } },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            rating: true,
          },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return productIds.map((id) => productMap.get(id as string));
  });
}

/**
 * Optimized transaction query with aggregations
 */
export function buildTransactionStatsQuery(params: {
  userId: string;
  userRole: 'buyer' | 'vendor';
  startDate?: Date;
  endDate?: Date;
}): Prisma.TransactionWhereInput {
  const { userId, userRole, startDate, endDate } = params;

  const where: Prisma.TransactionWhereInput = {};

  if (userRole === 'buyer') {
    where.buyerId = userId;
  } else {
    where.vendorId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  return where;
}

/**
 * Efficient count query with caching hint
 */
export async function getApproximateCount(
  prisma: PrismaClient,
  model: string
): Promise<number> {
  // For large tables, use approximate count from pg_class
  // This is much faster than COUNT(*) for large tables
  try {
    const result = await prisma.$queryRaw<Array<{ estimate: number }>>`
      SELECT reltuples::bigint AS estimate
      FROM pg_class
      WHERE relname = ${model}
    `;
    return result[0]?.estimate || 0;
  } catch (error) {
    console.error('Error getting approximate count:', error);
    return 0;
  }
}

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private slowQueryThreshold: number;

  constructor(slowQueryThreshold: number = 1000) {
    this.slowQueryThreshold = slowQueryThreshold;
  }

  async monitor<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      if (duration > this.slowQueryThreshold) {
        console.warn(`⚠️ Slow query detected: ${queryName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Query failed: ${queryName} after ${duration}ms`, error);
      throw error;
    }
  }
}

// Singleton query monitor
export const queryMonitor = new QueryMonitor();
