/**
 * Integration tests for Dashboard Real-time Updates
 * 
 * Tests WebSocket integration and real-time data updates
 * Validates Requirements 2.3, 3.3, 1.4
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  public url: string;
  
  constructor(url: string) {
    this.url = url;
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock sending data
    console.log('WebSocket send:', data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
    }
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

// Replace global WebSocket with mock
(globalThis as any).WebSocket = MockWebSocket;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('Dashboard Real-time Updates Integration', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    
    // Mock successful API response
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
          },
          commentary: [],
          highlights: []
        }
      }
    });

    // Capture WebSocket instance
    // const originalWebSocket = (globalThis as any).WebSocket;
    (globalThis as any).WebSocket = function(url: string) {
      mockWs = new MockWebSocket(url);
      return mockWs;
    };
    (globalThis as any).WebSocket.CONNECTING = MockWebSocket.CONNECTING;
    (globalThis as any).WebSocket.OPEN = MockWebSocket.OPEN;
    (globalThis as any).WebSocket.CLOSING = MockWebSocket.CLOSING;
    (globalThis as any).WebSocket.CLOSED = MockWebSocket.CLOSED;
  });

  /**
   * Test WebSocket connection establishment
   * Validates: Requirements 2.3, 3.3 (real-time connection)
   */
  test('establishes WebSocket connection for real-time updates', async () => {
    // Act
    render(<Dashboard />);

    // Wait for WebSocket connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Assert
    expect(mockWs).toBeDefined();
    expect(mockWs.url).toBe('ws://localhost:3001/ws');
    expect(mockWs.readyState).toBe(MockWebSocket.OPEN);
  });

  /**
   * Test pigeon data real-time updates
   * Validates: Requirement 2.3 (30-second pigeon data updates)
   */
  test('receives and processes pigeon data updates in real-time', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Act - Simulate pigeon data update
    const pigeonUpdate = {
      type: 'pigeon-update',
      data: {
        sightings: [
          {
            location: 'new-york',
            count: 42,
            timestamp: new Date().toISOString()
          }
        ],
        areas: ['new-york'],
        timestamp: new Date().toISOString()
      }
    };

    mockWs.simulateMessage(pigeonUpdate);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Updated 1 pigeon sightings/)).toBeInTheDocument();
    });
  });

  /**
   * Test crypto data real-time updates
   * Validates: Requirement 3.3 (30-second crypto price updates)
   */
  test('receives and processes crypto data updates in real-time', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Act - Simulate crypto data update
    const cryptoUpdate = {
      type: 'crypto-update',
      data: {
        prices: [
          {
            symbol: 'BTC',
            price: 50000,
            timestamp: new Date().toISOString()
          }
        ],
        cryptos: ['bitcoin'],
        timestamp: new Date().toISOString()
      }
    };

    mockWs.simulateMessage(cryptoUpdate);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Updated 1 crypto prices/)).toBeInTheDocument();
    });
  });

  /**
   * Test temporal synchronization
   * Validates: Requirement 1.4 (temporal alignment when time period changes)
   */
  test('maintains temporal synchronization when preferences change', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Mock WebSocket send to capture subscription messages
    const sendSpy = jest.spyOn(mockWs, 'send');

    // Act - Change preferences (expand control panel first)
    const controlToggle = screen.getByText(/Show Controls/);
    fireEvent.click(controlToggle);

    await waitFor(() => {
      expect(screen.getByText(/Hide Controls/)).toBeInTheDocument();
    });

    // Change cryptocurrency selection
    const ethereumCheckbox = screen.getByLabelText(/Ethereum/);
    fireEvent.click(ethereumCheckbox);

    // Assert - Should resubscribe with new preferences
    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ type: 'unsubscribe', dataType: 'all' })
      );
    });

    // Should subscribe with new preferences
    await waitFor(() => {
      const calls = sendSpy.mock.calls;
      const subscribeCall = calls.find(call => 
        call[0].includes('subscribe-crypto') && call[0].includes('ethereum')
      );
      expect(subscribeCall).toBeDefined();
    });
  });

  /**
   * Test real-time toggle functionality
   */
  test('allows toggling real-time updates on and off', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Act - Toggle real-time off
    const realtimeToggle = screen.getByTitle(/Disable real-time updates/);
    fireEvent.click(realtimeToggle);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/⏸️ Paused/)).toBeInTheDocument();
      expect(screen.getByText(/🔴 Offline/)).toBeInTheDocument();
    });

    // Act - Toggle real-time back on
    const pausedToggle = screen.getByTitle(/Enable real-time updates/);
    fireEvent.click(pausedToggle);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/📡 Live/)).toBeInTheDocument();
    });
  });

  /**
   * Test connection error handling
   */
  test('handles WebSocket connection errors gracefully', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for initial connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Act - Simulate connection error
    if (mockWs.onerror) {
      mockWs.onerror(new Event('error'));
    }

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/⚠️ Error/)).toBeInTheDocument();
    });
  });

  /**
   * Test notification system
   */
  test('displays notifications for real-time events', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/Real-time updates connected/)).toBeInTheDocument();
    });

    // Act - Simulate correlation update with high correlation
    const correlationUpdate = {
      type: 'correlation-update',
      data: {
        correlations: [
          {
            coefficient: 0.85,
            pValue: 0.01,
            timeRange: {
              start: new Date().toISOString(),
              end: new Date().toISOString()
            },
            significance: 'high'
          }
        ],
        highlights: ['Strong correlation detected'],
        commentary: ['Pigeons seem to predict Bitcoin!'],
        crypto: 'bitcoin',
        area: 'new-york',
        timestamp: new Date().toISOString()
      }
    };

    mockWs.simulateMessage(correlationUpdate);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Found 1 strong correlation/)).toBeInTheDocument();
    });
  });

  /**
   * Test subscription confirmations
   */
  test('handles subscription confirmations correctly', async () => {
    // Arrange
    render(<Dashboard />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/🟢 Live/)).toBeInTheDocument();
    });

    // Act - Simulate subscription confirmation
    const subscriptionConfirm = {
      type: 'subscription-confirmed',
      data: {
        dataType: 'pigeon',
        areas: ['new-york', 'london'],
        updateInterval: 30000
      }
    };

    mockWs.simulateMessage(subscriptionConfirm);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Subscribed to pigeon real-time updates/)).toBeInTheDocument();
    });
  });
});