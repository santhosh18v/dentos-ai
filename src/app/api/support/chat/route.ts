import { NextRequest, NextResponse } from "next/server";
import { supportAgent } from "@/lib/support";

// PUBLIC route (in proxy publicRoutes) — the shared brain for BOTH channels.
// Body: { question: string, clinicId?: string, patientId?: string, channel?: "web" | "whatsapp" }
//
// SECURITY: the "web" channel is anonymous — the agent NEVER serves personal data on it,
// regardless of any patientId passed. Personal questions are redirected to WhatsApp, where
// identity is verified by phone number. So a public caller cannot pull patient data here.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, patientId } = body;
    const channel: "web" | "whatsapp" = body.channel === "whatsapp" ? "whatsapp" : "web";
    // clinicId comes from the caller (public page knows it via slug); fallback for legacy widget.
    const clinicId = typeof body.clinicId === "string" && body.clinicId ? body.clinicId : "clinic001";

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "A question is required" },
        { status: 400 }
      );
    }

    // On the web channel, force patientId to null — anonymous visitors get no personal data.
    // Only the WhatsApp webhook (verified phone) may pass a real patientId.
    const safePatientId = channel === "whatsapp" ? (patientId || null) : null;

    const reply = await supportAgent.answer({
      question,
      clinicId,
      patientId: safePatientId,
      channel,
    });
    return NextResponse.json({ success: true, data: reply });
  } catch (error) {
    console.error("[POST /api/support/chat]", error);
    return NextResponse.json(
      { success: false, error: "Failed to get an answer" },
      { status: 500 }
    );
  }
}
