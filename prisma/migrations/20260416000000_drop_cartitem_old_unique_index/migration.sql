-- Migration: drop_cartitem_old_unique_index
-- 
-- The migration 20260415120000_add_product_variations attempted to drop
-- "CartItem_cartId_productId_key" using ALTER TABLE ... DROP CONSTRAINT IF EXISTS.
-- That syntax only removes constraints added via ADD CONSTRAINT, NOT indexes
-- created via CREATE UNIQUE INDEX. The command silently succeeded (no error, IF EXISTS)
-- but left the index in place.
--
-- The leftover index causes P2002 (unique violation) when a cart has the same
-- product with two different variants, because the index covers (cartId, productId)
-- without considering variantId.
--
-- Fix: drop the index using DROP INDEX, which is the correct syntax.

DROP INDEX IF EXISTS "CartItem_cartId_productId_key";
