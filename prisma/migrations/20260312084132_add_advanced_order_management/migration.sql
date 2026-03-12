-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedAgentId" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';

-- AlterTable
ALTER TABLE "ShippingRoute" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "cutOffTime" TIMESTAMP(3),
ADD COLUMN     "departureDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "routeId" TEXT,
ALTER COLUMN "customerName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "ShippingRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
