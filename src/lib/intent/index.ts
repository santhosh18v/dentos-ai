import type { IntentDetector } from "./types";
import { MockIntentDetector } from "./mock-detector";

// The single switch point. To go live later, swap this line for
// `new GptIntentDetector(...)`. Nothing else in the app changes.
export const intentDetector: IntentDetector = new MockIntentDetector();

export * from "./types";
