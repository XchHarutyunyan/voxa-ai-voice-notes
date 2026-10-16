import type { Lang, NoteDraft } from "./types";

/** Date helper: `days` from today at `hours`:`minutes` local time */
const at = (now: Date, days: number, hours: number, minutes = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export type Example = {
  lang: Lang;
  transcript: string;
  /** Pre-generated AI output so "Try an example" works instantly and offline */
  draft: (now: Date) => NoteDraft;
};

export const EXAMPLES: Example[] = [
  {
    lang: "en-US",
    transcript:
      "Okay so tomorrow at 10 I have a call with the client from Berlin about the new mobile app. Before that I need to prepare the estimate and send them the updated designs. Also don't forget to buy a birthday gift for mom, her party is on Saturday at 6 pm.",
    draft: (now) => ({
      title: "Client call & mom's birthday",
      summary: "Prepare for tomorrow's call with the Berlin client about the mobile app and get a gift before mom's party on Saturday.",
      tasks: ["Prepare the project estimate", "Send the updated designs to the client", "Buy a birthday gift for mom"],
      reminders: [
        { text: "Call with the Berlin client about the mobile app", at: at(now, 1, 10) },
        { text: "Mom's birthday party", at: at(now, (6 - now.getDay() + 7) % 7 || 7, 18) },
      ],
      tags: ["work", "personal"],
    }),
  },
  {
    lang: "en-US",
    transcript:
      "App idea: a habit tracker where your friends can see your streaks and send you a little nudge when you skip a day. Keep it offline first, sync later. I should sketch the onboarding tonight and check what Apple Health integration needs.",
    draft: (now) => ({
      title: "Social habit tracker idea",
      summary: "An offline-first habit tracker where friends see your streaks and nudge you when you skip a day.",
      tasks: ["Sketch the onboarding flow", "Research Apple Health integration requirements"],
      reminders: [{ text: "Sketch the onboarding", at: at(now, now.getHours() >= 20 ? 1 : 0, 20) }],
      tags: ["ideas", "work"],
    }),
  },
  {
    lang: "ru-RU",
    transcript:
      "Завтра в 9 утра стоматолог, нужно не опоздать. После обеда забрать посылку на почте и оплатить интернет до пятницы. И ещё записаться в спортзал на следующую неделю.",
    draft: (now) => ({
      title: "Стоматолог и дела на завтра",
      summary: "Утром визит к стоматологу, днём посылка и оплата интернета, плюс запись в спортзал.",
      tasks: ["Забрать посылку на почте", "Оплатить интернет до пятницы", "Записаться в спортзал на следующую неделю"],
      reminders: [
        { text: "Стоматолог", at: at(now, 1, 9) },
        { text: "Оплатить интернет", at: at(now, (5 - now.getDay() + 7) % 7 || 7, 12) },
      ],
      tags: ["health", "finance"],
    }),
  },
];
