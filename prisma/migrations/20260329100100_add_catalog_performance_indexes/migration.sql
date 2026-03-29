-- Performance indexes for Product model (7K+ catalog scaling)
CREATE INDEX IF NOT EXISTS "Product_isActive_createdAt_idx" ON "Product"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_brandId_isActive_idx" ON "Product"("brandId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_isActive_idx" ON "Product"("isFeatured", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isNew_isActive_idx" ON "Product"("isNew", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isActive_sortOrder_idx" ON "Product"("isActive", "sortOrder");

-- Performance indexes for ProductImage model
CREATE INDEX IF NOT EXISTS "ProductImage_productId_isPrimary_idx" ON "ProductImage"("productId", "isPrimary");
CREATE INDEX IF NOT EXISTS "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- Full-text search: add tsvector column
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS "Product_searchVector_idx" ON "Product" USING gin("searchVector");

-- Populate search vector for existing products
UPDATE "Product"
SET "searchVector" = to_tsvector('spanish',
  coalesce("name", '') || ' ' ||
  coalesce("description", '') || ' ' ||
  coalesce("shortDescription", '') || ' ' ||
  coalesce("sku", '') || ' ' ||
  coalesce("tags", '')
);

-- Function to maintain search vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" := to_tsvector('spanish',
    coalesce(NEW."name", '') || ' ' ||
    coalesce(NEW."description", '') || ' ' ||
    coalesce(NEW."shortDescription", '') || ' ' ||
    coalesce(NEW."sku", '') || ' ' ||
    coalesce(NEW."tags", '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS product_search_vector_trigger ON "Product";
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "name", "description", "shortDescription", "sku", "tags"
  ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION product_search_vector_update();
