import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chip } from "./Chip";
import { colors, formatCreated, formatWhen, radius } from "@/lib/theme";
import type { Note } from "@/lib/types";

export function NoteCard({ note }: { note: Note }) {
  const done = note.tasks.filter((t) => t.done).length;
  const next = note.reminders.find((r) => r.at && new Date(r.at) > new Date());

  return (
    <Link href={{ pathname: "/note/[id]", params: { id: note.id } }} asChild>
      <Pressable style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {note.title}
          </Text>
          <Text style={styles.date}>{formatCreated(note.createdAt)}</Text>
        </View>
        <Text style={styles.summary} numberOfLines={2}>
          {note.summary}
        </Text>
        <View style={styles.meta}>
          {note.tasks.length > 0 && (
            <Chip
              icon="checkbox-outline"
              label={`${done}/${note.tasks.length} tasks`}
              tone={done === note.tasks.length ? "green" : "accent"}
            />
          )}
          {next && <Chip icon="alarm-outline" label={formatWhen(next.at, note.lang)!} tone="coral" />}
          {note.tags.slice(0, 2).map((tag) => (
            <Chip key={tag} label={`#${tag}`} />
          ))}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 },
  date: { color: colors.muted, fontSize: 12 },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
});
