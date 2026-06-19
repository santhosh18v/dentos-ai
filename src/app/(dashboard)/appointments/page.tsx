"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Calendar } from "lucide-react";

type Appointment = {
  id: string;
  scheduledAt: string;
  durationMins: number;
  treatmentType: string;
  status: string;
  notes: string | null;
  patient: { name: string; phone: string; patientCode: string };
  dentist: { name: string };
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-200 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage clinic appointments</p>
        </div>
        <Link href="/appointments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Appointment
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No appointments yet</p>
            <Link href="/appointments/new">
              <Button className="mt-4" variant="outline">Book the first one</Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Dentist</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{formatTime(apt.scheduledAt)}</TableCell>
                  <TableCell>
                    <div>{apt.patient.name}</div>
                    <div className="text-xs text-muted-foreground">{apt.patient.patientCode}</div>
                  </TableCell>
                  <TableCell>{apt.dentist.name}</TableCell>
                  <TableCell>{apt.treatmentType}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[apt.status] || ""} variant="secondary">
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {apt.status === "SCHEDULED" && (
                      <Button size="sm" variant="outline"
                        onClick={() => updateStatus(apt.id, "CONFIRMED")}>
                        Confirm
                      </Button>
                    )}
                    {(apt.status === "SCHEDULED" || apt.status === "CONFIRMED") && (
                      <>
                        <Button size="sm" variant="outline"
                          onClick={() => updateStatus(apt.id, "COMPLETED")}>
                          Complete
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => updateStatus(apt.id, "NO_SHOW")}>
                          No-show
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
