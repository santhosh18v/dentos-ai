import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const clinicId = "clinic001";

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

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const clinicId = "clinic001";

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
