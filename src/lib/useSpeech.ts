import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCallback, useRef, useState } from "react";
import type { Lang } from "./types";

const isAvailable = () => {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
};

/**
 * Live speech-to-text on iOS, Android and the web (Chrome / Safari / Edge)
 * using the platform's built-in, free recognizer.
 */
export function useSpeech(lang: Lang) {
  const [supported] = useState(isAvailable);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => {
    // Keep words that were still "interim" when the user pressed stop
    if (interimRef.current) {
      finalRef.current = `${finalRef.current} ${interimRef.current}`.trim();
      setFinalText(finalRef.current);
    }
    interimRef.current = "";
    setInterim("");
    setListening(false);
  });
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (event.isFinal) {
      finalRef.current = `${finalRef.current} ${text}`.trim();
      setFinalText(finalRef.current);
      interimRef.current = "";
      setInterim("");
    } else {
      interimRef.current = text;
      setInterim(text);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    if (event.error === "aborted" || event.error === "no-speech") return;
    setError(
      event.error === "not-allowed"
        ? "Microphone access was blocked. Allow it in your browser or system settings."
        : event.message || "Speech recognition failed. Try again or type your note."
    );
  });

  const start = useCallback(async () => {
    setError(null);
    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterim("");
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError("Microphone access is needed to record a voice note.");
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang, interimResults: true, continuous: true, addsPunctuation: true });
  }, [lang]);

  const stop = useCallback(() => ExpoSpeechRecognitionModule.stop(), []);

  const reset = useCallback(() => {
    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterim("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript: `${finalText} ${interim}`.trim(),
    error,
    start,
    stop,
    reset,
  };
}
