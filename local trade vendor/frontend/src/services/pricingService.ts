import { ApiResponse, PriceAnalysis, CounterOfferSuggestion, MarketData, PricingInsight } from '../types';

export interface PricingAnalysisRequest {
  productId: string;
  location?: [number, number];
  radiusKm?: number;
}

export interface CounterOfferRequest {
  productId: string;
  currentOffer: number;
  initialPrice: number;
  negotiationHistory: Array<{
    price: number;
    timestamp: Date;
    fromBuyer: boolean;
  }>;
  buyerLanguage: string;
  vendorLanguage: string;
}

export interface PricingInsightsResponse {
  insights: PricingInsight[];
  summary: {
    totalProducts: number;
    averageConfidence: number;
    underpriced: number;
    overpriced: number;
    wellPriced: number;
  };
}

class PricingService {
  private baseUrl = '/api/pricing';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    return response.json();
  }

  /**
   * Get pricing analysis for a product
   */
  async analyzePricing(request: PricingAnalysisRequest): Promise<ApiResponse<PriceAnalysis>> {
    return this.request<PriceAnalysis>('/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get market data for a category
   */
  async getMarketData(
    category: string,
    location?: [number, number],
    radiusKm?: number
  ): Promise<ApiResponse<MarketData>> {
    const params = new URLSearchParams();
    if (location) {
      params.append('location', `${location[0]},${location[1]}`);
    }
    if (radiusKm) {
      params.append('radiusKm', radiusKm.toString());
    }

    const queryString = params.toString();
    const endpoint = `/market-data/${category}${queryString ? `?${queryString}` : ''}`;
    
    return this.request<MarketData>(endpoint);
  }

  /**
   * Get counter-offer suggestion for negotiation
   */
  async getCounterOfferSuggestion(request: CounterOfferRequest): Promise<ApiResponse<CounterOfferSuggestion>> {
    return this.request<CounterOfferSuggestion>('/counter-offer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get pricing insights for vendor dashboard
   */
  async getPricingInsights(
    vendorId?: string,
    category?: string,
    timeframe: '7d' | '30d' | '90d' = '30d'
  ): Promise<ApiResponse<PricingInsightsResponse>> {
    const params = new URLSearchParams();
    if (vendorId) params.append('vendorId', vendorId);
    if (category) params.append('category', category);
    params.append('timeframe', timeframe);

    const queryString = params.toString();
    const endpoint = `/insights${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PricingInsightsResponse>(endpoint);
  }
}

export const pricingService = new PricingService();