import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";


export async function GET(request: NextRequest) {
  const { clinicId } = getRoleFromRequest(request);
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: {
      clinicId,
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
