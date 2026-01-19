/*
  Warnings:

  - A unique constraint covering the columns `[paddleTransactionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paddleTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paddleTransactionId_key" ON "Payment"("paddleTransactionId");

-- CreateIndex
CREATE INDEX "Payment_teacherId_idx" ON "Payment"("teacherId");

-- CreateIndex
CREATE INDEX "Payment_paddleTransactionId_idx" ON "Payment"("paddleTransactionId");
