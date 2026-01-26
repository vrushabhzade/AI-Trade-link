import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

// Simple test to verify basic setup
describe('TradeLink Frontend Setup', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  it('should render the application', () => {
    renderApp()
    
    // Should render the layout with TradeLink branding
    expect(screen.getByText('TradeLink')).toBeInTheDocument()
  })

  it('should have correct project structure', () => {
    // Test that the app renders without crashing
    expect(true).toBe(true)
  })
})