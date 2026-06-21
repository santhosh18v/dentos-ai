import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLINIC_ID = "clinic001";

// GET /api/invoices/stats — money figures for the dashboard
export async function GET(_request: NextRequest) {
  try {
    // First and last moment of the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Sum payments RECEIVED this month (actual cash in, the true revenue)
    const paidThisMonth = await prisma.payment.aggregate({
      where: {
        paidAt: { gte: monthStart, lt: monthEnd },
        invoice: { clinicId: CLINIC_ID },
      },
      _sum: { amount: true },
    });

    // Outstanding = total billed minus total paid, across all non-cancelled invoices
    const invoiceAgg = await prisma.invoice.aggregate({
      where: { clinicId: CLINIC_ID, status: { not: "CANCELLED" } },
      _sum: { total: true, amountPaid: true },
    });

    const monthlyRevenue = Number(paidThisMonth._sum.amount || 0);
    const totalBilled = Number(invoiceAgg._sum.total || 0);
    const totalCollected = Number(invoiceAgg._sum.amountPaid || 0);
    const outstanding = totalBilled - totalCollected;

    return NextResponse.json({
      success: true,
      data: { monthlyRevenue, outstanding, totalBilled, totalCollected },
    });
  } catch (error) {
    console.error("[GET /api/invoices/stats]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
