import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/invoices/[id]/payments — record a payment, recompute status
// Body: { amount, method?, reference? }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { amount, method, reference } = await request.json();

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return NextResponse.json(
        { success: false, error: "A positive amount is required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: new Prisma.Decimal(amt.toFixed(2)),
        method: method || "CASH",
        reference: reference || null,
      },
    });

    const agg = await prisma.payment.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });
    const paid = Number(agg._sum.amount || 0);
    const total = Number(invoice.total);

    let status: "PAID" | "PARTIALLY_PAID" | "SENT" = "SENT";
    if (paid >= total) status = "PAID";
    else if (paid > 0) status = "PARTIALLY_PAID";

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: new Prisma.Decimal(paid.toFixed(2)),
        status,
      },
      include: { payments: { orderBy: { paidAt: "desc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[POST /api/invoices/[id]/payments]", error);
    return NextResponse.json(
      { success: false, error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
