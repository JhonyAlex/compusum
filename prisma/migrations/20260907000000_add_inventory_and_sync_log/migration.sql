-- AlterTable Product: add inventory and sync tracking
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "syncSource" TEXT;

-- AlterTable ProductVariant: add inventory and sync tracking
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);

-- CreateTable ProductSyncLog
CREATE TABLE IF NOT EXISTS "ProductSyncLog" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "uniqueRefs" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedCount" INTEGER NOT NULL DEFAULT 0,
    "zeroPriceCount" INTEGER NOT NULL DEFAULT 0,
    "depletedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "metadata" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProductSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductSyncLog_fileHash_idx" ON "ProductSyncLog"("fileHash");
CREATE INDEX IF NOT EXISTS "ProductSyncLog_status_idx" ON "ProductSyncLog"("status");
CREATE INDEX IF NOT EXISTS "ProductSyncLog_startedAt_idx" ON "ProductSyncLog"("startedAt");
