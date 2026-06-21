"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Phone, PhoneCall, AlertTriangle } from "lucide-react";

type Call = {
  id: string;
  status: string;
  intent: string | null;
  reason: string | null;
  transcript: string | null;
  needsFollowup: boolean;
  phoneNumber: string;
  patient: { name: string; patientCode: string };
  appointment: { scheduledAt: string; treatmentType: string; status: string };
};

// Sample mixed Telugu-English replies (mock only — replaced by real
// Twilio transcripts in production).
const SAMPLE_REPLIES: { label: string; transcript: string }[] = [
  { label: "Confirms (Avunu vastanu)", transcript: "Avunu vastanu" },
  { label: "Can't attend (exam undhi ralenu)", transcript: "Tomorrow exam undhi madam ralenu" },
  { label: "Can't attend (office work)", transcript: "Office work undhi raalenu" },
  { label: "Call me back later", transcript: "Ippudu busy, later call cheyyandi" },
  { label: "Wants a human", transcript: "Receptionist tho matladali" },
  { label: "Didn't understand", transcript: "Ardham kaaledu malli cheppandi" },
];

const CALL_STATUS_COLORS: Record<string, string> = {
  INITIATED: "bg-gray-200 text-gray-800",
  RINGING: "bg-blue-100 text-blue-800",
  ANSWERED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  NO_ANSWER: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
};

const WINDOW_LABEL: Record<number, string> = {
  7: "one week before",
  3: "three days before",
  1: "one day before",
};

const INTENT_COLORS: Record<string, string> = {
  CONFIRM: "bg-emerald-100 text-emerald-800",
  CANNOT_ATTEND: "bg-orange-100 text-orange-800",
  CALL_ME_BACK: "bg-blue-100 text-blue-800",
  HUMAN_ASSISTANCE: "bg-purple-100 text-purple-800",
  REPEAT: "bg-gray-200 text-gray-800",
};

export default function VoiceAssistantPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");
  const [daysAhead, setDaysAhead] = useState(3);

  async function loadCalls() {
    try {
      const res = await fetch("/api/calls");
      const data = await res.json();
      setCalls(data.data || []);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalls();
  }, []);

  async function startCalls() {
    setStarting(true);
    setMessage("");
    try {
      const res = await fetch("/api/calls/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysAhead }),
      });
      const data = await res.json();
      const windowLabel = WINDOW_LABEL[daysAhead] || `${daysAhead} days ahead`;
      setMessage(
        data.count > 0
          ? `Started ${data.count} reminder call(s) for patients ${windowLabel}.`
          : `No appointments to call ${windowLabel}.`
      );
      await loadCalls();
    } catch {
      setMessage("Failed to start calls.");
    } finally {
      setStarting(false);
    }
  }

  async function simulateReply(callId: string, transcript: string) {
    await fetch(`/api/calls/${callId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    await loadCalls();
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
          <h1 className="text-2xl font-bold">Voice Assistant</h1>
          <p className="text-muted-foreground">AI appointment confirmation calls (Telugu / English)</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
          >
            <option value={7}>1 week before</option>
            <option value={3}>3 days before</option>
            <option value={1}>1 day before</option>
          </select>
          <Button onClick={startCalls} disabled={starting}>
            <PhoneCall className="mr-2 h-4 w-4" />
            {starting ? "Starting..." : "Start Reminder Calls"}
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-md bg-muted p-3 text-sm">{message}</div>
      )}

      <Card className="p-0">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center">
            <Phone className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No calls yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Start Reminder Calls" to call tomorrow's patients.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Call Status</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Simulate Reply</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div className="font-medium">{call.patient.name}</div>
                    <div className="text-xs text-muted-foreground">{call.patient.patientCode}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatTime(call.appointment.scheduledAt)}</div>
                    <div className="text-xs text-muted-foreground">{call.appointment.treatmentType}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={CALL_STATUS_COLORS[call.status] || ""} variant="secondary">
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {call.intent ? (
                      <div>
                        <Badge className={INTENT_COLORS[call.intent] || ""} variant="secondary">
                          {call.intent}
                        </Badge>
                        {call.reason && (
                          <div className="text-xs text-muted-foreground mt-1">{call.reason}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.needsFollowup ? (
                      <span className="inline-flex items-center gap-1 text-orange-600 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded-md border bg-background px-2 py-1 text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) simulateReply(call.id, e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="">Patient says...</option>
                      {SAMPLE_REPLIES.map((r) => (
                        <option key={r.label} value={r.transcript}>{r.label}</option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        Mock mode: "Simulate Reply" stands in for a real patient phone response.
        In production, Twilio + Whisper supply the transcript automatically.
      </p>
    </div>
  );
}
