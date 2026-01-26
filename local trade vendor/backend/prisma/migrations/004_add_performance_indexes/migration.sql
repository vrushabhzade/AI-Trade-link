-- Add performance indexes for TradeLink Marketplace
-- Requirements: System performance optimization

-- User indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Vendor indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_verified ON vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON vendors(rating DESC);
-- Spatial index for location queries (already exists from migration 002)

-- Product indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
-- Composite index for active products by category
CREATE INDEX IF NOT EXISTS idx_products_active_category ON products(is_active, category) WHERE is_active = true;
-- Composite index for vendor's active products
CREATE INDEX IF NOT EXISTS idx_products_vendor_active ON products(vendor_id, is_active) WHERE is_active = true;

-- Negotiation indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_negotiations_product_id ON negotiations(product_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_id ON negotiations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_vendor_id ON negotiations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON negotiations(status);
CREATE INDEX IF NOT EXISTS idx_negotiations_created_at ON negotiations(created_at DESC);
-- Composite index for active negotiations by buyer
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_status ON negotiations(buyer_id, status);
-- Composite index for active negotiations by vendor
CREATE INDEX IF NOT EXISTS idx_negotiations_vendor_status ON negotiations(vendor_id, status);

-- Message indexes for chat history
CREATE INDEX IF NOT EXISTS idx_messages_negotiation_id ON messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
-- Composite index for negotiation messages ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_negotiation_time ON messages(negotiation_id, created_at DESC);

-- Transaction indexes for history and reporting
CREATE INDEX IF NOT EXISTS idx_transactions_negotiation_id ON transactions(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_id ON transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_transactions_delivery_status ON transactions(delivery_status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
-- Composite index for buyer's transactions by status
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_status ON transactions(buyer_id, status);
-- Composite index for vendor's transactions by status
CREATE INDEX IF NOT EXISTS idx_transactions_vendor_status ON transactions(vendor_id, status);

-- Add GIN indexes for JSONB columns to improve multilingual search
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(name);
CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING gin(description);
CREATE INDEX IF NOT EXISTS idx_vendors_business_name_gin ON vendors USING gin(business_name);
CREATE INDEX IF NOT EXISTS idx_messages_translations_gin ON messages USING gin(translations);

-- Add partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_negotiations_active ON negotiations(buyer_id, vendor_id, created_at DESC) 
  WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(buyer_id, vendor_id, created_at DESC) 
  WHERE status = 'PENDING';
