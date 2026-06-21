-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN     "aboutInfo" TEXT,
ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "openingTime" TEXT,
ADD COLUMN     "workingDays" TEXT;

-- CreateTable
CREATE TABLE "ClinicService" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicService_clinicId_idx" ON "ClinicService"("clinicId");

-- AddForeignKey
ALTER TABLE "ClinicService" ADD CONSTRAINT "ClinicService_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
