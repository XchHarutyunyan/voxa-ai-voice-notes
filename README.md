# Voxa — AI Voice Notes

Speak, and AI turns your voice into a clean note: a title, a short summary, a task list, time-based reminders and tags.

Built with **React Native + Expo (iOS, Android, Web)** and **TypeScript**. Free to run: built-in speech recognition, Google Gemini free tier, Netlify free tier.

## Features

- 🎙️ Live speech-to-text in English and Russian (on-device / browser recognizer, free)
- ✨ AI structuring: title, summary, tasks, reminders with resolved dates ("tomorrow at 10" → exact time), tags
- ✅ Tick off tasks, search across notes, view the original transcript
- 📴 Offline-first: notes are stored on the device; if the AI is unavailable a rule-based parser takes over
- ▶️ "Try an example" and "Type instead" for browsers without voice input (e.g. Firefox)

## How it works

```
Microphone ─▶ expo-speech-recognition ─▶ transcript
                                           │
                       POST /api/process-note (Netlify Function)
                                           │  GEMINI_API_KEY stays on the server
                                           ▼
                              Gemini ─▶ JSON note ─▶ AsyncStorage
                                           │
                     on any error ─▶ offline rule-based parser
```

## Run locally

```sh
npm install
npx expo start --web        # web (Chrome / Safari / Edge for voice input)
npx expo run:ios            # native development build (speech recognition needs one; Expo Go won't work)
```

Locally the AI endpoint isn't running, so notes are processed in offline mode. Use `netlify dev` to run the function with your key.

## Deploy (Netlify)

1. Connect the repo to Netlify — `netlify.toml` already sets the build (`npx expo export -p web`), `dist` and the functions folder.
2. In **Site settings → Environment variables** add `GEMINI_API_KEY` (free key from https://aistudio.google.com).
3. Optional: `GEMINI_MODELS` — comma-separated models tried in order (default `gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-3.5-flash`).

The site may be embedded in an `<iframe>` on khharutyunyan.dev with microphone access (see headers in `netlify.toml`).

## Scripts

| Command | |
| --- | --- |
| `npm run web` | Dev server for web |
| `npm run build:web` | Static web export to `dist/` |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |

---

Made by [Khachik Harutyunyan](https://khharutyunyan.dev) — Senior Full-Stack Web & Mobile Developer.
