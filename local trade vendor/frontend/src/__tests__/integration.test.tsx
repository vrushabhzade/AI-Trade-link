/**
 * Frontend Integration Tests for TradeLink Marketplace
 * Tests user flows and component interactions
 * Requirements: Complete system integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock API responses
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TradeLink Frontend Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Clear all mocks
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('1. User Registration and Login Flow', () => {
    it('should navigate to registration page and register new user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'buyer',
              preferredLanguage: 'en'
            },
            token: 'test-token'
          }
        })
      });

      renderApp();
      
      // Navigate to register page
      const registerLink = screen.getByText(/register/i);
      await userEvent.click(registerLink);

      // Fill registration form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const nameInput = screen.getByLabelText(/full name/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(nameInput, 'Test User');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /register/i });
      await userEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/register'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    it('should login existing user and store token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: 'user-1',
              email: 'test@example.com',
              role: 'buyer'
            },
            token: 'test-jwt-token'
          }
        })
      });

      renderApp();

      // Navigate to login page
      const loginLink = screen.getByText(/login/i);
      await userEvent.click(loginLink);

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'Password123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /login/i });
      await userEvent.click(submitButton);

      // Verify token is stored
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('test-jwt-token');
      });
    });
  });

  describe('2. Product Search and Discovery', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        role: 'buyer',
        preferredLanguage: 'en'
      }));
    });

    it('should search for products and display results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            products: [
              {
                id: 'prod-1',
                name: { en: 'Organic Tomatoes' },
                description: { en: 'Fresh tomatoes' },
                basePrice: 3.99,
                currency: 'USD',
                images: ['tomato.jpg']
              },
              {
                id: 'prod-2',
                name: { en: 'Fresh Lettuce' },
                description: { en: 'Crispy lettuce' },
                basePrice: 2.49,
                currency: 'USD',
                images: ['lettuce.jpg']
              }
            ]
          }
        })
      });

      renderApp();

      // Navigate to products page
      const productsLink = screen.getByText(/products/i);
      await userEvent.click(productsLink);

      // Search for products
      const searchInput = screen.getByPlaceholderText(/search/i);
      await userEvent.type(searchInput, 'tomato');

      // Verify products are displayed
      await waitFor(() => {
        expect(screen.getByText('Organic Tomatoes')).toBeInTheDocument();
      });
    });

    it('should filter products by category', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            products: [
              {
                id: 'prod-1',
                name: { en: 'Organic Tomatoes' },
                category: 'vegetables',
                basePrice: 3.99
              }
            ]
          }
        })
      });

      renderApp();

      const productsLink = screen.getByText(/products/i);
      await userEvent.click(productsLink);

      // Select category filter
      const categorySelect = screen.getByLabelText(/category/i);
      await userEvent.selectOptions(categorySelect, 'vegetables');

      // Verify filtered results
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('category=vegetables'),
          expect.any(Object)
        );
      });
    });
  });

  describe('3. Negotiation Flow', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'buyer-1',
        role: 'buyer',
        preferredLanguage: 'en'
      }));
    });

    it('should initiate negotiation from product page', async () => {
      // Mock product details
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            product: {
              id: 'prod-1',
              name: { en: 'Organic Tomatoes' },
              basePrice: 3.99,
              vendorId: 'vendor-1'
            }
          }
        })
      });

      // Mock negotiation creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            negotiation: {
              id: 'neg-1',
              productId: 'prod-1',
              initialOffer: 3.50,
              status: 'active'
            }
          }
        })
      });

      renderApp();

      // View product details
      const productsLink = screen.getByText(/products/i);
      await userEvent.click(productsLink);

      // Click negotiate button
      const negotiateButton = screen.getByText(/negotiate/i);
      await userEvent.click(negotiateButton);

      // Enter offer price
      const priceInput = screen.getByLabelText(/offer price/i);
      await userEvent.type(priceInput, '3.50');

      // Submit negotiation
      const submitButton = screen.getByRole('button', { name: /send offer/i });
      await userEvent.click(submitButton);

      // Verify negotiation was created
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/negotiations'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });

  describe('4. Multilingual Support', () => {
    it('should display content in user preferred language', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        role: 'buyer',
        preferredLanguage: 'es'
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            products: [
              {
                id: 'prod-1',
                name: {
                  en: 'Organic Tomatoes',
                  es: 'Tomates Orgánicos'
                },
                basePrice: 3.99
              }
            ]
          }
        })
      });

      renderApp();

      // Products should be displayed in Spanish
      await waitFor(() => {
        expect(screen.getByText('Tomates Orgánicos')).toBeInTheDocument();
      });
    });

    it('should allow language switching', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        role: 'buyer',
        preferredLanguage: 'en'
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: 'user-1',
              preferredLanguage: 'es'
            }
          }
        })
      });

      renderApp();

      // Navigate to settings
      const settingsLink = screen.getByText(/settings/i);
      await userEvent.click(settingsLink);

      // Change language
      const languageSelect = screen.getByLabelText(/language/i);
      await userEvent.selectOptions(languageSelect, 'es');

      // Save settings
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Verify API was called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users/profile'),
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('preferredLanguage')
          })
        );
      });
    });
  });

  describe('5. Mobile Responsiveness', () => {
    it('should render mobile-optimized layout on small screens', () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      renderApp();

      // Verify mobile navigation is present
      const mobileNav = screen.getByRole('navigation');
      expect(mobileNav).toBeInTheDocument();
    });

    it('should handle touch interactions', async () => {
      renderApp();

      const button = screen.getByRole('button', { name: /login/i });
      
      // Simulate touch event
      fireEvent.touchStart(button);
      fireEvent.touchEnd(button);

      expect(button).toBeInTheDocument();
    });
  });

  describe('6. Error Handling', () => {
    it('should display error message on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderApp();

      const loginLink = screen.getByText(/login/i);
      await userEvent.click(loginLink);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'Password123!');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await userEvent.click(submitButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle offline scenarios gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      renderApp();

      // Verify offline indicator is shown
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });
  });

  describe('7. Transaction Flow', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'buyer-1',
        role: 'buyer'
      }));
    });

    it('should complete transaction from accepted negotiation', async () => {
      // Mock accepted negotiation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            negotiation: {
              id: 'neg-1',
              status: 'accepted',
              finalPrice: 3.75,
              productId: 'prod-1'
            }
          }
        })
      });

      // Mock transaction creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            transaction: {
              id: 'trans-1',
              status: 'pending',
              totalAmount: 187.5
            }
          }
        })
      });

      renderApp();

      // Navigate to negotiations
      const negotiationsLink = screen.getByText(/negotiations/i);
      await userEvent.click(negotiationsLink);

      // Complete transaction
      const completeButton = screen.getByText(/complete transaction/i);
      await userEvent.click(completeButton);

      // Verify transaction was created
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/transactions'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });
});
