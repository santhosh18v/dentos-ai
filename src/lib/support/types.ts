// What the agent receives and returns. Channel-agnostic: the website widget
// and the WhatsApp webhook both build a SupportInput and render a SupportReply.

export type SupportIntent =
  | "HOURS"
  | "PRICE"
  | "SERVICES"
  | "LOCATION"
  | "MY_APPOINTMENT"
  | "MY_BILLS"
  | "BOOKING"
  | "GREETING"
  | "FALLBACK";

export type SupportInput = {
  question: string;
  clinicId: string;
  patientId?: string | null; // known on website (logged in) or matched by phone on WhatsApp
};

export type SupportReply = {
  intent: SupportIntent;
  answer: string;
  handoff: boolean; // true = needs a human (e.g. booking) — agent never acts itself
};

export interface SupportAgent {
  answer(input: SupportInput): Promise<SupportReply>;
}
