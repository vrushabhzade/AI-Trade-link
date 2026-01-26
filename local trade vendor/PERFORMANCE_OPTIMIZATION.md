# TradeLink Performance Optimization Guide

This document outlines the performance optimizations implemented in the TradeLink marketplace platform.

## Database Optimizations

### Indexes Added (Migration 004)

#### User Table Indexes
- `idx_users_email` - Fast email lookups for authentication
- `idx_users_role` - Quick filtering by user role
- `idx_users_created_at` - Efficient sorting by registration date

#### Vendor Table Indexes
- `idx_vendors_user_id` - Fast vendor profile lookups
- `idx_vendors_verified` - Filter verified vendors
- `idx_vendors_rating` - Sort vendors by rating
- Spatial index on `location` field (from migration 002)

#### Product Table Indexes
- `idx_products_vendor_id` - Fast vendor product queries
- `idx_products_category` - Category filtering
- `idx_products_is_active` - Active product filtering
- `idx_products_base_price` - Price range queries
- `idx_products_created_at` - Sort by creation date
- `idx_products_active_category` - Composite index for active products by category
- `idx_products_vendor_active` - Composite index for vendor's active products
- GIN indexes on JSONB columns for multilingual search

#### Negotiation Table Indexes
- `idx_negotiations_product_id` - Product negotiation lookups
- `idx_negotiations_buyer_id` - Buyer negotiation queries
- `idx_negotiations_vendor_id` - Vendor negotiation queries
- `idx_negotiations_status` - Status filtering
- `idx_negotiations_buyer_status` - Composite index for buyer's negotiations by status
- `idx_negotiations_vendor_status` - Composite index for vendor's negotiations by status
- `idx_negotiations_active` - Partial index for active negotiations

#### Message Table Indexes
- `idx_messages_negotiation_id` - Chat history queries
- `idx_messages_sender_id` - User message history
- `idx_messages_negotiation_time` - Composite index for ordered chat messages
- GIN index on `translations` JSONB field

#### Transaction Table Indexes
- `idx_transactions_buyer_id` - Buyer transaction history
- `idx_transactions_vendor_id` - Vendor transaction history
- `idx_transactions_status` - Status filtering
- `idx_transactions_payment_status` - Payment status queries
- `idx_transactions_delivery_status` - Delivery tracking
- `idx_transactions_buyer_status` - Composite index for buyer transactions by status
- `idx_transactions_vendor_status` - Composite index for vendor transactions by status
- `idx_transactions_pending` - Partial index for pending transactions

### Query Optimization Patterns

#### Cursor-Based Pagination
Use cursor-based pagination instead of offset-based for better performance on large datasets:

```typescript
import { createPaginationQuery, processPaginatedResults } from './utils/queryOptimization';

const query = createPaginationQuery({ cursor: lastId, take: 20 });
const results = await prisma.product.findMany(query);
const paginated = processPaginatedResults(results, 20);
```

#### Batch Loading (N+1 Prevention)
Use DataLoader pattern to prevent N+1 queries:

```typescript
import { createVendorLoader, createProductLoader } from './utils/queryOptimization';

const vendorLoader = createVendorLoader(prisma);
const vendors = await vendorLoader.loadMany(vendorIds);
```

#### Approximate Counts
For large tables, use approximate counts instead of exact counts:

```typescript
import { getApproximateCount } from './utils/queryOptimization';

const approxCount = await getApproximateCount(prisma, 'products');
```

## Caching Strategy

### Redis Caching Service

The `CacheService` provides a comprehensive caching layer:

```typescript
import { cacheService, CacheKeys, CacheTTL } from './services/cacheService';

// Cache product data
await cacheService.set(
  CacheKeys.product(productId),
  productData,
  CacheTTL.MEDIUM
);

// Get or set pattern
const product = await cacheService.getOrSet(
  CacheKeys.product(productId),
  () => fetchProductFromDB(productId),
  CacheTTL.MEDIUM
);
```

### Cache Keys and TTL

- **SHORT (1 min)**: Real-time data (online users, active negotiations)
- **MEDIUM (5 min)**: Frequently changing data (product listings, search results)
- **LONG (30 min)**: Semi-static data (vendor profiles, categories)
- **VERY_LONG (1 hour)**: Static data (translations, market data)
- **DAY (24 hours)**: Rarely changing data (system configuration)

### Cache Invalidation

Invalidate cache when data changes:

```typescript
// Invalidate specific product
await cacheService.delete(CacheKeys.product(productId));

// Invalidate all vendor products
await cacheService.deletePattern(CacheKeys.vendorProducts('*'));
```

## Image Optimization

### Image Optimization Service

The `ImageOptimizationService` handles image compression and optimization:

```typescript
import { imageOptimizationService } from './services/imageOptimizationService';

// Optimize single image
const result = await imageOptimizationService.optimizeImage(inputPath, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'jpeg',
  generateThumbnail: true,
});

// Convert to WebP for better compression
const webpPath = await imageOptimizationService.convertToWebP(inputPath, 80);

// Generate responsive sizes
const sizes = await imageOptimizationService.generateResponsiveSizes(inputPath);
```

### Image Optimization Best Practices

1. **Upload**: Accept original images from users
2. **Process**: Automatically optimize and generate thumbnails
3. **Store**: Save optimized versions and thumbnails
4. **Serve**: Deliver appropriate size based on device
5. **CDN**: Use CDN for image delivery (recommended)

### Recommended Image Sizes

- **Thumbnail**: 300x300px, 70% quality
- **Mobile**: 640px width, 80% quality
- **Tablet**: 1024px width, 80% quality
- **Desktop**: 1920px width, 80% quality

## Frontend Optimizations

### Code Splitting and Lazy Loading

Use lazy loading with retry logic:

```typescript
import { lazyWithRetry } from './utils/performanceOptimization';

const ProductsPage = lazyWithRetry(() => import('./pages/ProductsPage'));
const ChatPage = lazyWithRetry(() => import('./pages/ChatPage'));
```

### Debouncing and Throttling

Optimize search and scroll events:

```typescript
import { debounce, throttle } from './utils/performanceOptimization';

// Debounce search input
const debouncedSearch = debounce(handleSearch, 300);

// Throttle scroll events
const throttledScroll = throttle(handleScroll, 100);
```

### Image Lazy Loading

Use Intersection Observer for lazy loading:

```typescript
import { imageLazyLoader } from './utils/performanceOptimization';

// In component
useEffect(() => {
  const img = imgRef.current;
  if (img) {
    imageLazyLoader.observe(img);
  }
}, []);
```

### Local Storage Caching

Cache API responses locally:

```typescript
import { cachedStorage } from './utils/performanceOptimization';

// Cache with expiration
cachedStorage.set('products', products, 5); // 5 minutes

// Retrieve cached data
const cached = cachedStorage.get<Product[]>('products');
```

### Request Deduplication

Prevent duplicate API calls:

```typescript
import { requestDeduplicator } from './utils/performanceOptimization';

const data = await requestDeduplicator.deduplicate(
  'products-list',
  () => fetchProducts()
);
```

## Build Optimizations

### Vite Configuration

The Vite config includes:

1. **Code Splitting**: Separate vendor chunks for better caching
2. **Minification**: Terser minification with console removal
3. **Tree Shaking**: Remove unused code
4. **Dependency Pre-bundling**: Faster dev server startup

### Bundle Analysis

Run bundle analysis to identify optimization opportunities:

```bash
npm run build -- --mode analyze
```

## Performance Monitoring

### Query Performance Monitoring

Monitor slow queries:

```typescript
import { queryMonitor } from './utils/queryOptimization';

const products = await queryMonitor.monitor(
  'fetch-products',
  () => prisma.product.findMany()
);
```

### Frontend Performance Monitoring

Track component render times:

```typescript
import { performanceMonitor } from './utils/performanceOptimization';

performanceMonitor.mark('component-mount');
// ... component logic
performanceMonitor.measure('Component Render', 'component-mount');
```

## Performance Benchmarks

### Target Metrics

- **API Response Time**: < 200ms (95th percentile)
- **Translation Latency**: < 500ms
- **WebSocket Message Delivery**: < 100ms
- **Database Query Time**: < 50ms for product searches
- **Image Upload Processing**: < 2 seconds
- **Page Load Time**: < 3 seconds (First Contentful Paint)
- **Time to Interactive**: < 5 seconds

### Monitoring Tools

1. **Backend**: Query monitoring, Redis monitoring
2. **Frontend**: Lighthouse, Web Vitals
3. **Database**: PostgreSQL slow query log
4. **Infrastructure**: Application Performance Monitoring (APM)

## Best Practices

### Database

1. Always use indexes for frequently queried columns
2. Use composite indexes for multi-column queries
3. Implement cursor-based pagination for large datasets
4. Use batch loading to prevent N+1 queries
5. Monitor and optimize slow queries

### Caching

1. Cache frequently accessed data
2. Set appropriate TTL based on data volatility
3. Invalidate cache when data changes
4. Use cache warming for critical data
5. Monitor cache hit rates

### Images

1. Always optimize images before serving
2. Generate multiple sizes for responsive design
3. Use WebP format when supported
4. Implement lazy loading for images
5. Use CDN for image delivery

### Frontend

1. Implement code splitting and lazy loading
2. Debounce user input events
3. Throttle scroll and resize events
4. Use virtual scrolling for large lists
5. Minimize bundle size

### API

1. Implement request deduplication
2. Use compression (gzip/brotli)
3. Implement rate limiting
4. Use HTTP/2 when possible
5. Optimize payload size

## Troubleshooting

### Slow Queries

1. Check query execution plan: `EXPLAIN ANALYZE`
2. Verify indexes are being used
3. Consider adding composite indexes
4. Use approximate counts for large tables

### Cache Issues

1. Verify Redis connection
2. Check cache hit rates
3. Ensure proper cache invalidation
4. Monitor memory usage

### Image Loading

1. Verify image optimization is working
2. Check CDN configuration
3. Monitor image sizes
4. Ensure lazy loading is active

### Bundle Size

1. Run bundle analysis
2. Check for duplicate dependencies
3. Implement code splitting
4. Remove unused dependencies

## Future Optimizations

1. **CDN Integration**: Implement CDN for static assets
2. **Service Workers**: Add offline support and caching
3. **HTTP/2 Server Push**: Push critical resources
4. **Database Sharding**: For horizontal scaling
5. **Read Replicas**: Separate read and write operations
6. **GraphQL**: Reduce over-fetching
7. **Edge Computing**: Deploy to edge locations
8. **Compression**: Implement Brotli compression
