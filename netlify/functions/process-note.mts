/**
 * Turns a voice-note transcript into a structured note with Google Gemini
 * (free tier). The API key stays on the server: set GEMINI_API_KEY in the
 * Netlify site settings. Optional: GEMINI_MODELS, a comma-separated list
 * tried in order (a busy or rate-limited model falls through to the next).
 *
 * The client falls back to its offline parser whenever this endpoint
 * returns an error, so a missing key or exhausted quota never breaks the app.
 */

const MODELS = (process.env.GEMINI_MODELS || "gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-3.5-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const RETRYABLE = new Set([404, 429, 500, 503]);
const MAX_TRANSCRIPT = 4000;

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

const prompt = (transcript: string, lang: string, now: string, timezone: string) => `You turn messy voice notes into clean, actionable notes.

Current date-time: ${now} (time zone: ${timezone}).
Language of the note: ${lang}. Write every output string in the same language as the note.

Return ONLY a JSON object with exactly these fields:
{
  "title": string,            // 2-6 words, no trailing punctuation
  "summary": string,          // 1-2 short sentences
  "tasks": string[],          // concrete action items, each starting with a verb; [] if none
  "reminders": [              // things tied to a specific time; [] if none
    { "text": string, "at": string | null }  // "at" = ISO 8601 date-time with offset, resolved from relative expressions like "tomorrow at 10"; null if no exact time
  ],
  "tags": string[]            // 1-3 lowercase English tags, e.g. "work", "personal", "shopping", "health", "finance", "travel", "ideas"
}

Voice note transcript:
"""${transcript}"""`;

const isDraft = (d: any) =>
  d &&
  typeof d.title === "string" &&
  typeof d.summary === "string" &&
  Array.isArray(d.tasks) &&
  Array.isArray(d.reminders) &&
  Array.isArray(d.tags);

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "AI is not configured" }, 503);

  let body: { transcript?: string; lang?: string; now?: string; timezone?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const transcript = (body.transcript || "").trim().slice(0, MAX_TRANSCRIPT);
  if (transcript.length < 3) return json({ error: "Transcript is empty" }, 400);

  const request = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt(transcript, body.lang || "en-US", body.now || new Date().toISOString(), body.timezone || "UTC") }],
      },
    ],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });

  let res: Response | null = null;
  let model = MODELS[0];
  for (model of MODELS) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: request,
    });
    if (res.ok || !RETRYABLE.has(res.status)) break;
  }

  if (!res || !res.ok) {
    // 429 = free quota exhausted everywhere; the client switches to offline mode
    return json({ error: "AI request failed", status: res?.status }, res?.status === 429 ? 429 : 502);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

  try {
    const draft = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (!isDraft(draft)) throw new Error("Unexpected shape");
    return json({ draft, model });
  } catch {
    return json({ error: "AI returned an invalid response" }, 502);
  }
};

export const config = { path: "/api/process-note" };
