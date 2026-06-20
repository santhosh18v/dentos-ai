import type { NoteStructurer } from "./types";
import { MockNoteStructurer } from "./mock-structurer";

// The single switch point. To go live later, swap this line for
// `new GptStructurer(...)`. Nothing else in the app changes.
export const noteStructurer: NoteStructurer = new MockNoteStructurer();

export * from "./types";
