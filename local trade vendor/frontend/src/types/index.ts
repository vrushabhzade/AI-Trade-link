// Core type definitions based on design document

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'vendor';
  preferredLanguage: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: Record<string, string>; // Multilingual names
  description: Record<string, string>;
  category: string;
  basePrice: number;
  currency: string;
  unit: string;
  quantityAvailable: number;
  images: string[];
  attributes: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields that may come from search results
  distance?: number; // Distance in km from user location
  vendor?: {
    businessName: Record<string, string>;
    rating: number;
    verified: boolean;
  };
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: Record<string, string>;
  description: Record<string, string>;
  address: string;
  location: [number, number]; // [longitude, latitude]
  languages: string[];
  verified: boolean;
  rating: number;
  totalSales: number;
  avatarUrl?: string;
  bannerUrl?: string;
  createdAt: Date;
}

export interface Negotiation {
  id: string;
  productId: string;
  buyerId: string;
  vendorId: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  initialPrice: number;
  currentOffer: number;
  finalPrice?: number;
  buyerLanguage: string;
  vendorLanguage: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields for UI
  product?: Product;
  buyer?: User;
  vendor?: {
    id: string;
    user: User;
    businessName: Record<string, string>;
    rating: number;
    verified: boolean;
  };
  messages?: Message[];
  messageCount?: number;
  lastActivity?: Date;
}

export interface NegotiationStats {
  total: number;
  active: number;
  accepted: number;
  rejected: number;
  expired: number;
}

export interface NegotiationInsights {
  averageNegotiationTime: number; // in hours
  successRate: number; // percentage
  averageDiscount: number; // percentage
  topCategories: Array<{ category: string; count: number }>;
}

export interface NegotiationTimeline {
  id: string;
  type: 'message' | 'offer' | 'status_change';
  description: string;
  senderId?: string;
  senderName?: string;
  data?: any;
  createdAt: Date;
}

export interface PriceOffer {
  id: string;
  senderId: string;
  senderName: string;
  priceOffer: number;
  messageType: 'offer' | 'counter_offer';
  createdAt: Date;
}

export interface AgreementConfirmation {
  negotiationId: string;
  agreedPrice: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  additionalNotes?: string;
}

export interface Message {
  id: string;
  negotiationId: string;
  senderId: string;
  originalText: string;
  originalLanguage: string;
  translations: Record<string, string>;
  messageType: 'text' | 'offer' | 'counter_offer' | 'acceptance';
  priceOffer?: number;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ProductFilters {
  category?: string;
  location?: [number, number];
  radius?: number; // in kilometers
  language: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: string;
  search?: string; // Added search field
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PriceAnalysis {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidenceScore: number;
  reasoning: string;
  negotiationRange: {
    min: number;
    max: number;
  };
  marketInsights: {
    competitorCount: number;
    averageCompetitorPrice: number;
    pricePosition: 'below' | 'at' | 'above';
    demandLevel: 'low' | 'medium' | 'high';
  };
}

export interface CounterOfferSuggestion {
  suggestedPrice: number;
  messageTemplate: string;
  acceptanceProbability: number;
  rationale: string;
  alternativeSuggestions: string[];
}

export interface MarketData {
  competitorPrices: Array<{
    vendorId: string;
    price: number;
    currency: string;
    distance?: number;
  }>;
  historicalSales: Array<{
    price: number;
    quantity: number;
    date: Date;
  }>;
  localAverage: number;
  seasonality: 'high' | 'medium' | 'low';
  demandScore: number;
}

export interface PricingInsight {
  productId: string;
  productName: Record<string, string>;
  category: string;
  currentPrice: number;
  recommendedPrice: number;
  priceGap: number;
  confidenceScore: number;
  marketPosition: 'below' | 'at' | 'above';
  demandLevel: 'low' | 'medium' | 'high';
}

export interface Transaction {
  id: string;
  negotiationId: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  quantity: number;
  agreedPrice: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  paymentMethod?: string;
  paymentStatus: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  deliveryStatus: 'pending' | 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'failed';
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  deliveryTracking?: string;
  notes?: string;
  disputeReason?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields for UI
  product?: Product;
  buyer?: User;
  vendor?: {
    id: string;
    user: User;
    businessName: Record<string, string>;
    rating: number;
    verified: boolean;
  };
  negotiation?: Negotiation;
}

export interface TransactionStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  disputed: number;
  totalRevenue: number;
}

export interface CreateTransactionData {
  negotiationId: string;
  quantity?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  notes?: string;
}

export interface UpdateTransactionData {
  status?: Transaction['status'];
  paymentMethod?: string;
  paymentStatus?: Transaction['paymentStatus'];
  deliveryStatus?: Transaction['deliveryStatus'];
  deliveryTracking?: string;
  disputeReason?: string;
}

export interface TransactionFilters {
  buyerId?: string;
  vendorId?: string;
  productId?: string;
  status?: Transaction['status'];
  paymentStatus?: Transaction['paymentStatus'];
  deliveryStatus?: Transaction['deliveryStatus'];
}
