import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { intentDetector } from "@/lib/intent";
import type { Intent } from "@/lib/intent";
import type { AppointmentStatus } from "@prisma/client";

// POST /api/calls/[id]/respond
// Body: { transcript: "Tomorrow exam undhi ralenu" }
// In Path B, YOU send the transcript. Later, Twilio's webhook sends it.
// Runs intent detection → updates CallLog + Appointment accordingly.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { success: false, error: "transcript is required" },
        { status: 400 }
      );
    }

    const callLog = await prisma.callLog.findUnique({ where: { id } });
    if (!callLog) {
      return NextResponse.json(
        { success: false, error: "Call not found" },
        { status: 404 }
      );
    }

    // Detect intent (mock for now, GPT later — same interface)
    const result = await intentDetector.detect(transcript);

    // Decide the consequences
    const { appointmentStatus, needsFollowup } = mapIntent(result.intent);

    // Update the call log with the outcome
    await prisma.callLog.update({
      where: { id },
      data: {
        status: "COMPLETED",
        intent: result.intent === "UNKNOWN" ? null : (result.intent as Exclude<Intent, "UNKNOWN">),
        reason: result.reason || null,
        transcript,
        needsFollowup,
      },
    });

    // Update the appointment if the intent calls for it
    if (appointmentStatus) {
      await prisma.appointment.update({
        where: { id: callLog.appointmentId },
        data: { status: appointmentStatus },
      });
    }

    return NextResponse.json({
      success: true,
      intent: result.intent,
      reason: result.reason || null,
      appointmentStatus: appointmentStatus || "unchanged",
      needsFollowup,
    });
  } catch (error) {
    console.error("[POST /api/calls/[id]/respond]", error);
    return NextResponse.json(
      { success: false, error: "Failed to process response" },
      { status: 500 }
    );
  }
}

// Maps an intent to its consequences (your spec's business rules)
function mapIntent(intent: Intent): {
  appointmentStatus: AppointmentStatus | null;
  needsFollowup: boolean;
} {
  switch (intent) {
    case "CONFIRM":
      return { appointmentStatus: "CONFIRMED", needsFollowup: false };
    case "CANNOT_ATTEND":
      return { appointmentStatus: "NEEDS_FOLLOWUP", needsFollowup: true };
    case "CALL_ME_BACK":
      return { appointmentStatus: null, needsFollowup: true };
    case "HUMAN_ASSISTANCE":
      return { appointmentStatus: null, needsFollowup: true };
    case "REPEAT":
      return { appointmentStatus: null, needsFollowup: false };
    default: // UNKNOWN — safest is to flag for a human
      return { appointmentStatus: null, needsFollowup: true };
  }
}
