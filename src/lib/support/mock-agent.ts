import { prisma } from "@/lib/prisma";
import type { SupportAgent, SupportInput, SupportReply, SupportIntent } from "./types";

// Mock = keyword-based language understanding, but answers from REAL clinic data.
// Swap to a GptSupportAgent later (same interface, same data, smarter parsing).

function detectIntent(q: string): SupportIntent {
  const t = q.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  if (has("hello", "hi ", "hey", "good morning", "good evening")) return "GREETING";
  if (has("timing", "open", "close", "hours", "sunday", "working", "when are you")) return "HOURS";
  if (has("cost", "price", "how much", "fee", "charge", "rate")) return "PRICE";
  if (has("do you do", "do you have", "services", "treatment", "offer", "provide")) return "SERVICES";
  if (has("where", "address", "location", "parking", "reach", "directions")) return "LOCATION";
  if (has("my appointment", "my next", "my visit", "when is my", "do i have appointment")) return "MY_APPOINTMENT";
  if (has("pending", "bill", "due", "balance", "owe", "invoice", "payment due")) return "MY_BILLS";
  if (has("book", "schedule", "make an appointment", "want to come", "reschedule", "cancel")) return "BOOKING";
  return "FALLBACK";
}

function rupee(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export class MockSupportAgent implements SupportAgent {
  async answer(input: SupportInput): Promise<SupportReply> {
    const intent = detectIntent(input.question);
    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    const clinicName = clinic?.name || "our clinic";

    switch (intent) {
      case "GREETING":
        return {
          intent,
          handoff: false,
          answer: `Hello! Welcome to ${clinicName}. I can help with our timings, services, prices, location, your appointments, or pending bills. What would you like to know?`,
        };

      case "HOURS": {
        const days = clinic?.workingDays || "Mon-Sat";
        const open = clinic?.openingTime || "09:00";
        const close = clinic?.closingTime || "18:00";
        const sundayNote = days.toLowerCase().includes("sun")
          ? " Yes, we are open on Sundays too."
          : " We are closed on Sundays.";
        return {
          intent,
          handoff: false,
          answer: `We are open ${days}, ${open} to ${close}.${sundayNote}`,
        };
      }

      case "PRICE": {
        const services = await prisma.clinicService.findMany({
          where: { clinicId: input.clinicId, isActive: true },
        });
        const t = input.question.toLowerCase();
        const matched = services.find((s) =>
          t.includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().split(/[ /&]+/).some((w) => w.length > 3 && t.includes(w))
        );
        if (matched) {
          return {
            intent,
            handoff: false,
            answer: `${matched.name} costs ${rupee(Number(matched.price))}.${matched.description ? " " + matched.description : ""}`,
          };
        }
        const list = services.slice(0, 6).map((s) => `${s.name} (${rupee(Number(s.price))})`).join(", ");
        return {
          intent,
          handoff: false,
          answer: `Here are some of our prices: ${list}. Ask about a specific treatment for its exact price.`,
        };
      }

      case "SERVICES": {
        const services = await prisma.clinicService.findMany({
          where: { clinicId: input.clinicId, isActive: true },
        });
        const names = services.map((s) => s.name).join(", ");
        return {
          intent,
          handoff: false,
          answer: `We offer: ${names}. Would you like the price of any of these?`,
        };
      }

      case "LOCATION":
        return {
          intent,
          handoff: false,
          answer: `${clinicName} is at ${clinic?.address || "our listed address"}. ${clinic?.aboutInfo || ""}`.trim(),
        };

      case "MY_APPOINTMENT": {
        if (!input.patientId) {
          const wa = clinic?.whatsappNumber;
          const msg = wa
            ? `For your personal appointment details, please message us on WhatsApp at ${wa} — we'll verify your number and help you there.`
            : "For your personal appointment details, please contact the clinic directly.";
          return { intent, handoff: false, answer: msg };
        }
        const next = await prisma.appointment.findFirst({
          where: {
            patientId: input.patientId,
            scheduledAt: { gte: new Date() },
            status: { in: ["SCHEDULED", "CONFIRMED"] },
          },
          orderBy: { scheduledAt: "asc" },
        });
        if (!next) {
          return { intent, handoff: false, answer: "You don't have any upcoming appointments. Would you like to book one? I can connect you with our staff." };
        }
        const when = next.scheduledAt.toLocaleString("en-IN", {
          weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
        });
        return {
          intent,
          handoff: false,
          answer: `Your next appointment is ${next.treatmentType} on ${when}.`,
        };
      }

      case "MY_BILLS": {
        if (!input.patientId) {
          const wa = clinic?.whatsappNumber;
          const msg = wa
            ? `For your bill details, please message us on WhatsApp at ${wa} — we'll verify your number and share them securely.`
            : "For your bill details, please contact the clinic directly.";
          return { intent, handoff: false, answer: msg };
        }
        const unpaid = await prisma.invoice.findMany({
          where: {
            patientId: input.patientId,
            status: { in: ["SENT", "PARTIALLY_PAID"] },
          },
        });
        if (unpaid.length === 0) {
          return { intent, handoff: false, answer: "You have no pending bills. You're all settled!" };
        }
        const totalDue = unpaid.reduce((s, inv) => s + (Number(inv.total) - Number(inv.amountPaid)), 0);
        return {
          intent,
          handoff: false,
          answer: `You have ${unpaid.length} pending bill(s) with a total balance of ${rupee(totalDue)}. You can pay at the clinic via cash, UPI, or card.`,
        };
      }

      case "BOOKING":
        // SAFETY: the agent never books/changes anything — hands off to a human.
        return {
          intent,
          handoff: true,
          answer: "I'd be happy to help you book or change an appointment. Let me connect you with our staff who will confirm a time for you.",
        };

      default:
        return {
          intent: "FALLBACK",
          handoff: true,
          answer: "I'm not sure about that one — let me connect you with our staff who can help directly.",
        };
    }
  }
}
