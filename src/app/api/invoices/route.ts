import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireRole, getRoleFromRequest } from "@/lib/auth";

const GST_RATE = 18; // percent

// GET /api/invoices — list invoices for the page
export async function GET(request: NextRequest) {
  try {
    const { payload, forbidden } = requireRole(request, ["CLINIC_ADMIN", "RECEPTIONIST"]);
    if (forbidden) return forbidden;
    const clinicId = payload.clinicId;
    const invoices = await prisma.invoice.findMany({
      where: { clinicId },
      include: {
        patient: { select: { name: true, patientCode: true } },
        _count: { select: { lineItems: true, payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error("[GET /api/invoices]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

type IncomingLine = { description: string; quantity?: number; unitPrice: number };

// POST /api/invoices — create an invoice + its line items
// Body: { patientId, appointmentId?, lineItems: [{description, quantity, unitPrice}], notes? }
export async function POST(request: NextRequest) {
  try {
    const { payload, forbidden } = requireRole(request, ["CLINIC_ADMIN", "RECEPTIONIST"]);
    if (forbidden) return forbidden;
    const clinicId = payload.clinicId;

    const { patientId, appointmentId, lineItems, notes } = await request.json();

    if (!patientId || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "patientId and at least one line item are required" },
        { status: 400 }
      );
    }

    // Validate prices: must be numeric and not negative (₹0 is allowed for free/complimentary).
    for (const li of lineItems as IncomingLine[]) {
      const price = Number(li.unitPrice);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Line item prices must be a number and cannot be negative" },
          { status: 400 }
        );
      }
    }

    // --- SERVER-SIDE money math (never trust the browser) ---
    let subtotal = 0;
    const preparedLines = (lineItems as IncomingLine[]).map((li) => {
      const qty = li.quantity && li.quantity > 0 ? li.quantity : 1;
      const unit = Number(li.unitPrice) || 0;
      const lineTotal = qty * unit;
      subtotal += lineTotal;
      return {
        description: String(li.description || "Item"),
        quantity: qty,
        unitPrice: new Prisma.Decimal(unit.toFixed(2)),
        lineTotal: new Prisma.Decimal(lineTotal.toFixed(2)),
      };
    });

    const gstAmount = (subtotal * GST_RATE) / 100;
    const total = subtotal + gstAmount;

    // --- collision-proof invoice number (same pattern as patient codes) ---
    const last = await prisma.invoice.findFirst({
      where: { clinicId },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    let nextNum = 1;
    if (last?.invoiceNumber) {
      const m = last.invoiceNumber.match(/(\d+)$/);
      if (m) nextNum = parseInt(m[1], 10) + 1;
    }
    const invoiceNumber = `INV-${String(nextNum).padStart(3, "0")}`;

    // --- create invoice + line items atomically (one transaction) ---
    const invoice = await prisma.invoice.create({
      data: {
        clinicId,
        patientId,
        appointmentId: appointmentId || null,
        invoiceNumber,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        gstRate: new Prisma.Decimal(GST_RATE.toFixed(2)),
        gstAmount: new Prisma.Decimal(gstAmount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        amountPaid: new Prisma.Decimal("0.00"),
        status: "SENT",
        notes: notes || null,
        lineItems: { create: preparedLines },
      },
      include: {
        lineItems: true,
        patient: { select: { name: true, patientCode: true } },
      },
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/invoices]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
