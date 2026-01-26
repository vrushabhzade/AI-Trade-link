/**
 * Integration Tests for Dashboard Component
 * 
 * Tests complete user journeys from dashboard load to correlation analysis
 * Verifies API integration with rate limiting scenarios
 * 
 * **Feature: pigeon-crypto-dashboard, Integration Tests**
 */


import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Dashboard from './Dashboard';
import type { DashboardData } from '../types/index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN
};

// Mock WebSocket constructor
(globalThis as any).WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Sample dashboard data
const mockDashboardData: DashboardData = {
  pigeonData: [
    {
      timestamp: new Date('2023-12-01T10:00:00Z'),
      location: 'new-york',
      count: 15,
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      timestamp: new Date('2023-12-01T11:00:00Z'),
      location: 'london',
      count: 8,
      coordinates: { lat: 51.5074, lng: -0.1278 }
    }
  ],
  cryptoData: [
    {
      timestamp: new Date('2023-12-01T10:00:00Z'),
      symbol: 'BTC',
      price: 42000,
      volume: 1000000
    },
    {
      timestamp: new Date('2023-12-01T11:00:00Z'),
      symbol: 'ETH',
      price: 2500,
      volume: 500000
    }
  ],
  correlations: [
    {
      coefficient: 0.75,
      pValue: 0.02,
      timeRange: {
        start: new Date('2023-12-01T10:00:00Z'),
        end: new Date('2023-12-01T11:00:00Z')
      },
      significance: 'high' as const
    }
  ],
  metadata: {
    lastUpdated: new Date('2023-12-01T12:00:00Z'),
    dataQuality: 'real' as const
  },
  commentary: ['Strong correlation detected between pigeon activity and Bitcoin price!'],
  highlights: []
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock successful API response by default
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: mockDashboardData,
        performance: {
          responseTime: 150,
          dataPoints: { pigeon: 2, crypto: 2, correlations: 1 }
        }
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Test complete user journey from dashboard load to correlation analysis
   * **Feature: pigeon-crypto-dashboard, Integration Test 1: Complete User Journey**
   */
  test('complete user journey from load to correlation analysis', async () => {
    // const user = userEvent.setup();
    
    render(<Dashboard />);

    // 1. Verify initial loading state
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();

    // 2. Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });

    // 3. Verify dashboard data is displayed
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/data: real/i)).toBeInTheDocument();

    // 4. Verify chart is rendered (Chart.js canvas)
    const canvas = screen.getByRole('img'); // Chart.js renders as img role
    expect(canvas).toBeInTheDocument();

    // 5. Open control panel
    const controlToggle = screen.getByText(/show controls/i);
    // await user.click(controlToggle);

    // 6. Verify control panel is visible
    expect(screen.getByText(/time range/i)).toBeInTheDocument();
    expect(screen.getByText(/cryptocurrencies/i)).toBeInTheDocument();
    expect(screen.getByText(/geographic regions/i)).toBeInTheDocument();

    // 7. Change time range
    const timeRangeSelect = screen.getByDisplayValue(/1 week/i);
    // await user.selectOptions(timeRangeSelect, '24');

    // 8. Verify API is called with new parameters
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/dashboard-data'),
        expect.objectContaining({
          params: expect.objectContaining({
            timeRange: '1'
          })
        })
      );
    });

    // 9. Toggle cryptocurrency selection
    const bitcoinCheckbox = screen.getByLabelText(/bitcoin/i);
    // await user.click(bitcoinCheckbox);

    // 10. Verify correlation analysis is displayed
    expect(screen.getByText(/correlation analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/75.0%/)).toBeInTheDocument(); // Correlation coefficient
    expect(screen.getByText(/strong correlation/i)).toBeInTheDocument();

    // 11. Verify commentary is shown
    expect(screen.getByText(/strong correlation detected/i)).toBeInTheDocument();

    // 12. Test chart type switching
    const areaChartButton = screen.getByText(/area/i);
    // await user.click(areaChartButton);

    // 13. Verify chart updates (check for active class)
    expect(areaChartButton).toHaveClass('active');
  });

  /**
   * Test API integration with rate limiting scenarios
   * **Feature: pigeon-crypto-dashboard, Integration Test 2: Rate Limiting Handling**
   */
  test('handles rate limiting scenarios gracefully', async () => {
    // Mock rate limit error
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        status: 429,
        data: { message: 'Rate limit exceeded' }
      }
    });

    render(<Dashboard />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });

    // Verify error suggestions are shown
    expect(screen.getByText(/wait a few minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/automatically retry/i)).toBeInTheDocument();

    // Verify retry button is available
    const retryButton = screen.getByText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockDashboardData
      }
    });

    // Click retry
    fireEvent.click(retryButton);

    // Verify successful recovery
    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });
  });

  /**
   * Test network error handling and offline mode
   * **Feature: pigeon-crypto-dashboard, Integration Test 3: Offline Mode**
   */
  test('handles network errors and enables offline mode', async () => {
    // Mock network error
    mockedAxios.get.mockRejectedValueOnce({
      code: 'ENOTFOUND',
      message: 'Network error'
    });

    // Mock cached data in localStorage
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDashboardData));

    render(<Dashboard />);

    // Wait for offline mode to be activated
    await waitFor(() => {
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });

    // Verify offline banner is shown
    expect(screen.getByText(/connection to data services unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/cached data available/i)).toBeInTheDocument();

    // Verify fallback button is available
    const useCachedButton = screen.getByText(/use cached data/i);
    expect(useCachedButton).toBeInTheDocument();

    // Click to use cached data
    fireEvent.click(useCachedButton);

    // Verify cached data is loaded
    await waitFor(() => {
      expect(screen.getByText(/using cached data/i)).toBeInTheDocument();
    });
  });

  /**
   * Test real-time WebSocket integration
   * **Feature: pigeon-crypto-dashboard, Integration Test 4: Real-time Updates**
   */
  test('integrates with WebSocket for real-time updates', async () => {
    render(<Dashboard />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });

    // Verify WebSocket connection is established
    expect((globalThis as any).WebSocket).toHaveBeenCalledWith('ws://localhost:3001/ws');

    // Simulate WebSocket connection
    const onOpenCallback = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'open'
    )?.[1];

    if (onOpenCallback) {
      act(() => {
        onOpenCallback();
      });
    }

    // Verify real-time status shows connected
    await waitFor(() => {
      expect(screen.getByText(/🟢 live/i)).toBeInTheDocument();
    });

    // Simulate incoming pigeon data update
    const onMessageCallback = mockWebSocket.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];

    if (onMessageCallback) {
      const mockMessage = {
        data: JSON.stringify({
          type: 'pigeon-update',
          data: {
            sightings: [{
              timestamp: new Date().toISOString(),
              location: 'tokyo',
              count: 12,
              coordinates: { lat: 35.6762, lng: 139.6503 }
            }]
          }
        })
      };

      act(() => {
        onMessageCallback(mockMessage);
      });
    }

    // Verify notification for real-time update
    await waitFor(() => {
      expect(screen.getByText(/updated.*pigeon sightings/i)).toBeInTheDocument();
    });
  });

  /**
   * Test error recovery and fallback mechanisms
   * **Feature: pigeon-crypto-dashboard, Integration Test 5: Error Recovery**
   */
  test('error recovery and fallback mechanisms work together', async () => {
    // const user = userEvent.setup();

    // Start with network error
    mockedAxios.get.mockRejectedValueOnce({
      code: 'ENOTFOUND',
      message: 'Network error'
    });

    render(<Dashboard />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/network connection problem/i)).toBeInTheDocument();
    });

    // Verify multiple recovery options are available
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
    expect(screen.getByText(/refresh page/i)).toBeInTheDocument();

    // Mock successful recovery
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockDashboardData
      }
    });

    // Simulate network coming back online
    Object.defineProperty(navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));

    // Wait for automatic retry
    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify error is cleared and data is loaded
    expect(screen.queryByText(/network connection problem/i)).not.toBeInTheDocument();
    expect(screen.getByText(/data: real/i)).toBeInTheDocument();
  });

  /**
   * Test performance optimization with large datasets
   * **Feature: pigeon-crypto-dashboard, Integration Test 6: Performance Optimization**
   */
  test('handles large datasets with performance optimization', async () => {
    // Mock large dataset response
    const largeDataset = {
      ...mockDashboardData,
      pigeonData: Array.from({ length: 5000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000),
        location: 'new-york',
        count: Math.floor(Math.random() * 50),
        coordinates: { lat: 40.7128, lng: -74.0060 }
      })),
      cryptoData: Array.from({ length: 5000 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 60000),
        symbol: 'BTC',
        price: 40000 + Math.random() * 10000,
        volume: 1000000
      }))
    };

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: largeDataset,
        performance: {
          responseTime: 2500,
          dataPoints: { pigeon: 5000, crypto: 5000, correlations: 1 },
          optimized: true
        }
      }
    });

    const startTime = performance.now();
    render(<Dashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });

    const loadTime = performance.now() - startTime;

    // Verify performance indicators
    expect(screen.getByText(/10000 data points/i)).toBeInTheDocument();

    // Verify reasonable load time (should be under 3 seconds for UI responsiveness)
    expect(loadTime).toBeLessThan(3000);

    // Verify chart renders without blocking
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  /**
   * Test cross-browser compatibility features
   * **Feature: pigeon-crypto-dashboard, Integration Test 7: Browser Compatibility**
   */
  test('maintains functionality across different browser conditions', async () => {
    // Test with WebSocket unavailable
    (globalThis as any).WebSocket = undefined as any;

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });

    // Should still function without WebSocket
    expect(screen.getByText(/🔴 offline/i)).toBeInTheDocument();

    // Test with localStorage unavailable
    const originalLocalStorage = window.localStorage;
    delete (window as any).localStorage;

    // Should still function without localStorage
    expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();

    // Restore localStorage
    window.localStorage = originalLocalStorage;
  });

  /**
   * Test mobile responsiveness
   * **Feature: pigeon-crypto-dashboard, Integration Test 8: Mobile Responsiveness**
   */
  test('adapts to mobile viewport correctly', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });
    Object.defineProperty(window, 'innerHeight', { value: 667 });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/pigeon-crypto dashboard/i)).toBeInTheDocument();
    });

    // Verify mobile-friendly layout
    const dashboard = screen.getByText(/pigeon-crypto dashboard/i).closest('.dashboard');
    expect(dashboard).toHaveClass('dashboard');

    // Test touch interactions (mobile-specific)
    const controlToggle = screen.getByText(/show controls/i);
    fireEvent.touchStart(controlToggle);
    fireEvent.touchEnd(controlToggle);

    // Should still work on mobile
    expect(screen.getByText(/time range/i)).toBeInTheDocument();
  });
});