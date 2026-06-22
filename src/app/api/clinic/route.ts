import { NextRequest, NextResponse } from "next/server";
import { requireRole, getRoleFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// GET /api/clinic — clinic profile, hours, about
export async function GET(request: NextRequest) {
  try {
    const { clinicId } = getRoleFromRequest(request);
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: clinic });
  } catch (error) {
    console.error("[GET /api/clinic]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch clinic" }, { status: 500 });
  }
}

// PUT /api/clinic — update profile/hours/about
// Body: any of { name, address, phone, email, gstNumber, workingDays, openingTime, closingTime, aboutInfo }
export async function PUT(request: NextRequest) {
  try {
    const { payload, forbidden } = requireRole(request, ["CLINIC_ADMIN"]);
    if (forbidden) return forbidden;
    const clinicId = payload.clinicId;

    const body = await request.json();
    // Whitelist editable fields (never trust arbitrary keys from the client)
    const allowed = [
      "name", "address", "phone", "email", "gstNumber",
      "workingDays", "openingTime", "closingTime", "aboutInfo",
    ];
    const data: Record<string, string> = {};
    for (const key of allowed) {
      if (key in body && typeof body[key] === "string") data[key] = body[key];
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.clinic.update({ where: { id: clinicId }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PUT /api/clinic]", error);
    return NextResponse.json({ success: false, error: "Failed to update clinic" }, { status: 500 });
  }
}
