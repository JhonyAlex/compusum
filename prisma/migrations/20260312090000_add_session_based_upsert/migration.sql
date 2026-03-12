-- AddColumn sessionId y userId a Cart
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateIndex para sessionId en Cart
CREATE INDEX IF NOT EXISTS "Cart_sessionId_idx" ON "Cart"("sessionId");
CREATE INDEX IF NOT EXISTS "Cart_userId_idx" ON "Cart"("userId");

-- Crear constraint único para [sessionId, status] en Cart (solo para registros donde sessionId no es null)
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_sessionId_status_unique_idx" ON "Cart"("sessionId", "status") WHERE "sessionId" IS NOT NULL;

-- AddColumn sessionId a Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- CreateIndex para sessionId en Order
CREATE INDEX IF NOT EXISTS "Order_sessionId_idx" ON "Order"("sessionId");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");

-- Crear constraints únicos para Order (solo para registros activos)
CREATE UNIQUE INDEX IF NOT EXISTS "Order_sessionId_status_unique_idx" ON "Order"("sessionId", "status") WHERE "sessionId" IS NOT NULL AND "status" = 'solicitado';
CREATE UNIQUE INDEX IF NOT EXISTS "Order_customerId_status_unique_idx" ON "Order"("customerId", "status") WHERE "customerId" IS NOT NULL AND "status" = 'solicitado';
