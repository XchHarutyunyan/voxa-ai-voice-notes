import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NoteCard } from "@/components/NoteCard";
import { RecordButton } from "@/components/RecordButton";
import { processTranscript } from "@/lib/ai";
import { EXAMPLES } from "@/lib/examples";
import { draftToNote, useNotes } from "@/lib/notesStore";
import { colors, radius } from "@/lib/theme";
import type { Lang } from "@/lib/types";
import { useSpeech } from "@/lib/useSpeech";

type Phase = "idle" | "listening" | "typing" | "playing" | "processing";

const haptic = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

export default function HomeScreen() {
  const { notes, addNote } = useNotes();
  const [lang, setLang] = useState<Lang>("en-US");
  const speech = useSpeech(lang);
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState("");
  const [playback, setPlayback] = useState("");
  const [query, setQuery] = useState("");
  const exampleIndex = useRef(0);
  const wasListening = useRef(false);

  const finish = async (transcript: string, noteLang: Lang) => {
    const text = transcript.trim();
    if (text.length < 3) {
      setPhase("idle");
      return;
    }
    setPhase("processing");
    const { draft, source } = await processTranscript(text, noteLang);
    const note = draftToNote(draft, text, noteLang, source);
    addNote(note);
    setPhase("idle");
    setTyped("");
    speech.reset();
    router.push({ pathname: "/note/[id]", params: { id: note.id } });
  };

  // When the recognizer stops (button or silence), structure what was said
  useEffect(() => {
    if (wasListening.current && !speech.listening && phase === "listening") {
      finish(speech.transcript, lang);
    }
    wasListening.current = speech.listening;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening]);

  const toggleRecording = () => {
    haptic();
    if (speech.listening) {
      speech.stop();
    } else {
      setPhase("listening");
      speech.start();
    }
  };

  /** Replays a pre-recorded note word by word, then shows the AI result */
  const playExample = () => {
    const example = EXAMPLES[exampleIndex.current % EXAMPLES.length];
    exampleIndex.current += 1;
    const words = example.transcript.split(" ");
    setPhase("playing");
    setPlayback("");
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setPlayback(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(timer);
        setPhase("processing");
        setTimeout(() => {
          const note = draftToNote(example.draft(new Date()), example.transcript, example.lang, "example");
          addNote(note);
          setPhase("idle");
          setPlayback("");
          router.push({ pathname: "/note/[id]", params: { id: note.id } });
        }, 1200);
      }
    }, 70);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      [n.title, n.summary, n.transcript, ...n.tags, ...n.tasks.map((t) => t.text)].join(" ").toLowerCase().includes(q)
    );
  }, [notes, query]);

  const busy = phase === "processing" || phase === "playing";
  const liveText = phase === "playing" ? playback : speech.transcript;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.logo}>
            Voxa<Text style={{ color: colors.coral }}>.</Text>
          </Text>
          <Text style={styles.tagline}>Speak. AI organizes the rest.</Text>
        </View>
        <View style={styles.langToggle}>
          {(["en-US", "ru-RU"] as Lang[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              disabled={speech.listening}
              style={[styles.langBtn, lang === l && styles.langBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: lang === l }}
            >
              <Text style={[styles.langText, lang === l && { color: colors.text }]}>{l.slice(0, 2).toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.recorder}>
        {phase === "typing" ? (
          <View style={styles.typeBox}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              placeholder={
                lang === "ru-RU"
                  ? "Например: завтра в 10 созвон, нужно подготовить смету…"
                  : "e.g. Tomorrow at 10 call with the client, need to prepare the estimate…"
              }
              placeholderTextColor={colors.muted}
              multiline
              autoFocus
              style={styles.input}
            />
            <View style={styles.row}>
              <Pressable onPress={() => setPhase("idle")} style={styles.ghostBtn}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => finish(typed, lang)}
                disabled={typed.trim().length < 3}
                style={[styles.primaryBtn, typed.trim().length < 3 && { opacity: 0.5 }]}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.primaryText}>Organize with AI</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <RecordButton
              listening={speech.listening}
              disabled={!speech.supported || busy}
              onPress={toggleRecording}
            />
            <Text style={styles.status}>
              {phase === "processing"
                ? "AI is organizing your note…"
                : speech.listening
                  ? "Listening… tap to finish"
                  : phase === "playing"
                    ? "Playing an example voice note…"
                    : speech.supported
                      ? "Tap and say what's on your mind"
                      : "Voice input isn't supported in this browser"}
            </Text>
            {phase === "processing" && <ActivityIndicator color={colors.accent} style={{ marginTop: 8 }} />}
            {!!liveText && phase !== "processing" && (
              <Text style={styles.live} numberOfLines={5}>
                “{liveText}”
              </Text>
            )}
            {!!speech.error && <Text style={styles.error}>{speech.error}</Text>}
            {!speech.listening && !busy && (
              <View style={styles.row}>
                <Pressable onPress={playExample} style={styles.ghostBtn} accessibilityRole="button">
                  <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.ghostText}>Try an example</Text>
                </Pressable>
                <Pressable onPress={() => setPhase("typing")} style={styles.ghostBtn} accessibilityRole="button">
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                  <Text style={styles.ghostText}>Type instead</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Your notes</Text>
        <Text style={styles.count}>{notes.length}</Text>
      </View>
      {notes.length > 2 && (
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, tasks, tags"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <NoteCard note={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>{query ? "Nothing found." : "No notes yet — record your first one above."}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 40 },
  headerWrap: { gap: 4 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { color: colors.text, fontSize: 30, fontWeight: "800", letterSpacing: -1 },
  tagline: { color: colors.muted, fontSize: 13 },
  langToggle: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  langBtnActive: { backgroundColor: colors.surface2 },
  langText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  recorder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 24,
  },
  status: { color: colors.text, fontSize: 15, fontWeight: "600", textAlign: "center" },
  live: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 12, fontStyle: "italic" },
  error: { color: colors.coral, fontSize: 13, textAlign: "center", marginTop: 10 },
  row: { flexDirection: "row", gap: 10, marginTop: 14, justifyContent: "center", flexWrap: "wrap" },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  typeBox: { width: "100%" },
  input: {
    minHeight: 120,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: 14,
    textAlignVertical: "top",
  },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  count: {
    color: colors.muted,
    fontSize: 12,
    backgroundColor: colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 20 },
});
