import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/clinical-notes/[id]/approve
// The ONLY route that sets isApproved = true. This is the safety gate:
// an AI draft is not a finalized medical record until a dentist approves.
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const note = await prisma.clinicalNote.update({
      where: { id },
      data: { isApproved: true },
    });

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    console.error("[PUT /api/clinical-notes/[id]/approve]", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve note" },
      { status: 500 }
    );
  }
}
