import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLINIC_ID = "clinic001";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: {
      clinicId: CLINIC_ID,
      isActive: true,
      role: role
        ? (role as "DENTIST")
        : { in: ["DENTIST", "CLINIC_ADMIN"] },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ users });
}
