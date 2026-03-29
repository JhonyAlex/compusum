Bootstrapping database...
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 230ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

7 migrations found in prisma/migrations


No pending migrations to apply.
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
-- DropIndex
Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.
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
✓ Ready in 62ms
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 161ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Need your database queries to be 1000x faster? Accelerate offers you that and more: https://pris.ly/tip-2-accelerate
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"
Environment variables loaded from .env

8 migrations found in prisma/migrations
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

-- DropIndex
DROP INDEX "ShippingRoute_departureDaysOfWeek_idx";
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
✅ Departamentos, ciudades y rutas creadas con días de salida flexibles
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 83ms
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 146ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

8 migrations found in prisma/migrations


No pending migrations to apply.
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

-- DropIndex
DROP INDEX "ShippingRoute_departureDaysOfWeek_idx";
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
✅ Departamentos, ciudades y rutas creadas con días de salida flexibles
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 64ms
Bootstrapping database...
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 158ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)

Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "compusum-shop", schema "public" at "compusum-shop_postgres-db:5432"

8 migrations found in prisma/migrations


No pending migrations to apply.
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
-- DropIndex
Se detectaron diferencias no estructurales (por ejemplo, indices/constraints) que Prisma no modela completamente. Se permite continuar.
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

-- DropIndex
DROP INDEX "ShippingRoute_departureDaysOfWeek_idx";
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
✅ Departamentos, ciudades y rutas creadas con días de salida flexibles
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 85ms
Bootstrapping database...
Prisma schema loaded from prisma/schema.prisma
Environment variables loaded from .env

✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 146ms

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

9 migrations found in prisma/migrations

Applying migration `20260329100100_add_catalog_performance_indexes`

The following migration(s) have been applied:

migrations/
  └─ 20260329100100_add_catalog_performance_indexes/
    └─ migration.sql
      
All migrations have been successfully applied.
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

-- DropIndex
DROP INDEX "Product_searchVector_idx";

-- DropIndex
DROP INDEX "ShippingRoute_departureDaysOfWeek_idx";
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
✅ Departamentos, ciudades y rutas creadas con días de salida flexibles
🎉 Seed completado exitosamente!
Starting server...
▲ Next.js 16.1.3
- Local:         http://localhost:80
- Network:       http://0.0.0.0:80

✓ Starting...
✓ Ready in 65ms
Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
    at forEach (null)
    at processTicksAndRejections (null)
⨯ unhandledRejection:  Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
    at forEach (null)
    at processTicksAndRejections (null)
⨯ Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
    at forEach (null)
    at processTicksAndRejections (null)
⨯ Error: You cannot use different slug names for the same dynamic path ('id' !== 'slug').
    at forEach (null)
    at processTicksAndRejections (null)
