import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLogLevels =
  process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'warn', 'error']

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/compusum_db?schema=public'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogLevels,
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db