/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Clinic` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");
