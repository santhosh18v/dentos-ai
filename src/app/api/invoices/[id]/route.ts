import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invoices/[id] — one invoice with line items + payments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: { select: { name: true, patientCode: true, phone: true } },
        lineItems: true,
        payments: { orderBy: { paidAt: "desc" } },
        appointment: { select: { treatmentType: true, scheduledAt: true } },
      },
    });
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("[GET /api/invoices/[id]]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
