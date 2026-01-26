import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import types and validation functions
import type { DashboardData, PigeonSighting, CryptoPricePoint } from './types/index.js';
import { validateDashboardData, validatePigeonSighting, validateCryptoPricePoint } from './validation/index.js';

// Import services
import { cryptoService, SUPPORTED_CRYPTOS, type SupportedCrypto } from './services/cryptoService.js';
import { pigeonService, URBAN_AREAS, type UrbanArea } from './services/pigeonService.js';
import { correlationService } from './services/correlationService.js';
import { userPreferencesService } from './services/userPreferencesService.js';
import { websocketService } from './services/websocketService.js';
import { persistenceService } from './services/persistenceService.js';
import { cacheService } from './services/cacheService.js';
import { performanceService } from './services/performanceService.js';
import { errorHandlingService } from './services/errorHandlingService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(helmet());
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'pigeon-crypto-dashboard-backend'
  });
});

// API routes
app.get('/api/crypto/current', async (req, res) => {
  try {
    const { cryptos } = req.query;
    const cryptoList = typeof cryptos === 'string' 
      ? cryptos.split(',').filter(c => c in SUPPORTED_CRYPTOS) as SupportedCrypto[]
      : ['bitcoin', 'ethereum', 'dogecoin'] as SupportedCrypto[];

    const prices = await cryptoService.getCurrentPrices(cryptoList);
    res.json({
      success: true,
      data: prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current crypto prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cryptocurrency prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/crypto/historical/:crypto', async (req, res) => {
  try {
    const { crypto } = req.params;
    const { days = '7' } = req.query;

    if (!(crypto in SUPPORTED_CRYPTOS)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported cryptocurrency',
        supported: Object.keys(SUPPORTED_CRYPTOS)
      });
    }

    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 365.'
      });
    }

    const prices = await cryptoService.getHistoricalPrices(crypto as SupportedCrypto, daysNum);
    return res.json({
      success: true,
      data: prices,
      crypto,
      days: daysNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching historical crypto prices:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch historical cryptocurrency prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/crypto/supported', (req, res) => {
  res.json({
    success: true,
    data: SUPPORTED_CRYPTOS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/crypto/status', (req, res) => {
  try {
    const rateLimitStatus = cryptoService.getRateLimitStatus();
    const cacheStats = cryptoService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        rateLimits: rateLimitStatus,
        cache: cacheStats,
        supportedCryptos: Object.keys(SUPPORTED_CRYPTOS)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get service status'
    });
  }
});

// Pigeon data endpoints
app.get('/api/pigeon/current', async (req, res) => {
  try {
    const { areas } = req.query;
    const areaList = typeof areas === 'string' 
      ? areas.split(',').filter(a => a in URBAN_AREAS) as UrbanArea[]
      : ['new-york', 'london', 'tokyo'] as UrbanArea[];

    const sightings = await pigeonService.getCurrentSightings(areaList);
    res.json({
      success: true,
      data: sightings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching current pigeon sightings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pigeon sightings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/pigeon/historical/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const { days = '7' } = req.query;

    if (!(area in URBAN_AREAS)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported urban area',
        supported: Object.keys(URBAN_AREAS)
      });
    }

    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter. Must be between 1 and 30.'
      });
    }

    const sightings = await pigeonService.getHistoricalSightings([area as UrbanArea], daysNum);
    return res.json({
      success: true,
      data: sightings,
      area,
      days: daysNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching historical pigeon sightings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch historical pigeon sightings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/pigeon/aggregated', async (req, res) => {
  try {
    const { areas, timeRange = 'day' } = req.query;
    const areaList = typeof areas === 'string' 
      ? areas.split(',').filter(a => a in URBAN_AREAS) as UrbanArea[]
      : ['new-york', 'london', 'tokyo'] as UrbanArea[];

    if (!['hour', 'day', 'week'].includes(timeRange as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timeRange parameter. Must be hour, day, or week.'
      });
    }

    const aggregatedCounts = await pigeonService.getAggregatedCounts(
      areaList, 
      timeRange as 'hour' | 'day' | 'week'
    );
    
    return res.json({
      success: true,
      data: aggregatedCounts,
      timeRange,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching aggregated pigeon counts:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregated pigeon counts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/pigeon/areas', (req, res) => {
  res.json({
    success: true,
    data: URBAN_AREAS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/pigeon/status', (req, res) => {
  try {
    const rateLimitStatus = pigeonService.getRateLimitStatus();
    const cacheStats = pigeonService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        rateLimits: rateLimitStatus,
        cache: cacheStats,
        supportedAreas: Object.keys(URBAN_AREAS)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get pigeon service status'
    });
  }
});

// Dashboard data endpoint with correlation analysis and performance optimization
app.get('/api/dashboard-data', async (req, res) => {
  const startTime = Date.now();
  const userId = req.headers['x-user-id'] as string || `anonymous-${Date.now()}`;
  
  try {
    // Handle concurrent user connections (Requirement 6.4)
    const connectionResult = performanceService.handleUserConnection(userId);
    if (!connectionResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many concurrent users',
        queuePosition: connectionResult.queuePosition,
        message: 'Please wait for your turn. You are in the queue.'
      });
    }

    const { 
      timeRange = '7', 
      cryptos = 'bitcoin,ethereum', 
      areas = 'new-york,london,tokyo',
      bucketSize = 'hour',
      optimize = 'true'
    } = req.query;

    // Parse parameters
    const days = Math.min(Math.max(parseInt(timeRange as string, 10) || 7, 1), 30);
    const cryptoList = typeof cryptos === 'string' 
      ? cryptos.split(',').filter(c => c in SUPPORTED_CRYPTOS) as SupportedCrypto[]
      : ['bitcoin', 'ethereum'] as SupportedCrypto[];
    const areaList = typeof areas === 'string' 
      ? areas.split(',').filter(a => a in URBAN_AREAS) as UrbanArea[]
      : ['new-york', 'london', 'tokyo'] as UrbanArea[];
    const shouldOptimize = optimize === 'true';

    // Validate bucket size
    if (!['minute', 'hour', 'day'].includes(bucketSize as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bucketSize parameter. Must be minute, hour, or day.'
      });
    }

    // Fetch pigeon data
    let pigeonData = await pigeonService.getHistoricalSightings(areaList, days);
    
    // Fetch crypto data for all requested cryptocurrencies
    const cryptoDataPromises = cryptoList.map(crypto => 
      cryptoService.getHistoricalPrices(crypto, days)
    );
    const cryptoDataArrays = await Promise.all(cryptoDataPromises);
    let cryptoData = cryptoDataArrays.flat();

    // Apply performance optimizations for large datasets (Requirement 6.2)
    if (shouldOptimize) {
      // Optimize pigeon data if it's large
      if (pigeonData.length > 1000) {
        pigeonData = performanceService.optimizePigeonData(pigeonData, 'adaptive');
      }

      // Optimize crypto data if it's large
      if (cryptoData.length > 1000) {
        cryptoData = performanceService.optimizeCryptoData(cryptoData, 'adaptive');
      }

      // Aggregate data for better performance if needed
      if (pigeonData.length > 5000) {
        const windowMs = bucketSize === 'minute' ? 300000 : bucketSize === 'hour' ? 3600000 : 86400000;
        pigeonData = performanceService.aggregatePigeonData(pigeonData, windowMs, 'average');
      }

      if (cryptoData.length > 5000) {
        const windowMs = bucketSize === 'minute' ? 300000 : bucketSize === 'hour' ? 3600000 : 86400000;
        cryptoData = performanceService.aggregateCryptoData(cryptoData, windowMs, 'average');
      }
    }

    // Perform correlation analysis with batch processing for efficiency (Requirement 6.5)
    const dashboardData = await correlationService.aggregateAndCorrelate(
      pigeonData,
      cryptoData,
      { 
        bucketSize: bucketSize as 'minute' | 'hour' | 'day',
        tolerance: bucketSize === 'minute' ? 60000 : bucketSize === 'hour' ? 3600000 : 86400000
      }
    );

    // Get correlation highlights and commentary
    const highlights = correlationService.getCorrelationHighlights(dashboardData.correlations);

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Clean up user connection
    performanceService.removeUserConnection(userId);

    return res.json({
      success: true,
      data: {
        ...dashboardData,
        highlights: highlights.highlighted,
        commentary: highlights.commentary
      },
      parameters: {
        timeRange: days,
        cryptos: cryptoList,
        areas: areaList,
        bucketSize,
        optimized: shouldOptimize
      },
      performance: {
        responseTime,
        dataPoints: {
          pigeon: pigeonData.length,
          crypto: cryptoData.length,
          correlations: dashboardData.correlations.length
        },
        optimized: shouldOptimize
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    
    // Clean up user connection on error
    performanceService.removeUserConnection(userId);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Correlation analysis endpoint
app.get('/api/correlations', async (req, res) => {
  try {
    const { 
      crypto = 'bitcoin', 
      area = 'new-york', 
      timeRange = '7',
      bucketSize = 'hour'
    } = req.query;

    // Validate parameters
    if (!(crypto as string in SUPPORTED_CRYPTOS)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported cryptocurrency',
        supported: Object.keys(SUPPORTED_CRYPTOS)
      });
    }

    if (!(area as string in URBAN_AREAS)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported urban area',
        supported: Object.keys(URBAN_AREAS)
      });
    }

    const days = Math.min(Math.max(parseInt(timeRange as string, 10) || 7, 1), 30);

    // Fetch data
    const pigeonData = await pigeonService.getHistoricalSightings([area as UrbanArea], days);
    const cryptoData = await cryptoService.getHistoricalPrices(crypto as SupportedCrypto, days);

    // Perform correlation analysis
    const dashboardData = await correlationService.aggregateAndCorrelate(
      pigeonData,
      cryptoData,
      { 
        bucketSize: bucketSize as 'minute' | 'hour' | 'day',
        tolerance: bucketSize === 'minute' ? 60000 : bucketSize === 'hour' ? 3600000 : 86400000
      }
    );

    // Generate commentary
    const commentary = dashboardData.correlations.map(corr => 
      correlationService.generateCorrelationCommentary(
        corr.coefficient,
        crypto as string,
        area as string
      )
    );

    return res.json({
      success: true,
      data: {
        correlations: dashboardData.correlations,
        commentary,
        metadata: dashboardData.metadata
      },
      parameters: {
        crypto,
        area,
        timeRange: days,
        bucketSize
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating correlations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate correlations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User preferences endpoints
app.get('/api/preferences/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || sessionId.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const preferences = await userPreferencesService.getUserPreferences(sessionId);
    
    return res.json({
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/preferences/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { preferences, persist = true } = req.body;
    
    if (!sessionId || sessionId.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences data'
      });
    }

    const updatedPreferences = await userPreferencesService.saveUserPreferences(
      sessionId, 
      preferences, 
      persist
    );
    
    return res.json({
      success: true,
      data: updatedPreferences,
      persisted: persist,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save user preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put('/api/preferences/:sessionId/:key', async (req, res) => {
  try {
    const { sessionId, key } = req.params;
    const { value, persist = true } = req.body;
    
    if (!sessionId || sessionId.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    if (!key || !['selectedCryptocurrencies', 'timeRange', 'selectedRegions', 'chartType', 'theme'].includes(key)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preference key',
        validKeys: ['selectedCryptocurrencies', 'timeRange', 'selectedRegions', 'chartType', 'theme']
      });
    }

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing preference value'
      });
    }

    const updatedPreferences = await userPreferencesService.updatePreference(
      sessionId, 
      key as any, 
      value, 
      persist
    );
    
    return res.json({
      success: true,
      data: updatedPreferences,
      updated: key,
      persisted: persist,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user preference:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user preference',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete('/api/preferences/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || sessionId.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    await userPreferencesService.deleteUserPreferences(sessionId);
    
    return res.json({
      success: true,
      message: 'User preferences deleted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/preferences/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || sessionId.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID'
      });
    }

    const defaultPreferences = await userPreferencesService.resetPreferences(sessionId);
    
    return res.json({
      success: true,
      data: defaultPreferences,
      message: 'Preferences reset to defaults',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset user preferences',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Preferences statistics endpoint (for admin/monitoring)
app.get('/api/preferences/stats', (req, res) => {
  try {
    const stats = userPreferencesService.getPreferencesStats();
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching preferences statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch preferences statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// WebSocket status endpoint
app.get('/api/websocket/status', (req, res) => {
  try {
    const stats = websocketService.getStats();
    
    return res.json({
      success: true,
      data: {
        ...stats,
        endpoints: {
          websocket: '/ws',
          subscriptionTypes: ['pigeon', 'crypto', 'correlations']
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching WebSocket status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch WebSocket status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache management endpoints
app.get('/api/cache/status', (req, res) => {
  try {
    const stats = cacheService.getStats();
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cache status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      const cleared = await cacheService.clearByPattern(pattern);
      return res.json({
        success: true,
        message: `Cleared ${cleared} cache entries matching pattern: ${pattern}`,
        cleared,
        timestamp: new Date().toISOString()
      });
    } else {
      await cacheService.clearAll();
      return res.json({
        success: true,
        message: 'All cache cleared',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Persistence management endpoints
app.get('/api/persistence/status', async (req, res) => {
  try {
    const stats = await persistenceService.getStats();
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching persistence status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch persistence status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/persistence/cleanup', async (req, res) => {
  try {
    const results = await persistenceService.cleanupOldData();
    
    return res.json({
      success: true,
      message: 'Data cleanup completed',
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during data cleanup:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup old data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance monitoring endpoints
app.get('/api/performance/status', (req, res) => {
  try {
    const stats = performanceService.getStats();
    
    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch performance status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/performance/config', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }

    performanceService.updateConfig(config);
    
    return res.json({
      success: true,
      message: 'Performance configuration updated',
      data: performanceService.getStats(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating performance config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update performance configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/performance/optimize', async (req, res) => {
  try {
    const { type, data, strategy = 'adaptive' } = req.body;
    
    if (!type || !data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid optimization request. Requires type and data array.'
      });
    }

    let optimizedData;
    switch (type) {
      case 'pigeon':
        optimizedData = performanceService.optimizePigeonData(data, strategy);
        break;
      case 'crypto':
        optimizedData = performanceService.optimizeCryptoData(data, strategy);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid optimization type. Must be "pigeon" or "crypto".'
        });
    }
    
    return res.json({
      success: true,
      data: optimizedData,
      optimization: {
        originalSize: data.length,
        optimizedSize: optimizedData.length,
        reduction: ((data.length - optimizedData.length) / data.length * 100).toFixed(1) + '%',
        strategy
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to optimize data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error reporting endpoint
app.post('/api/errors/report', (req, res) => {
  try {
    const { error, context, userAgent, timestamp } = req.body;
    
    // Log the client-side error
    console.error('Client Error Report:', {
      error,
      context,
      userAgent,
      timestamp: new Date(timestamp),
      ip: req.ip,
      headers: req.headers
    });
    
    // In a production environment, you would send this to an error tracking service
    // like Sentry, LogRocket, or similar
    
    res.json({
      success: true,
      message: 'Error report received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process error report'
    });
  }
});

// Error statistics endpoint
app.get('/api/errors/stats', (req, res) => {
  try {
    const stats = errorHandlingService.getErrorStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching error statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch error statistics'
    });
  }
});

// System health check with enhanced diagnostics
app.get('/api/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'pigeon-crypto-dashboard-backend',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        cache: await cacheService.healthCheck(),
        persistence: await persistenceService.getInstance().healthCheck(),
        websocket: websocketService.getStats(),
        performance: performanceService.getStats(),
        errors: errorHandlingService.getErrorStats()
      }
    };
    
    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  
  // Use error handling service to classify and structure the error
  const structuredError = errorHandlingService.classifyError(err, {
    service: 'ExpressServer',
    operation: req.method + ' ' + req.path,
    timestamp: new Date(),
    metadata: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
  
  const statusCode = err.name === 'ValidationError' ? 400 : 500;
  
  res.status(statusCode).json({ 
    success: false,
    error: process.env.NODE_ENV === 'development' ? structuredError.message : 'Something went wrong',
    type: structuredError.type,
    suggestions: structuredError.suggestions,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services
async function initializeServices() {
  try {
    await persistenceService.initialize();
    console.log('✅ Persistence service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize persistence service:', error);
  }
}

// Initialize WebSocket service
websocketService.initialize(server);

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Pigeon-Crypto Dashboard Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  
  // Initialize services after server starts
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  websocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  websocketService.shutdown();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;