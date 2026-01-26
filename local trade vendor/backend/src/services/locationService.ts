import { prisma } from '../config/database';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  location: LocationPoint;
  distance: number; // in meters
  type: 'vendor' | 'product';
}

export interface NearbyVendorsOptions {
  center: LocationPoint;
  radiusKm: number;
  limit?: number;
  category?: string;
  minRating?: number;
  languages?: string[];
}

export interface NearbyProductsOptions {
  center: LocationPoint;
  radiusKm: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
}

export class LocationService {
  /**
   * Find vendors within a specified radius of a location
   */
  async findNearbyVendors(options: NearbyVendorsOptions): Promise<any[]> {
    const { center, radiusKm, limit = 50, category, minRating, languages } = options;
    
    let whereClause = `
      WHERE ST_DWithin(
        v.location, 
        ST_Point($1, $2), 
        $3
      )
      AND v.location IS NOT NULL
    `;
    
    const params: any[] = [center.longitude, center.latitude, radiusKm * 1000]; // Convert km to meters
    let paramIndex = 4;

    if (minRating !== undefined) {
      whereClause += ` AND v.rating >= $${paramIndex}`;
      params.push(minRating);
      paramIndex++;
    }

    if (languages && languages.length > 0) {
      whereClause += ` AND v.languages && $${paramIndex}::text[]`;
      params.push(languages);
      paramIndex++;
    }

    // If category is specified, filter by vendors who have products in that category
    let categoryJoin = '';
    if (category) {
      categoryJoin = `
        JOIN products p ON v.id = p.vendor_id AND p.category = $${paramIndex} AND p.is_active = true
      `;
      params.push(category);
      paramIndex++;
      whereClause += ` GROUP BY v.id, v.user_id, v.business_name, v.description, v.address, v.location, v.languages, v.verified, v.rating, v.total_sales, v.avatar_url, v.banner_url, v.created_at, u.full_name, u.email, u.preferred_language, distance`;
    }

    const query = `
      SELECT 
        v.*,
        u.full_name,
        u.email,
        u.preferred_language,
        ST_Distance(v.location, ST_Point($1, $2)) as distance,
        ST_X(v.location) as longitude,
        ST_Y(v.location) as latitude
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      ${categoryJoin}
      ${whereClause}
      ORDER BY distance ASC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    return prisma.$queryRawUnsafe(query, ...params);
  }

  /**
   * Find products within a specified radius of a location
   */
  async findNearbyProducts(options: NearbyProductsOptions): Promise<any[]> {
    const { center, radiusKm, limit = 50, category, subcategory, minPrice, maxPrice, query } = options;
    
    let whereClause = `
      WHERE ST_DWithin(
        v.location, 
        ST_Point($1, $2), 
        $3
      )
      AND v.location IS NOT NULL
      AND p.is_active = true
    `;
    
    const params: any[] = [center.longitude, center.latitude, radiusKm * 1000]; // Convert km to meters
    let paramIndex = 4;

    if (category) {
      whereClause += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      whereClause += ` AND p.subcategory = $${paramIndex}`;
      params.push(subcategory);
      paramIndex++;
    }

    if (minPrice !== undefined) {
      whereClause += ` AND p.base_price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined) {
      whereClause += ` AND p.base_price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    if (query) {
      whereClause += ` AND (
        p.name::text ILIKE $${paramIndex} OR 
        p.description::text ILIKE $${paramIndex}
      )`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    const sqlQuery = `
      SELECT 
        p.*,
        v.business_name,
        v.rating as vendor_rating,
        v.verified as vendor_verified,
        u.full_name as vendor_name,
        ST_Distance(v.location, ST_Point($1, $2)) as distance,
        ST_X(v.location) as vendor_longitude,
        ST_Y(v.location) as vendor_latitude
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      ${whereClause}
      ORDER BY distance ASC, p.created_at DESC
      LIMIT $${paramIndex}
    `;

    params.push(limit);

    return prisma.$queryRawUnsafe(sqlQuery, ...params);
  }

  /**
   * Calculate distance between two points in kilometers
   */
  async calculateDistance(point1: LocationPoint, point2: LocationPoint): Promise<number> {
    const query = `
      SELECT ST_Distance(
        ST_Point($1, $2),
        ST_Point($3, $4)
      ) as distance
    `;

    const result = await prisma.$queryRawUnsafe(query, 
      point1.longitude, point1.latitude,
      point2.longitude, point2.latitude
    ) as any[];

    return result[0]?.distance ? Math.round(result[0].distance / 1000 * 100) / 100 : 0; // Convert to km and round to 2 decimals
  }

  /**
   * Get vendors within a polygon area (for complex geographic boundaries)
   */
  async findVendorsInPolygon(polygonCoordinates: LocationPoint[]): Promise<any[]> {
    if (polygonCoordinates.length < 3) {
      throw new Error('Polygon must have at least 3 points');
    }

    // Create WKT polygon string
    const coordinateString = polygonCoordinates
      .map(point => `${point.longitude} ${point.latitude}`)
      .join(', ');
    const polygonWKT = `POLYGON((${coordinateString}, ${polygonCoordinates[0].longitude} ${polygonCoordinates[0].latitude}))`;

    const query = `
      SELECT 
        v.*,
        u.full_name,
        u.email,
        u.preferred_language,
        ST_X(v.location) as longitude,
        ST_Y(v.location) as latitude
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE ST_Within(v.location, ST_GeomFromText($1, 4326))
      AND v.location IS NOT NULL
      ORDER BY v.rating DESC, v.total_sales DESC
    `;

    return prisma.$queryRawUnsafe(query, polygonWKT);
  }

  /**
   * Get the closest vendor to a given location
   */
  async findClosestVendor(location: LocationPoint, category?: string): Promise<any | null> {
    let categoryClause = '';
    const params: any[] = [location.longitude, location.latitude];

    if (category) {
      categoryClause = `
        JOIN products p ON v.id = p.vendor_id 
        WHERE p.category = $3 AND p.is_active = true
        GROUP BY v.id, v.user_id, v.business_name, v.description, v.address, v.location, v.languages, v.verified, v.rating, v.total_sales, v.avatar_url, v.banner_url, v.created_at, u.full_name, u.email, u.preferred_language, distance
      `;
      params.push(category);
    } else {
      categoryClause = 'WHERE v.location IS NOT NULL';
    }

    const query = `
      SELECT 
        v.*,
        u.full_name,
        u.email,
        u.preferred_language,
        ST_Distance(v.location, ST_Point($1, $2)) as distance,
        ST_X(v.location) as longitude,
        ST_Y(v.location) as latitude
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      ${categoryClause}
      ORDER BY distance ASC
      LIMIT 1
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params) as any[];
    return result[0] || null;
  }

  /**
   * Get location statistics for a vendor (average distance to customers, coverage area, etc.)
   */
  async getVendorLocationStats(vendorId: string): Promise<{
    totalNegotiations: number;
    averageDistanceToCustomers: number | null;
    maxDistanceToCustomer: number | null;
    coverageAreaKm: number | null;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_negotiations,
        AVG(ST_Distance(v.location, ST_Point(
          CAST(u.location->>'coordinates'->0 AS FLOAT),
          CAST(u.location->>'coordinates'->1 AS FLOAT)
        ))) as avg_distance,
        MAX(ST_Distance(v.location, ST_Point(
          CAST(u.location->>'coordinates'->0 AS FLOAT),
          CAST(u.location->>'coordinates'->1 AS FLOAT)
        ))) as max_distance
      FROM negotiations n
      JOIN vendors v ON n.vendor_id = v.id
      JOIN users u ON n.buyer_id = u.id
      WHERE v.id = $1 
      AND v.location IS NOT NULL
      AND u.location IS NOT NULL
      AND u.location->>'coordinates' IS NOT NULL
    `;

    const result = await prisma.$queryRawUnsafe(query, vendorId) as any[];
    const stats = result[0];

    return {
      totalNegotiations: parseInt(stats?.total_negotiations || '0'),
      averageDistanceToCustomers: stats?.avg_distance ? Math.round(stats.avg_distance / 1000 * 100) / 100 : null,
      maxDistanceToCustomer: stats?.max_distance ? Math.round(stats.max_distance / 1000 * 100) / 100 : null,
      coverageAreaKm: stats?.max_distance ? Math.round(Math.PI * Math.pow(stats.max_distance / 1000, 2) * 100) / 100 : null,
    };
  }

  /**
   * Update vendor location
   */
  async updateVendorLocation(vendorId: string, location: LocationPoint): Promise<void> {
    const query = `
      UPDATE vendors 
      SET location = ST_Point($1, $2)
      WHERE id = $3
    `;

    await prisma.$executeRawUnsafe(query, location.longitude, location.latitude, vendorId);
  }

  /**
   * Get popular areas (areas with high vendor density)
   */
  async getPopularAreas(center: LocationPoint, radiusKm: number, gridSizeKm: number = 1): Promise<any[]> {
    // This creates a grid and counts vendors in each grid cell
    const query = `
      WITH grid AS (
        SELECT 
          generate_series(
            FLOOR(($1 - $3/111.0) / ($4/111.0)) * ($4/111.0),
            CEIL(($1 + $3/111.0) / ($4/111.0)) * ($4/111.0),
            $4/111.0
          ) as lng,
          generate_series(
            FLOOR(($2 - $3/111.0) / ($4/111.0)) * ($4/111.0),
            CEIL(($2 + $3/111.0) / ($4/111.0)) * ($4/111.0),
            $4/111.0
          ) as lat
      ),
      vendor_counts AS (
        SELECT 
          g.lng,
          g.lat,
          COUNT(v.id) as vendor_count,
          AVG(v.rating) as avg_rating
        FROM grid g
        LEFT JOIN vendors v ON ST_DWithin(
          v.location,
          ST_Point(g.lng, g.lat),
          $4 * 1000 / 2
        )
        WHERE ST_DWithin(
          ST_Point(g.lng, g.lat),
          ST_Point($1, $2),
          $3 * 1000
        )
        GROUP BY g.lng, g.lat
        HAVING COUNT(v.id) > 0
      )
      SELECT 
        lng as longitude,
        lat as latitude,
        vendor_count,
        COALESCE(avg_rating, 0) as average_rating
      FROM vendor_counts
      ORDER BY vendor_count DESC, avg_rating DESC
      LIMIT 20
    `;

    return prisma.$queryRawUnsafe(query, 
      center.longitude, 
      center.latitude, 
      radiusKm, 
      gridSizeKm
    );
  }

  /**
   * Validate if a point is within service area
   */
  async isLocationServiced(location: LocationPoint, maxDistanceKm: number = 50): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM vendors v
        WHERE ST_DWithin(
          v.location,
          ST_Point($1, $2),
          $3
        )
        AND v.location IS NOT NULL
      ) as is_serviced
    `;

    const result = await prisma.$queryRawUnsafe(query, 
      location.longitude, 
      location.latitude, 
      maxDistanceKm * 1000
    ) as any[];

    return result[0]?.is_serviced || false;
  }
}

export const locationService = new LocationService();