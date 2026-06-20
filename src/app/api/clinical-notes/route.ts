import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noteStructurer } from "@/lib/clinical";

const CLINIC_ID = "clinic001";

// GET /api/clinical-notes — list notes for the page
export async function GET(_request: NextRequest) {
  try {
    const notes = await prisma.clinicalNote.findMany({
      where: { clinicId: CLINIC_ID },
      include: {
        patient: { select: { name: true, patientCode: true } },
        appointment: { select: { scheduledAt: true, treatmentType: true } },
        dentist: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("[GET /api/clinical-notes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/clinical-notes — create a DRAFT from raw dictation
// Body: { appointmentId, rawText }
export async function POST(request: NextRequest) {
  try {
    const { appointmentId, rawText } = await request.json();

    if (!appointmentId || !rawText) {
      return NextResponse.json(
        { success: false, error: "appointmentId and rawText are required" },
        { status: 400 }
      );
    }

    // Confirm the appointment exists and belongs to this clinic
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId: CLINIC_ID },
      select: { id: true, patientId: true, dentistId: true },
    });
    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // AI structures the raw text into fields (mock now, GPT later)
    const structured = await noteStructurer.structure(rawText);

    // Create as a DRAFT — aiGenerated true, isApproved FALSE (the gate)
    const note = await prisma.clinicalNote.create({
      data: {
        clinicId: CLINIC_ID,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        dentistId: appointment.dentistId,
        chiefComplaint: structured.chiefComplaint || null,
        clinicalFindings: structured.clinicalFindings || null,
        assessment: structured.assessment || null,
        treatmentPlan: structured.treatmentPlan || null,
        treatmentDone: structured.treatmentDone || null,
        prescription: structured.prescription || null,
        followUpDate: structured.followUpDate ? new Date(structured.followUpDate) : null,
        rawTranscript: rawText,
        aiGenerated: true,
        isApproved: false,
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clinical-notes]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create note" },
      { status: 500 }
    );
  }
}
