"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Clock } from "lucide-react";
import Link from "next/link";

type Patient = { id: string; name: string; patientCode: string; phone: string };
type Dentist = { id: string; name: string; role: string };

const TREATMENTS = [
  "Checkup", "Cleaning", "Filling", "Root Canal",
  "Extraction", "Crown", "Whitening", "Braces Consultation",
];

// Build 30-minute time slots between an opening and closing time ("HH:mm").
// e.g. buildSlots("09:00", "20:00") -> ["09:00","09:30",...,"20:00"]
function buildSlots(open: string, close: string): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const start = oh * 60 + (om || 0);
  const end = ch * 60 + (cm || 0);
  const out: string[] = [];
  for (let mins = start; mins <= end; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return out;
}

// Fallback if clinic hours haven't loaded yet
const DEFAULT_SLOTS = buildSlots("09:00", "20:00");

// Format "14:30" -> "2:30 PM" for display
function formatSlot(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [patientId, setPatientId] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState("");
  const [durationMins, setDurationMins] = useState(30);
  const [treatmentType, setTreatmentType] = useState("Checkup");
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>(DEFAULT_SLOTS);

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((d) => setPatients(d.data || d.patients || []))
      .catch(() => setPatients([]));
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setDentists(d.users || []))
      .catch(() => setDentists([]));
    fetch("/api/clinic")
      .then((r) => r.json())
      .then((d) => {
        const open = d?.data?.openingTime;
        const close = d?.data?.closingTime;
        if (open && close) setSlots(buildSlots(open, close));
      })
      .catch(() => setSlots(DEFAULT_SLOTS));
  }, []);

  async function handleSubmit() {
    setError("");

    if (!patientId || !dentistId || !date || !time || !treatmentType) {
      setError("Please fill patient, dentist, date, time and treatment.");
      return;
    }

    setSaving(true);

    const [hours, minutes] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    const scheduledAt = combined.toISOString();

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId, dentistId, scheduledAt,
          durationMins, treatmentType, notes,
        }),
      });

      if (res.ok) {
        router.push("/appointments");
      } else {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Is the server running?");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/appointments">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Appointment</h1>
          <p className="text-muted-foreground">Book a slot for a patient</p>
        </div>
      </div>

      <Card className="p-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-2">
          <Label>Patient</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.patientCode}) — {p.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Dentist</Label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={dentistId}
            onChange={(e) => setDentistId(e.target.value)}
          >
            <option value="">Select a dentist...</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span className="text-muted-foreground">dd/mm/yyyy</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Popover open={timeOpen} onOpenChange={setTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {time ? formatSlot(time) : <span className="text-muted-foreground">Select a time</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {slots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={time === slot ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => {
                        setTime(slot);
                        setTimeOpen(false);
                      }}
                    >
                      {formatSlot(slot)}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Treatment</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={treatmentType}
              onChange={(e) => setTreatmentType(e.target.value)}
            >
              {TREATMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={durationMins}
              onChange={(e) => setDurationMins(Number(e.target.value))}
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="e.g. Patient is nervous, bring previous X-rays"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Booking..." : "Book Appointment"}
          </Button>
          <Link href="/appointments">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
