import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip } from "@/components/Chip";
import { useNotes } from "@/lib/notesStore";
import { colors, formatCreated, formatWhen, radius } from "@/lib/theme";

const SOURCE_LABEL = {
  ai: { label: "Organized by AI", icon: "sparkles", tone: "accent" },
  offline: { label: "Offline mode", icon: "cloud-offline-outline", tone: "muted" },
  example: { label: "Example note", icon: "play-circle-outline", tone: "muted" },
} as const;

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, toggleTask, removeNote } = useNotes();
  const [showTranscript, setShowTranscript] = useState(false);
  const note = notes.find((n) => n.id === id);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (!note) {
    return (
      <SafeAreaView style={styles.screen}>
        <Pressable onPress={back} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Notes</Text>
        </Pressable>
        <Text style={styles.empty}>This note no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const source = SOURCE_LABEL[note.source];
  const done = note.tasks.filter((t) => t.done).length;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.nav}>
        <Pressable onPress={back} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to notes">
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Notes</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            removeNote(note.id);
            back();
          }}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Delete note"
        >
          <Ionicons name="trash-outline" size={20} color={colors.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Chip label={source.label} icon={source.icon} tone={source.tone} />
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.date}>{formatCreated(note.createdAt)}</Text>
        <Text style={styles.summary}>{note.summary}</Text>

        {note.tasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Ionicons name="checkbox-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Tasks</Text>
              <Text style={styles.sectionCount}>
                {done}/{note.tasks.length}
              </Text>
            </View>
            {note.tasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() => toggleTask(note.id, task.id)}
                style={styles.task}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.done }}
              >
                <Ionicons
                  name={task.done ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={task.done ? colors.green : colors.muted}
                />
                <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.text}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {note.reminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Ionicons name="alarm-outline" size={18} color={colors.coral} />
              <Text style={styles.sectionTitle}>Reminders</Text>
            </View>
            {note.reminders.map((r) => (
              <View key={r.id} style={styles.reminder}>
                <Text style={styles.reminderText}>{r.text}</Text>
                {r.at && <Chip label={formatWhen(r.at, note.lang)!} icon="time-outline" tone="coral" />}
              </View>
            ))}
          </View>
        )}

        {note.tags.length > 0 && (
          <View style={[styles.section, styles.tags]}>
            {note.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} />
            ))}
          </View>
        )}

        <Pressable onPress={() => setShowTranscript((v) => !v)} style={styles.transcriptToggle}>
          <Ionicons name="mic-outline" size={16} color={colors.muted} />
          <Text style={styles.transcriptLabel}>{showTranscript ? "Hide" : "Show"} original transcript</Text>
          <Ionicons name={showTranscript ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
        </Pressable>
        {showTranscript && <Text style={styles.transcript}>{note.transcript}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingTop: 4 },
  backBtn: { flexDirection: "row", alignItems: "center", padding: 8 },
  backText: { color: colors.text, fontSize: 16 },
  iconBtn: { padding: 10 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 48, gap: 6 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6, marginTop: 10 },
  date: { color: colors.muted, fontSize: 13 },
  summary: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 10, opacity: 0.9 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
    gap: 4,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", flex: 1 },
  sectionCount: { color: colors.muted, fontSize: 13 },
  task: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  taskText: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 21 },
  taskDone: { color: colors.muted, textDecorationLine: "line-through" },
  reminder: { gap: 6, paddingVertical: 8 },
  reminderText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, backgroundColor: "transparent", borderWidth: 0, padding: 0 },
  transcriptToggle: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 22, alignSelf: "flex-start" },
  transcriptLabel: { color: colors.muted, fontSize: 13 },
  transcript: { color: colors.muted, fontSize: 14, lineHeight: 21, fontStyle: "italic", marginTop: 8 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
});
