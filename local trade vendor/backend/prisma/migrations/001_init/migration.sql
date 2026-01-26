-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('ACTIVE', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'OFFER', 'COUNTER_OFFER', 'ACCEPTANCE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "location" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" JSONB NOT NULL,
    "description" JSONB,
    "address" TEXT,
    "location" POINT,
    "languages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    "total_sales" INTEGER NOT NULL DEFAULT 0,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "base_price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "unit" TEXT,
    "quantity_available" INTEGER,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negotiations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'ACTIVE',
    "initial_price" DECIMAL(10,2) NOT NULL,
    "current_offer" DECIMAL(10,2),
    "final_price" DECIMAL(10,2),
    "buyer_language" TEXT NOT NULL,
    "vendor_language" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "negotiation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "original_language" TEXT NOT NULL,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "price_offer" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");

-- CreateIndex
CREATE INDEX "vendors_location_idx" ON "vendors" USING GIST ("location");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_vendor_id_idx" ON "products"("vendor_id");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "negotiations_status_idx" ON "negotiations"("status");

-- CreateIndex
CREATE INDEX "negotiations_buyer_id_idx" ON "negotiations"("buyer_id");

-- CreateIndex
CREATE INDEX "negotiations_vendor_id_idx" ON "negotiations"("vendor_id");

-- CreateIndex
CREATE INDEX "messages_negotiation_id_idx" ON "messages"("negotiation_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON UPDATE CASCADE;