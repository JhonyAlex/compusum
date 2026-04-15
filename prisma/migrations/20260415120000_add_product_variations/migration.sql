-- Product variations model
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "normalizedName" TEXT NOT NULL,
  "price" DOUBLE PRECISION,
  "wholesalePrice" DOUBLE PRECISION,
  "stockStatus" TEXT NOT NULL DEFAULT 'disponible',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductVariant_productId_fkey'
  ) THEN
    ALTER TABLE "ProductVariant"
      ADD CONSTRAINT "ProductVariant_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_productId_normalizedName_key"
  ON "ProductVariant"("productId", "normalizedName");

CREATE INDEX IF NOT EXISTS "ProductVariant_productId_isActive_sortOrder_idx"
  ON "ProductVariant"("productId", "isActive", "sortOrder");

-- Cart item variant snapshot and relation
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantName" TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "variantCode" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CartItem_variantId_fkey'
  ) THEN
    ALTER TABLE "CartItem"
      ADD CONSTRAINT "CartItem_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_variantId_key"
  ON "CartItem"("cartId", "productId", "variantId");

CREATE INDEX IF NOT EXISTS "CartItem_variantId_idx"
  ON "CartItem"("variantId");

-- Order item variant snapshot
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantCode" TEXT;
