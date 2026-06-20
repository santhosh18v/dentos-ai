import type { IntentDetector, IntentResult, Intent } from "./types";

// Lightweight pattern matcher for mixed Telugu-English replies.
// This is a MOCK — it uses keyword cues, not real understanding.
// The real GptIntentDetector (later) will replace this and handle
// genuinely novel phrasing. Same interface, so it drops in cleanly.

const PATTERNS: { intent: Intent; cues: string[]; reasonCues?: string[] }[] = [
  {
    intent: "CONFIRM",
    cues: ["avunu", "vastanu", "vasthanu", "yes", "sure", "confirm", "ok", "okay", "ostanu"],
  },
  {
    intent: "CANNOT_ATTEND",
    cues: ["ralenu", "raalenu", "cant", "can't", "cannot", "busy", "exam", "office work", "out of station", "leave"],
    reasonCues: ["exam", "office work", "out of station", "busy", "travel", "work"],
  },
  {
    intent: "CALL_ME_BACK",
    cues: ["later call", "tharvatha call", "call cheyyandi", "ippudu busy", "call me back", "one hour"],
  },
  {
    intent: "HUMAN_ASSISTANCE",
    cues: ["receptionist", "doctor tho", "staff", "someone call", "matladali", "maatladali", "talk to"],
  },
  {
    intent: "REPEAT",
    cues: ["malli cheppandi", "ardham kaaledu", "repeat", "again", "cheppandi", "samajh"],
  },
];

export class MockIntentDetector implements IntentDetector {
  name = "mock";

  async detect(transcript: string): Promise<IntentResult> {
    const text = transcript.toLowerCase();

    for (const p of PATTERNS) {
      const hit = p.cues.some((cue) => text.includes(cue));
      if (hit) {
        let reason: string | undefined;
        if (p.reasonCues) {
          const matched = p.reasonCues.find((rc) => text.includes(rc));
          if (matched) reason = matched;
        }
        return { intent: p.intent, reason, confidence: 0.75 };
      }
    }

    return { intent: "UNKNOWN", confidence: 0.0 };
  }
}
