import { MockSupportAgent } from "./mock-agent";
import type { SupportAgent } from "./types";

// Swap point: replace with `new GptSupportAgent()` later. Same interface,
// same clinic data — only the language understanding gets smarter.
export const supportAgent: SupportAgent = new MockSupportAgent();

export type { SupportInput, SupportReply, SupportIntent, SupportAgent } from "./types";
