import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";


export async function GET(request: NextRequest) {
  const { clinicId } = getRoleFromRequest(request);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const where: Record<string, unknown> = { clinicId };

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.scheduledAt = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { name: true, phone: true, patientCode: true } },
      dentist: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: NextRequest) {
  const { clinicId } = getRoleFromRequest(request);
  const body = await request.json();
  const { patientId, dentistId, scheduledAt, durationMins, treatmentType, notes } = body;

  if (!patientId || !dentistId || !scheduledAt || !treatmentType) {
    return NextResponse.json(
      { error: "patientId, dentistId, scheduledAt and treatmentType are required" },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinicId,
      patientId,
      dentistId,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins ?? 30,
      treatmentType,
      notes: notes || null,
    },
    include: {
      patient: { select: { name: true, patientCode: true } },
      dentist: { select: { name: true } },
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
