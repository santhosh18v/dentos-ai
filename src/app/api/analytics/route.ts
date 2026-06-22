import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRoleFromRequest } from "@/lib/auth";


// Build a list of the last N months as { key: "2026-06", label: "Jun" }
function lastMonths(n: number) {
  const months: { key: string; label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return months;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// GET /api/analytics — all dashboard analytics in one payload
export async function GET(request: NextRequest) {
  try {
    const { clinicId } = getRoleFromRequest(request);
    const months = lastMonths(6);
    const earliest = new Date(months[0].year, months[0].month, 1);

    // --- Revenue by month (from payments received) ---
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: earliest },
        invoice: { clinicId },
      },
      select: { amount: true, paidAt: true },
    });
    const revenueByMonth = months.map((m) => ({ month: m.label, revenue: 0 }));
    const revIndex: Record<string, number> = {};
    months.forEach((m, i) => { revIndex[m.key] = i; });
    for (const p of payments) {
      const k = monthKey(new Date(p.paidAt));
      if (k in revIndex) revenueByMonth[revIndex[k]].revenue += Number(p.amount);
    }

    // --- New patients by month ---
    const patients = await prisma.patient.findMany({
      where: { clinicId, createdAt: { gte: earliest } },
      select: { createdAt: true },
    });
    const patientsByMonth = months.map((m) => ({ month: m.label, patients: 0 }));
    for (const p of patients) {
      const k = monthKey(new Date(p.createdAt));
      if (k in revIndex) patientsByMonth[revIndex[k]].patients += 1;
    }

    // --- Appointments by status ---
    const apptGroups = await prisma.appointment.groupBy({
      by: ["status"],
      where: { clinicId },
      _count: { status: true },
    });
    const appointmentsByStatus = apptGroups.map((g) => ({
      status: g.status,
      count: g._count.status,
    }));

    // --- No-show rate ---
    const totalAppts = appointmentsByStatus.reduce((s, a) => s + a.count, 0);
    const noShows = appointmentsByStatus.find((a) => a.status === "NO_SHOW")?.count || 0;
    const noShowRate = totalAppts > 0 ? Math.round((noShows / totalAppts) * 1000) / 10 : 0;

    // --- Top treatments by count ---
    const treatmentGroups = await prisma.appointment.groupBy({
      by: ["treatmentType"],
      where: { clinicId },
      _count: { treatmentType: true },
      orderBy: { _count: { treatmentType: "desc" } },
      take: 6,
    });
    const topTreatments = treatmentGroups.map((g) => ({
      treatment: g.treatmentType,
      count: g._count.treatmentType,
    }));

    // --- Summary tiles ---
    const invoiceAgg = await prisma.invoice.aggregate({
      where: { clinicId, status: { not: "CANCELLED" } },
      _sum: { total: true, amountPaid: true },
    });
    const totalBilled = Number(invoiceAgg._sum.total || 0);
    const totalCollected = Number(invoiceAgg._sum.amountPaid || 0);
    const outstanding = totalBilled - totalCollected;

    return NextResponse.json({
      success: true,
      data: {
        revenueByMonth,
        patientsByMonth,
        appointmentsByStatus,
        topTreatments,
        summary: {
          totalCollected,
          outstanding,
          totalAppointments: totalAppts,
          noShowRate,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/analytics]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
