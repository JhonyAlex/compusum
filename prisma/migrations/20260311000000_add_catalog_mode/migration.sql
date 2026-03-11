-- AlterTable: Add catalogMode to Category
ALTER TABLE "Category" ADD COLUMN "catalogMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add catalogMode to Brand
ALTER TABLE "Brand" ADD COLUMN "catalogMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add catalogMode to Product
ALTER TABLE "Product" ADD COLUMN "catalogMode" BOOLEAN NOT NULL DEFAULT false;
