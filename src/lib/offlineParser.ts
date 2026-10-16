import type { Lang, NoteDraft } from "./types";

/**
 * Rule-based fallback used when the AI endpoint is unavailable
 * (no API key, free quota exhausted, offline). Far less smart than the
 * model, but always works and never costs anything.
 */

const TASK_HINTS: Record<Lang, RegExp> = {
  "en-US":
    /\b(need to|have to|must|should|don't forget|do not forget|remember to|todo|to do|buy|call|send|email|prepare|book|pay|finish|fix|write|check|schedule|order|pick up)\b/i,
  "ru-RU":
    /(нужно|надо|необходимо|не забыть|не забудь|напомни|купить|позвонить|отправить|написать|подготовить|забронировать|оплатить|закончить|исправить|проверить|заказать|забрать)/i,
};

const TIME_HINTS: Record<Lang, RegExp> = {
  "en-US":
    /\b(today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|at \d{1,2}(:\d{2})?\s*(am|pm)?|\d{1,2}(:\d{2})?\s*(am|pm)|in \d+ (minutes?|hours?|days?))\b/i,
  "ru-RU":
    /(сегодня|вечером|завтра|послезавтра|понедельник|вторник|сред[уа]|четверг|пятниц[уа]|суббот[уа]|воскресенье|на следующей неделе|в \d{1,2}(:\d{2})?|через \d+ (минут[уы]?|час(а|ов)?|дн(я|ей)|день))/i,
};

const TAGS: { tag: string; re: RegExp }[] = [
  { tag: "work", re: /(meeting|client|call|estimate|project|deadline|report|team|invoice|созвон|встреч|клиент|заказчик|смет|проект|дедлайн|отчет|отчёт|команд|счет|счёт)/i },
  { tag: "personal", re: /(mom|dad|family|friend|birthday|gift|мам|пап|семь|друг|день рождения|подар)/i },
  { tag: "shopping", re: /(buy|order|groceries|store|купить|заказать|продукт|магазин)/i },
  { tag: "health", re: /(gym|doctor|dentist|run|workout|pills|спортзал|врач|стоматолог|бег|трениров|таблет)/i },
  { tag: "finance", re: /(pay|bill|rent|bank|budget|оплат|счет за|аренд|банк|бюджет)/i },
  { tag: "travel", re: /(flight|hotel|trip|ticket|airport|рейс|отель|поездк|билет|аэропорт)/i },
];

const WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  воскресенье: 0, понедельник: 1, вторник: 2, среду: 3, среда: 3, четверг: 4, пятницу: 5, пятница: 5, субботу: 6, суббота: 6,
};

const splitClauses = (text: string, lang: Lang) => {
  const connector = lang === "ru-RU" ? /,?\s+(?:и ещё|а также|и|а потом|потом)\s+/i : /,?\s+(?:and also|and then|and|then|also)\s+/i;
  return text
    .split(/[.!?;\n]+/)
    .flatMap((s) => s.split(connector))
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const cleanTask = (clause: string, lang: Lang) =>
  capitalize(
    clause
      .replace(
        lang === "ru-RU"
          ? /^(мне |я )?(нужно|надо|необходимо|не забыть|не забудь|напомни( мне)?)\s+/i
          : /^(i |we )?(need to|have to|must|should|don't forget to|do not forget to|remember to|don't forget|remember)\s+/i,
        ""
      )
      .trim()
  );

/** Resolves simple relative time expressions to an ISO date-time */
export const resolveTime = (clause: string, now: Date): string | null => {
  const text = clause.toLowerCase();
  const date = new Date(now);
  let matched = false;

  if (/(tomorrow|завтра)/.test(text)) {
    date.setDate(date.getDate() + (/(послезавтра)/.test(text) ? 2 : 1));
    matched = true;
  } else if (/(today|tonight|сегодня|вечером)/.test(text)) {
    matched = true;
  } else {
    const day = Object.keys(WEEKDAYS).find((d) => text.includes(d));
    if (day) {
      const diff = (WEEKDAYS[day] - date.getDay() + 7) % 7 || 7;
      date.setDate(date.getDate() + diff);
      matched = true;
    }
  }

  const inMatch = text.match(/(?:in|через) (\d+) (minute|minutes|hour|hours|минут|минуту|минуты|час|часа|часов)/);
  if (inMatch) {
    const n = Number(inMatch[1]);
    const ms = /(hour|час)/.test(inMatch[2]) ? n * 3600e3 : n * 60e3;
    return new Date(now.getTime() + ms).toISOString();
  }

  const clock = text.match(/(?:at |в )?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?!\d)/);
  if (clock && (matched || /(at |в )\d/.test(text) || clock[3])) {
    let hours = Number(clock[1]);
    if (clock[3] === "pm" && hours < 12) hours += 12;
    if (clock[3] === "am" && hours === 12) hours = 0;
    if (hours <= 23) {
      date.setHours(hours, Number(clock[2] || 0), 0, 0);
      if (!matched && date < now) date.setDate(date.getDate() + 1);
      return date.toISOString();
    }
  }

  if (matched) {
    date.setHours(/(tonight|вечером)/.test(text) ? 19 : 9, 0, 0, 0);
    return date.toISOString();
  }
  return null;
};

export function parseOffline(transcript: string, lang: Lang, now = new Date()): NoteDraft {
  const clauses = splitClauses(transcript, lang);
  const tasks: string[] = [];
  const reminders: NoteDraft["reminders"] = [];

  for (const clause of clauses) {
    const hasTime = TIME_HINTS[lang].test(clause);
    if (hasTime) {
      reminders.push({ text: cleanTask(clause, lang), at: resolveTime(clause, now) });
    }
    if (TASK_HINTS[lang].test(clause)) {
      tasks.push(cleanTask(clause, lang));
    }
  }

  const words = transcript.trim().split(/\s+/);
  const title = capitalize(words.slice(0, 6).join(" ").replace(/[,.;:!?]+$/, "")) + (words.length > 6 ? "…" : "");
  const firstSentence = transcript.split(/(?<=[.!?])\s+/)[0] ?? transcript;
  const summary = firstSentence.length > 160 ? firstSentence.slice(0, 157) + "…" : firstSentence;
  const tags = TAGS.filter(({ re }) => re.test(transcript)).map(({ tag }) => tag);

  return {
    title: title || (lang === "ru-RU" ? "Голосовая заметка" : "Voice note"),
    summary: capitalize(summary.trim()),
    tasks: [...new Set(tasks)].slice(0, 8),
    reminders: reminders.slice(0, 5),
    tags: tags.length ? tags : ["note"],
  };
}
