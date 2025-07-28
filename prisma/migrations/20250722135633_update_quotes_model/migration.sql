-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "colorMode" TEXT,
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "dataCleansing" BOOLEAN,
ADD COLUMN     "estimatedRecipients" INTEGER,
ADD COLUMN     "firstClassPostage" BOOLEAN,
ADD COLUMN     "ncoaUpdate" BOOLEAN,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchaseOrder" TEXT,
ADD COLUMN     "subject" TEXT;
