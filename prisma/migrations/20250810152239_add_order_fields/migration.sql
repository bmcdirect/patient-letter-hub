-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "actualRecipients" INTEGER,
ADD COLUMN     "autoDeleteDataFile" BOOLEAN,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "customerNumber" TEXT,
ADD COLUMN     "dataCleansing" BOOLEAN,
ADD COLUMN     "firstClassPostage" BOOLEAN,
ADD COLUMN     "ncoaUpdate" BOOLEAN,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchaseOrder" TEXT,
ADD COLUMN     "totalCost" DOUBLE PRECISION;
