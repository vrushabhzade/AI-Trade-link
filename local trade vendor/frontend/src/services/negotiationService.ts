import { 
  Negotiation, 
  NegotiationStats, 
  NegotiationInsights, 
  NegotiationTimeline, 
  PriceOffer, 
  CounterOfferSuggestion,
  ApiResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class NegotiationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Create a new negotiation
   */
  async createNegotiation(data: {
    productId: string;
    initialPrice: number;
    buyerLanguage?: string;
    vendorLanguage?: string;
    message?: string;
  }): Promise<Negotiation> {
    const response = await fetch(`${API_BASE_URL}/negotiations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result: ApiResponse<Negotiation> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to create negotiation');
    }

    return result.data;
  }

  /**
   * Get negotiation by ID
   */
  async getNegotiation(id: string): Promise<Negotiation> {
    const response = await fetch(`${API_BASE_URL}/negotiations/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<Negotiation> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to fetch negotiation');
    }

    return result.data;
  }

  /**
   * Get user's negotiations
   */
  async getNegotiations(filters?: {
    status?: string;
    role?: 'buyer' | 'vendor';
  }): Promise<Negotiation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.role) params.append('role', filters.role);

    const response = await fetch(`${API_BASE_URL}/negotiations?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<Negotiation[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to fetch negotiations');
    }

    return result.data;
  }

  /**
   * Make a counter offer
   */
  async makeCounterOffer(negotiationId: string, data: {
    amount: number;
    message?: string;
  }): Promise<Negotiation> {
    const response = await fetch(`${API_BASE_URL}/negotiations/${negotiationId}/counter-offer`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result: ApiResponse<Negotiation> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to make counter offer');
    }

    return result.data;
  }

  /**
   * Accept negotiation
   */
  async acceptNegotiation(negotiationId: string, data: {
    finalPrice?: number;
    message?: string;
  }): Promise<Negotiation> {
    const response = await fetch(`${API_BASE_URL}/negotiations/${negotiationId}/accept`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result: ApiResponse<Negotiation> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to accept negotiation');
    }

    return result.data;
  }

  /**
   * Reject negotiation
   */
  async rejectNegotiation(negotiationId: string, data: {
    message?: string;
  }): Promise<Negotiation> {
    const response = await fetch(`${API_BASE_URL}/negotiations/${negotiationId}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result: ApiResponse<Negotiation> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to reject negotiation');
    }

    return result.data;
  }

  /**
   * Get AI-powered response suggestions
   */
  async getSuggestions(negotiationId: string): Promise<CounterOfferSuggestion> {
    const response = await fetch(`${API_BASE_URL}/negotiations/${negotiationId}/suggestions`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<CounterOfferSuggestion> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get suggestions');
    }

    return result.data;
  }

  /**
   * Get negotiation statistics
   */
  async getStats(role: 'buyer' | 'vendor'): Promise<NegotiationStats> {
    const response = await fetch(`${API_BASE_URL}/negotiations/stats/${role}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<NegotiationStats> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get negotiation stats');
    }

    return result.data;
  }

  /**
   * Get negotiation insights
   */
  async getInsights(role: 'buyer' | 'vendor'): Promise<NegotiationInsights> {
    const response = await fetch(`${API_BASE_URL}/negotiations/insights/${role}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<NegotiationInsights> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get negotiation insights');
    }

    return result.data;
  }

  /**
   * Get negotiation status and progress
   */
  async getNegotiationStatus(negotiationId: string): Promise<{
    negotiationId: string;
    status: string;
    currentOffer?: number;
    finalPrice?: number;
    messageCount: number;
    lastActivity: Date;
    expiresAt?: Date;
    participants: {
      buyer: { id: string; fullName: string };
      vendor: { id: string; fullName: string };
    };
    recentActivity: Array<{
      id: string;
      senderId: string;
      senderName: string;
      messageType: string;
      priceOffer?: number;
      createdAt: Date;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/chat/negotiations/${negotiationId}/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<any> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get negotiation status');
    }

    return result.data;
  }

  /**
   * Get price offer history
   */
  async getPriceOfferHistory(negotiationId: string): Promise<PriceOffer[]> {
    const response = await fetch(`${API_BASE_URL}/chat/negotiations/${negotiationId}/offers`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<{ offers: PriceOffer[] }> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get offer history');
    }

    return result.data.offers;
  }

  /**
   * Get negotiation timeline
   */
  async getNegotiationTimeline(negotiationId: string): Promise<NegotiationTimeline[]> {
    const response = await fetch(`${API_BASE_URL}/chat/negotiations/${negotiationId}/timeline`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const result: ApiResponse<{ timeline: NegotiationTimeline[] }> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to get negotiation timeline');
    }

    return result.data.timeline;
  }

  /**
   * Format price with currency
   */
  formatPrice(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Calculate negotiation progress percentage
   */
  calculateProgress(negotiation: Negotiation): number {
    if (negotiation.status !== 'active') {
      return negotiation.status === 'accepted' ? 100 : 0;
    }

    const initialPrice = negotiation.initialPrice;
    const currentOffer = negotiation.currentOffer;
    
    // Simple progress calculation based on price movement
    // This could be enhanced with more sophisticated logic
    const priceMovement = Math.abs(currentOffer - initialPrice) / initialPrice;
    return Math.min(priceMovement * 100, 90); // Cap at 90% for active negotiations
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-100';
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Get time remaining until expiration
   */
  getTimeRemaining(expiresAt: Date): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
}

export const negotiationService = new NegotiationService();