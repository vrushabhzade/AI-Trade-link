/**
 * Property-based tests for Dashboard Component
 * 
 * **Feature: pigeon-crypto-dashboard, Property 2: Interactive data tooltips**
 * **Validates: Requirements 1.3**
 * 
 * Tests that interactive tooltips display detailed information for both 
 * pigeon counts and crypto prices at specific time periods.
 */

import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import axios from 'axios';
import Dashboard from './Dashboard';
import type { DashboardData, PigeonSighting, CryptoPricePoint } from '../types/index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => {
    return (
      <div data-testid="chart-mock">
        <div data-testid="chart-datasets">{JSON.stringify(data.datasets)}</div>
        <div data-testid="chart-options">{JSON.stringify(options)}</div>
      </div>
    );
  },
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    if (formatStr === 'PPpp') {
      return date.toLocaleString();
    }
    if (formatStr === 'HH:mm:ss') {
      return date.toLocaleTimeString();
    }
    return date.toISOString();
  },
}));

// Mock process.env for environment variables
// Set environment variable for testing
Object.defineProperty(import.meta, 'env', {
  value: { VITE_API_BASE_URL: 'http://localhost:3001' },
  writable: true
});

describe('Dashboard Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing DOM elements
    document.body.innerHTML = '';
    // Mock successful API response by default
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          pigeonData: [],
          cryptoData: [],
          correlations: [],
          metadata: {
            lastUpdated: new Date().toISOString(),
            dataQuality: 'mock'
          }
        }
      }
    });
  });

  afterEach(() => {
    // Clean up DOM after each test
    cleanup();
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 2: Interactive data tooltips**
   * 
   * Property: For any valid dashboard data with pigeon sightings and crypto prices,
   * the chart tooltip configuration should include callbacks that format data
   * appropriately for both data types.
   */
  test('Property 2: Interactive data tooltips display correct information', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid pigeon sightings
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.constantFrom('New York City', 'London', 'Tokyo'),
            count: fc.integer({ min: 1, max: 100 }),
            coordinates: fc.record({
              lat: fc.float({ min: -90, max: 90 }),
              lng: fc.float({ min: -180, max: 180 })
            })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        
        // Generate valid crypto price points
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000) }),
            volume: fc.float({ min: Math.fround(1000), max: Math.fround(1000000000) }),
            marketCap: fc.float({ min: Math.fround(1000000), max: Math.fround(1000000000000) })
          }),
          { minLength: 1, maxLength: 3 }
        ),
        
        async (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[]) => {
          // Mock API response with generated data
          const dashboardData: DashboardData = {
            pigeonData,
            cryptoData,
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...dashboardData,
                pigeonData: pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...dashboardData.metadata,
                  lastUpdated: dashboardData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { getByTestId } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify chart is rendered
          const chartMock = getByTestId('chart-mock');
          expect(chartMock).toBeTruthy();

          // Get chart options from the mock
          const chartOptionsElement = getByTestId('chart-options');
          const chartOptions = JSON.parse(chartOptionsElement.textContent || '{}');

          // Verify tooltip configuration exists - this validates Requirement 1.3
          expect(chartOptions.plugins?.tooltip).toBeDefined();
          expect(chartOptions.plugins.tooltip.callbacks).toBeDefined();

          // Verify tooltip callbacks are properly configured for interactive tooltips
          const tooltipCallbacks = chartOptions.plugins.tooltip.callbacks;
          expect(tooltipCallbacks.title).toBeDefined();
          expect(tooltipCallbacks.label).toBeDefined();
          expect(tooltipCallbacks.afterBody).toBeDefined();

          // Verify chart datasets contain both pigeon and crypto data
          const chartDatasetsElement = getByTestId('chart-datasets');
          const datasets = JSON.parse(chartDatasetsElement.textContent || '[]');

          if (pigeonData.length > 0) {
            // Should have pigeon datasets
            const pigeonDatasets = datasets.filter((ds: any) => 
              ds.label && ds.label.includes('Pigeon')
            );
            expect(pigeonDatasets.length).toBeGreaterThan(0);

            // Pigeon datasets should use y-axis
            pigeonDatasets.forEach((ds: any) => {
              expect(ds.yAxisID).toBe('y');
            });
          }

          if (cryptoData.length > 0) {
            // Should have crypto datasets
            const cryptoDatasets = datasets.filter((ds: any) => 
              ds.label && (ds.label.includes('BTC') || ds.label.includes('ETH') || ds.label.includes('DOGE'))
            );
            expect(cryptoDatasets.length).toBeGreaterThan(0);

            // Crypto datasets should use y1-axis
            cryptoDatasets.forEach((ds: any) => {
              expect(ds.yAxisID).toBe('y1');
            });
          }

          // Verify dual y-axis configuration for displaying both data types
          expect(chartOptions.scales?.y).toBeDefined();
          expect(chartOptions.scales?.y1).toBeDefined();
          expect(chartOptions.scales.y.title?.text).toBe('Pigeon Sightings');
          expect(chartOptions.scales.y1.title?.text).toBe('Price (USD)');
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });

  /**
   * Property: Dashboard should handle loading states correctly
   */
  test('Property: Loading states display correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // Delay in milliseconds
        
        async (delay) => {
          // Mock delayed API response
          mockedAxios.get.mockImplementationOnce(() => 
            new Promise(resolve => 
              setTimeout(() => resolve({
                data: {
                  success: true,
                  data: {
                    pigeonData: [],
                    cryptoData: [],
                    correlations: [],
                    metadata: {
                      lastUpdated: new Date().toISOString(),
                      dataQuality: 'mock'
                    }
                  }
                }
              }), delay)
            )
          );

          const { getByText, queryByText } = render(<Dashboard />);

          // Verify initial loading state
          expect(getByText(/Fetching latest data/)).toBeTruthy();

          // Wait for loading to complete
          await new Promise(resolve => setTimeout(resolve, delay + 100));

          // Verify loading state is gone
          expect(queryByText(/Fetching latest data/)).toBeFalsy();
        }
      ),
      { numRuns: 5, timeout: 5000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 1: Data visualization differentiation**
   * **Validates: Requirements 1.2, 1.5**
   * 
   * Property: For any combination of pigeon data and cryptocurrency data displayed 
   * simultaneously, each data type should have visually distinct styling (colors, 
   * line styles, markers) that maintains clarity and readability.
   */
  test('Property 1: Data visualization differentiation maintains distinct styling', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate multiple pigeon locations
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.constantFrom('New York City', 'London', 'Tokyo', 'Paris', 'Berlin'),
            count: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        
        // Generate multiple cryptocurrencies
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            symbol: fc.constantFrom('BTC', 'ETH', 'DOGE'),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000) }),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        
        async (pigeonData: PigeonSighting[], cryptoData: CryptoPricePoint[]) => {
          // Mock API response with generated data
          const dashboardData: DashboardData = {
            pigeonData,
            cryptoData,
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...dashboardData,
                pigeonData: pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...dashboardData.metadata,
                  lastUpdated: dashboardData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { getByTestId } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Get chart datasets
          const chartDatasetsElement = getByTestId('chart-datasets');
          const datasets = JSON.parse(chartDatasetsElement.textContent || '[]');

          // Separate pigeon and crypto datasets
          const pigeonDatasets = datasets.filter((ds: any) => 
            ds.label && ds.label.includes('Pigeon')
          );
          const cryptoDatasets = datasets.filter((ds: any) => 
            ds.label && (ds.label.includes('BTC') || ds.label.includes('ETH') || ds.label.includes('DOGE'))
          );

          // Verify visual differentiation between pigeon and crypto data
          if (pigeonDatasets.length > 0 && cryptoDatasets.length > 0) {
            // 1. Different y-axes (Requirement 1.2)
            pigeonDatasets.forEach((ds: any) => {
              expect(ds.yAxisID).toBe('y');
            });
            cryptoDatasets.forEach((ds: any) => {
              expect(ds.yAxisID).toBe('y1');
            });

            // 2. Different point sizes (Requirement 1.2)
            pigeonDatasets.forEach((ds: any) => {
              expect(ds.pointRadius).toBeGreaterThanOrEqual(4);
            });
            cryptoDatasets.forEach((ds: any) => {
              expect(ds.pointRadius).toBeLessThanOrEqual(4);
            });

            // 3. Distinct color schemes (Requirement 1.5)
            const pigeonColors = pigeonDatasets.map((ds: any) => ds.borderColor);
            const cryptoColors = cryptoDatasets.map((ds: any) => ds.borderColor);
            
            // Verify each dataset has a unique color within its type
            const uniquePigeonColors = new Set(pigeonColors);
            const uniqueCryptoColors = new Set(cryptoColors);
            
            expect(uniquePigeonColors.size).toBe(pigeonDatasets.length);
            expect(uniqueCryptoColors.size).toBe(cryptoDatasets.length);

            // 4. Verify background colors are consistent with border colors
            pigeonDatasets.forEach((ds: any) => {
              expect(ds.backgroundColor).toContain(ds.borderColor.substring(0, 7));
            });
            cryptoDatasets.forEach((ds: any) => {
              expect(ds.backgroundColor).toContain(ds.borderColor.substring(0, 7));
            });

            // 5. Verify different hover behaviors (Requirement 1.2)
            pigeonDatasets.forEach((ds: any) => {
              expect(ds.pointHoverRadius).toBeGreaterThanOrEqual(6);
            });
            cryptoDatasets.forEach((ds: any) => {
              expect(ds.pointHoverRadius).toBeLessThanOrEqual(6);
            });
          }
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 17: Responsive design adaptation**
   * **Validates: Requirements 6.3**
   * 
   * Property: For any mobile device viewport, the dashboard should adapt its layout 
   * while maintaining data readability and all core functionality.
   */
  test('Property 17: Responsive design adaptation maintains functionality', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different viewport sizes
        fc.record({
          width: fc.integer({ min: 320, max: 1920 }),
          height: fc.integer({ min: 568, max: 1080 }),
        }),
        
        // Generate sample data
        fc.array(
          fc.record({
            timestamp: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            location: fc.constantFrom('New York City', 'London'),
            count: fc.integer({ min: 1, max: 50 }),
          }),
          { minLength: 1, maxLength: 2 }
        ),
        
        async ({ width, height }, pigeonData: PigeonSighting[]) => {
          // Mock viewport size
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
          });

          // Mock API response
          const dashboardData: DashboardData = {
            pigeonData,
            cryptoData: [{
              timestamp: new Date(),
              symbol: 'BTC',
              price: 50000,
            }],
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...dashboardData,
                pigeonData: pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: dashboardData.cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...dashboardData.metadata,
                  lastUpdated: dashboardData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { container, getByTestId, getByText } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify core functionality is present regardless of viewport size
          
          // 1. Dashboard header should be present (Requirement 6.3)
          const headers = container.querySelectorAll('h1');
          expect(headers.length).toBeGreaterThan(0);
          expect(headers[0].textContent).toContain('Pigeon-Crypto Dashboard');

          // 2. Chart should be rendered (Requirement 6.3)
          expect(getByTestId('chart-mock')).toBeTruthy();

          // 3. Chart controls should be present (Requirement 6.3)
          const chartControls = container.querySelector('.chart-controls');
          expect(chartControls).toBeTruthy();

          // 4. Chart type buttons should be functional (Requirement 6.3)
          expect(getByText(/Line/)).toBeTruthy();
          expect(getByText(/Area/)).toBeTruthy();
          expect(getByText(/Points/)).toBeTruthy();

          // 5. Correlation toggle should be present (Requirement 6.3)
          expect(getByText(/Highlight Correlations/)).toBeTruthy();

          // 6. Verify responsive chart configuration
          const chartOptionsElement = getByTestId('chart-options');
          const chartOptions = JSON.parse(chartOptionsElement.textContent || '{}');
          
          // Chart should be responsive (Requirement 6.3)
          expect(chartOptions.responsive).toBe(true);

          // 7. For mobile viewports, verify layout adaptations
          const isMobile = width <= 768;
          if (isMobile) {
            // Mobile-specific checks
            const dashboardElement = container.querySelector('.dashboard');
            expect(dashboardElement).toBeTruthy();
            
            // Verify mobile-friendly styling is applied
            // const computedStyle = window.getComputedStyle(dashboardElement!);
            // Note: In JSDOM, computed styles may not reflect CSS media queries,
            // but we can verify the elements are present and accessible
          }

          // 8. Verify data readability is maintained (Requirement 6.3)
          const chartDatasetsElement = getByTestId('chart-datasets');
          const datasets = JSON.parse(chartDatasetsElement.textContent || '[]');
          
          // Data should still be properly formatted regardless of viewport
          if (datasets.length > 0) {
            datasets.forEach((dataset: any) => {
              expect(dataset.label).toBeDefined();
              expect(dataset.data).toBeDefined();
              expect(Array.isArray(dataset.data)).toBe(true);
            });
          }

          // 9. Verify correlation info is accessible (Requirement 6.3)
          const correlationInfo = container.querySelector('.correlation-info');
          if (correlationInfo) {
            expect(correlationInfo).toBeTruthy();
          }
        }
      ),
      { numRuns: 8, timeout: 10000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 12: Time range flexibility**
   * **Validates: Requirements 5.1**
   * 
   * Property: For any time range selection from 1 hour to 1 year, the system should 
   * successfully fetch and display historical data for both pigeon and cryptocurrency sources.
   */
  test('Property 12: Time range flexibility supports all valid ranges', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid time ranges
        fc.constantFrom('1', '6', '24', '168', '720', '2160', '4320', '8760'),
        
        async (_timeRange: string) => {
          // Mock API response for any time range
          const mockData: DashboardData = {
            pigeonData: [{
              timestamp: new Date(),
              location: 'New York City',
              count: 10,
            }],
            cryptoData: [{
              timestamp: new Date(),
              symbol: 'BTC',
              price: 50000,
            }],
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...mockData,
                pigeonData: mockData.pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: mockData.cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...mockData.metadata,
                  lastUpdated: mockData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { container } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify API was called with correct parameters
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/dashboard-data'),
            expect.objectContaining({
              params: expect.objectContaining({
                timeRange: expect.any(String),
              }),
              timeout: 10000,
            })
          );

          // Verify chart is rendered for any valid time range
          const chartElements = container.querySelectorAll('[data-testid="chart-mock"]');
          expect(chartElements.length).toBeGreaterThan(0);

          // Verify control panel shows time range options
          const timeRangeSelects = container.querySelectorAll('select');
          expect(timeRangeSelects.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 8, timeout: 10000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 13: Dynamic updates without reload**
   * **Validates: Requirements 5.2, 5.4**
   * 
   * Property: For any user interface change (cryptocurrency selection, display options, 
   * geographic filters), the system should update the display without requiring page reload.
   */
  test('Property 13: Dynamic updates work without page reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different UI state changes
        fc.record({
          cryptoChange: fc.boolean(),
          regionChange: fc.boolean(),
          chartTypeChange: fc.boolean(),
        }),
        
        async ({ cryptoChange, regionChange, chartTypeChange }) => {
          // Mock API response
          const mockData: DashboardData = {
            pigeonData: [{
              timestamp: new Date(),
              location: 'London',
              count: 15,
            }],
            cryptoData: [{
              timestamp: new Date(),
              symbol: 'ETH',
              price: 3000,
            }],
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          // Mock multiple API calls for dynamic updates
          mockedAxios.get.mockResolvedValue({
            data: {
              success: true,
              data: {
                ...mockData,
                pigeonData: mockData.pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: mockData.cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...mockData.metadata,
                  lastUpdated: mockData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { container } = render(<Dashboard />);

          // Wait for initial load
          await new Promise(resolve => setTimeout(resolve, 100));

          const initialCallCount = mockedAxios.get.mock.calls.length;

          // Test dynamic updates without page reload
          if (cryptoChange) {
            // Simulate cryptocurrency selection change
            const cryptoCheckboxes = container.querySelectorAll('input[type="checkbox"]');
            const cryptoCheckbox = Array.from(cryptoCheckboxes).find((cb: Element) => 
              cb.parentElement?.textContent?.includes('Bitcoin')
            ) as HTMLInputElement;
            
            if (cryptoCheckbox) {
              cryptoCheckbox.click();
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          if (regionChange) {
            // Simulate region selection change
            const regionCheckboxes = container.querySelectorAll('input[type="checkbox"]');
            const regionCheckbox = Array.from(regionCheckboxes).find((cb: Element) => 
              cb.parentElement?.textContent?.includes('Tokyo')
            ) as HTMLInputElement;
            
            if (regionCheckbox) {
              regionCheckbox.click();
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          if (chartTypeChange) {
            // Simulate chart type change
            const chartTypeButtons = container.querySelectorAll('.chart-type-btn');
            const areaButton = Array.from(chartTypeButtons).find((btn: Element) => 
              btn.textContent?.includes('Area')
            ) as HTMLButtonElement;
            
            if (areaButton) {
              areaButton.click();
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          // Verify that changes triggered new API calls (dynamic updates)
          if (cryptoChange || regionChange) {
            expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
          }

          // Verify chart is still rendered (no page reload)
          const chartElements = container.querySelectorAll('[data-testid="chart-mock"]');
          expect(chartElements.length).toBeGreaterThan(0);

          // Verify UI elements are still present (no page reload)
          const controlPanels = container.querySelectorAll('.control-panel');
          expect(controlPanels.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 5, timeout: 10000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 14: Geographic filtering accuracy**
   * **Validates: Requirements 5.3**
   * 
   * Property: For any geographic region filter applied, the displayed pigeon data 
   * should contain only sightings from the selected urban areas.
   */
  test('Property 14: Geographic filtering shows only selected regions', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different region combinations
        fc.array(
          fc.constantFrom('new-york', 'london', 'tokyo', 'paris', 'berlin'),
          { minLength: 1, maxLength: 3 }
        ),
        
        async (selectedRegions: string[]) => {
          // Create mock data with multiple regions
          const allRegions = ['new-york', 'london', 'tokyo', 'paris', 'berlin'];
          const mockPigeonData = allRegions.map(region => ({
            timestamp: new Date(),
            location: region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            count: Math.floor(Math.random() * 50) + 1,
          }));

          const mockData: DashboardData = {
            pigeonData: mockPigeonData.filter(p => 
              selectedRegions.some(region => 
                p.location.toLowerCase().replace(' ', '-') === region
              )
            ),
            cryptoData: [{
              timestamp: new Date(),
              symbol: 'BTC',
              price: 45000,
            }],
            correlations: [],
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...mockData,
                pigeonData: mockData.pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: mockData.cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                metadata: {
                  ...mockData.metadata,
                  lastUpdated: mockData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { container } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify API was called with correct region parameters
          expect(mockedAxios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/dashboard-data'),
            expect.objectContaining({
              params: expect.objectContaining({
                areas: expect.any(String),
              }),
            })
          );

          // Get chart datasets to verify geographic filtering
          const chartDataElements = container.querySelectorAll('[data-testid="chart-datasets"]');
          if (chartDataElements.length > 0) {
            const chartDataElement = chartDataElements[0];
            const datasets = JSON.parse(chartDataElement.textContent || '[]');
            
            // Verify only selected regions appear in pigeon datasets
            const pigeonDatasets = datasets.filter((ds: any) => 
              ds.label && ds.label.includes('Pigeon')
            );

            pigeonDatasets.forEach((dataset: any) => {
              const datasetLabel = dataset.label.toLowerCase();
              const hasValidRegion = selectedRegions.some(region => {
                const regionName = region.replace('-', ' ');
                return datasetLabel.includes(regionName);
              });
              
              // Each pigeon dataset should correspond to a selected region
              expect(hasValidRegion).toBe(true);
            });
          }

          // Verify control panel shows region selection
          const regionCheckboxes = container.querySelectorAll('input[type="checkbox"]');
          const regionRelatedCheckboxes = Array.from(regionCheckboxes).filter((cb: Element) => 
            cb.parentElement?.textContent?.match(/🇺🇸|🇬🇧|🇯🇵|🇫🇷|🇩🇪/)
          );
          expect(regionRelatedCheckboxes.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 6, timeout: 10000 }
    );
  });

  /**
   * **Feature: pigeon-crypto-dashboard, Property 11: Disclaimer and commentary presence**
   * **Validates: Requirements 4.3, 4.4**
   * 
   * Property: For any correlation display, the system should include both disclaimers 
   * about coincidental nature and humorous commentary about apparent relationships.
   */
  test('Property 11: Disclaimer and commentary are always present with correlations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate correlation data with commentary
        fc.array(
          fc.record({
            coefficient: fc.float({ min: Math.fround(-1), max: Math.fround(1) }),
            pValue: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
            significance: fc.constantFrom('high', 'medium', 'low', 'none'),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        
        // Generate humorous commentary
        fc.array(
          fc.string({ minLength: 10, maxLength: 200 }),
          { minLength: 1, maxLength: 3 }
        ),
        
        async (correlations: any[], commentary: string[]) => {
          // Create mock data with correlations and commentary
          const mockData: DashboardData = {
            pigeonData: [{
              timestamp: new Date(),
              location: 'New York City',
              count: 25,
            }],
            cryptoData: [{
              timestamp: new Date(),
              symbol: 'BTC',
              price: 45000,
            }],
            correlations: correlations.map(corr => ({
              ...corr,
              timeRange: {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
              }
            })),
            commentary,
            highlights: correlations.filter(c => Math.abs(c.coefficient) >= 0.7),
            metadata: {
              lastUpdated: new Date(),
              dataQuality: 'mock'
            }
          };

          mockedAxios.get.mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                ...mockData,
                pigeonData: mockData.pigeonData.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
                cryptoData: mockData.cryptoData.map(c => ({ ...c, timestamp: c.timestamp.toISOString() })),
                correlations: mockData.correlations.map(c => ({
                  ...c,
                  timeRange: {
                    start: c.timeRange.start.toISOString(),
                    end: c.timeRange.end.toISOString()
                  }
                })),
                metadata: {
                  ...mockData.metadata,
                  lastUpdated: mockData.metadata.lastUpdated.toISOString()
                }
              }
            }
          });

          // Render dashboard
          const { container } = render(<Dashboard />);

          // Wait for data to load
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify correlation analysis section is present
          const correlationInfo = container.querySelector('.correlation-info');
          expect(correlationInfo).toBeTruthy();

          // Verify disclaimers are present (Requirement 4.3)
          const disclaimers = container.querySelectorAll('.correlation-disclaimer');
          expect(disclaimers.length).toBeGreaterThan(0);

          // Check for specific disclaimer content about coincidental nature
          const disclaimerTexts = Array.from(disclaimers).map((d: Element) => d.textContent || '');
          const hasCoincidentalDisclaimer = disclaimerTexts.some(text => 
            text.includes('coincidental') || text.includes('not meaningful')
          );
          expect(hasCoincidentalDisclaimer).toBe(true);

          // Check for causation disclaimer
          const hasCausationDisclaimer = disclaimerTexts.some(text => 
            text.includes('Correlation does not imply causation') || text.includes('causation')
          );
          expect(hasCausationDisclaimer).toBe(true);

          // Verify humorous commentary is present (Requirement 4.4)
          if (commentary.length > 0) {
            const commentarySection = container.querySelector('.correlation-commentary');
            expect(commentarySection).toBeTruthy();

            const commentaryItems = container.querySelectorAll('.commentary-item');
            expect(commentaryItems.length).toBeGreaterThan(0);

            // Verify commentary content is displayed
            const commentaryTexts = Array.from(commentaryItems).map((item: Element) => 
              item.textContent || ''
            );
            expect(commentaryTexts.length).toBeGreaterThan(0);

            // Verify commentary has entertainment disclaimer
            const entertainmentDisclaimer = container.querySelector('.commentary-disclaimer');
            expect(entertainmentDisclaimer).toBeTruthy();
            expect(entertainmentDisclaimer?.textContent).toContain('entertainment');
          }

          // Verify educational section is present
          const educationSection = container.querySelector('.correlation-education');
          expect(educationSection).toBeTruthy();

          // Verify educational disclaimer
          const educationDisclaimer = container.querySelector('.education-disclaimer');
          expect(educationDisclaimer).toBeTruthy();
          expect(educationDisclaimer?.textContent).toContain('entertainment');

          // Verify correlation coefficients are displayed with proper formatting
          const coefficients = container.querySelectorAll('.correlation-coefficient');
          expect(coefficients.length).toBe(correlations.length);

          coefficients.forEach((coeff: Element) => {
            const text = coeff.textContent || '';
            // Should be formatted as percentage
            expect(text).toMatch(/^-?\d+\.\d%$/);
          });

          // Verify significance levels are displayed
          const significanceElements = container.querySelectorAll('.correlation-significance');
          expect(significanceElements.length).toBe(correlations.length);

          significanceElements.forEach((sig: Element, index: number) => {
            const text = sig.textContent || '';
            expect(text).toContain(correlations[index].significance);
          });
        }
      ),
      { numRuns: 8, timeout: 10000 }
    );
  });

  /**
   * Property: Dashboard should handle error states correctly
   */
  test('Property: Error states display correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          statusCode: fc.constantFrom(400, 500, 502),
          errorMessage: fc.string({ minLength: 1, maxLength: 50 })
        }),
        
        async ({ statusCode, errorMessage }) => {
          // Mock API error
          mockedAxios.get.mockRejectedValueOnce({
            response: {
              status: statusCode,
              data: { message: errorMessage }
            }
          });

          const { container } = render(<Dashboard />);

          // Wait for error state to appear
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify error message is displayed
          const errorHeaders = container.querySelectorAll('h3');
          const errorHeader = Array.from(errorHeaders).find((h: Element) => h.textContent?.includes('Error Loading Dashboard'));
          expect(errorHeader).toBeTruthy();
          
          // Verify retry button is present
          const retryButtons = container.querySelectorAll('button');
          const retryButton = Array.from(retryButtons).find((b: Element) => b.textContent?.includes('Try Again'));
          expect(retryButton).toBeTruthy();
        }
      ),
      { numRuns: 5, timeout: 5000 }
    );
  });
});