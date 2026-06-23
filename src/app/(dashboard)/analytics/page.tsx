"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, BarChart, Bar,
} from "recharts";
import { IndianRupee, Clock, CalendarCheck, UserX } from "lucide-react";

type Analytics = {
  revenueByMonth: { month: string; revenue: number }[];
  patientsByMonth: { month: string; patients: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  topTreatments: { treatment: string; count: number }[];
  summary: {
    totalCollected: number;
    outstanding: number;
    totalAppointments: number;
    noShowRate: number;
  };
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981",
  CONFIRMED: "#3b82f6",
  SCHEDULED: "#6b7280",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f59e0b",
  NEEDS_FOLLOWUP: "#a855f7",
};

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-muted-foreground text-sm py-12 text-center">Loading analytics...</div>;
  }
  if (!data) {
    return <div className="text-muted-foreground text-sm py-12 text-center">No analytics available.</div>;
  }

  const tiles = [
    { label: "Collected", value: inr(data.summary.totalCollected), icon: IndianRupee, color: "text-emerald-500" },
    { label: "Outstanding", value: inr(data.summary.outstanding), icon: Clock, color: "text-amber-500" },
    { label: "Appointments", value: String(data.summary.totalAppointments), icon: CalendarCheck, color: "text-blue-500" },
    { label: "No-show Rate", value: `${data.summary.noShowRate}%`, icon: UserX, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Practice performance over the last 6 months</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <t.icon className="h-4 w-4" /> {t.label}
            </div>
            <div className={`text-2xl font-bold ${t.color}`}>{t.value}</div>
          </Card>
        ))}
      </div>

      {/* Revenue by month — area */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Revenue by Month</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.revenueByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 12%)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => inr(v as number)} contentStyle={{ backgroundColor: "oklch(0.22 0.02 240)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.97 0.005 240)" }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by status — donut */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Appointments by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.appointmentsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.appointmentsByStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "oklch(0.22 0.02 240)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.97 0.005 240)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Patient growth — line */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">New Patients by Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.patientsByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 12%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "oklch(0.22 0.02 240)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.97 0.005 240)" }} />
              <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top treatments — horizontal bar */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Top Treatments</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data.topTreatments}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 40, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 12%)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="treatment" tick={{ fontSize: 12 }} width={120} />
            <Tooltip contentStyle={{ backgroundColor: "oklch(0.22 0.02 240)", border: "1px solid oklch(1 0 0 / 10%)", borderRadius: "8px", color: "oklch(0.97 0.005 240)" }} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <p className="text-xs text-muted-foreground">
        Includes demo data seeded for visualization. Revenue reflects payments received.
      </p>
    </div>
  );
}
