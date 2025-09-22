/*
  Warnings:

  - You are about to drop the column `filePath` on the `order_files` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_files" DROP COLUMN "filePath",
ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "fileSize" INTEGER;
