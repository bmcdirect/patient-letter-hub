/*
  Warnings:

  - You are about to drop the column `enclosures` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `quotes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[proofId]` on the table `order_approvals` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED', 'ESCALATED');

-- AlterTable
ALTER TABLE "order_approvals" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "escalationReason" TEXT,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "proofId" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "userFeedback" TEXT;

-- AlterTable
ALTER TABLE "practices" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "enclosures",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "npi1" TEXT,
ADD COLUMN     "npi2" TEXT,
ADD COLUMN     "taxonomyCode" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "proofs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "proofRound" INTEGER NOT NULL,
    "fileUrl" TEXT,
    "filePath" TEXT,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDING',
    "userFeedback" TEXT,
    "adminNotes" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "escalationReason" TEXT,

    CONSTRAINT "proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proofs_orderId_proofRound_key" ON "proofs"("orderId", "proofRound");

-- CreateIndex
CREATE UNIQUE INDEX "order_approvals_proofId_key" ON "order_approvals"("proofId");

-- AddForeignKey
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "proofs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
