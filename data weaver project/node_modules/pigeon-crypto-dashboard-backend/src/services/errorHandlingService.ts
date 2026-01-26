/**
 * Error Handling Service
 * 
 * Provides comprehensive error handling with:
 * - Graceful degradation for API failures
 * - User-friendly error messages and recovery suggestions
 * - Offline mode with cached data display
 * - Retry mechanisms with exponential backoff
 * - Error classification and routing
 * 
 * Requirements: 2.5, 3.5, 6.1
 */

import type { APIError } from '../types/index.js';
import { cacheService } from './cacheService.js';
import { persistenceService } from './persistenceService.js';

// Error types and classifications
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  PERSISTENCE_ERROR = 'PERSISTENCE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error context information
export interface ErrorContext {
  service: string;
  operation: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// Structured error information
export interface StructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  suggestions: string[];
  context: ErrorContext;
  originalError?: Error;
  retryable: boolean;
  fallbackAvailable: boolean;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

// Fallback data configuration
export interface FallbackConfig {
  useCachedData: boolean;
  usePersistedData: boolean;
  useMockData: boolean;
  maxCacheAge: number; // milliseconds
  maxPersistedAge: number; // milliseconds
}

// Default configurations
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.API_ERROR
  ]
};

const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  useCachedData: true,
  usePersistedData: true,
  useMockData: true,
  maxCacheAge: 30 * 60 * 1000, // 30 minutes
  maxPersistedAge: 24 * 60 * 60 * 1000 // 24 hours
};

export class ErrorHandlingService {
  private errorLog: StructuredError[] = [];
  private offlineMode = false;
  private lastNetworkCheck = 0;
  private networkCheckInterval = 30000; // 30 seconds

  /**
   * Classify and structure an error
   */
  classifyError(
    error: Error | any,
    context: ErrorContext
  ): StructuredError {
    let errorType = ErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = 'An unexpected error occurred';
    let suggestions: string[] = [];
    let retryable = false;
    let fallbackAvailable = true;

    // Classify based on error properties
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorType = ErrorType.TIMEOUT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Request timed out';
      suggestions = [
        'Check your internet connection',
        'Try again in a few moments',
        'The server may be experiencing high load'
      ];
      retryable = true;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || !navigator?.onLine) {
      errorType = ErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Network connection unavailable';
      suggestions = [
        'Check your internet connection',
        'Try refreshing the page',
        'We\'ll show cached data while you\'re offline'
      ];
      retryable = true;
      this.offlineMode = true;
    } else if (error.response?.status === 429) {
      errorType = ErrorType.RATE_LIMIT_ERROR;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Too many requests - please wait';
      suggestions = [
        'Wait a few minutes before trying again',
        'We\'ll automatically retry with cached data',
        'Consider reducing the frequency of updates'
      ];
      retryable = true;
    } else if (error.response?.status >= 400 && error.response?.status < 500) {
      errorType = ErrorType.API_ERROR;
      severity = ErrorSeverity.MEDIUM;
      userMessage = 'Service temporarily unavailable';
      suggestions = [
        'This appears to be a temporary issue',
        'We\'ll try again automatically',
        'Cached data will be used in the meantime'
      ];
      retryable = error.response.status >= 500; // Only retry server errors
    } else if (error.response?.status >= 500) {
      errorType = ErrorType.API_ERROR;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Server error occurred';
      suggestions = [
        'The service is experiencing technical difficulties',
        'We\'ll retry automatically',
        'Using cached data while the issue is resolved'
      ];
      retryable = true;
    } else if (error.name === 'ValidationError') {
      errorType = ErrorType.VALIDATION_ERROR;
      severity = ErrorSeverity.LOW;
      userMessage = 'Invalid data received';
      suggestions = [
        'This may be a temporary data issue',
        'Try refreshing the page',
        'Contact support if the problem persists'
      ];
      retryable = false;
      fallbackAvailable = false;
    }

    const structuredError: StructuredError = {
      type: errorType,
      severity,
      message: error.message || 'Unknown error',
      userMessage,
      suggestions,
      context,
      originalError: error,
      retryable,
      fallbackAvailable
    };

    // Log the error
    this.logError(structuredError);

    return structuredError;
  }

  /**
   * Execute operation with retry logic and fallback handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig: Partial<RetryConfig> = {},
    fallbackConfig: Partial<FallbackConfig> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    const fallback = { ...DEFAULT_FALLBACK_CONFIG, ...fallbackConfig };
    
    let lastError: StructuredError | null = null;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        // Check network status before attempting
        if (this.offlineMode && await this.checkNetworkStatus()) {
          this.offlineMode = false;
        }

        const result = await operation();
        
        // Reset offline mode on successful operation
        if (this.offlineMode) {
          this.offlineMode = false;
        }
        
        return result;
      } catch (error) {
        attempt++;
        lastError = this.classifyError(error, {
          ...context,
          metadata: { ...context.metadata, attempt }
        });

        // If not retryable or max attempts reached, try fallback
        if (!lastError.retryable || attempt >= config.maxAttempts) {
          if (lastError.fallbackAvailable) {
            const fallbackResult = await this.tryFallback<T>(context, fallback);
            if (fallbackResult !== null) {
              return fallbackResult;
            }
          }
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        console.warn(`Retrying ${context.service}.${context.operation} in ${jitteredDelay}ms (attempt ${attempt}/${config.maxAttempts})`);
        await this.delay(jitteredDelay);
      }
    }

    throw lastError;
  }

  /**
   * Try fallback data sources
   */
  private async tryFallback<T>(
    context: ErrorContext,
    config: FallbackConfig
  ): Promise<T | null> {
    const cacheKey = `${context.service}:${context.operation}`;
    
    // Try cached data first
    if (config.useCachedData) {
      try {
        const cached = await cacheService.getCachedCryptoData(cacheKey);
        if (cached && cached.length > 0) {
          console.log(`Using cached data for ${context.service}.${context.operation}`);
          return cached as T;
        }
      } catch (error) {
        console.warn('Cache fallback failed:', error);
      }
    }

    // Try persisted data
    if (config.usePersistedData) {
      try {
        // For now, skip persistence lookup in error handling
        const persisted = null; // await persistenceService.getInstance().getCryptoData(...);
        if (persisted && Array.isArray(persisted) && (persisted as any[]).length > 0) {
          console.log(`Using persisted data for ${context.service}.${context.operation}`);
          return persisted as T;
        }
      } catch (error) {
        console.warn('Persistence fallback failed:', error);
      }
    }

    // Try mock data as last resort
    if (config.useMockData) {
      try {
        const mockData = await this.generateMockData<T>(context);
        if (mockData) {
          console.log(`Using mock data for ${context.service}.${context.operation}`);
          return mockData;
        }
      } catch (error) {
        console.warn('Mock data generation failed:', error);
      }
    }

    return null;
  }

  /**
   * Generate mock data based on context
   */
  private async generateMockData<T>(context: ErrorContext): Promise<T | null> {
    // This would be implemented based on the specific service
    // For now, return null to indicate no mock data available
    return null;
  }

  /**
   * Check if data is still fresh
   */
  private isDataFresh(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp < maxAge;
  }

  /**
   * Check network connectivity
   */
  private async checkNetworkStatus(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastNetworkCheck < this.networkCheckInterval) {
      return !this.offlineMode;
    }

    this.lastNetworkCheck = now;

    try {
      // Try a simple network request
      const response = await fetch('/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get user-friendly error message with recovery suggestions
   */
  getErrorMessage(error: StructuredError): {
    title: string;
    message: string;
    suggestions: string[];
    actions: Array<{ label: string; action: string }>;
  } {
    const actions: Array<{ label: string; action: string }> = [];

    // Add retry action if retryable
    if (error.retryable) {
      actions.push({ label: 'Try Again', action: 'retry' });
    }

    // Add offline mode action if network error
    if (error.type === ErrorType.NETWORK_ERROR) {
      actions.push({ label: 'Use Offline Mode', action: 'offline' });
    }

    // Add refresh action for most errors
    if (error.type !== ErrorType.VALIDATION_ERROR) {
      actions.push({ label: 'Refresh Page', action: 'refresh' });
    }

    return {
      title: this.getErrorTitle(error.type),
      message: error.userMessage,
      suggestions: error.suggestions,
      actions
    };
  }

  /**
   * Get error title based on type
   */
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return 'Connection Problem';
      case ErrorType.API_ERROR:
        return 'Service Unavailable';
      case ErrorType.RATE_LIMIT_ERROR:
        return 'Too Many Requests';
      case ErrorType.TIMEOUT_ERROR:
        return 'Request Timed Out';
      case ErrorType.VALIDATION_ERROR:
        return 'Data Error';
      case ErrorType.CACHE_ERROR:
        return 'Cache Error';
      case ErrorType.PERSISTENCE_ERROR:
        return 'Storage Error';
      default:
        return 'Unexpected Error';
    }
  }

  /**
   * Log structured error
   */
  private logError(error: StructuredError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log to console based on severity
    const logMessage = `[${error.severity}] ${error.context.service}.${error.context.operation}: ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.LOW:
        console.info(logMessage, error);
        break;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: StructuredError[];
    offlineMode: boolean;
  } {
    const errorsByType = {} as Record<ErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorLog.slice(-10),
      offlineMode: this.offlineMode
    };
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Set offline mode manually
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  /**
   * Check if currently in offline mode
   */
  isOffline(): boolean {
    return this.offlineMode;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let _errorHandlingService: ErrorHandlingService | null = null;

export const errorHandlingService = {
  getInstance(): ErrorHandlingService {
    if (!_errorHandlingService) {
      _errorHandlingService = new ErrorHandlingService();
    }
    return _errorHandlingService;
  },
  
  // Delegate methods for convenience
  classifyError: (error: Error | any, context: ErrorContext) => 
    errorHandlingService.getInstance().classifyError(error, context),
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig?: Partial<RetryConfig>,
    fallbackConfig?: Partial<FallbackConfig>
  ) => errorHandlingService.getInstance().executeWithRetry(operation, context, retryConfig, fallbackConfig),
  getErrorMessage: (error: StructuredError) => 
    errorHandlingService.getInstance().getErrorMessage(error),
  getErrorStats: () => errorHandlingService.getInstance().getErrorStats(),
  clearErrorLog: () => errorHandlingService.getInstance().clearErrorLog(),
  setOfflineMode: (offline: boolean) => errorHandlingService.getInstance().setOfflineMode(offline),
  isOffline: () => errorHandlingService.getInstance().isOffline()
};