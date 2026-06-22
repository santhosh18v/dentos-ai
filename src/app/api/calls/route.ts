import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";


// GET /api/calls — list call logs (most recent first) for the page
export async function GET(request: NextRequest) {
  try {
    const { clinicId } = getRoleFromRequest(request);
    const calls = await prisma.callLog.findMany({
      where: { clinicId },
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
