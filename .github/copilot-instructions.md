---
description: "Use when working in Compusum. Require operational validation after large changes, especially around Prisma, migrations, seed, startup, checkout, auth, or deployment flows."
---

# Instrucciones de workspace para Compusum

## Cuando un cambio es grande

Trata como cambio grande cualquier cambio que toque:

- `prisma/schema.prisma`, `prisma/migrations/**` o `prisma/seed.ts`
- bootstrap o arranque (`package.json`, `docker-entrypoint.sh`, `Dockerfile`)
- autenticacion, sesiones, checkout, pedidos o flujos que dependan de columnas nuevas en Prisma
- datos sembrados, modelos, relaciones o campos usados por el seed

No cierres un cambio grande solo porque compila o porque existe una migracion. Hay que validar alineacion real entre codigo, migraciones, seed y arranque.

## Checklist obligatorio

1. Si cambias Prisma, agrega la migracion correspondiente. No dejes solo cambios en `schema.prisma` si el codigo o el seed ya dependen de esos campos. El SQL de la migracion DEBE ser idempotente: usa `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` y `CREATE UNIQUE INDEX IF NOT EXISTS` para que la migracion pueda reejecutarse si falla a mitad y queda en estado parcial.
2. Verifica que el seed use solo tablas y columnas presentes en la base que recibira `migrate deploy`.
3. Revisa la ruta real de arranque antes de asumir que el deploy esta cubierto. En este repo eso implica revisar `package.json` y `docker-entrypoint.sh`.
4. Si el cambio toca Prisma o seed, intenta ejecutar: `bunx prisma generate`, `bunx prisma migrate status` o `bunx prisma migrate deploy`, y `bun run seed`.
5. Si el cambio toca rutas, API, componentes o flujo de app, intenta ejecutar tambien `bun run build`.
6. Valida de forma preventiva antes de desplegar y luego revisa logs/terminal para confirmar. Errores criticos:
	- `P2022` columna faltante: el esquema efectivo diverge de las migraciones. Corregir secuencia de migraciones.
	- `P3005` no baseline existente: `bootstrap.ts` lo maneja automaticamente con `migrate resolve --applied 0_init`.
	- `P3009` migracion fallida: ocurre cuando una migracion quedo marcada como "failed" en `_prisma_migrations`. `bootstrap.ts` debe manejarlo con `migrate resolve --rolled-back <nombre>` y luego reintentar el deploy. Si `bootstrap.ts` no lo maneja, ejecutar manualmente: `bunx prisma migrate resolve --rolled-back <nombre_de_la_migracion_fallida>` y redesplegar. Nunca rearrancar el contenedor sin resolver este estado primero.
7. En la respuesta final informa explicitamente que validaste, que no pudiste validar y cualquier riesgo operativo pendiente.

## Protocolo preventivo obligatorio (antes de cualquier migrate/deploy)

Cuando el cambio toque Prisma, seed, bootstrap o flujos que dependen de columnas nuevas, el agente NO debe ejecutar deploy directamente. Debe seguir este orden para evitar incidentes:

1. Verificar que toda migracion nueva sea idempotente (`IF NOT EXISTS` en columnas e indices).
2. Si la migracion crea indices o constraints unicos sobre tablas con datos existentes, incluir en la misma migracion una fase previa de deduplicacion/normalizacion de datos para evitar `P3018` (`23505`).
3. Ejecutar `bunx prisma generate`.
4. Ejecutar `bunx prisma migrate status` para detectar estado inconsistente antes de desplegar.
5. Si hay migracion fallida (`P3009`), resolver primero con `bunx prisma migrate resolve --rolled-back <nombre>` y solo despues reintentar `bunx prisma migrate deploy`.
6. Ejecutar `bunx prisma migrate deploy`.
7. Ejecutar `bun run seed`.
8. Ejecutar `bun run build` si se tocaron rutas/API/componentes/flujo de app.

Si cualquiera de estos pasos falla, se corrige la causa raiz antes de continuar. No se permite "seguir para ver si arranca" ni reinicios ciegos del contenedor.

## Incidente de referencia

En Compusum ya hubo un arranque que continuo hasta el seed con una base desalineada y fallo porque el codigo esperaba `User.phone` y la base todavia no tenia esa columna. Cuando un cambio grande toque Prisma o bootstrap, el agente debe verificar alineacion operativa completa y no solo consistencia del codigo fuente.

## Incidente P3009 — migracion fallida bloquea todos los deploys (2026-03-12)

La migracion `20260312090000_add_session_based_upsert` fallo en la base de produccion porque el SQL no era idempotente: intentaba `ADD COLUMN` en columnas que podrian ya existir de un intento anterior. Prisma la marco como fallida en `_prisma_migrations` y bloqueo todos los redesploys con error `P3009`. El `bootstrap.ts` solo manejaba `P3005` y lanzaba `P3009` sin resolver, haciendo que el contenedor reiniciara en bucle infinito.

**Raiz**: SQL de migracion no idempotente + `bootstrap.ts` sin manejo de `P3009`.

**Reglas que aplican desde ahora**:
- Todo SQL en migraciones nuevas debe usar `IF NOT EXISTS` en `ADD COLUMN`, `CREATE INDEX` y `CREATE UNIQUE INDEX`.
- `bootstrap.ts` debe manejar `P3009`: detectar el nombre de la migracion fallida desde el stderr (patron: `The \`<nombre>\` migration started at .* failed`), ejecutar `migrate resolve --rolled-back <nombre>`, y reintentar `migrate deploy`. Ver implementacion en `prisma/bootstrap.ts`.
- Antes de hacer push de una migracion nueva, verificar que el SQL sea idempotente o que no existan estados parciales en la base de destino.

## Sistema de estilos global (obligatorio para cambios UI)

Cuando un cambio toque componentes, paginas, layouts o cualquier elemento visual, seguir estas reglas:

1. No agregar colores hardcodeados (`#hex`, `rgb`, `rgba`) en `tsx/css` nuevos. Usar tokens globales definidos en `src/app/globals.css`.
2. No usar `style={{ fontFamily: "var(--font-fredoka)" }}` en elementos nuevos. Usar clases semanticas globales (`font-heading`, `font-body`).
3. Si se necesita un color, sombra, radio, animacion o transicion nueva, agregar primero el token en `:root` dentro de `src/app/globals.css` y luego consumirlo desde componentes.
4. Si un componente requiere variantes visuales reutilizables, resolverlo con componentes base (`src/components/ui/**`) y `cva` antes de repetir clases por pagina.
5. Validar consistencia con `bun run styles:guard` antes de cerrar cambios UI.

Objetivo: que un cambio de tema o look & feel se pueda ejecutar desde un punto central sin tener que buscar estilos hardcodeados por todo el proyecto.