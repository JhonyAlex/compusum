FROM oven/bun:latest AS base

# 1. Dependencias
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# 2. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
# Generamos el Prisma Client antes de hacer el build de Next.js
RUN bunx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Runner (Producción)
FROM base AS runner
WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOST=0.0.0.0

# Copiamos la build standalone.
# El script build de tu package.json ya se encarga de meter 'public' y '.next/static' aquí.
COPY --from=builder /app/.next/standalone ./

# IMPORTANTE: Copiamos explicitamente Prisma engine porque el modo standalone a veces lo oculta.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Iniciamos utilizando bun apuntando al server originado en standalone
CMD ["sh", "-c", "set -e; if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations 2>/dev/null)\" ]; then echo 'Applying Prisma migrations...'; ./node_modules/.bin/prisma migrate deploy; else echo 'No migrations found, running prisma db push...'; ./node_modules/.bin/prisma db push --accept-data-loss; fi; echo 'Running seed...'; bun run seed; bun server.js"]
