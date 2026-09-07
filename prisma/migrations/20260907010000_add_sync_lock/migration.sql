-- CreateTable SyncLock
CREATE TABLE IF NOT EXISTS "SyncLock" (
    "id" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncLock_pkey" PRIMARY KEY ("id")
);
