import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLogLevels =
  process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'warn', 'error']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLogLevels,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db