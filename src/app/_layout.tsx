import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotesProvider } from "@/lib/notesStore";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotesProvider>
        {/* On wide screens the web build is centred like a phone */}
        <View style={styles.page}>
          <View style={styles.app}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: "slide_from_right",
              }}
            />
          </View>
        </View>
        <StatusBar style="light" />
      </NotesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Platform.OS === "web" ? "#0A0E12" : colors.bg, alignItems: "center" },
  app: { flex: 1, width: "100%", maxWidth: 480, backgroundColor: colors.bg },
});
