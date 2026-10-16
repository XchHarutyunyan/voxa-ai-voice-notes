import { Platform } from "react-native";
import { parseOffline } from "./offlineParser";
import type { Lang, NoteDraft, NoteSource } from "./types";

/**
 * On the web the app and the serverless function share an origin.
 * Native builds need the deployed URL in EXPO_PUBLIC_API_URL.
 */
const API_URL = Platform.OS === "web" ? "/api/process-note" : process.env.EXPO_PUBLIC_API_URL;
const TIMEOUT_MS = 15000;

/** Local date-time with UTC offset, e.g. "Saturday, 2026-10-17T01:39:00+04:00" */
export const localNow = (d: Date) => {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const iso =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
  return `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${iso}`;
};

const clean = (draft: NoteDraft): NoteDraft => ({
  title: String(draft.title).trim(),
  summary: String(draft.summary).trim(),
  tasks: draft.tasks.map(String).filter(Boolean).slice(0, 12),
  reminders: draft.reminders
    .filter((r) => r && r.text)
    .map((r) => ({ text: String(r.text), at: r.at && !isNaN(Date.parse(r.at)) ? new Date(r.at).toISOString() : null }))
    .slice(0, 8),
  tags: draft.tags.map((t) => String(t).toLowerCase()).filter(Boolean).slice(0, 3),
});

/** Structures a transcript with AI, falling back to the offline parser on any failure */
export async function processTranscript(
  transcript: string,
  lang: Lang
): Promise<{ draft: NoteDraft; source: NoteSource }> {
  const now = new Date();

  if (API_URL) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          lang,
          // Local time, not UTC: "tomorrow" must be relative to the user's calendar day
          now: localNow(now),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        signal: controller.signal,
      });
      if (res.ok) {
        const { draft } = await res.json();
        return { draft: clean(draft), source: "ai" };
      }
    } catch {
      // network error or timeout: fall through to offline mode
    } finally {
      clearTimeout(timer);
    }
  }

  return { draft: parseOffline(transcript, lang, now), source: "offline" };
}
