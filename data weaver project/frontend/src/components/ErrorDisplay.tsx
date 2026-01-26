/**
 * Error Display Component
 * 
 * Provides user-friendly error messages with recovery suggestions
 * and retry mechanisms with exponential backoff.
 * 
 * Requirements: 2.5, 3.5, 6.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import './ErrorDisplay.css';

export interface ErrorInfo {
  type: 'network' | 'api' | 'timeout' | 'validation' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details?: string;
  suggestions: string[];
  timestamp: Date;
  retryable: boolean;
  fallbackAvailable: boolean;
}

interface ErrorDisplayProps {
  error: ErrorInfo | null;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  onUseFallback?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  onUseFallback,
  className = '',
  showDetails = false
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(showDetails);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState<number | null>(null);

  /**
   * Get error icon based on type and severity
   */
  const getErrorIcon = useCallback((type: string, severity: string): string => {
    if (severity === 'critical') return '🚨';
    
    switch (type) {
      case 'network':
        return '📡';
      case 'api':
        return '🔧';
      case 'timeout':
        return '⏱️';
      case 'validation':
        return '⚠️';
      default:
        return '❌';
    }
  }, []);

  /**
   * Get error color scheme based on severity
   */
  const getErrorColorScheme = useCallback((severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }, []);

  /**
   * Calculate retry delay with exponential backoff
   */
  const getRetryDelay = useCallback((attempts: number): number => {
    return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
  }, []);

  /**
   * Handle retry with exponential backoff
   */
  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    setRetryAttempts(prev => prev + 1);

    try {
      await onRetry();
      setRetryAttempts(0); // Reset on success
      setAutoRetryCountdown(null);
    } catch (retryError) {
      console.warn('Retry failed:', retryError);
      
      // Schedule auto-retry for retryable errors
      if (error?.retryable && retryAttempts < 3) {
        const delay = getRetryDelay(retryAttempts);
        setAutoRetryCountdown(Math.ceil(delay / 1000));
        
        setTimeout(() => {
          handleRetry();
        }, delay);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying, error?.retryable, retryAttempts, getRetryDelay]);

  /**
   * Handle auto-retry countdown
   */
  useEffect(() => {
    if (autoRetryCountdown === null || autoRetryCountdown <= 0) return;

    const timer = setTimeout(() => {
      setAutoRetryCountdown(prev => prev ? prev - 1 : null);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoRetryCountdown]);

  /**
   * Auto-retry for network errors
   */
  useEffect(() => {
    if (error?.type === 'network' && error.retryable && retryAttempts === 0) {
      const delay = getRetryDelay(0);
      setAutoRetryCountdown(Math.ceil(delay / 1000));
      
      const timer = setTimeout(() => {
        handleRetry();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [error, retryAttempts, getRetryDelay, handleRetry]);

  if (!error) return null;

  const colorScheme = getErrorColorScheme(error.severity);
  const icon = getErrorIcon(error.type, error.severity);

  return (
    <div className={`error-display ${colorScheme} ${className}`}>
      <div className="error-header">
        <div className="error-icon">{icon}</div>
        <div className="error-title-section">
          <h3 className="error-title">{error.title}</h3>
          <p className="error-message">{error.message}</p>
          <div className="error-meta">
            <span className="error-time">
              {format(error.timestamp, 'HH:mm:ss')}
            </span>
            <span className={`error-severity ${error.severity}`}>
              {error.severity.toUpperCase()}
            </span>
            {retryAttempts > 0 && (
              <span className="retry-count">
                Attempt {retryAttempts}
              </span>
            )}
          </div>
        </div>
        <div className="error-actions">
          {error.retryable && onRetry && (
            <button
              className={`retry-button ${isRetrying ? 'retrying' : ''}`}
              onClick={handleRetry}
              disabled={isRetrying}
              title="Retry the failed operation"
            >
              {isRetrying ? (
                <>
                  <span className="retry-spinner">⟳</span>
                  Retrying...
                </>
              ) : autoRetryCountdown ? (
                <>
                  🔄 Auto-retry in {autoRetryCountdown}s
                </>
              ) : (
                <>
                  🔄 Retry
                </>
              )}
            </button>
          )}
          
          {error.fallbackAvailable && onUseFallback && (
            <button
              className="fallback-button"
              onClick={onUseFallback}
              title="Use cached or alternative data"
            >
              📊 Use Cached Data
            </button>
          )}
          
          {onDismiss && (
            <button
              className="dismiss-button"
              onClick={onDismiss}
              title="Dismiss this error"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error.suggestions.length > 0 && (
        <div className="error-suggestions">
          <h4>💡 What you can try:</h4>
          <ul className="suggestion-list">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="suggestion-item">
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error.details && (
        <div className="error-details-section">
          <button
            className="details-toggle"
            onClick={() => setShowFullDetails(!showFullDetails)}
          >
            {showFullDetails ? '🔼' : '🔽'} Technical Details
          </button>
          
          {showFullDetails && (
            <div className="error-details">
              <pre className="error-details-text">{error.details}</pre>
            </div>
          )}
        </div>
      )}

      <div className="error-help">
        <div className="help-links">
          <button
            className="help-link"
            onClick={() => window.location.reload()}
            title="Refresh the entire page"
          >
            🔄 Refresh Page
          </button>
          
          <button
            className="help-link"
            onClick={() => {
              if (navigator.onLine) {
                window.open('https://status.example.com', '_blank');
              }
            }}
            title="Check service status"
            disabled={!navigator.onLine}
          >
            📊 Service Status
          </button>
          
          <button
            className="help-link"
            onClick={() => {
              const subject = encodeURIComponent(`Error Report: ${error.title}`);
              const body = encodeURIComponent(`
Error Type: ${error.type}
Severity: ${error.severity}
Message: ${error.message}
Time: ${format(error.timestamp, 'PPpp')}
Details: ${error.details || 'None'}
              `.trim());
              window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
            }}
            title="Report this error"
          >
            📧 Report Issue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;