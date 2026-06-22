"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle2, FileText } from "lucide-react";

type Appt = { id: string; patient: { name: string }; treatmentType: string; scheduledAt: string };
type Note = {
  id: string;
  chiefComplaint: string | null;
  clinicalFindings: string | null;
  assessment: string | null;
  treatmentPlan: string | null;
  treatmentDone: string | null;
  prescription: string | null;
  aiGenerated: boolean;
  isApproved: boolean;
  patient: { name: string; patientCode: string };
  appointment: { treatmentType: string; scheduledAt: string };
};

const FIELD_LABELS: { key: keyof Draft; label: string }[] = [
  { key: "chiefComplaint", label: "Chief Complaint" },
  { key: "clinicalFindings", label: "Clinical Findings" },
  { key: "assessment", label: "Assessment" },
  { key: "treatmentPlan", label: "Treatment Plan" },
  { key: "treatmentDone", label: "Treatment Done" },
  { key: "prescription", label: "Prescription" },
];

type Draft = {
  id: string;
  chiefComplaint: string;
  clinicalFindings: string;
  assessment: string;
  treatmentPlan: string;
  treatmentDone: string;
  prescription: string;
};

export default function ClinicalNotesPage() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAll() {
    const [aRes, nRes] = await Promise.all([
      fetch("/api/appointments"),
      fetch("/api/clinical-notes"),
    ]);
    const aData = await aRes.json();
    const nData = await nRes.json();
    setAppointments(aData.appointments || []);
    setNotes(nData.data || []);
  }

  // Role guard: only DENTIST and CLINIC_ADMIN may view clinical notes.
  // A receptionist who types the URL directly is redirected to the dashboard.
  useEffect(() => {
    const c = document.cookie.split("; ").find((x) => x.startsWith("user_role="));
    const role = c ? c.split("=")[1] : "";
    if (role !== "CLINIC_ADMIN" && role !== "DENTIST") {
      window.location.replace("/dashboard");
    }
  }, []);

  useEffect(() => { loadAll(); }, []);

  async function generate() {
    if (!appointmentId || !rawText.trim()) {
      setMessage("Pick an appointment and enter notes first.");
      return;
    }
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, rawText }),
      });
      const data = await res.json();
      if (data.success) {
        const n = data.data;
        setDraft({
          id: n.id,
          chiefComplaint: n.chiefComplaint || "",
          clinicalFindings: n.clinicalFindings || "",
          assessment: n.assessment || "",
          treatmentPlan: n.treatmentPlan || "",
          treatmentDone: n.treatmentDone || "",
          prescription: n.prescription || "",
        });
        setMessage("AI draft generated. Review and edit before approving.");
      } else {
        setMessage(data.error || "Failed to generate.");
      }
    } catch {
      setMessage("Failed to generate.");
    } finally {
      setGenerating(false);
    }
  }

  async function approveAndSave() {
    if (!draft) return;
    setSaving(true);
    try {
      // Save any edits first
      await fetch(`/api/clinical-notes/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint: draft.chiefComplaint,
          clinicalFindings: draft.clinicalFindings,
          assessment: draft.assessment,
          treatmentPlan: draft.treatmentPlan,
          treatmentDone: draft.treatmentDone,
          prescription: draft.prescription,
        }),
      });
      // Then approve (the gate)
      await fetch(`/api/clinical-notes/${draft.id}/approve`, { method: "PUT" });
      setDraft(null);
      setRawText("");
      setAppointmentId("");
      setMessage("Note approved and saved.");
      await loadAll();
    } catch {
      setMessage("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clinical Notes</h1>
        <p className="text-muted-foreground">Dictate, let AI structure, review, and approve</p>
      </div>

      {message && <div className="rounded-md bg-muted p-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — create */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" /> New Note
            </h2>

            <div className="space-y-2">
              <Label>Appointment</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
              >
                <option value="">Select an appointment...</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.patient.name} — {a.treatmentType}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Dictation / Notes</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px]"
                placeholder="e.g. Patient has pain in lower right molar. Found a deep cavity. Diagnosis pulpitis. Plan root canal. Prescribed amoxicillin."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Type for now. Voice dictation (Whisper) plugs in here later.
              </p>
            </div>

            <Button onClick={generate} disabled={generating}>
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "Generate Note (AI)"}
            </Button>
          </Card>

          {/* Draft — editable, then approve */}
          {draft && (
            <Card className="p-5 space-y-4 border-amber-300">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Review Draft</h2>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  Draft — not yet saved
                </Badge>
              </div>
              {FIELD_LABELS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label>{label}</Label>
                  <textarea
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px]"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </div>
              ))}
              <Button onClick={approveAndSave} disabled={saving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Approve & Save"}
              </Button>
            </Card>
          )}
        </div>

        {/* RIGHT — list */}
        <div>
          <Card className="p-5">
            <h2 className="font-semibold mb-4">Recent Notes</h2>
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{n.patient.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {n.appointment.treatmentType}
                        </div>
                      </div>
                      {n.isApproved ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          ✓ Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          Draft
                        </Badge>
                      )}
                    </div>
                    {n.chiefComplaint && (
                      <p className="text-xs text-muted-foreground mt-2">{n.chiefComplaint}</p>
                    )}
                    {n.aiGenerated && (
                      <p className="text-[10px] text-muted-foreground mt-1">AI-assisted</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
