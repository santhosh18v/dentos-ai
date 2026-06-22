import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// PUT /api/clinic/services/[id] — edit a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, price, description, category, isActive } = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof name === "string") data.name = name;
    if (price != null && Number(price) >= 0) data.price = new Prisma.Decimal(Number(price).toFixed(2));
    if (typeof description === "string") data.description = description;
    if (typeof category === "string") data.category = category;
    if (typeof isActive === "boolean") data.isActive = isActive;

    const updated = await prisma.clinicService.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PUT /api/clinic/services/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to update service" }, { status: 500 });
  }
}

// DELETE /api/clinic/services/[id] — remove a service
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.clinicService.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/clinic/services/[id]]", error);
    return NextResponse.json({ success: false, error: "Failed to delete service" }, { status: 500 });
  }
}
