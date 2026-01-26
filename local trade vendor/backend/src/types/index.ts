// Core type definitions matching frontend types

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'vendor' | 'admin';
  preferredLanguage: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
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

export interface Product {
  id: string;
  vendorId: string;
  name: Record<string, string>;
  description: Record<string, string>;
  category: string;
  subcategory?: string;
  basePrice: number;
  currency: string;
  unit: string;
  quantityAvailable: number;
  images: string[];
  attributes: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
  retryable?: boolean;
  retryAfter?: number;
}

export interface ProductFilters {
  category?: string;
  location?: [number, number];
  radius?: number;
  language: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: string;
  search?: string;
}

export interface TranslationContext {
  type: 'product' | 'negotiation' | 'general';
  productName?: string;
  negotiationId?: string;
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
  completedAt?: Date;
}

export interface TransactionFilters {
  buyerId?: string;
  vendorId?: string;
  productId?: string;
  status?: Transaction['status'];
  paymentStatus?: Transaction['paymentStatus'];
  deliveryStatus?: Transaction['deliveryStatus'];
}
