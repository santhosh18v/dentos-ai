import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telephony } from "@/lib/telephony";

const CLINIC_ID = "clinic001";

// POST /api/calls/start
// Body (optional): { date: "YYYY-MM-DD" }  — defaults to tomorrow
// Finds appointments for that day and initiates a reminder call for each.
export async function POST(request: NextRequest) {
  try {
    let targetDate: Date;
    try {
      const body = await request.json();
      targetDate = body?.date ? new Date(body.date) : tomorrow();
    } catch {
      targetDate = tomorrow();
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // Only call appointments that still need confirming
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId: CLINIC_ID,
        scheduledAt: { gte: start, lt: end },
        status: "SCHEDULED",
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        dentist: { select: { name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const results = [];
    for (const apt of appointments) {
      // Create the call record first (status INITIATED)
      const callLog = await prisma.callLog.create({
        data: {
          clinicId: CLINIC_ID,
          appointmentId: apt.id,
          patientId: apt.patient.id,
          phoneNumber: apt.patient.phone,
          status: "INITIATED",
        },
      });

      // Hand off to the telephony provider (mock for now)
      const apptTime = apt.scheduledAt.toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit",
      });
      const callResult = await telephony.placeCall({
        callLogId: callLog.id,
        phoneNumber: apt.patient.phone,
        patientName: apt.patient.name,
        appointmentTime: apptTime,
        dentistName: apt.dentist.name,
      });

      // Reflect provider's immediate status (mock returns INITIATED)
      const updated = await prisma.callLog.update({
        where: { id: callLog.id },
        data: { status: callResult.status === "FAILED" ? "FAILED" : "RINGING" },
        include: {
          patient: { select: { name: true } },
        },
      });

      results.push(updated);
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      calls: results,
    });
  } catch (error) {
    console.error("[POST /api/calls/start]", error);
    return NextResponse.json(
      { success: false, error: "Failed to start calls" },
      { status: 500 }
    );
  }
}

function tomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}
