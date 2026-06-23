import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUBLIC endpoint — no auth. Returns only safe, public-facing clinic fields by slug.
// Used by the public clinic page (/c/[slug]) that patients visit without logging in.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      select: {
        // ONLY public fields — never expose gstNumber, internal ids beyond what's needed, etc.
        id: true,
        name: true,
        address: true,
        phone: true,
        whatsappNumber: true,
        workingDays: true,
        openingTime: true,
        closingTime: true,
        aboutInfo: true,
      },
    });
    if (!clinic) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: clinic });
  } catch (error) {
    console.error("[GET /api/public/clinic/[slug]]", error);
    return NextResponse.json({ success: false, error: "Failed to load clinic" }, { status: 500 });
  }
}
