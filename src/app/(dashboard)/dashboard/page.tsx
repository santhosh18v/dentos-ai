"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
  id: string;
  scheduledAt: string;
  treatmentType: string;
  status: string;
  patient: { name: string };
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "text-emerald-400 bg-emerald-400/10",
  SCHEDULED: "text-blue-400 bg-blue-400/10",
  COMPLETED: "text-gray-300 bg-gray-400/10",
  CANCELLED: "text-red-400 bg-red-400/10",
  NO_SHOW: "text-amber-400 bg-amber-400/10",
};

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DashboardPage() {
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [todays, setTodays] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/patients"),
          fetch(`/api/appointments?date=${todayStr()}`),
        ]);
        const pData = await pRes.json();
        const aData = await aRes.json();
        const patients = pData.data || pData.patients || [];
        setPatientCount(patients.length);
        setTodays(aData.appointments || []);
      } catch {
        setPatientCount(0);
        setTodays([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const confirmedToday = todays.filter((a) => a.status === "CONFIRMED").length;

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });
  }

  const cards = [
    {
      label: "Total Patients",
      value: patientCount === null ? "…" : patientCount.toLocaleString("en-IN"),
      color: "text-emerald-400",
    },
    {
      label: "Today's Appointments",
      value: loading ? "…" : String(todays.length),
      color: "text-blue-400",
    },
    {
      label: "Confirmed Today",
      value: loading ? "…" : String(confirmedToday),
      color: "text-amber-400",
    },
    {
      label: "Monthly Revenue",
      value: "—",
      color: "text-gray-500",
      hint: "Coming in Phase 7",
    },
  ];

  return (
    <div className="min-h-full bg-gray-950">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good morning, Dr. Sharma</h1>
        <p className="text-gray-400 text-sm mt-1">SmileCare Dental Clinic · {dateLabel}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-gray-400 text-xs mb-2">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            {card.hint && <div className="text-gray-600 text-[10px] mt-1">{card.hint}</div>}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Today's Appointments</h2>
          <Link href="/appointments" className="text-emerald-400 text-xs hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm py-6 text-center">Loading...</div>
        ) : todays.length === 0 ? (
          <div className="text-gray-500 text-sm py-6 text-center">
            No appointments scheduled for today.
          </div>
        ) : (
          todays.map((apt) => (
            <div key={apt.id} className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
              <div className="w-8 h-8 bg-emerald-600/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold">
                {apt.patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-white text-sm">{apt.patient.name}</div>
                <div className="text-gray-400 text-xs">{apt.treatmentType}</div>
              </div>
              <div className="text-gray-400 text-xs">{formatTime(apt.scheduledAt)}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[apt.status] || "text-gray-400 bg-gray-400/10"}`}>
                {apt.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
