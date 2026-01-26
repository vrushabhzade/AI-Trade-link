/**
 * Basic tests for Dashboard Component
 * 
 * Simple unit tests to verify core functionality
 */

import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({
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
  }))
}));

// Mock Chart.js to avoid canvas issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart-mock">Chart</div>,
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: () => 'mocked-date',
}));

describe('Dashboard Component', () => {
  test('renders dashboard component', () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText('Pigeon-Crypto Dashboard')).toBeTruthy();
  });

  test('displays loading state initially', () => {
    const { getByText } = render(<Dashboard />);
    expect(getByText(/Loading dashboard data/)).toBeTruthy();
  });
});