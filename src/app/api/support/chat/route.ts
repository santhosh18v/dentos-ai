import { NextRequest, NextResponse } from "next/server";
import { supportAgent } from "@/lib/support";

const CLINIC_ID = "clinic001";

// POST /api/support/chat
// Body: { question: string, patientId?: string }
// The shared brain for BOTH channels (website widget + WhatsApp webhook).
export async function POST(request: NextRequest) {
  try {
    const { question, patientId } = await request.json();

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "A question is required" },
        { status: 400 }
      );
    }

    const reply = await supportAgent.answer({
      question,
      clinicId: CLINIC_ID,
      patientId: patientId || null,
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
