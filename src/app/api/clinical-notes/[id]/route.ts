import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clinical-notes/[id] — fetch one note
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.clinicalNote.findUnique({
      where: { id },
      include: {
        patient: { select: { name: true, patientCode: true } },
        appointment: { select: { scheduledAt: true, treatmentType: true } },
        dentist: { select: { name: true } },
      },
    });
    if (!note) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("[GET /api/clinical-notes/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

// PUT /api/clinical-notes/[id] — edit fields.
// IMPORTANT: editing does NOT approve. isApproved is never touched here.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    const editable = [
      "chiefComplaint", "clinicalFindings", "assessment",
      "treatmentPlan", "treatmentDone", "prescription",
    ];
    for (const field of editable) {
      if (field in body) data[field] = body[field] || null;
    }
    if ("followUpDate" in body) {
      data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
    }

    const note = await prisma.clinicalNote.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("[PUT /api/clinical-notes/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update note" },
      { status: 500 }
    );
  }
}
