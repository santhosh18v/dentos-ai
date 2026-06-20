// The five intents, matching the Phase 5 spec exactly.
export type Intent =
  | "CONFIRM"
  | "CANNOT_ATTEND"
  | "CALL_ME_BACK"
  | "HUMAN_ASSISTANCE"
  | "REPEAT"
  | "UNKNOWN"; // fallback when nothing matches

export interface IntentResult {
  intent: Intent;
  reason?: string;      // extracted reason, e.g. "Exam tomorrow"
  confidence: number;   // 0..1
}

// Every detector (mock, GPT) must implement this.
export interface IntentDetector {
  name: string;
  detect(transcript: string): Promise<IntentResult>;
}
