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

1. Si cambias Prisma, agrega la migracion correspondiente. No dejes solo cambios en `schema.prisma` si el codigo o el seed ya dependen de esos campos.
2. Verifica que el seed use solo tablas y columnas presentes en la base que recibira `migrate deploy`.
3. Revisa la ruta real de arranque antes de asumir que el deploy esta cubierto. En este repo eso implica revisar `package.json` y `docker-entrypoint.sh`.
4. Si el cambio toca Prisma o seed, intenta ejecutar: `bunx prisma generate`, `bunx prisma migrate status` o `bunx prisma migrate deploy`, y `bun run seed`.
5. Si el cambio toca rutas, API, componentes o flujo de app, intenta ejecutar tambien `bun run build`.
6. Lee logs y terminal. Un error de drift o columna faltante como `P2022`, o un caso donde `migrate deploy` diga que no hay pendientes pero seed/app fallen por columnas faltantes, es desalineacion real entre historial de migraciones y esquema efectivo. No cierres la tarea hasta corregir la secuencia de migracion, seed y arranque.
7. En la respuesta final informa explicitamente que validaste, que no pudiste validar y cualquier riesgo operativo pendiente.

## Incidente de referencia

En Compusum ya hubo un arranque que continuo hasta el seed con una base desalineada y fallo porque el codigo esperaba `User.phone` y la base todavia no tenia esa columna. Cuando un cambio grande toque Prisma o bootstrap, el agente debe verificar alineacion operativa completa y no solo consistencia del codigo fuente.