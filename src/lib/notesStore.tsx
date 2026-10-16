import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EXAMPLES } from "./examples";
import { uid } from "./id";
import type { Lang, Note, NoteDraft, NoteSource } from "./types";

const STORAGE_KEY = "voxa.notes.v1";

export const draftToNote = (draft: NoteDraft, transcript: string, lang: Lang, source: NoteSource, createdAt = new Date()): Note => ({
  id: uid(),
  createdAt: createdAt.toISOString(),
  lang,
  transcript,
  title: draft.title,
  summary: draft.summary,
  tasks: draft.tasks.map((text) => ({ id: uid(), text, done: false })),
  reminders: draft.reminders.map((r) => ({ id: uid(), text: r.text, at: r.at })),
  tags: draft.tags,
  source,
});

/** Two example notes so first-time visitors don't land on an empty screen */
const seedNotes = (): Note[] => {
  const now = new Date();
  // EXAMPLES[0] is kept fresh for the "Try an example" button
  return EXAMPLES.slice(1, 3).map((ex, i) => {
    const note = draftToNote(ex.draft(now), ex.transcript, ex.lang, "example", new Date(now.getTime() - (i + 1) * 3600e3));
    if (i === 1) note.tasks[0].done = true;
    return note;
  });
};

type NotesContext = {
  notes: Note[];
  ready: boolean;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;
  toggleTask: (noteId: string, taskId: string) => void;
};

const Ctx = createContext<NotesContext | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setNotes(raw ? JSON.parse(raw) : seedNotes()))
      .catch(() => setNotes(seedNotes()))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes, ready]);

  const addNote = useCallback((note: Note) => setNotes((prev) => [note, ...prev]), []);
  const removeNote = useCallback((id: string) => setNotes((prev) => prev.filter((n) => n.id !== id)), []);
  const toggleTask = useCallback(
    (noteId: string, taskId: string) =>
      setNotes((prev) =>
        prev.map((n) =>
          n.id !== noteId ? n : { ...n, tasks: n.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
        )
      ),
    []
  );

  const value = useMemo(() => ({ notes, ready, addNote, removeNote, toggleTask }), [notes, ready, addNote, removeNote, toggleTask]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useNotes = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotes must be used inside <NotesProvider>");
  return ctx;
};
