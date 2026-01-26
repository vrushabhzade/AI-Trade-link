import {
  Transaction,
  TransactionStats,
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  ApiResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  const data: ApiResponse<T> = await response.json();
  if (!data.success || !data.data) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data.data;
};

export const transactionService = {
  /**
   * Create a new transaction from an accepted negotiation
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Get transaction by negotiation ID
   */
  async getTransactionByNegotiationId(negotiationId: string): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/negotiation/${negotiationId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Get transactions with filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${API_URL}/api/transactions?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Transaction[]>(response);
  },

  /**
   * Update transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionData): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Process payment for transaction
   */
  async processPayment(
    transactionId: string,
    paymentMethod: string,
    paymentDetails?: any
  ): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${transactionId}/payment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentMethod, paymentDetails }),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    transactionId: string,
    deliveryStatus: Transaction['deliveryStatus'],
    trackingNumber?: string
  ): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${transactionId}/delivery`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deliveryStatus, trackingNumber }),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Cancel transaction
   */
  async cancelTransaction(transactionId: string, reason?: string): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${transactionId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Create dispute
   */
  async createDispute(transactionId: string, reason: string): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${transactionId}/dispute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Resolve dispute
   */
  async resolveDispute(
    transactionId: string,
    resolution: 'refund' | 'continue'
  ): Promise<Transaction> {
    const response = await fetch(`${API_URL}/api/transactions/${transactionId}/dispute/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolution }),
    });
    return handleResponse<Transaction>(response);
  },

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId: string, role: 'buyer' | 'vendor'): Promise<TransactionStats> {
    const params = new URLSearchParams({ role });
    const response = await fetch(`${API_URL}/api/transactions/stats/${userId}?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<TransactionStats>(response);
  },
};
