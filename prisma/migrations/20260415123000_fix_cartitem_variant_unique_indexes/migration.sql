-- Fix uniqueness semantics for CartItem when variantId is NULL
DROP INDEX IF EXISTS "CartItem_cartId_productId_variantId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_base_unique"
  ON "CartItem"("cartId", "productId")
  WHERE "variantId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_cartId_productId_variant_unique"
  ON "CartItem"("cartId", "productId", "variantId")
  WHERE "variantId" IS NOT NULL;