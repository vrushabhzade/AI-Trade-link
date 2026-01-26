/**
 * Geospatial utility functions for location-based operations
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate bounding box for a given center point and radius
 * Returns coordinates that form a square around the center
 */
export function calculateBoundingBox(center: Coordinates, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.0; // Approximate km per degree latitude
  const lonDelta = radiusKm / (111.0 * Math.cos(toRadians(center.latitude))); // Adjust for latitude
  
  return {
    north: center.latitude + latDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lonDelta,
    west: center.longitude - lonDelta,
  };
}

/**
 * Check if a point is within a bounding box
 */
export function isPointInBoundingBox(point: Coordinates, bbox: BoundingBox): boolean {
  return (
    point.latitude >= bbox.south &&
    point.latitude <= bbox.north &&
    point.longitude >= bbox.west &&
    point.longitude <= bbox.east
  );
}

/**
 * Validate latitude and longitude values
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;
  
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(coordinates: Coordinates, precision: number = 6): string {
  const lat = coordinates.latitude.toFixed(precision);
  const lon = coordinates.longitude.toFixed(precision);
  const latDir = coordinates.latitude >= 0 ? 'N' : 'S';
  const lonDir = coordinates.longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lon))}°${lonDir}`;
}

/**
 * Calculate the center point of multiple coordinates
 */
export function calculateCenterPoint(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate center of empty coordinates array');
  }
  
  if (coordinates.length === 1) {
    return coordinates[0];
  }
  
  let totalLat = 0;
  let totalLon = 0;
  
  coordinates.forEach(coord => {
    totalLat += coord.latitude;
    totalLon += coord.longitude;
  });
  
  return {
    latitude: totalLat / coordinates.length,
    longitude: totalLon / coordinates.length,
  };
}

/**
 * Generate a random point within a given radius of a center point
 * Useful for testing and data generation
 */
export function generateRandomPointInRadius(center: Coordinates, radiusKm: number): Coordinates {
  const radiusInDegrees = radiusKm / 111.0;
  
  // Generate random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  // Calculate new coordinates
  const deltaLat = distance * Math.cos(angle);
  const deltaLon = distance * Math.sin(angle) / Math.cos(toRadians(center.latitude));
  
  return {
    latitude: center.latitude + deltaLat,
    longitude: center.longitude + deltaLon,
  };
}

/**
 * Convert PostGIS POINT string to coordinates object
 */
export function parsePostGISPoint(pointString: string): Coordinates | null {
  if (!pointString) return null;
  
  // PostGIS POINT format: "POINT(longitude latitude)"
  const match = pointString.match(/POINT\(([^)]+)\)/);
  if (!match) return null;
  
  const [lon, lat] = match[1].split(' ').map(Number);
  
  if (isNaN(lat) || isNaN(lon)) return null;
  
  return { latitude: lat, longitude: lon };
}

/**
 * Convert coordinates to PostGIS POINT string
 */
export function toPostGISPoint(coordinates: Coordinates): string {
  return `POINT(${coordinates.longitude} ${coordinates.latitude})`;
}

/**
 * Calculate the area of a polygon defined by coordinates (in square kilometers)
 */
export function calculatePolygonArea(coordinates: Coordinates[]): number {
  if (coordinates.length < 3) {
    return 0;
  }
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].longitude * coordinates[j].latitude;
    area -= coordinates[j].longitude * coordinates[i].latitude;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert from square degrees to square kilometers (approximate)
  const kmPerDegree = 111.0;
  return area * kmPerDegree * kmPerDegree;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  const { latitude: x, longitude: y } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * Get the closest point on a line segment to a given point
 */
export function getClosestPointOnLine(
  point: Coordinates,
  lineStart: Coordinates,
  lineEnd: Coordinates
): Coordinates {
  const A = point.latitude - lineStart.latitude;
  const B = point.longitude - lineStart.longitude;
  const C = lineEnd.latitude - lineStart.latitude;
  const D = lineEnd.longitude - lineStart.longitude;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return lineStart; // Line start and end are the same point
  }
  
  let param = dot / lenSq;
  
  if (param < 0) {
    return lineStart;
  } else if (param > 1) {
    return lineEnd;
  } else {
    return {
      latitude: lineStart.latitude + param * C,
      longitude: lineStart.longitude + param * D,
    };
  }
}