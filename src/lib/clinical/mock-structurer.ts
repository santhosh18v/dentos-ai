import type { NoteStructurer, StructuredNote } from "./types";

// Mock note structurer. Splits raw dictation into fields using simple
// keyword cues. NOT real understanding — the real GptStructurer (later)
// replaces this and handles natural, unstructured dictation. Same
// interface, so it drops in without touching routes or the page.

const FIELD_CUES: { field: keyof StructuredNote; cues: string[] }[] = [
  { field: "chiefComplaint",   cues: ["complaint", "patient has", "patient reports", "pain", "came for", "presenting"] },
  { field: "clinicalFindings", cues: ["found", "finding", "observed", "examination", "on exam", "noticed", "cavity", "swelling"] },
  { field: "assessment",       cues: ["diagnosis", "assessment", "appears to be", "likely", "pulpitis", "caries", "gingivitis"] },
  { field: "treatmentPlan",    cues: ["plan", "will do", "planned", "recommend", "advise", "next visit"] },
  { field: "treatmentDone",    cues: ["done", "performed", "completed", "did", "treated", "filled", "extracted", "cleaned"] },
  { field: "prescription",     cues: ["prescribe", "prescribed", "medication", "tablet", "amoxicillin", "ibuprofen", "rx", "take"] },
];

export class MockNoteStructurer implements NoteStructurer {
  name = "mock";

  async structure(rawText: string): Promise<StructuredNote> {
    // Split the dictation into sentences, then route each sentence
    // to the best-matching field based on keyword cues.
    const sentences = rawText
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const result: StructuredNote = {};

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let placed = false;

      for (const { field, cues } of FIELD_CUES) {
        if (cues.some((cue) => lower.includes(cue))) {
          result[field] = result[field]
            ? `${result[field]}. ${sentence}`
            : sentence;
          placed = true;
          break;
        }
      }

      // Unmatched sentences fall into clinicalFindings as a catch-all
      if (!placed) {
        result.clinicalFindings = result.clinicalFindings
          ? `${result.clinicalFindings}. ${sentence}`
          : sentence;
      }
    }

    return result;
  }
}
