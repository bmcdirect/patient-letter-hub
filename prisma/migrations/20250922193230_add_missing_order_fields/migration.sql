-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "actualRecipients" INTEGER,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "dataCleansing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstClassPostage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ncoaUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchaseOrder" TEXT;
