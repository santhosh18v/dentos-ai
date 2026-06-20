// The structured medical note the AI produces from raw text.
export interface StructuredNote {
  chiefComplaint?: string;
  clinicalFindings?: string;
  assessment?: string;
  treatmentPlan?: string;
  treatmentDone?: string;
  prescription?: string;
  followUpDate?: string; // ISO date string, optional
}

// Every structurer (mock, GPT) must implement this.
export interface NoteStructurer {
  name: string;
  structure(rawText: string): Promise<StructuredNote>;
}
