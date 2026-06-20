-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'ANSWERED', 'COMPLETED', 'NO_ANSWER', 'FAILED');

-- CreateEnum
CREATE TYPE "CallIntent" AS ENUM ('CONFIRM', 'CANNOT_ATTEND', 'CALL_ME_BACK', 'HUMAN_ASSISTANCE', 'REPEAT');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'NEEDS_FOLLOWUP';

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "intent" "CallIntent",
    "reason" TEXT,
    "transcript" TEXT,
    "durationSecs" INTEGER,
    "needsFollowup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallLog_clinicId_idx" ON "CallLog"("clinicId");

-- CreateIndex
CREATE INDEX "CallLog_appointmentId_idx" ON "CallLog"("appointmentId");

-- CreateIndex
CREATE INDEX "CallLog_patientId_idx" ON "CallLog"("patientId");

-- CreateIndex
CREATE INDEX "CallLog_status_idx" ON "CallLog"("status");

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
