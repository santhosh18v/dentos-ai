import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ appointment });
}
