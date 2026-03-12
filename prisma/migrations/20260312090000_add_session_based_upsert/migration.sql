-- AddColumn sessionId y userId a Cart
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- CreateIndex para sessionId en Cart
CREATE INDEX IF NOT EXISTS "Cart_sessionId_idx" ON "Cart"("sessionId");
CREATE INDEX IF NOT EXISTS "Cart_userId_idx" ON "Cart"("userId");

-- Evita P3018 por datos historicos: conserva solo el carrito activo mas reciente por sessionId
WITH ranked_cart_active AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY "sessionId"
			ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
		) AS rn
	FROM "Cart"
	WHERE "sessionId" IS NOT NULL
		AND "status" = 'activo'
)
UPDATE "Cart" c
SET "status" = 'expirado',
		"isActive" = false,
		"updatedAt" = NOW()
FROM ranked_cart_active r
WHERE c.id = r.id
	AND r.rn > 1
	AND c."status" = 'activo';

-- Crear constraint único para [sessionId, status] en Cart (solo para registros donde sessionId no es null)
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_sessionId_status_unique_idx" ON "Cart"("sessionId", "status") WHERE "sessionId" IS NOT NULL;

-- AddColumn sessionId a Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;

-- CreateIndex para sessionId en Order
CREATE INDEX IF NOT EXISTS "Order_sessionId_idx" ON "Order"("sessionId");
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");

-- Evita P3018 por datos historicos: conserva solo el pedido solicitado mas reciente por sessionId
WITH ranked_order_session AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY "sessionId"
			ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
		) AS rn
	FROM "Order"
	WHERE "sessionId" IS NOT NULL
		AND "status" = 'solicitado'
)
UPDATE "Order" o
SET "status" = 'compartido',
		"updatedAt" = NOW()
FROM ranked_order_session r
WHERE o.id = r.id
	AND r.rn > 1
	AND o."status" = 'solicitado';

-- Evita P3018 por datos historicos: conserva solo el pedido solicitado mas reciente por customerId
WITH ranked_order_customer AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY "customerId"
			ORDER BY "updatedAt" DESC, "createdAt" DESC, id DESC
		) AS rn
	FROM "Order"
	WHERE "customerId" IS NOT NULL
		AND "status" = 'solicitado'
)
UPDATE "Order" o
SET "status" = 'compartido',
		"updatedAt" = NOW()
FROM ranked_order_customer r
WHERE o.id = r.id
	AND r.rn > 1
	AND o."status" = 'solicitado';

-- Crear constraints únicos para Order (solo para registros activos)
CREATE UNIQUE INDEX IF NOT EXISTS "Order_sessionId_status_unique_idx" ON "Order"("sessionId", "status") WHERE "sessionId" IS NOT NULL AND "status" = 'solicitado';
CREATE UNIQUE INDEX IF NOT EXISTS "Order_customerId_status_unique_idx" ON "Order"("customerId", "status") WHERE "customerId" IS NOT NULL AND "status" = 'solicitado';
