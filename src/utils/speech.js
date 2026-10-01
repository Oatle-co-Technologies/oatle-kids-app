const PREFERRED_VOICES = [
  "Samantha",
  "Ava",
  "Karen",
  "Victoria",
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
];

let voices = [];
let speechSequence = 0;

function loadVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  voices = window.speechSynthesis.getVoices();
}

if (
  typeof window !== "undefined" &&
  "speechSynthesis" in window
) {
  loadVoices();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    loadVoices
  );
}

function getPreferredVoice() {
  if (!voices.length) {
    loadVoices();
  }

  // First: explicitly preferred female English voices.
  for (const preferredName of PREFERRED_VOICES) {
    const voice = voices.find(
      (item) =>
        item.name === preferredName &&
        item.lang.toLowerCase().startsWith("en")
    );

    if (voice) {
      return voice;
    }
  }

  // Second: look for common female voice names.
  const feminineNames = [
    "female",
    "samantha",
    "ava",
    "karen",
    "victoria",
    "allison",
    "susan",
    "moira",
    "fiona",
    "zira",
    "aria",
    "jenny",
    "siri",
  ];

  const feminineVoice = voices.find((voice) => {
    const name = voice.name.toLowerCase();
    const language = voice.lang.toLowerCase();

    return (
      language.startsWith("en") &&
      feminineNames.some((namePart) =>
        name.includes(namePart)
      )
    );
  });

  if (feminineVoice) {
    return feminineVoice;
  }

  // Final fallback: any English local voice.
  return (
    voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith("en-") &&
        voice.localService
    ) ||
    voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    ) ||
    null
  );
}

function speakWithBrowser(text, sequence) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !text
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  if (sequence !== speechSequence) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);

  const voice = getPreferredVoice();

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }

  // Clear, unhurried speech without the synthetic high-pitch effect.
  utterance.rate = 0.78;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

async function speakWithNativeEngine(text, sequence) {
  try {
    await TextToSpeech.stop();

    if (sequence !== speechSequence) {
      return;
    }

    await TextToSpeech.speak({
      text,
      lang: "en-US",
      rate: 0.8,
      pitch: 1.0,
      volume: 1.0,
      category: "playback",
      queueStrategy: QueueStrategy.Flush,
    });
  } catch (error) {
    // A device without an installed native voice can still try the web
    // speech engine. This keeps browser testing and older devices usable.
    if (sequence === speechSequence) {
      speakWithBrowser(text, sequence);
    }
  }
}

export function stopSpeech() {
  speechSequence += 1;

  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {});
  }

  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }
}

export function speak(text) {
  if (!text) return;

  const sequence = ++speechSequence;

  if (Capacitor.isNativePlatform()) {
    void speakWithNativeEngine(text, sequence);
    return;
  }

  speakWithBrowser(text, sequence);
}
import { Capacitor } from "@capacitor/core";
import {
  QueueStrategy,
  TextToSpeech,
} from "@capacitor-community/text-to-speech";
