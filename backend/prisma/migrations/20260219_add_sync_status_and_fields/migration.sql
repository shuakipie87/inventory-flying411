-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('NEVER_SYNCED', 'PENDING_SYNC', 'SYNCING', 'SYNCED', 'SYNC_FAILED');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "aircraft_data" JSONB,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "engine_data" JSONB,
ADD COLUMN     "last_sync_attempt_at" TIMESTAMP(3),
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "part_data" JSONB,
ADD COLUMN     "registration_no" TEXT,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "sync_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sync_error" TEXT,
ADD COLUMN     "sync_status" "SyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED';

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "external_id" TEXT,
    "error" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_listing_id_idx" ON "sync_logs"("listing_id");

-- CreateIndex
CREATE INDEX "sync_logs_created_at_idx" ON "sync_logs"("created_at");

-- CreateIndex
CREATE INDEX "sync_logs_status_idx" ON "sync_logs"("status");
