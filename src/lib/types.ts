export type Lang = "en-US" | "ru-RU";

export type Task = {
  id: string;
  text: string;
  done: boolean;
};

export type Reminder = {
  id: string;
  text: string;
  /** ISO date-time if the note mentioned a concrete time */
  at: string | null;
};

/** How the structured note was produced */
export type NoteSource = "ai" | "offline" | "example";

export type Note = {
  id: string;
  createdAt: string;
  lang: Lang;
  transcript: string;
  title: string;
  summary: string;
  tasks: Task[];
  reminders: Reminder[];
  tags: string[];
  source: NoteSource;
};

/** Structured result returned by the AI (or the offline parser) for a transcript */
export type NoteDraft = Pick<Note, "title" | "summary" | "tags"> & {
  tasks: string[];
  reminders: { text: string; at: string | null }[];
};
