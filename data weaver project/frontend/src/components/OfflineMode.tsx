/**
 * Offline Mode Component
 * 
 * Displays offline status and provides cached data functionality
 * when network connectivity is unavailable.
 * 
 * Requirements: 2.5, 3.5, 6.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import './OfflineMode.css';

interface OfflineModeProps {
  isOffline: boolean;
  lastDataUpdate?: Date;
  onRetryConnection: () => void;
  onToggleOfflineMode: (enabled: boolean) => void;
  cachedDataAvailable: boolean;
  className?: string;
}

interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export const OfflineMode: React.FC<OfflineModeProps> = ({
  isOffline,
  lastDataUpdate,
  onRetryConnection,
  onToggleOfflineMode,
  cachedDataAvailable,
  className = ''
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine
  });
  const [showDetails, setShowDetails] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  /**
   * Update network status information
   */
  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    setNetworkStatus({
      online: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt
    });
  }, []);

  /**
   * Handle retry connection with exponential backoff
   */
  const handleRetryConnection = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryAttempts(prev => prev + 1);

    try {
      await onRetryConnection();
      setRetryAttempts(0); // Reset on success
    } catch (error) {
      console.warn('Retry connection failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [onRetryConnection, isRetrying]);

  /**
   * Get retry delay based on attempt count
   */
  const getRetryDelay = useCallback((attempts: number): number => {
    return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
  }, []);

  /**
   * Auto-retry connection with exponential backoff
   */
  useEffect(() => {
    if (isOffline && retryAttempts > 0 && retryAttempts < 5) {
      const delay = getRetryDelay(retryAttempts);
      const timer = setTimeout(() => {
        handleRetryConnection();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isOffline, retryAttempts, getRetryDelay, handleRetryConnection]);

  /**
   * Listen for network status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
      setRetryAttempts(0);
      if (isOffline) {
        handleRetryConnection();
      }
    };

    const handleOffline = () => {
      updateNetworkStatus();
      onToggleOfflineMode(true);
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status update
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus, handleRetryConnection, isOffline, onToggleOfflineMode]);

  if (!isOffline) {
    return null;
  }

  return (
    <div className={`offline-mode ${className}`}>
      <div className="offline-banner">
        <div className="offline-icon">📡</div>
        <div className="offline-content">
          <div className="offline-title">
            <span className="offline-status">Offline Mode</span>
            {cachedDataAvailable && (
              <span className="cached-data-indicator">📊 Cached data available</span>
            )}
          </div>
          <div className="offline-message">
            {networkStatus.online 
              ? 'Connection to data services unavailable'
              : 'No internet connection detected'
            }
            {lastDataUpdate && (
              <span className="last-update">
                Last updated: {format(lastDataUpdate, 'PPpp')}
              </span>
            )}
          </div>
        </div>
        <div className="offline-actions">
          <button
            className={`retry-button ${isRetrying ? 'retrying' : ''}`}
            onClick={handleRetryConnection}
            disabled={isRetrying}
            title="Try to reconnect"
          >
            {isRetrying ? (
              <>
                <span className="retry-spinner">⟳</span>
                Retrying...
              </>
            ) : (
              <>
                🔄 Retry
                {retryAttempts > 0 && (
                  <span className="retry-count">({retryAttempts})</span>
                )}
              </>
            )}
          </button>
          <button
            className="details-toggle"
            onClick={() => setShowDetails(!showDetails)}
            title="Show connection details"
          >
            {showDetails ? '🔼' : '🔽'} Details
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="offline-details">
          <div className="network-info">
            <h4>Network Information</h4>
            <div className="network-stats">
              <div className="network-stat">
                <span className="stat-label">Browser Status:</span>
                <span className={`stat-value ${networkStatus.online ? 'online' : 'offline'}`}>
                  {networkStatus.online ? '🟢 Online' : '🔴 Offline'}
                </span>
              </div>
              {networkStatus.effectiveType && (
                <div className="network-stat">
                  <span className="stat-label">Connection Type:</span>
                  <span className="stat-value">{networkStatus.effectiveType}</span>
                </div>
              )}
              {networkStatus.downlink && (
                <div className="network-stat">
                  <span className="stat-label">Download Speed:</span>
                  <span className="stat-value">{networkStatus.downlink} Mbps</span>
                </div>
              )}
              {networkStatus.rtt && (
                <div className="network-stat">
                  <span className="stat-label">Latency:</span>
                  <span className="stat-value">{networkStatus.rtt} ms</span>
                </div>
              )}
            </div>
          </div>

          <div className="offline-features">
            <h4>Available in Offline Mode</h4>
            <ul className="feature-list">
              <li className={cachedDataAvailable ? 'available' : 'unavailable'}>
                {cachedDataAvailable ? '✅' : '❌'} Cached dashboard data
              </li>
              <li className="available">
                ✅ Chart visualization and controls
              </li>
              <li className="available">
                ✅ Historical correlation analysis
              </li>
              <li className="unavailable">
                ❌ Real-time data updates
              </li>
              <li className="unavailable">
                ❌ Fresh API data
              </li>
            </ul>
          </div>

          <div className="recovery-suggestions">
            <h4>Recovery Suggestions</h4>
            <ul className="suggestion-list">
              <li>Check your internet connection</li>
              <li>Try refreshing the page</li>
              <li>Disable VPN or proxy if enabled</li>
              <li>Check if the service is experiencing issues</li>
              <li>Clear browser cache and cookies</li>
            </ul>
          </div>

          <div className="offline-controls">
            <button
              className="force-online-button"
              onClick={() => onToggleOfflineMode(false)}
              title="Force online mode (may cause errors if connection is still unavailable)"
            >
              🌐 Force Online Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineMode;