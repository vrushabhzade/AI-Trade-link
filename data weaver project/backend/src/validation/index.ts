/**
 * Data validation functions for all models
 * Ensures data integrity and type safety throughout the system
 */

import type { 
  PigeonSighting, 
  CryptoPricePoint, 
  CorrelationResult, 
  DashboardData,
  UserPreferences 
} from '../types/index';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a PigeonSighting object
 */
export function validatePigeonSighting(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate timestamp
  if (!data.timestamp) {
    errors.push('timestamp is required');
  } else if (!(data.timestamp instanceof Date) && !isValidDateString(data.timestamp)) {
    errors.push('timestamp must be a valid Date or date string');
  }

  // Validate location
  if (!data.location || typeof data.location !== 'string') {
    errors.push('location must be a non-empty string');
  }

  // Validate count
  if (typeof data.count !== 'number' || data.count < 0 || !Number.isInteger(data.count)) {
    errors.push('count must be a non-negative integer');
  }

  // Validate optional coordinates
  if (data.coordinates !== undefined) {
    if (!data.coordinates || typeof data.coordinates !== 'object') {
      errors.push('coordinates must be an object with lat and lng properties');
    } else {
      if (typeof data.coordinates.lat !== 'number' || 
          data.coordinates.lat < -90 || data.coordinates.lat > 90) {
        errors.push('coordinates.lat must be a number between -90 and 90');
      }
      if (typeof data.coordinates.lng !== 'number' || 
          data.coordinates.lng < -180 || data.coordinates.lng > 180) {
        errors.push('coordinates.lng must be a number between -180 and 180');
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a CryptoPricePoint object
 */
export function validateCryptoPricePoint(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate timestamp
  if (!data.timestamp) {
    errors.push('timestamp is required');
  } else if (!(data.timestamp instanceof Date) && !isValidDateString(data.timestamp)) {
    errors.push('timestamp must be a valid Date or date string');
  }

  // Validate symbol
  if (!data.symbol || typeof data.symbol !== 'string') {
    errors.push('symbol must be a non-empty string');
  }

  // Validate price
  if (typeof data.price !== 'number' || data.price < 0 || !isFinite(data.price)) {
    errors.push('price must be a positive finite number');
  }

  // Validate optional volume
  if (data.volume !== undefined) {
    if (typeof data.volume !== 'number' || data.volume < 0 || !isFinite(data.volume)) {
      errors.push('volume must be a non-negative finite number');
    }
  }

  // Validate optional marketCap
  if (data.marketCap !== undefined) {
    if (typeof data.marketCap !== 'number' || data.marketCap < 0 || !isFinite(data.marketCap)) {
      errors.push('marketCap must be a non-negative finite number');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a CorrelationResult object
 */
export function validateCorrelationResult(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate coefficient
  if (typeof data.coefficient !== 'number' || 
      data.coefficient < -1 || data.coefficient > 1 || !isFinite(data.coefficient)) {
    errors.push('coefficient must be a finite number between -1 and 1');
  }

  // Validate pValue
  if (typeof data.pValue !== 'number' || 
      data.pValue < 0 || data.pValue > 1 || !isFinite(data.pValue)) {
    errors.push('pValue must be a finite number between 0 and 1');
  }

  // Validate timeRange
  if (!data.timeRange || typeof data.timeRange !== 'object') {
    errors.push('timeRange is required and must be an object');
  } else {
    if (!data.timeRange.start) {
      errors.push('timeRange.start is required');
    } else if (!(data.timeRange.start instanceof Date) && !isValidDateString(data.timeRange.start)) {
      errors.push('timeRange.start must be a valid Date or date string');
    }

    if (!data.timeRange.end) {
      errors.push('timeRange.end is required');
    } else if (!(data.timeRange.end instanceof Date) && !isValidDateString(data.timeRange.end)) {
      errors.push('timeRange.end must be a valid Date or date string');
    }

    // Check that end is after start
    if (data.timeRange.start && data.timeRange.end) {
      const start = new Date(data.timeRange.start);
      const end = new Date(data.timeRange.end);
      if (start >= end) {
        errors.push('timeRange.end must be after timeRange.start');
      }
    }
  }

  // Validate significance
  const validSignificance = ['high', 'medium', 'low', 'none'];
  if (!validSignificance.includes(data.significance)) {
    errors.push('significance must be one of: high, medium, low, none');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a DashboardData object
 */
export function validateDashboardData(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate pigeonData array
  if (!Array.isArray(data.pigeonData)) {
    errors.push('pigeonData must be an array');
  } else {
    data.pigeonData.forEach((item: any, index: number) => {
      const validation = validatePigeonSighting(item);
      if (!validation.isValid) {
        errors.push(`pigeonData[${index}]: ${validation.errors.join(', ')}`);
      }
    });
  }

  // Validate cryptoData array
  if (!Array.isArray(data.cryptoData)) {
    errors.push('cryptoData must be an array');
  } else {
    data.cryptoData.forEach((item: any, index: number) => {
      const validation = validateCryptoPricePoint(item);
      if (!validation.isValid) {
        errors.push(`cryptoData[${index}]: ${validation.errors.join(', ')}`);
      }
    });
  }

  // Validate correlations array
  if (!Array.isArray(data.correlations)) {
    errors.push('correlations must be an array');
  } else {
    data.correlations.forEach((item: any, index: number) => {
      const validation = validateCorrelationResult(item);
      if (!validation.isValid) {
        errors.push(`correlations[${index}]: ${validation.errors.join(', ')}`);
      }
    });
  }

  // Validate metadata
  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('metadata is required and must be an object');
  } else {
    if (!data.metadata.lastUpdated) {
      errors.push('metadata.lastUpdated is required');
    } else if (!(data.metadata.lastUpdated instanceof Date) && !isValidDateString(data.metadata.lastUpdated)) {
      errors.push('metadata.lastUpdated must be a valid Date or date string');
    }

    const validDataQuality = ['real', 'mock', 'mixed'];
    if (!validDataQuality.includes(data.metadata.dataQuality)) {
      errors.push('metadata.dataQuality must be one of: real, mock, mixed');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates UserPreferences object
 */
export function validateUserPreferences(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data must be an object'] };
  }

  // Validate selectedCryptocurrencies
  if (!Array.isArray(data.selectedCryptocurrencies)) {
    errors.push('selectedCryptocurrencies must be an array');
  } else {
    data.selectedCryptocurrencies.forEach((crypto: any, index: number) => {
      if (typeof crypto !== 'string' || crypto.trim() === '') {
        errors.push(`selectedCryptocurrencies[${index}] must be a non-empty string`);
      }
    });
  }

  // Validate timeRange
  if (!data.timeRange || typeof data.timeRange !== 'string') {
    errors.push('timeRange must be a non-empty string');
  }

  // Validate selectedRegions
  if (!Array.isArray(data.selectedRegions)) {
    errors.push('selectedRegions must be an array');
  } else {
    data.selectedRegions.forEach((region: any, index: number) => {
      if (typeof region !== 'string' || region.trim() === '') {
        errors.push(`selectedRegions[${index}] must be a non-empty string`);
      }
    });
  }

  // Validate chartType
  const validChartTypes = ['line', 'area', 'candlestick'];
  if (!validChartTypes.includes(data.chartType)) {
    errors.push('chartType must be one of: line, area, candlestick');
  }

  // Validate theme
  const validThemes = ['light', 'dark'];
  if (!validThemes.includes(data.theme)) {
    errors.push('theme must be one of: light, dark');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Helper function to check if a string is a valid date
 */
function isValidDateString(dateString: any): boolean {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Sanitizes and normalizes data by converting date strings to Date objects
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    const sanitized = { ...data } as any;
    
    // Convert timestamp fields to Date objects
    if (sanitized.timestamp && typeof sanitized.timestamp === 'string') {
      sanitized.timestamp = new Date(sanitized.timestamp);
    }
    
    // Handle timeRange objects
    if (sanitized.timeRange) {
      if (sanitized.timeRange.start && typeof sanitized.timeRange.start === 'string') {
        sanitized.timeRange.start = new Date(sanitized.timeRange.start);
      }
      if (sanitized.timeRange.end && typeof sanitized.timeRange.end === 'string') {
        sanitized.timeRange.end = new Date(sanitized.timeRange.end);
      }
    }
    
    // Handle metadata.lastUpdated
    if (sanitized.metadata?.lastUpdated && typeof sanitized.metadata.lastUpdated === 'string') {
      sanitized.metadata.lastUpdated = new Date(sanitized.metadata.lastUpdated);
    }
    
    return sanitized;
  }
  
  return data;
}