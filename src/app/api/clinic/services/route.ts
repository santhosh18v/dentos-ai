import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const CLINIC_ID = "clinic001";

// GET /api/clinic/services — list all services
export async function GET(_request: NextRequest) {
  try {
    const services = await prisma.clinicService.findMany({
      where: { clinicId: CLINIC_ID },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error("[GET /api/clinic/services]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch services" }, { status: 500 });
  }
}

// POST /api/clinic/services — add a service
// Body: { name, price, description?, category? }
export async function POST(request: NextRequest) {
  try {
    const { name, price, description, category } = await request.json();
    if (!name || price == null || Number(price) < 0) {
      return NextResponse.json({ success: false, error: "Name and a valid price are required" }, { status: 400 });
    }
    const service = await prisma.clinicService.create({
      data: {
        clinicId: CLINIC_ID,
        name: String(name),
        price: new Prisma.Decimal(Number(price).toFixed(2)),
        description: description || null,
        category: category || null,
      },
    });
    return NextResponse.json({ success: true, data: service }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/clinic/services]", error);
    return NextResponse.json({ success: false, error: "Failed to add service" }, { status: 500 });
  }
}
