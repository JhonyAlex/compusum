No migrations found, running prisma db push...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

The database is already in sync with the Prisma schema.

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 134ms

Running seed...
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
▲ Next.js 16.1.3
- Local:         http://c3be62d76a82:80
- Network:       http://c3be62d76a82:80

✓ Starting...
✓ Ready in 93ms
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT 1
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Category" LEFT JOIN (SELECT "public"."Product"."categoryId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."categoryId") AS "aggr_selection_0_Product" ON ("public"."Category"."id" = "aggr_selection_0_Product"."categoryId") WHERE ("public"."Category"."parentId" IS NULL AND "public"."Category"."isActive" = $2) ORDER BY "public"."Category"."name" ASC OFFSET $3
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE ("public"."Category"."isActive" = $1 AND "public"."Category"."parentId" IN ($2,$3,$4,$5,$6)) OFFSET $7
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."slug" = $1 LIMIT $2 OFFSET $3
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Product"."id" FROM "public"."Product" WHERE ("public"."Product"."isActive" = $1 AND "public"."Product"."brandId" = $2) OFFSET $3) AS "sub"
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."isActive" = $1 AND "public"."Product"."brandId" = $2) ORDER BY "public"."Product"."createdAt" DESC LIMIT $3 OFFSET $4
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1,$2) OFFSET $3
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE ("public"."Product"."slug" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT 1
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action
    at processTicksAndRejections (null)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action
    at processTicksAndRejections (null)
Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
Read more: https://nextjs.org/docs/messages/failed-to-find-server-action
    at processTicksAndRejections (null)
prisma:query SELECT 1
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Category" LEFT JOIN (SELECT "public"."Product"."categoryId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."categoryId") AS "aggr_selection_0_Product" ON ("public"."Category"."id" = "aggr_selection_0_Product"."categoryId") WHERE ("public"."Category"."parentId" IS NULL AND "public"."Category"."isActive" = $2) ORDER BY "public"."Category"."name" ASC OFFSET $3
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE ("public"."Category"."isActive" = $1 AND "public"."Category"."parentId" IN ($2,$3,$4,$5,$6)) OFFSET $7
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt", COALESCE("aggr_selection_0_Product"."_aggr_count_products", 0) AS "_aggr_count_products" FROM "public"."Brand" LEFT JOIN (SELECT "public"."Product"."brandId", COUNT(*) AS "_aggr_count_products" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 GROUP BY "public"."Product"."brandId") AS "aggr_selection_0_Product" ON ("public"."Brand"."id" = "aggr_selection_0_Product"."brandId") WHERE "public"."Brand"."isActive" = $2 ORDER BY "public"."Brand"."name" ASC OFFSET $3
prisma:query SELECT COUNT(*) AS "_count$_all" FROM (SELECT "public"."Product"."id" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 OFFSET $2) AS "sub"
prisma:query SELECT "public"."Product"."id", "public"."Product"."name", "public"."Product"."slug", "public"."Product"."sku", "public"."Product"."description", "public"."Product"."shortDescription", "public"."Product"."categoryId", "public"."Product"."brandId", "public"."Product"."price", "public"."Product"."wholesalePrice", "public"."Product"."minWholesaleQty", "public"."Product"."stockStatus", "public"."Product"."isFeatured", "public"."Product"."isNew", "public"."Product"."isActive", "public"."Product"."tags", "public"."Product"."sortOrder", "public"."Product"."viewsCount", "public"."Product"."metaTitle", "public"."Product"."metaDescription", "public"."Product"."createdAt", "public"."Product"."updatedAt" FROM "public"."Product" WHERE "public"."Product"."isActive" = $1 ORDER BY "public"."Product"."createdAt" DESC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9) OFFSET $10
prisma:query SELECT "public"."Category"."id", "public"."Category"."name", "public"."Category"."slug", "public"."Category"."description", "public"."Category"."image", "public"."Category"."icon", "public"."Category"."parentId", "public"."Category"."sortOrder", "public"."Category"."isActive", "public"."Category"."metaTitle", "public"."Category"."metaDescription", "public"."Category"."createdAt", "public"."Category"."updatedAt" FROM "public"."Category" WHERE "public"."Category"."id" IN ($1,$2,$3,$4,$5,$6,$7,$8) OFFSET $9
prisma:query SELECT "public"."Brand"."id", "public"."Brand"."name", "public"."Brand"."slug", "public"."Brand"."description", "public"."Brand"."logo", "public"."Brand"."website", "public"."Brand"."isActive", "public"."Brand"."sortOrder", "public"."Brand"."createdAt", "public"."Brand"."updatedAt" FROM "public"."Brand" WHERE "public"."Brand"."isActive" = $1 ORDER BY "public"."Brand"."sortOrder" ASC LIMIT $2 OFFSET $3
Applying Prisma migrations...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline

Applying Prisma migrations...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline

Applying Prisma migrations...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline

Applying Prisma migrations...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Applying Prisma migrations...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

1 migration found in prisma/migrations

Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
