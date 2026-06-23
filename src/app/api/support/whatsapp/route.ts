import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportAgent } from "@/lib/support";

const CLINIC_ID = "clinic001";
const VERIFY_TOKEN = "dentos-whatsapp-verify"; // matches the token set in Meta dashboard (later)

// GET — Meta's webhook verification handshake.
// Meta calls this once when you register the webhook; you echo back hub.challenge.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Verification failed", { status: 403 });
}

// Normalise a phone number to its last 10 digits for matching
// (WhatsApp sends "919014743783", our DB may store "9014743783" or "+91...").
function last10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

// POST — incoming patient message.
// Body (mock shape, mirrors Meta's WhatsApp payload):
//   { from: "<phone>", text: "<message>" }
// Real Meta payload is nested (entry[].changes[].value.messages[]); we accept
// both the simple mock shape and a Meta-like shape.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract { from, text } from either the simple mock shape or Meta's nested shape
    let from: string | undefined;
    let text: string | undefined;

    if (body?.from && body?.text) {
      from = body.from;
      text = body.text;
    } else {
      const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      from = msg?.from;
      text = msg?.text?.body;
    }

    if (!from || !text) {
      return NextResponse.json(
        { success: false, error: "Expected { from, text }" },
        { status: 400 }
      );
    }

    // Match the patient by phone (enables personal queries without a login)
    const patients = await prisma.patient.findMany({
      where: { clinicId: CLINIC_ID },
      select: { id: true, phone: true },
    });
    const target = last10(from);
    const matched = patients.find((p) => last10(p.phone) === target);

    const reply = await supportAgent.answer({
      question: text,
      clinicId: CLINIC_ID,
      patientId: matched?.id || null,
      channel: "whatsapp",
    });

    // In production: POST reply.answer back via the WhatsApp Cloud API here.
    // For Path B we return it so we can see what would be sent.
    return NextResponse.json({
      success: true,
      channel: "whatsapp",
      to: from,
      matchedPatient: matched?.id || null,
      data: reply,
    });
  } catch (error) {
    console.error("[POST /api/support/whatsapp]", error);
    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}
