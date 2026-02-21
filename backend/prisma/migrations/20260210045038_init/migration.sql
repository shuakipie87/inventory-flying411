-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SOLD', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "condition" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" TEXT,
    "flying411_listing_id" TEXT,
    "synced_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "webp_path" TEXT,
    "category" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listing_id" TEXT NOT NULL,

    CONSTRAINT "listing_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listing_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "model" TEXT,
    "alternates" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "source" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "part_id" TEXT NOT NULL,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "listings_flying411_listing_id_key" ON "listings"("flying411_listing_id");

-- CreateIndex
CREATE INDEX "listings_user_id_idx" ON "listings"("user_id");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at");

-- CreateIndex
CREATE INDEX "listings_flying411_listing_id_idx" ON "listings"("flying411_listing_id");

-- CreateIndex
CREATE INDEX "listing_images_listing_id_idx" ON "listing_images"("listing_id");

-- CreateIndex
CREATE INDEX "reviews_listing_id_idx" ON "reviews"("listing_id");

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_idx" ON "reviews"("reviewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "parts_part_number_key" ON "parts"("part_number");

-- CreateIndex
CREATE INDEX "parts_part_number_idx" ON "parts"("part_number");

-- CreateIndex
CREATE INDEX "parts_manufacturer_idx" ON "parts"("manufacturer");

-- CreateIndex
CREATE INDEX "parts_category_idx" ON "parts"("category");

-- CreateIndex
CREATE INDEX "price_history_part_id_idx" ON "price_history"("part_id");

-- CreateIndex
CREATE INDEX "price_history_condition_idx" ON "price_history"("condition");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
