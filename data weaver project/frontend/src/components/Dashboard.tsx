/**
 * Main Dashboard Component
 * 
 * Displays the combined pigeon and cryptocurrency data visualization
 * with interactive charts, tooltips, and real-time updates.
 * 
 * Requirements: 1.1, 1.3, 6.1
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import axios from 'axios';
import { format } from 'date-fns';
import type { 
  DashboardData, 
  ChartDataPoint,
  PigeonSighting,
  CryptoPricePoint,
  CorrelationResult
} from '../types/index.js';
import ErrorDisplay, { type ErrorInfo } from './ErrorDisplay.js';
import OfflineMode from './OfflineMode.js';
import './Dashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface DashboardProps {
  className?: string;
}

interface LoadingState {
  isLoading: boolean;
  message: string;
}

interface ErrorState {
  hasError: boolean;
  message: string;
  details?: string;
  errorInfo?: ErrorInfo;
}

type ChartType = 'line' | 'area' | 'points';

interface ChartStyle {
  type: ChartType;
  showCorrelationHighlights: boolean;
}

interface UserPreferences {
  timeRange: string;
  selectedCryptocurrencies: string[];
  selectedRegions: string[];
  bucketSize: 'minute' | 'hour' | 'day';
}

interface WebSocketMessage {
  type: string;
  data: any;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

const TIME_RANGES = [
  { value: '1', label: '1 Hour', unit: 'hour' },
  { value: '6', label: '6 Hours', unit: 'hour' },
  { value: '24', label: '1 Day', unit: 'hour' },
  { value: '168', label: '1 Week', unit: 'day' },
  { value: '720', label: '1 Month', unit: 'day' },
  { value: '2160', label: '3 Months', unit: 'day' },
  { value: '4320', label: '6 Months', unit: 'day' },
  { value: '8760', label: '1 Year', unit: 'day' },
];

const CRYPTOCURRENCIES = [
  { value: 'bitcoin', label: 'Bitcoin (BTC)', symbol: '₿' },
  { value: 'ethereum', label: 'Ethereum (ETH)', symbol: 'Ξ' },
  { value: 'dogecoin', label: 'Dogecoin (DOGE)', symbol: 'Ð' },
];

const REGIONS = [
  { value: 'new-york', label: 'New York City', flag: '🇺🇸' },
  { value: 'london', label: 'London', flag: '🇬🇧' },
  { value: 'tokyo', label: 'Tokyo', flag: '🇯🇵' },
  { value: 'paris', label: 'Paris', flag: '🇫🇷' },
  { value: 'berlin', label: 'Berlin', flag: '🇩🇪' },
];

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001';
const WS_BASE_URL = import.meta.env?.VITE_WS_BASE_URL || 'ws://localhost:3001';

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: true, message: 'Loading dashboard data...' });
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>({ 
    type: 'line', 
    showCorrelationHighlights: true 
  });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    timeRange: '168', // 1 week default
    selectedCryptocurrencies: ['bitcoin', 'ethereum'],
    selectedRegions: ['new-york', 'london', 'tokyo'],
    bucketSize: 'hour',
  });
  const [showControlPanel, setShowControlPanel] = useState(false);
  
  // Real-time updates state
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info', timestamp: new Date() });
  const [, setRealTimeData] = useState<{
    pigeon: PigeonSighting[];
    crypto: CryptoPricePoint[];
    correlations: CorrelationResult[];
  }>({ pigeon: [], crypto: [], correlations: [] });
  
  // Enhanced error handling state
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cachedDataAvailable, setCachedDataAvailable] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // WebSocket connection ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Chart configuration
  const [chartOptions] = useState({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'Pigeon Sightings vs Cryptocurrency Prices',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: TooltipItem<'line'>[]) => {
            if (context.length > 0 && context[0].parsed.x !== null) {
              const date = new Date(context[0].parsed.x);
              return format(date, 'PPpp');
            }
            return '';
          },
          label: (context: TooltipItem<'line'>) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (value === null) return `${datasetLabel}: No data`;
            
            if (datasetLabel.includes('Pigeon')) {
              return `${datasetLabel}: ${value} sightings`;
            } else if (datasetLabel.includes('BTC') || datasetLabel.includes('ETH') || datasetLabel.includes('DOGE')) {
              return `${datasetLabel}: $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            return `${datasetLabel}: ${value}`;
          },
          afterBody: () => {
            // Add correlation information if available
            if (dashboardData?.correlations && dashboardData.correlations.length > 0) {
              const correlation = dashboardData.correlations[0];
              if (Math.abs(correlation.coefficient) >= 0.5) {
                return [
                  '',
                  `Correlation: ${(correlation.coefficient * 100).toFixed(1)}%`,
                  `Significance: ${correlation.significance}`
                ];
              }
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Pigeon Sightings',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Price (USD)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  });

  /**
   * Fetch dashboard data from the backend API with performance optimizations
   * Implements efficient data fetching and rendering (Requirements 6.2, 6.5)
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading({ isLoading: true, message: 'Fetching latest data...' });
      setError({ hasError: false, message: '' });

      // Convert hours to days for API call
      const timeRangeHours = parseInt(userPreferences.timeRange, 10);
      const timeRangeDays = Math.max(1, Math.ceil(timeRangeHours / 24));

      // Generate unique user ID for concurrent user handling
      const userId = sessionStorage.getItem('dashboard-user-id') || 
        `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('dashboard-user-id', userId);

      const response = await axios.get(`${API_BASE_URL}/api/dashboard-data`, {
        params: {
          timeRange: timeRangeDays.toString(),
          cryptos: userPreferences.selectedCryptocurrencies.join(','),
          areas: userPreferences.selectedRegions.join(','),
          bucketSize: userPreferences.bucketSize,
          optimize: 'true' // Enable performance optimizations
        },
        headers: {
          'X-User-ID': userId
        },
        timeout: 15000, // 15 second timeout for large datasets
      });

      if (response.data.success) {
        const data = response.data.data;
        
        // Batch process data conversion to prevent UI blocking (Requirement 6.5)
        const processDataInBatches = async () => {
          // Process pigeon data in batches
          const pigeonBatches = [];
          const pigeonBatchSize = 100;
          for (let i = 0; i < data.pigeonData.length; i += pigeonBatchSize) {
            const batch = data.pigeonData.slice(i, i + pigeonBatchSize);
            pigeonBatches.push(batch.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            })));
            // Allow other operations to run
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          // Process crypto data in batches
          const cryptoBatches = [];
          const cryptoBatchSize = 100;
          for (let i = 0; i < data.cryptoData.length; i += cryptoBatchSize) {
            const batch = data.cryptoData.slice(i, i + cryptoBatchSize);
            cryptoBatches.push(batch.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            })));
            // Allow other operations to run
            await new Promise(resolve => setTimeout(resolve, 0));
          }

          return {
            pigeonData: pigeonBatches.flat(),
            cryptoData: cryptoBatches.flat()
          };
        };

        const { pigeonData, cryptoData } = await processDataInBatches();
        
        const processedData: DashboardData = {
          ...data,
          pigeonData,
          cryptoData,
          correlations: data.correlations.map((item: any) => ({
            ...item,
            timeRange: {
              start: new Date(item.timeRange.start),
              end: new Date(item.timeRange.end)
            }
          })),
          metadata: {
            ...data.metadata,
            lastUpdated: new Date(data.metadata.lastUpdated)
          },
          // Include commentary and highlights from API response
          commentary: data.commentary || [],
          highlights: data.highlights || []
        };

        // Use requestAnimationFrame for smooth UI updates (Requirement 6.5)
        requestAnimationFrame(() => {
          setDashboardData(processedData);
          setLastUpdated(new Date());
          setLoading({ isLoading: false, message: '' });
        });

        // Log performance metrics if available
        if (response.data.performance) {
          console.log('Dashboard Performance:', response.data.performance);
        }
      } else {
        throw new Error(response.data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setRetryCount(prev => prev + 1);
      
      // Create structured error information
      let errorInfo: ErrorInfo;
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          errorInfo = {
            type: 'timeout',
            severity: 'medium',
            title: 'Request Timed Out',
            message: 'The server took too long to respond',
            details: err.message,
            suggestions: [
              'Check your internet connection',
              'Try again in a few moments',
              'The server may be experiencing high load',
              'Consider reducing the time range or data complexity'
            ],
            timestamp: new Date(),
            retryable: true,
            fallbackAvailable: cachedDataAvailable
          };
        } else if (err.response?.status === 429) {
          errorInfo = {
            type: 'api',
            severity: 'medium',
            title: 'Too Many Requests',
            message: 'Server is busy - please wait',
            details: err.response.data?.message || err.message,
            suggestions: [
              'Wait a few minutes before trying again',
              'We\'ll automatically retry with cached data',
              'Consider reducing the frequency of updates',
              'Try using a longer time range to reduce API calls'
            ],
            timestamp: new Date(),
            retryable: true,
            fallbackAvailable: cachedDataAvailable
          };
        } else if (err.request) {
          errorInfo = {
            type: 'network',
            severity: 'high',
            title: 'Network Connection Problem',
            message: 'Unable to connect to the server',
            details: 'No response received from the server',
            suggestions: [
              'Check your internet connection',
              'Try refreshing the page',
              'Disable VPN or proxy if enabled',
              'We\'ll show cached data while you\'re offline'
            ],
            timestamp: new Date(),
            retryable: true,
            fallbackAvailable: cachedDataAvailable
          };
          setIsOfflineMode(true);
        } else if (err.response) {
          const isServerError = err.response.status >= 500;
          errorInfo = {
            type: 'api',
            severity: isServerError ? 'high' : 'medium',
            title: isServerError ? 'Server Error' : 'Service Error',
            message: `Server responded with error (${err.response.status})`,
            details: err.response.data?.message || err.message,
            suggestions: [
              isServerError ? 'The service is experiencing technical difficulties' : 'This appears to be a temporary issue',
              'We\'ll retry automatically',
              'Cached data will be used in the meantime',
              'Contact support if the problem persists'
            ],
            timestamp: new Date(),
            retryable: isServerError,
            fallbackAvailable: cachedDataAvailable
          };
        } else {
          errorInfo = {
            type: 'unknown',
            severity: 'medium',
            title: 'Unexpected Error',
            message: err.message || 'An unexpected error occurred',
            details: err.stack || err.message,
            suggestions: [
              'Try refreshing the page',
              'Clear your browser cache',
              'Contact support if the problem persists'
            ],
            timestamp: new Date(),
            retryable: true,
            fallbackAvailable: cachedDataAvailable
          };
        }
      } else if (err instanceof Error) {
        errorInfo = {
          type: 'unknown',
          severity: 'medium',
          title: 'Application Error',
          message: err.message,
          details: err.stack || err.message,
          suggestions: [
            'Try refreshing the page',
            'Clear your browser cache',
            'Contact support if the problem persists'
          ],
          timestamp: new Date(),
          retryable: true,
          fallbackAvailable: cachedDataAvailable
        };
      } else {
        errorInfo = {
          type: 'unknown',
          severity: 'medium',
          title: 'Unknown Error',
          message: 'An unexpected error occurred',
          details: String(err),
          suggestions: [
            'Try refreshing the page',
            'Contact support if the problem persists'
          ],
          timestamp: new Date(),
          retryable: true,
          fallbackAvailable: false
        };
      }

      // Use requestAnimationFrame for smooth error state updates
      requestAnimationFrame(() => {
        setError({ 
          hasError: true, 
          message: errorInfo.message, 
          details: errorInfo.details,
          errorInfo 
        });
        setLoading({ isLoading: false, message: '' });
      });
    }
  }, [userPreferences]);

  /**
   * Process dashboard data into Chart.js format with correlation highlighting
   * Implements efficient data processing to prevent UI blocking (Requirement 6.5)
   */
  const processChartData = useCallback(() => {
    if (!dashboardData) return null;

    const startTime = performance.now();
    const datasets: any[] = [];

    // Check for high correlations to highlight
    const hasHighCorrelation = dashboardData.correlations.some(
      corr => Math.abs(corr.coefficient) >= 0.7
    );

    // Performance optimization: limit data points for smooth rendering
    const maxDataPoints = 1000;
    const shouldSample = dashboardData.pigeonData.length > maxDataPoints || 
                        dashboardData.cryptoData.length > maxDataPoints;

    // Process pigeon data with performance optimization
    if (dashboardData.pigeonData.length > 0) {
      // Sample data if too large for smooth rendering (Requirement 6.2)
      let pigeonData = dashboardData.pigeonData;
      if (shouldSample && pigeonData.length > maxDataPoints) {
        const step = Math.ceil(pigeonData.length / maxDataPoints);
        pigeonData = pigeonData.filter((_, index) => index % step === 0);
      }

      // Group pigeon data by location
      const pigeonByLocation = pigeonData.reduce((acc, sighting) => {
        if (!acc[sighting.location]) {
          acc[sighting.location] = [];
        }
        acc[sighting.location].push({
          x: sighting.timestamp,
          y: sighting.count,
        });
        return acc;
      }, {} as Record<string, ChartDataPoint[]>);

      // Create datasets for each location
      const pigeonColors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
      let colorIndex = 0;

      Object.entries(pigeonByLocation).forEach(([location, data]) => {
        const baseColor = pigeonColors[colorIndex % pigeonColors.length];
        const isHighlighted = hasHighCorrelation && chartStyle.showCorrelationHighlights;
        
        datasets.push({
          label: `Pigeon Sightings (${location})`,
          data: data.sort((a, b) => a.x.getTime() - b.x.getTime()),
          borderColor: isHighlighted ? baseColor : baseColor + 'CC',
          backgroundColor: chartStyle.type === 'area' 
            ? baseColor + (isHighlighted ? '40' : '20')
            : baseColor + '20',
          yAxisID: 'y',
          tension: chartStyle.type === 'points' ? 0 : 0.1,
          pointRadius: chartStyle.type === 'points' ? 6 : (isHighlighted ? 5 : 4),
          pointHoverRadius: chartStyle.type === 'points' ? 8 : 6,
          borderWidth: isHighlighted ? 3 : 2,
          fill: chartStyle.type === 'area' ? 'origin' : false,
          showLine: chartStyle.type !== 'points',
          // Add glow effect for high correlations
          ...(isHighlighted && {
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            pointBorderWidth: 2,
            pointBackgroundColor: baseColor,
            pointBorderColor: '#ffffff',
          }),
        });
        colorIndex++;
      });
    }

    // Process crypto data with performance optimization
    if (dashboardData.cryptoData.length > 0) {
      // Sample data if too large for smooth rendering (Requirement 6.2)
      let cryptoData = dashboardData.cryptoData;
      if (shouldSample && cryptoData.length > maxDataPoints) {
        const step = Math.ceil(cryptoData.length / maxDataPoints);
        cryptoData = cryptoData.filter((_, index) => index % step === 0);
      }

      // Group crypto data by symbol
      const cryptoBySymbol = cryptoData.reduce((acc, price) => {
        if (!acc[price.symbol]) {
          acc[price.symbol] = [];
        }
        acc[price.symbol].push({
          x: price.timestamp,
          y: price.price,
        });
        return acc;
      }, {} as Record<string, ChartDataPoint[]>);

      // Create datasets for each cryptocurrency
      const cryptoColors = {
        'BTC': '#F7931A',
        'ETH': '#627EEA',
        'DOGE': '#C2A633',
      };

      Object.entries(cryptoBySymbol).forEach(([symbol, data]) => {
        const baseColor = cryptoColors[symbol as keyof typeof cryptoColors] || '#6B7280';
        const isHighlighted = hasHighCorrelation && chartStyle.showCorrelationHighlights;
        
        datasets.push({
          label: `${symbol} Price`,
          data: data.sort((a, b) => a.x.getTime() - b.x.getTime()),
          borderColor: isHighlighted ? baseColor : baseColor + 'CC',
          backgroundColor: chartStyle.type === 'area' 
            ? baseColor + (isHighlighted ? '40' : '20')
            : baseColor + '20',
          yAxisID: 'y1',
          tension: chartStyle.type === 'points' ? 0 : 0.1,
          pointRadius: chartStyle.type === 'points' ? 5 : (isHighlighted ? 4 : 3),
          pointHoverRadius: chartStyle.type === 'points' ? 7 : 5,
          borderWidth: isHighlighted ? 3 : 2,
          fill: chartStyle.type === 'area' ? 'origin' : false,
          showLine: chartStyle.type !== 'points',
          // Add glow effect for high correlations
          ...(isHighlighted && {
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            pointBorderWidth: 2,
            pointBackgroundColor: baseColor,
            pointBorderColor: '#ffffff',
          }),
        });
      });
    }

    // Log performance metrics for monitoring
    const processingTime = performance.now() - startTime;
    if (processingTime > 100) { // Log if processing takes more than 100ms
      console.warn(`Chart data processing took ${processingTime.toFixed(2)}ms`, {
        pigeonDataPoints: dashboardData.pigeonData.length,
        cryptoDataPoints: dashboardData.cryptoData.length,
        datasets: datasets.length,
        sampled: shouldSample
      });
    }

    return { datasets };
  }, [dashboardData, chartStyle]);

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = useCallback((timeRange: string) => {
    const selectedRange = TIME_RANGES.find(r => r.value === timeRange);
    const bucketSize = selectedRange?.unit === 'hour' ? 'hour' : 'day';
    
    setUserPreferences(prev => ({
      ...prev,
      timeRange,
      bucketSize: bucketSize as 'hour' | 'day'
    }));
  }, []);

  /**
   * Handle cryptocurrency selection change
   */
  const handleCryptocurrencyChange = useCallback((crypto: string, checked: boolean) => {
    setUserPreferences(prev => {
      const newCryptos = checked
        ? [...prev.selectedCryptocurrencies, crypto]
        : prev.selectedCryptocurrencies.filter(c => c !== crypto);
      
      // Ensure at least one cryptocurrency is selected
      if (newCryptos.length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        selectedCryptocurrencies: newCryptos
      };
    });
  }, []);

  /**
   * Handle region selection change
   */
  const handleRegionChange = useCallback((region: string, checked: boolean) => {
    setUserPreferences(prev => {
      const newRegions = checked
        ? [...prev.selectedRegions, region]
        : prev.selectedRegions.filter(r => r !== region);
      
      // Ensure at least one region is selected
      if (newRegions.length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        selectedRegions: newRegions
      };
    });
  }, []);

  /**
   * Retry loading data with exponential backoff
   */
  const handleRetry = useCallback(async () => {
    setError({ hasError: false, message: '' });
    await fetchDashboardData();
  }, [fetchDashboardData]);



  /**
   * Use fallback/cached data
   */
  const handleUseFallback = useCallback(async () => {
    try {
      setLoading({ isLoading: true, message: 'Loading cached data...' });
      
      // Try to get cached data from localStorage
      const cachedData = localStorage.getItem('dashboard-cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const processedData: DashboardData = {
          ...parsed,
          pigeonData: parsed.pigeonData.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })),
          cryptoData: parsed.cryptoData.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          })),
          correlations: parsed.correlations.map((item: any) => ({
            ...item,
            timeRange: {
              start: new Date(item.timeRange.start),
              end: new Date(item.timeRange.end)
            }
          })),
          metadata: {
            ...parsed.metadata,
            lastUpdated: new Date(parsed.metadata.lastUpdated),
            dataQuality: 'mock' as const
          }
        };

        setDashboardData(processedData);
        setLastUpdated(new Date(parsed.metadata.lastUpdated));
        setError({ hasError: false, message: '' });
        showNotification('Using cached data', 'info');
      } else {
        throw new Error('No cached data available');
      }
    } catch (err) {
      console.error('Failed to load cached data:', err);
      showNotification('No cached data available', 'warning');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  }, []);

  /**
   * Dismiss error
   */
  const handleDismissError = useCallback(() => {
    setError({ hasError: false, message: '' });
  }, []);

  /**
   * Toggle offline mode
   */
  const handleToggleOfflineMode = useCallback((enabled: boolean) => {
    setIsOfflineMode(enabled);
    if (!enabled) {
      // Try to reconnect when going back online
      handleRetry();
    }
  }, [handleRetry]);

  /**
   * Show notification to user
   * Implements user notifications for data updates and system status (Requirement 2.3, 3.3)
   */
  const showNotification = useCallback((message: string, type: NotificationState['type'] = 'info') => {
    setNotification({
      show: true,
      message,
      type,
      timestamp: new Date()
    });

    // Auto-hide notification after 5 seconds
    window.setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  }, []);

  /**
   * Connect to WebSocket for real-time updates
   * Implements real-time data streaming (Requirements 2.3, 3.3)
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(`${WS_BASE_URL}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        showNotification('Real-time updates connected', 'success');

        // Subscribe to data streams based on user preferences
        if (isRealTimeEnabled) {
          // Subscribe to pigeon data
          ws.send(JSON.stringify({
            type: 'subscribe-pigeon',
            areas: userPreferences.selectedRegions
          }));

          // Subscribe to crypto data
          ws.send(JSON.stringify({
            type: 'subscribe-crypto',
            cryptos: userPreferences.selectedCryptocurrencies
          }));

          // Subscribe to correlations (use first crypto and region)
          if (userPreferences.selectedCryptocurrencies.length > 0 && userPreferences.selectedRegions.length > 0) {
            ws.send(JSON.stringify({
              type: 'subscribe-correlations',
              crypto: userPreferences.selectedCryptocurrencies[0],
              area: userPreferences.selectedRegions[0]
            }));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          // Attempt to reconnect with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          showNotification(`Connection lost. Reconnecting in ${delay / 1000}s...`, 'warning');
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          showNotification('Unable to maintain real-time connection. Using periodic updates.', 'error');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        showNotification('Real-time connection error', 'error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      showNotification('Failed to connect for real-time updates', 'error');
    }
  }, [isRealTimeEnabled, userPreferences.selectedRegions, userPreferences.selectedCryptocurrencies, showNotification]);

  /**
   * Handle incoming WebSocket messages
   * Implements temporal synchronization across all data sources (Requirement 1.4)
   */
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'connection':
        console.log('WebSocket connection confirmed:', message.data.message);
        break;

      case 'subscription-confirmed':
        console.log(`Subscribed to ${message.data.dataType} updates`);
        showNotification(`Subscribed to ${message.data.dataType} real-time updates`, 'success');
        break;

      case 'pigeon-update':
        // Update pigeon data in real-time (Requirement 2.3)
        const pigeonSightings = message.data.sightings.map((sighting: any) => ({
          ...sighting,
          timestamp: new Date(sighting.timestamp)
        }));
        
        setRealTimeData(prev => ({ ...prev, pigeon: pigeonSightings }));
        
        // Merge with existing dashboard data for temporal alignment (Requirement 1.4)
        setDashboardData(prev => {
          if (!prev) return prev;
          
          // Merge new pigeon data with existing data, avoiding duplicates
          const existingTimestamps = new Set(prev.pigeonData.map(p => p.timestamp.getTime()));
          const newSightings = pigeonSightings.filter((s: PigeonSighting) => !existingTimestamps.has(s.timestamp.getTime()));
          
          return {
            ...prev,
            pigeonData: [...prev.pigeonData, ...newSightings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            metadata: {
              ...prev.metadata,
              lastUpdated: new Date()
            }
          };
        });
        
        setLastUpdated(new Date());
        showNotification(`Updated ${pigeonSightings.length} pigeon sightings`, 'info');
        break;

      case 'crypto-update':
        // Update crypto data in real-time (Requirement 3.3)
        const cryptoPrices = message.data.prices.map((price: any) => ({
          ...price,
          timestamp: new Date(price.timestamp)
        }));
        
        setRealTimeData(prev => ({ ...prev, crypto: cryptoPrices }));
        
        // Merge with existing dashboard data for temporal alignment (Requirement 1.4)
        setDashboardData(prev => {
          if (!prev) return prev;
          
          // Merge new crypto data with existing data, avoiding duplicates
          const existingTimestamps = new Set(prev.cryptoData.map(c => c.timestamp.getTime()));
          const newPrices = cryptoPrices.filter((p: CryptoPricePoint) => !existingTimestamps.has(p.timestamp.getTime()));
          
          return {
            ...prev,
            cryptoData: [...prev.cryptoData, ...newPrices].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
            metadata: {
              ...prev.metadata,
              lastUpdated: new Date()
            }
          };
        });
        
        setLastUpdated(new Date());
        showNotification(`Updated ${cryptoPrices.length} crypto prices`, 'info');
        break;

      case 'correlation-update':
        // Update correlation data
        const correlations = message.data.correlations.map((corr: any) => ({
          ...corr,
          timeRange: {
            start: new Date(corr.timeRange.start),
            end: new Date(corr.timeRange.end)
          }
        }));
        
        setRealTimeData(prev => ({ ...prev, correlations }));
        
        // Update dashboard data with new correlations
        setDashboardData(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            correlations,
            highlights: message.data.highlights || prev.highlights,
            commentary: message.data.commentary || prev.commentary,
            metadata: {
              ...prev.metadata,
              lastUpdated: new Date()
            }
          };
        });
        
        setLastUpdated(new Date());
        
        // Show notification for significant correlations
        const highCorrelations = correlations.filter((c: CorrelationResult) => Math.abs(c.coefficient) >= 0.7);
        if (highCorrelations.length > 0) {
          showNotification(`Found ${highCorrelations.length} strong correlation(s)!`, 'success');
        }
        break;

      case 'error':
        console.error('WebSocket error message:', message.data.error);
        showNotification(`Real-time error: ${message.data.error}`, 'error');
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, [showNotification]);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
  }, []);

  /**
   * Toggle real-time updates
   */
  const toggleRealTimeUpdates = useCallback(() => {
    setIsRealTimeEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        connectWebSocket();
        showNotification('Real-time updates enabled', 'success');
      } else {
        disconnectWebSocket();
        showNotification('Real-time updates disabled', 'info');
      }
      
      return newState;
    });
  }, [connectWebSocket, disconnectWebSocket, showNotification]);

  // Check for cached data availability
  useEffect(() => {
    const cachedData = localStorage.getItem('dashboard-cache');
    setCachedDataAvailable(!!cachedData);
  }, []);

  // Cache successful data fetches
  useEffect(() => {
    if (dashboardData && !loading.isLoading && !error.hasError) {
      try {
        localStorage.setItem('dashboard-cache', JSON.stringify(dashboardData));
        setCachedDataAvailable(true);
      } catch (err) {
        console.warn('Failed to cache dashboard data:', err);
      }
    }
  }, [dashboardData, loading.isLoading, error.hasError]);

  // Initial data load and refresh when preferences change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // WebSocket connection management
  useEffect(() => {
    if (isRealTimeEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [isRealTimeEnabled, connectWebSocket, disconnectWebSocket]);

  // Handle preference changes for WebSocket subscriptions (Requirement 1.4)
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isRealTimeEnabled) {
      // Resubscribe with new preferences to maintain temporal synchronization
      
      // Unsubscribe from all current subscriptions
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', dataType: 'all' }));
      
      // Subscribe with new preferences
      window.setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          // Subscribe to pigeon data
          wsRef.current.send(JSON.stringify({
            type: 'subscribe-pigeon',
            areas: userPreferences.selectedRegions
          }));

          // Subscribe to crypto data
          wsRef.current.send(JSON.stringify({
            type: 'subscribe-crypto',
            cryptos: userPreferences.selectedCryptocurrencies
          }));

          // Subscribe to correlations
          if (userPreferences.selectedCryptocurrencies.length > 0 && userPreferences.selectedRegions.length > 0) {
            wsRef.current.send(JSON.stringify({
              type: 'subscribe-correlations',
              crypto: userPreferences.selectedCryptocurrencies[0],
              area: userPreferences.selectedRegions[0]
            }));
          }
        }
      }, 100); // Small delay to ensure unsubscribe is processed
    }
  }, [userPreferences.selectedCryptocurrencies, userPreferences.selectedRegions, isRealTimeEnabled]);

  // Fallback auto-refresh when real-time is disabled (meets requirement 2.3, 3.3)
  useEffect(() => {
    if (!isRealTimeEnabled) {
      const interval = setInterval(() => {
        if (!loading.isLoading && !error.hasError) {
          fetchDashboardData();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [fetchDashboardData, loading.isLoading, error.hasError, isRealTimeEnabled]);

  // WebSocket health check (ping/pong)
  useEffect(() => {
    if (connectionStatus === 'connected' && wsRef.current) {
      const pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Ping every 30 seconds

      return () => clearInterval(pingInterval);
    }
  }, [connectionStatus]);

  const chartData = processChartData();

  return (
    <div className={`dashboard ${className}`}>
      {/* Offline Mode Banner */}
      <OfflineMode
        isOffline={isOfflineMode}
        lastDataUpdate={lastUpdated || undefined}
        onRetryConnection={handleRetry}
        onToggleOfflineMode={handleToggleOfflineMode}
        cachedDataAvailable={cachedDataAvailable}
      />

      <div className="dashboard-header">
        <h1>Pigeon-Crypto Dashboard</h1>
        <div className="dashboard-status">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          {dashboardData?.metadata && (
            <span className={`data-quality ${dashboardData.metadata.dataQuality}`}>
              Data: {dashboardData.metadata.dataQuality}
              {isOfflineMode && ' (Offline)'}
            </span>
          )}
          {dashboardData && (
            <span className="performance-indicator">
              📊 {dashboardData.pigeonData.length + dashboardData.cryptoData.length} data points
            </span>
          )}
          <div className="realtime-status">
            <span className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'connected' && !isOfflineMode && '🟢 Live'}
              {connectionStatus === 'connecting' && '🟡 Connecting'}
              {(connectionStatus === 'disconnected' || isOfflineMode) && '🔴 Offline'}
              {connectionStatus === 'error' && '⚠️ Error'}
            </span>
            <button
              className={`realtime-toggle ${isRealTimeEnabled && !isOfflineMode ? 'enabled' : 'disabled'}`}
              onClick={toggleRealTimeUpdates}
              disabled={isOfflineMode}
              title={
                isOfflineMode 
                  ? 'Real-time updates unavailable in offline mode'
                  : isRealTimeEnabled 
                    ? 'Disable real-time updates' 
                    : 'Enable real-time updates'
              }
            >
              {isOfflineMode ? '📡 Offline' : isRealTimeEnabled ? '📡 Live' : '⏸️ Paused'}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Real-time notification */}
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            <div className="notification-content">
              <span className="notification-message">{notification.message}</span>
              <span className="notification-time">{format(notification.timestamp, 'HH:mm:ss')}</span>
              <button 
                className="notification-close"
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {loading.isLoading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{loading.message}</p>
          </div>
        )}

        {error.hasError && error.errorInfo && (
          <ErrorDisplay
            error={error.errorInfo}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
            onUseFallback={cachedDataAvailable ? handleUseFallback : undefined}
            showDetails={retryCount > 2} // Show details after multiple failures
          />
        )}

        {!loading.isLoading && !error.hasError && chartData && (
          <>
            <div className="control-panel">
              <div className="control-panel-header">
                <h3>Dashboard Controls</h3>
                <button
                  className="control-panel-toggle"
                  onClick={() => setShowControlPanel(!showControlPanel)}
                  title={showControlPanel ? 'Hide Controls' : 'Show Controls'}
                >
                  {showControlPanel ? '🔼' : '🔽'} {showControlPanel ? 'Hide' : 'Show'} Controls
                </button>
              </div>

              {showControlPanel && (
                <div className="control-panel-content">
                  {/* Time Range Selector */}
                  <div className="control-group">
                    <label className="control-label">📅 Time Range</label>
                    <select
                      value={userPreferences.timeRange}
                      onChange={(e) => handleTimeRangeChange(e.target.value)}
                      className="control-select"
                    >
                      {TIME_RANGES.map(range => (
                        <option key={range.value} value={range.value}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cryptocurrency Selection */}
                  <div className="control-group">
                    <label className="control-label">💰 Cryptocurrencies</label>
                    <div className="checkbox-group">
                      {CRYPTOCURRENCIES.map(crypto => (
                        <label key={crypto.value} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={userPreferences.selectedCryptocurrencies.includes(crypto.value)}
                            onChange={(e) => handleCryptocurrencyChange(crypto.value, e.target.checked)}
                          />
                          <span className="checkbox-label">
                            {crypto.symbol} {crypto.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Geographic Region Filter */}
                  <div className="control-group">
                    <label className="control-label">🌍 Geographic Regions</label>
                    <div className="checkbox-group">
                      {REGIONS.map(region => (
                        <label key={region.value} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={userPreferences.selectedRegions.includes(region.value)}
                            onChange={(e) => handleRegionChange(region.value, e.target.checked)}
                          />
                          <span className="checkbox-label">
                            {region.flag} {region.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Current Selection Summary */}
                  <div className="control-group">
                    <label className="control-label">📋 Current Selection</label>
                    <div className="selection-summary">
                      <div className="summary-item">
                        <span className="summary-label">Time:</span>
                        <span className="summary-value">
                          {TIME_RANGES.find(r => r.value === userPreferences.timeRange)?.label}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Cryptos:</span>
                        <span className="summary-value">
                          {userPreferences.selectedCryptocurrencies.length} selected
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Regions:</span>
                        <span className="summary-value">
                          {userPreferences.selectedRegions.length} selected
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Bucket:</span>
                        <span className="summary-value">{userPreferences.bucketSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chart-controls">
              <div className="chart-type-selector">
                <label>Chart Type:</label>
                <div className="chart-type-buttons">
                  <button
                    className={`chart-type-btn ${chartStyle.type === 'line' ? 'active' : ''}`}
                    onClick={() => setChartStyle(prev => ({ ...prev, type: 'line' }))}
                    title="Line Chart"
                  >
                    📈 Line
                  </button>
                  <button
                    className={`chart-type-btn ${chartStyle.type === 'area' ? 'active' : ''}`}
                    onClick={() => setChartStyle(prev => ({ ...prev, type: 'area' }))}
                    title="Area Chart"
                  >
                    📊 Area
                  </button>
                  <button
                    className={`chart-type-btn ${chartStyle.type === 'points' ? 'active' : ''}`}
                    onClick={() => setChartStyle(prev => ({ ...prev, type: 'points' }))}
                    title="Scatter Plot"
                  >
                    🔵 Points
                  </button>
                </div>
              </div>
              
              <div className="correlation-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={chartStyle.showCorrelationHighlights}
                    onChange={(e) => setChartStyle(prev => ({ 
                      ...prev, 
                      showCorrelationHighlights: e.target.checked 
                    }))}
                  />
                  Highlight Correlations
                </label>
              </div>
            </div>

            <div className="chart-container">
              <Line data={chartData} options={chartOptions} />
            </div>
          </>
        )}

        {!loading.isLoading && !error.hasError && dashboardData?.correlations && (
          <div className="correlation-info">
            <div className="correlation-header">
              <h3>🔍 Correlation Analysis</h3>
              <div className="correlation-stats">
                <span className="stat-item">
                  📊 {dashboardData.correlations.length} correlation{dashboardData.correlations.length !== 1 ? 's' : ''} found
                </span>
                {dashboardData.highlights && dashboardData.highlights.length > 0 && (
                  <span className="stat-item highlight">
                    🔥 {dashboardData.highlights.length} strong correlation{dashboardData.highlights.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Humorous Commentary Section */}
            {dashboardData.commentary && dashboardData.commentary.length > 0 && (
              <div className="correlation-commentary">
                <h4>🎭 AI Commentary</h4>
                <div className="commentary-container">
                  {dashboardData.commentary.map((comment, index) => (
                    <div key={index} className="commentary-item">
                      <div className="commentary-bubble">
                        <p className="commentary-text">{comment}</p>
                        <div className="commentary-footer">
                          <span className="commentary-author">🤖 Correlation Bot</span>
                          <span className="commentary-disclaimer">
                            <em>For entertainment purposes only</em>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlation Coefficients */}
            <div className="correlation-coefficients">
              <h4>📈 Statistical Analysis</h4>
              {dashboardData.correlations.map((correlation, index) => {
                const isHighCorrelation = Math.abs(correlation.coefficient) >= 0.7;
                const isHighlighted = isHighCorrelation && chartStyle.showCorrelationHighlights;
                
                return (
                  <div 
                    key={index} 
                    className={`correlation-item ${correlation.significance} ${isHighlighted ? 'highlighted' : ''}`}
                  >
                    <div className="correlation-main">
                      <div className="correlation-value">
                        <span className="correlation-coefficient">
                          {(correlation.coefficient * 100).toFixed(1)}%
                        </span>
                        <span className="correlation-direction">
                          {correlation.coefficient > 0 ? '📈 Positive' : '📉 Negative'}
                        </span>
                      </div>
                      <div className="correlation-meta">
                        <span className="correlation-significance">
                          {correlation.significance} significance
                        </span>
                        <span className="correlation-p-value">
                          p-value: {correlation.pValue.toFixed(4)}
                        </span>
                      </div>
                      {isHighCorrelation && (
                        <span className="correlation-badge">
                          🔥 Strong Correlation
                        </span>
                      )}
                    </div>
                    
                    <div className="correlation-disclaimers">
                      <p className="correlation-disclaimer primary">
                        ⚠️ <strong>Important:</strong> This correlation is purely coincidental and not meaningful for investment decisions.
                      </p>
                      <p className="correlation-disclaimer secondary">
                        📚 <strong>Remember:</strong> Correlation does not imply causation. Pigeons don't actually influence cryptocurrency prices!
                      </p>
                      {isHighCorrelation && (
                        <p className="correlation-warning">
                          📊 This unusually high correlation is being highlighted in the chart above for your amusement.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Educational Footer */}
            <div className="correlation-education">
              <h4>🎓 What does this mean?</h4>
              <div className="education-content">
                <div className="education-item">
                  <strong>Correlation Coefficient:</strong> Measures how closely two datasets move together (-100% to +100%)
                </div>
                <div className="education-item">
                  <strong>P-Value:</strong> Statistical significance (lower values indicate stronger evidence)
                </div>
                <div className="education-item">
                  <strong>Significance Levels:</strong> High (strong evidence), Medium (moderate), Low (weak), None (no pattern)
                </div>
                <div className="education-disclaimer">
                  <em>This dashboard is for entertainment and educational purposes. Any correlations found are purely coincidental!</em>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;