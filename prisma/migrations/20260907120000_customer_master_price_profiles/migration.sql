-- Fase 2: Maestro de clientes (extensión B2B de User) + Perfiles de precio
-- Migración idempotente apta para `prisma migrate deploy` en producción.

-- AlterTable User: extensión B2B del maestro de clientes
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "priceProfileId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- CreateTable PriceProfile (perfiles/listas de precios comerciales)
CREATE TABLE IF NOT EXISTS "PriceProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "percentAdjustment" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable PriceProfileProduct (override por producto; modelo separado del de
-- variante para evitar índices únicos con columnas nullable en PostgreSQL)
CREATE TABLE IF NOT EXISTS "PriceProfileProduct" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "wholesalePrice" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,

    CONSTRAINT "PriceProfileProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable PriceProfileVariant (override por variante; gana sobre el de producto)
CREATE TABLE IF NOT EXISTS "PriceProfileVariant" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "wholesalePrice" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,

    CONSTRAINT "PriceProfileVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PriceProfile_code_key" ON "PriceProfile"("code");
CREATE INDEX IF NOT EXISTS "PriceProfile_isActive_idx" ON "PriceProfile"("isActive");
CREATE INDEX IF NOT EXISTS "PriceProfileProduct_productId_idx" ON "PriceProfileProduct"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "PriceProfileProduct_profileId_productId_key" ON "PriceProfileProduct"("profileId", "productId");
CREATE INDEX IF NOT EXISTS "PriceProfileVariant_variantId_idx" ON "PriceProfileVariant"("variantId");
CREATE UNIQUE INDEX IF NOT EXISTS "PriceProfileVariant_profileId_variantId_key" ON "PriceProfileVariant"("profileId", "variantId");
CREATE INDEX IF NOT EXISTS "User_priceProfileId_idx" ON "User"("priceProfileId");
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");

-- Foreign keys (idempotentes)
DO $$ BEGIN
    ALTER TABLE "PriceProfileProduct" ADD CONSTRAINT "PriceProfileProduct_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PriceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PriceProfileProduct" ADD CONSTRAINT "PriceProfileProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PriceProfileVariant" ADD CONSTRAINT "PriceProfileVariant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PriceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "PriceProfileVariant" ADD CONSTRAINT "PriceProfileVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_priceProfileId_fkey" FOREIGN KEY ("priceProfileId") REFERENCES "PriceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
