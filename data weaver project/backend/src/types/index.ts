/**
 * Core data models and interfaces for the Pigeon-Crypto Dashboard
 * These types define the structure of data flowing through the system
 */

export interface PigeonSighting {
  timestamp: Date;
  location: string;
  count: number;
  coordinates?: { lat: number; lng: number };
}

export interface CryptoPricePoint {
  timestamp: Date;
  symbol: string;
  price: number;
  volume?: number;
  marketCap?: number;
}

export interface CorrelationResult {
  coefficient: number;
  pValue: number;
  timeRange: { start: Date; end: Date };
  significance: 'high' | 'medium' | 'low' | 'none';
}

export interface DashboardData {
  pigeonData: PigeonSighting[];
  cryptoData: CryptoPricePoint[];
  correlations: CorrelationResult[];
  metadata: {
    lastUpdated: Date;
    dataQuality: 'real' | 'mock' | 'mixed';
  };
}

// WebSocket message types for real-time updates
export interface WebSocketMessage {
  type: 'pigeon-update' | 'crypto-update' | 'correlation-update';
  data: PigeonSighting | CryptoPricePoint | CorrelationResult;
}

// API request/response types
export interface DashboardDataRequest {
  timeRange?: string;
  crypto?: string;
  region?: string;
}

export interface UserPreferences {
  selectedCryptocurrencies: string[];
  timeRange: string;
  selectedRegions: string[];
  chartType: 'line' | 'area' | 'candlestick';
  theme: 'light' | 'dark';
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}