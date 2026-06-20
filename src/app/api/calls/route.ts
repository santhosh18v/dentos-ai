import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLINIC_ID = "clinic001";

// GET /api/calls — list call logs (most recent first) for the page
export async function GET(_request: NextRequest) {
  try {
    const calls = await prisma.callLog.findMany({
      where: { clinicId: CLINIC_ID },
      include: {
        patient: { select: { name: true, patientCode: true } },
        appointment: { select: { scheduledAt: true, treatmentType: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: calls });
  } catch (error) {
    console.error("[GET /api/calls]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
