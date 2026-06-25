"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sparkles, CheckCircle2, FileText, Mic, MicOff, Settings2 } from "lucide-react";

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

const DEFAULT_DICTATION_URL = "https://airfare-updating-describing-seats.trycloudflare.com";

export default function ClinicalNotesPage() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [appointmentId, setAppointmentId] = useState("");
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [dictationUrl, setDictationUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dictationUrl") || DEFAULT_DICTATION_URL;
    }
    return DEFAULT_DICTATION_URL;
  });
  const [showUrlInput, setShowUrlInput] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  useEffect(() => {
    const c = document.cookie.split("; ").find((x) => x.startsWith("user_role="));
    const role = c ? c.split("=")[1] : "";
    if (role !== "CLINIC_ADMIN" && role !== "DENTIST") {
      window.location.replace("/dashboard");
    }
  }, []);

  useEffect(() => { loadAll(); }, []);

  async function startRecording() {
    if (!appointmentId) {
      setMessage("Select an appointment before recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendToDictate(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setMessage("Recording… speak clearly. Click Stop when done.");
    } catch {
      setMessage("Microphone access denied. Please allow microphone in browser settings.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setTranscribing(true);
    setMessage("Transcribing and structuring note… this may take 10–30 seconds.");
  }

  async function sendToDictate(blob: Blob) {
    try {
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");

      const res = await fetch(`${dictationUrl.replace(/\/$/,  "")}/dictate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();

      const transcript: string = data.transcript || "";
      const cn = data.clinicalNote || {};

      setRawText(transcript);

      const noteRes = await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, rawText: transcript }),
      });
      const noteData = await noteRes.json();

      if (!noteData.success) throw new Error(noteData.error || "Failed to create note");

      const n = noteData.data;

      setDraft({
        id: n.id,
        chiefComplaint:   cn.chiefComplaint || n.chiefComplaint   || "",
        clinicalFindings: [cn.history, cn.examination].filter(Boolean).join("\n") || n.clinicalFindings || "",
        assessment:       cn.diagnosis     || n.assessment        || "",
        treatmentPlan:    cn.treatmentPlan || n.treatmentPlan     || "",
        treatmentDone:    n.treatmentDone  || "",
        prescription:     n.prescription   || "",
      });

      setMessage("Voice note transcribed by Whisper and structured by Qwen3. Review and approve.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessage(`Dictation failed: ${msg}. Make sure the tunnel is running and the URL is correct.`);
    } finally {
      setTranscribing(false);
    }
  }

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
          chiefComplaint:   n.chiefComplaint   || "",
          clinicalFindings: n.clinicalFindings  || "",
          assessment:       n.assessment        || "",
          treatmentPlan:    n.treatmentPlan     || "",
          treatmentDone:    n.treatmentDone     || "",
          prescription:     n.prescription      || "",
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
      await fetch(`/api/clinical-notes/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint:   draft.chiefComplaint,
          clinicalFindings: draft.clinicalFindings,
          assessment:       draft.assessment,
          treatmentPlan:    draft.treatmentPlan,
          treatmentDone:    draft.treatmentDone,
          prescription:     draft.prescription,
        }),
      });
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

      {message && (
        <div className={`rounded-md p-3 text-sm ${
          message.startsWith("Voice note")
            ? "bg-emerald-100 text-emerald-800"
            : message.startsWith("Dictation failed") || message.startsWith("Microphone")
            ? "bg-red-100 text-red-800"
            : "bg-muted"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> New Note
              </h2>
              <button
                onClick={() => setShowUrlInput((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Configure AI API URL"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>

            {showUrlInput && (
              <div className="space-y-1 rounded-md bg-muted p-3">
                <Label className="text-xs">AI API URL (Cloudflare Tunnel)</Label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-1.5 text-xs font-mono"
                  value={dictationUrl}
                  onChange={(e) => { setDictationUrl(e.target.value); localStorage.setItem("dictationUrl", e.target.value); }}
                  placeholder="https://your-tunnel.trycloudflare.com"
                />
                <p className="text-[10px] text-muted-foreground">
                  Update this when you restart the Cloudflare tunnel (URL changes each time).
                </p>
              </div>
            )}

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

            <div className="rounded-md border border-dashed border-emerald-400/50 bg-emerald-400/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Voice Dictation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Whisper transcribes · Qwen3 structures
                  </p>
                </div>
                {!recording ? (
                  <Button
                    size="sm"
                    onClick={startRecording}
                    disabled={transcribing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Mic className="mr-1.5 h-3.5 w-3.5" />
                    {transcribing ? "Processing…" : "Record"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  >
                    <MicOff className="mr-1.5 h-3.5 w-3.5" />
                    Stop
                  </Button>
                )}
              </div>
              {transcribing && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Transcribing with Whisper medium, then structuring with Qwen3 8B…
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Transcript / Notes</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]"
                placeholder="Transcript appears here after recording, or type directly…"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
              />
            </div>

            <Button onClick={generate} disabled={generating} variant="outline" className="w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "Generate from text (mock AI)"}
            </Button>
          </Card>

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
                          Approved
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
