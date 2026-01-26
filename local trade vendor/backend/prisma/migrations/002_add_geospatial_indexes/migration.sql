-- Add additional indexes for geospatial performance optimization

-- Composite index for location-based product searches
CREATE INDEX IF NOT EXISTS "products_category_active_idx" ON "products"("category", "is_active");
CREATE INDEX IF NOT EXISTS "products_price_range_idx" ON "products"("base_price", "is_active");
CREATE INDEX IF NOT EXISTS "products_vendor_active_idx" ON "products"("vendor_id", "is_active");

-- Composite index for vendor searches with location
CREATE INDEX IF NOT EXISTS "vendors_rating_verified_idx" ON "vendors"("rating", "verified");
CREATE INDEX IF NOT EXISTS "vendors_languages_idx" ON "vendors" USING GIN("languages");

-- Spatial index for more complex geospatial queries (already exists but ensuring it's optimal)
DROP INDEX IF EXISTS "vendors_location_idx";
CREATE INDEX "vendors_location_idx" ON "vendors" USING GIST ("location") WHERE "location" IS NOT NULL;

-- Index for negotiation queries by status and dates
CREATE INDEX IF NOT EXISTS "negotiations_status_created_idx" ON "negotiations"("status", "created_at");
CREATE INDEX IF NOT EXISTS "negotiations_expires_at_idx" ON "negotiations"("expires_at") WHERE "expires_at" IS NOT NULL;

-- Index for message queries by negotiation and timestamp
CREATE INDEX IF NOT EXISTS "messages_negotiation_created_idx" ON "messages"("negotiation_id", "created_at");
CREATE INDEX IF NOT EXISTS "messages_type_created_idx" ON "messages"("message_type", "created_at");

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS "products_active_created_idx" ON "products"("created_at") WHERE "is_active" = true;
CREATE INDEX IF NOT EXISTS "vendors_verified_rating_idx" ON "vendors"("rating" DESC) WHERE "verified" = true;

-- Index for user location data (JSONB)
CREATE INDEX IF NOT EXISTS "users_location_coordinates_idx" ON "users" USING GIN("location") WHERE "location" IS NOT NULL;

-- Full-text search indexes for multilingual content
CREATE INDEX IF NOT EXISTS "products_name_gin_idx" ON "products" USING GIN("name");
CREATE INDEX IF NOT EXISTS "products_description_gin_idx" ON "products" USING GIN("description");
CREATE INDEX IF NOT EXISTS "vendors_business_name_gin_idx" ON "vendors" USING GIN("business_name");

-- Index for message translations
CREATE INDEX IF NOT EXISTS "messages_translations_gin_idx" ON "messages" USING GIN("translations");