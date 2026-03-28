Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 165ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

5 migrations found in prisma/migrations


No pending migrations to apply.
Environment variables loaded from .env
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.5.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
-- CreateIndex
Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.
CREATE UNIQUE INDEX "Cart_sessionId_status_key" ON "Cart"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sessionId_status_key" ON "Order"("sessionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_customerId_status_key" ON "Order"("customerId", "status");
🌱 Iniciando seed de Compusum...
$ bun prisma/seed.ts
✅ Usuario admin creado: admin@compusum.co
✅ Categoría creada: Escolar
✅ Categoría creada: Oficina
✅ Categoría creada: Arte y Manualidades
✅ Categoría creada: Tecnología y Accesorios
✅ Categoría creada: Ergonomía y Organización
✅ 15 marcas creadas
✅ 3 temporadas creadas
✅ Banners creados
✅ 12 configuraciones creadas
✅ 24 productos de ejemplo creados
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 70ms
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT 1
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Setting"."id", "public"."Setting"."value" FROM "public"."Setting" WHERE ("public"."Setting"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Category" LEFT JOIN (SELECT "public"."Product"."categoryId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."categoryId") AS "aggr_selection_0_Product" ON ("public"."Category"."id" = "aggr_selection_0_Product"."categoryId") WHERE ("public"."Category"."parentId" IS NULL AND "public"."Category"."isActive" = $2) ORDER BY "public"."Category"."name" ASC OFFSET $3
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE ("public"."Category"."isActive" = $1 AND "public"."Category"."parentId" IN ($2,$3,$4,$5,$6)) OFFSET $7
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Product"."id" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 OFFSET $2) AS "sub"
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 ORDER BY "public"."Product"."createdAt" DESC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9) OFFSET $10
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) OFFSET $12
Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at apply (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:2:603)
    at td (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:39262)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:40085)
    at <anonymous> (.next/server/edge/chunks/[root-of-the-server]__852bac76._.js:13:35741)
    at processTicksAndRejections (null)
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT 1
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."catalogMode", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."catalogMode", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."catalogMode", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 189ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.5.0                       │
│                                                         │
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

7 migrations found in prisma/migrations


No pending migrations to apply.
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
-- This is an empty migration.
Operational schema validation passed.
$ bun prisma/seed.ts
🌱 Iniciando seed de Compusum...
✅ Usuario admin creado: admin@compusum.co
✅ Categoría creada: Escolar
✅ Categoría creada: Oficina
✅ Categoría creada: Arte y Manualidades
✅ Categoría creada: Tecnología y Accesorios
✅ Categoría creada: Ergonomía y Organización
✅ 15 marcas creadas
✅ 3 temporadas creadas
✅ Banners creados
✅ 12 configuraciones creadas
✅ 24 productos de ejemplo creados
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 105ms
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 154ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
Prisma schema loaded from prisma/schema.prisma
Environment variables loaded from .env
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

7 migrations found in prisma/migrations


No pending migrations to apply.
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.6.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.
-- DropIndex
DROP INDEX "Brand_isActive_idx";

-- DropIndex
DROP INDEX "Category_isActive_idx";

-- DropIndex
DROP INDEX "Category_parentId_idx";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "Product_isActive_idx";

-- DropIndex
DROP INDEX "Product_isFeatured_idx";

-- DropIndex
DROP INDEX "Product_isNew_idx";
🌱 Iniciando seed de Compusum...
$ bun prisma/seed.ts
✅ Usuario admin creado: admin@compusum.co
✅ Categoría creada: Escolar
✅ Categoría creada: Oficina
✅ Categoría creada: Arte y Manualidades
✅ Categoría creada: Tecnología y Accesorios
✅ Categoría creada: Ergonomía y Organización
✅ 15 marcas creadas
✅ 3 temporadas creadas
✅ Banners creados
✅ 12 configuraciones creadas
✅ 24 productos de ejemplo creados
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 63ms
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 158ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
Environment variables loaded from .env
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.6.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

7 migrations found in prisma/migrations


No pending migrations to apply.
Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.
-- DropIndex
DROP INDEX "Brand_isActive_idx";

-- DropIndex
DROP INDEX "Category_isActive_idx";

-- DropIndex
DROP INDEX "Category_parentId_idx";

-- DropIndex
DROP INDEX "Product_brandId_idx";

-- DropIndex
DROP INDEX "Product_categoryId_idx";

-- DropIndex
DROP INDEX "Product_isActive_idx";

-- DropIndex
DROP INDEX "Product_isFeatured_idx";

-- DropIndex
DROP INDEX "Product_isNew_idx";
🌱 Iniciando seed de Compusum...
✅ Usuario admin creado: admin@compusum.co
✅ Categoría creada: Escolar
✅ Categoría creada: Oficina
✅ Categoría creada: Arte y Manualidades
✅ Categoría creada: Tecnología y Accesorios
✅ Categoría creada: Ergonomía y Organización
✅ 15 marcas creadas
✅ 3 temporadas creadas
✅ Banners creados
✅ 12 configuraciones creadas
✅ 24 productos de ejemplo creados
🎉 Seed completado exitosamente!
$ bun prisma/seed.ts
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 65ms
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}
prisma:error 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
Error managing order: Error [PrismaClientKnownRequestError]: 
Invalid `prisma.cart.update()` invocation:


Unique constraint failed on the fields: (`sessionId`,`status`)
    at processTicksAndRejections (null) {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}