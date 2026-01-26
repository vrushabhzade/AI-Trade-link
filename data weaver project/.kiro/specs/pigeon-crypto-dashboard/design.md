# Design Document

## Overview

The Pigeon-Crypto Dashboard is a web-based data visualization application that combines urban pigeon population data with cryptocurrency price information in a single, entertaining interface. The system fetches data from multiple sources, processes it for temporal alignment, and presents it through interactive charts that highlight amusing correlations between these completely unrelated datasets.

The application serves as both an entertaining data visualization and a subtle commentary on how humans tend to find patterns in unrelated information. By deliberately combining pigeon sightings with crypto prices, the dashboard creates the appearance of meaningful correlations while maintaining transparency about their coincidental nature.

## Architecture

The system follows a client-server architecture with the following key components:

### Frontend (React/TypeScript)
- **Dashboard Component**: Main interface displaying the combined charts
- **Chart Visualization**: Interactive time-series charts using Chart.js or D3.js
- **Control Panel**: User interface for selecting time ranges, cryptocurrencies, and regions
- **Correlation Display**: Component showing statistical correlations with humorous commentary

### Backend (Node.js/Express)
- **API Gateway**: Handles client requests and coordinates data fetching
- **Data Aggregation Service**: Combines and aligns pigeon and crypto data temporally
- **Pigeon Data Service**: Manages pigeon sighting data (real API or mock generator)
- **Crypto Data Service**: Interfaces with cryptocurrency APIs (CoinGecko, CoinMarketCap)
- **Correlation Engine**: Calculates statistical correlations between datasets

### Data Layer
- **Redis Cache**: Stores recent data to reduce API calls and improve performance
- **SQLite Database**: Persists historical data and user preferences
- **Mock Data Generator**: Creates realistic pigeon sighting patterns when real data unavailable

## Components and Interfaces

### Data Models

```typescript
interface PigeonSighting {
  timestamp: Date;
  location: string;
  count: number;
  coordinates?: { lat: number; lng: number };
}

interface CryptoPricePoint {
  timestamp: Date;
  symbol: string;
  price: number;
  volume?: number;
  marketCap?: number;
}

interface CorrelationResult {
  coefficient: number;
  pValue: number;
  timeRange: { start: Date; end: Date };
  significance: 'high' | 'medium' | 'low' | 'none';
}

interface DashboardData {
  pigeonData: PigeonSighting[];
  cryptoData: CryptoPricePoint[];
  correlations: CorrelationResult[];
  metadata: {
    lastUpdated: Date;
    dataQuality: 'real' | 'mock' | 'mixed';
  };
}
```

### API Interfaces

```typescript
// REST API endpoints
GET /api/dashboard-data?timeRange=1d&crypto=bitcoin&region=nyc
POST /api/user-preferences
GET /api/correlations?crypto=bitcoin&timeRange=7d

// WebSocket for real-time updates
interface WebSocketMessage {
  type: 'pigeon-update' | 'crypto-update' | 'correlation-update';
  data: PigeonSighting | CryptoPricePoint | CorrelationResult;
}
```

### External API Integration

**Cryptocurrency APIs:**
- Primary: CoinGecko API (free tier: 50 calls/minute)
- Fallback: CoinMarketCap API
- Data points: price, volume, market cap, 24h change

**Pigeon Data Sources:**
- eBird API (Cornell Lab of Ornithology) for real bird sighting data
- Urban wildlife databases where available
- Mock data generator with realistic urban patterns as fallback

## Data Models

### Pigeon Data Processing
The system aggregates pigeon sightings by time periods (hourly, daily) and geographic regions. When real pigeon data is unavailable, the mock generator creates realistic patterns based on:
- Urban density patterns (more pigeons in city centers)
- Seasonal variations (breeding seasons, migration patterns)
- Daily cycles (feeding times, roosting patterns)
- Weather correlations (activity levels vs temperature/precipitation)

### Cryptocurrency Data Processing
Crypto data is fetched at regular intervals and stored with consistent timestamps. The system handles:
- Multiple cryptocurrency symbols (BTC, ETH, DOGE, etc.)
- Price normalization for visual comparison
- Volume-weighted averages for smoother trend lines
- Missing data interpolation for continuous charts

### Temporal Alignment
Both datasets are aligned to common time intervals (15-minute, hourly, daily buckets) to enable meaningful correlation calculations and visual overlay.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 2.3 and 3.3 both test 30-second update requirements and can be combined into a single real-time update property
- Properties 1.2 and 1.5 both test visual styling differentiation and can be combined
- Properties 2.2 and 2.5 both test fallback behavior and can be combined into a comprehensive fallback property

### Core Properties

**Property 1: Data visualization differentiation**
*For any* combination of pigeon data and cryptocurrency data displayed simultaneously, each data type should have visually distinct styling (colors, line styles, markers) that maintains clarity and readability
**Validates: Requirements 1.2, 1.5**

**Property 2: Interactive data tooltips**
*For any* data point on the chart, hovering should display detailed information for both pigeon counts and cryptocurrency prices at that specific time period
**Validates: Requirements 1.3**

**Property 3: Temporal alignment consistency**
*For any* time period selection, both pigeon data and cryptocurrency data should update to display the exact same time range, maintaining temporal synchronization
**Validates: Requirements 1.4**

**Property 4: Multi-cryptocurrency support**
*For any* valid cryptocurrency symbol (Bitcoin, Ethereum, Dogecoin), the system should successfully fetch, display, and style the data alongside pigeon information
**Validates: Requirements 3.2**

**Property 5: Real-time update performance**
*For any* new data arrival (pigeon or cryptocurrency), the dashboard display should update within 30 seconds of data availability
**Validates: Requirements 2.3, 3.3**

**Property 6: Geographic aggregation accuracy**
*For any* pigeon sighting data that includes location information, the system should correctly aggregate counts by urban area or city without data loss
**Validates: Requirements 2.4**

**Property 7: Comprehensive fallback behavior**
*For any* data source failure (pigeon or cryptocurrency), the system should display appropriate error messages and continue functioning with cached data, mock data, or both
**Validates: Requirements 2.2, 2.5**

**Property 8: Rate limiting and caching resilience**
*For any* API rate limit condition, the system should implement throttling and caching strategies that maintain functionality without exceeding limits
**Validates: Requirements 3.5**

**Property 9: Correlation calculation accuracy**
*For any* pair of pigeon and cryptocurrency datasets, the system should calculate statistically valid correlation coefficients using appropriate time-series methods
**Validates: Requirements 4.1, 4.5**

**Property 10: Correlation highlighting consistency**
*For any* correlation coefficient that exceeds 0.7 or falls below -0.7, the system should apply consistent visual highlighting to those time periods
**Validates: Requirements 4.2**

**Property 11: Disclaimer and commentary presence**
*For any* correlation display, the system should include both disclaimers about coincidental nature and humorous commentary about apparent relationships
**Validates: Requirements 4.3, 4.4**

**Property 12: Time range flexibility**
*For any* time range selection from 1 hour to 1 year, the system should successfully fetch and display historical data for both pigeon and cryptocurrency sources
**Validates: Requirements 5.1**

**Property 13: Dynamic updates without reload**
*For any* user interface change (cryptocurrency selection, display options, geographic filters), the system should update the display without requiring page reload
**Validates: Requirements 5.2, 5.4**

**Property 14: Geographic filtering accuracy**
*For any* geographic region filter applied, the displayed pigeon data should contain only sightings from the selected urban areas
**Validates: Requirements 5.3**

**Property 15: Preference persistence**
*For any* user preference settings, the system should restore these exact settings when the user returns in a new browser session
**Validates: Requirements 5.5**

**Property 16: Performance optimization with large datasets**
*For any* dataset exceeding performance thresholds, the system should implement sampling or aggregation techniques that maintain smooth rendering performance
**Validates: Requirements 6.2**

**Property 17: Responsive design adaptation**
*For any* mobile device viewport, the dashboard should adapt its layout while maintaining data readability and all core functionality
**Validates: Requirements 6.3**

**Property 18: Concurrent user handling**
*For any* number of concurrent users within system limits, performance should remain stable without degradation in response times or functionality
**Validates: Requirements 6.4**

**Property 19: Smooth data rendering**
*For any* data update operation, the rendering should complete without visual flickering, delays, or jarring transitions
**Validates: Requirements 6.5**

## Error Handling

The system implements comprehensive error handling across all components:

### Data Source Failures
- **Pigeon Data Unavailable**: Automatically switch to mock data generator with realistic urban patterns
- **Cryptocurrency API Failures**: Implement fallback APIs and cached data with clear user notifications
- **Network Connectivity Issues**: Display offline mode with cached data and retry mechanisms

### Data Quality Issues
- **Missing Data Points**: Implement interpolation for small gaps, clear indicators for larger gaps
- **Malformed Data**: Validate and sanitize all incoming data, log errors for debugging
- **Timestamp Misalignment**: Implement robust temporal alignment with configurable tolerance

### User Interface Errors
- **Chart Rendering Failures**: Fallback to simplified chart types with error notifications
- **Performance Degradation**: Automatic data sampling and user notifications about reduced fidelity
- **Browser Compatibility**: Progressive enhancement with graceful degradation for older browsers

### Rate Limiting and API Constraints
- **API Rate Limits**: Implement exponential backoff, request queuing, and user notifications
- **Data Volume Limits**: Automatic aggregation and sampling with user control over detail levels
- **Concurrent Request Management**: Request deduplication and intelligent batching

## Testing Strategy

The testing approach combines unit testing for individual components with property-based testing for system-wide correctness guarantees.

### Unit Testing Framework
- **Framework**: Jest with React Testing Library for frontend components
- **Coverage**: Individual functions, React components, API endpoints, and data processing utilities
- **Focus Areas**: 
  - Data transformation and aggregation logic
  - Chart rendering components
  - API integration modules
  - Error handling pathways

### Property-Based Testing Framework
- **Framework**: fast-check for JavaScript/TypeScript property-based testing
- **Configuration**: Minimum 100 iterations per property test to ensure statistical confidence
- **Test Data Generation**: 
  - Smart generators for realistic pigeon sighting patterns
  - Cryptocurrency price data generators with market-realistic constraints
  - Time range generators covering edge cases (leap years, daylight saving transitions)
  - Geographic coordinate generators for urban areas

### Integration Testing
- **API Integration**: Test real API connections with rate limiting and error scenarios
- **End-to-End Workflows**: Complete user journeys from dashboard load to correlation analysis
- **Performance Testing**: Load testing with simulated concurrent users and large datasets
- **Cross-Browser Testing**: Ensure compatibility across major browsers and mobile devices

### Mock Data Strategy
- **Realistic Patterns**: Mock pigeon data follows actual urban wildlife patterns
- **Seasonal Variations**: Include breeding seasons, migration patterns, and weather correlations
- **Market Simulation**: Cryptocurrency mock data includes realistic volatility and trading patterns
- **Edge Case Coverage**: Generate data for boundary conditions and error scenarios

Each property-based test will be tagged with comments explicitly referencing the correctness property from this design document using the format: **Feature: pigeon-crypto-dashboard, Property {number}: {property_text}**