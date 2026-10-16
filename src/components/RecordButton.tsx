import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

type Props = {
  listening: boolean;
  disabled?: boolean;
  onPress: () => void;
};

const SIZE = 96;

/** Big microphone button with pulsing rings while recording */
export function RecordButton({ listening, disabled, onPress }: Props) {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const ring = (delay: number) => {
    const progress = Animated.modulo(Animated.add(pulse, delay), 1);
    return {
      transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
    };
  };

  return (
    <View style={styles.wrap}>
      {listening && (
        <>
          <Animated.View style={[styles.ring, ring(0)]} />
          <Animated.View style={[styles.ring, ring(0.5)]} />
        </>
      )}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={listening ? "Stop recording" : "Start recording"}
        style={({ pressed }) => [
          styles.button,
          listening && styles.buttonActive,
          disabled && styles.buttonDisabled,
          pressed && { transform: [{ scale: 0.96 }] },
        ]}
      >
        <Ionicons name={listening ? "stop" : "mic"} size={listening ? 34 : 40} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE * 2, height: SIZE * 2, alignItems: "center", justifyContent: "center" },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.coral,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  buttonActive: { backgroundColor: colors.coral, shadowColor: colors.coral },
  buttonDisabled: { backgroundColor: colors.surface2, shadowOpacity: 0 },
});
