import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/patients — list all patients for a clinic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const clinicId = searchParams.get("clinicId") || "clinic001";

    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        isActive: true,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" } },
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

// POST /api/patients — create new patient
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

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const clinicId = "clinic001";

    // Count existing patients to generate patient code
    const count = await prisma.patient.count({ where: { clinicId } });
    const patientCode = `SMC-${String(count + 1).padStart(3, "0")}`;

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        patientCode,
        name,
        phone,
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
