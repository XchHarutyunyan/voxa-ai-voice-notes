import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type Props = {
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  tone?: "accent" | "coral" | "muted" | "green";
};

const tones = {
  accent: { bg: colors.accentSoft, fg: colors.accent },
  coral: { bg: colors.coralSoft, fg: colors.coral },
  green: { bg: "rgba(61,220,132,0.12)", fg: colors.green },
  muted: { bg: colors.surface2, fg: colors.muted },
};

export function Chip({ label, icon, tone = "muted" }: Props) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      {icon && <Ionicons name={icon} size={12} color={t.fg} />}
      <Text style={[styles.label, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  label: { fontSize: 12, fontWeight: "600" },
});
