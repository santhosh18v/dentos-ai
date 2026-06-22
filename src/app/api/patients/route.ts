import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const { clinicId } = getRoleFromRequest(request);

    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        isActive: true,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    console.error("[GET /api/patients]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
      medicalHistory,
      allergies,
      bloodGroup,
      emergencyContact,
      preferredLanguage,
    } = body;

    // --- Validation (server is the gatekeeper; the form can be bypassed) ---
    const cleanName = typeof name === "string" ? name.trim() : "";
    if (cleanName.length < 2 || cleanName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }
    // Strip spaces/dashes/parens, then require exactly 10 digits (Indian mobile)
    const cleanPhone = typeof phone === "string" ? phone.replace(/[\s\-()]/g, "") : "";
    if (!/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: "Phone must be exactly 10 digits" },
        { status: 400 }
      );
    }

    const { clinicId } = getRoleFromRequest(request);

    // Find the highest existing patient code, then increment (collision-proof)
    const lastPatient = await prisma.patient.findFirst({
      where: { clinicId },
      orderBy: { patientCode: "desc" },
      select: { patientCode: true },
    });

    let nextNum = 1;
    if (lastPatient?.patientCode) {
      const match = lastPatient.patientCode.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const patientCode = `SMC-${String(nextNum).padStart(3, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        patientCode,
        name: cleanName,
        phone: cleanPhone,
        email,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        medicalHistory,
        allergies,
        bloodGroup,
        emergencyContact,
        preferredLanguage: preferredLanguage || "ENGLISH",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error("[POST /api/patients]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create patient" },
      { status: 500 }
    );
  }
}
