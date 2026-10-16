export const colors = {
  bg: "#0F141A",
  surface: "#161E27",
  surface2: "#1D2733",
  border: "#253141",
  text: "#F3F5F7",
  muted: "#93A0AE",
  accent: "#48A3C6",
  accentSoft: "rgba(72,163,198,0.15)",
  coral: "#EA5B5C",
  coralSoft: "rgba(234,91,92,0.15)",
  green: "#3DDC84",
  amber: "#F5B54A",
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const formatWhen = (iso: string | null, locale: string) => {
  if (!iso) return null;
  const date = new Date(iso);
  const now = new Date();
  const dayDiff = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86400e3
  );
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const ru = locale.startsWith("ru");
  if (dayDiff === 0) return `${ru ? "Сегодня" : "Today"}, ${time}`;
  if (dayDiff === 1) return `${ru ? "Завтра" : "Tomorrow"}, ${time}`;
  return `${date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
};

export const formatCreated = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
