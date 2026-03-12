-- Create missing unique indexes expected by prisma/schema.prisma
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_sessionId_status_key" ON "Cart"("sessionId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_sessionId_status_key" ON "Order"("sessionId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_customerId_status_key" ON "Order"("customerId", "status");
