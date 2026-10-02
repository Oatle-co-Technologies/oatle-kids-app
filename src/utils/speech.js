import { Capacitor } from "@capacitor/core";
import {
  QueueStrategy,
  TextToSpeech,
} from "@capacitor-community/text-to-speech";

const APPLE_PREFERRED_VOICES = [
  "Ava",
  "Allison",
  "Susan",
  "Samantha",
  "Karen",
  "Moira",
  "Fiona",
  "Tessa",
  "Victoria",
];

const PREFERRED_VOICES = [
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  ...APPLE_PREFERRED_VOICES,
];

let voices = [];
let speechSequence = 0;
let nativeAppleVoiceIndexPromise;
let browserUtterance = null;
let browserStartTimer = null;
let browserRetryTimer = null;
let browserNeedsGesture = false;
let pendingBrowserSpeech = null;

function isAndroidBrowser() {
  return (
    typeof navigator !== "undefined" &&
    /Android/i.test(navigator.userAgent)
  );
}

function clearBrowserTimers() {
  if (browserStartTimer) {
    window.clearTimeout(browserStartTimer);
    browserStartTimer = null;
  }

  if (browserRetryTimer) {
    window.clearTimeout(browserRetryTimer);
    browserRetryTimer = null;
  }
}

function isAppleDevice() {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() === "ios";
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function getAppleVoiceScore(voice) {
  const name = voice.name.toLowerCase();
  const identifier = (voice.voiceURI || "").toLowerCase();
  const language = voice.lang.toLowerCase();

  if (!language.startsWith("en")) {
    return -1;
  }

  const preferredIndex = APPLE_PREFERRED_VOICES.findIndex(
    (preferredName) => name.includes(preferredName.toLowerCase())
  );

  let score =
    preferredIndex === -1
      ? 0
      : 100 - preferredIndex * 8;

  if (identifier.includes("premium")) score += 24;
  if (identifier.includes("enhanced")) score += 18;
  if (identifier.includes("siri")) score += 14;
  if (language === "en-us") score += 6;

  return score;
}

function findAppleVoiceIndex(availableVoices) {
  let bestIndex = -1;
  let bestScore = -1;

  availableVoices.forEach((voice, index) => {
    const score = getAppleVoiceScore(voice);

    if (score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestIndex;
}

async function getNativeAppleVoiceIndex() {
  if (!nativeAppleVoiceIndexPromise) {
    nativeAppleVoiceIndexPromise = TextToSpeech.getSupportedVoices()
      .then(({ voices: supportedVoices }) =>
        findAppleVoiceIndex(supportedVoices)
      )
      .catch(() => -1);
  }

  return nativeAppleVoiceIndexPromise;
}

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

  if (isAppleDevice()) {
    const appleVoiceIndex = findAppleVoiceIndex(voices);

    if (appleVoiceIndex >= 0) {
      return voices[appleVoiceIndex];
    }
  }

  const preferredVoices = isAppleDevice()
    ? APPLE_PREFERRED_VOICES
    : PREFERRED_VOICES;

  // Installed Android PWAs must keep working without a network connection.
  // Prefer a voice that is actually installed on the device before an online
  // Google voice that Chrome may list but fail to start silently.
  if (isAndroidBrowser()) {
    const localPreferredVoice = voices.find(
      (voice) =>
        voice.localService &&
        voice.lang.toLowerCase().startsWith("en") &&
        preferredVoices.some(
          (preferredName) => voice.name === preferredName
        )
    );

    if (localPreferredVoice) {
      return localPreferredVoice;
    }

    const localEnglishVoice = voices.find(
      (voice) =>
        voice.localService &&
        voice.lang.toLowerCase().startsWith("en")
    );

    if (localEnglishVoice) {
      return localEnglishVoice;
    }
  }

  // First: explicitly preferred friendly English voices.
  for (const preferredName of preferredVoices) {
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

function speakWithBrowser(
  text,
  sequence,
  { useDefaultVoice = false, isRetry = false } = {}
) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !text
  ) {
    return;
  }

  const synthesis = window.speechSynthesis;

  clearBrowserTimers();
  synthesis.cancel();

  if (sequence !== speechSequence) {
    return;
  }

  pendingBrowserSpeech = { text, sequence };

  const beginSpeech = () => {
    browserStartTimer = null;

    if (sequence !== speechSequence) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = useDefaultVoice ? null : getPreferredVoice();
    const appleDevice = isAppleDevice();
    let started = false;

    browserUtterance = utterance;

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-US";
    }

    // Apple speech needs a little more lift than the Android/browser voice.
    // The pitch change is intentionally modest so letters and numbers stay clear.
    utterance.rate = appleDevice ? 0.9 : 0.78;
    utterance.pitch = appleDevice ? 1.18 : 1.05;
    utterance.volume = 1;

    utterance.onstart = () => {
      started = true;
      browserNeedsGesture = false;
      pendingBrowserSpeech = null;

      if (browserRetryTimer) {
        window.clearTimeout(browserRetryTimer);
        browserRetryTimer = null;
      }
    };

    utterance.onend = () => {
      if (browserUtterance === utterance) {
        browserUtterance = null;
      }
    };

    utterance.onerror = (event) => {
      if (browserUtterance === utterance) {
        browserUtterance = null;
      }

      if (
        sequence !== speechSequence ||
        event.error === "canceled" ||
        event.error === "interrupted"
      ) {
        return;
      }

      if (event.error === "not-allowed") {
        browserNeedsGesture = true;
        return;
      }

      if (!isRetry) {
        speakWithBrowser(text, sequence, {
          useDefaultVoice: true,
          isRetry: true,
        });
      }
    };

    // resume() clears a paused state left behind when an Android PWA was sent
    // to the background and later reopened.
    synthesis.resume();
    synthesis.speak(utterance);

    browserRetryTimer = window.setTimeout(() => {
      browserRetryTimer = null;

      if (started || sequence !== speechSequence) {
        return;
      }

      if (!isRetry) {
        speakWithBrowser(text, sequence, {
          useDefaultVoice: true,
          isRetry: true,
        });
        return;
      }

      // Some Android browsers block automatic speech without raising an
      // error. Preserve the line and replay it on the child's next tap.
      synthesis.cancel();
      browserUtterance = null;
      browserNeedsGesture = true;
    }, 1400);
  };

  // Chrome on Android can drop speech when cancel() and speak() happen in the
  // same task. A tiny delay lets the cancellation settle first.
  browserStartTimer = window.setTimeout(
    beginSpeech,
    isAndroidBrowser() ? 70 : 0
  );
}

async function speakWithNativeEngine(text, sequence) {
  try {
    await TextToSpeech.stop();

    if (sequence !== speechSequence) {
      return;
    }

    const appleDevice = isAppleDevice();
    const appleVoiceIndex = appleDevice
      ? await getNativeAppleVoiceIndex()
      : -1;

    if (sequence !== speechSequence) {
      return;
    }

    await TextToSpeech.speak({
      text,
      lang: "en-US",
      rate: appleDevice ? 0.95 : 0.8,
      pitch: appleDevice ? 1.18 : 1.0,
      volume: 1.0,
      category: "playback",
      ...(appleVoiceIndex >= 0
        ? { voice: appleVoiceIndex }
        : {}),
      queueStrategy: QueueStrategy.Flush,
    });
  } catch {
    // A device without an installed native voice can still try the web
    // speech engine. This keeps browser testing and older devices usable.
    if (sequence === speechSequence) {
      speakWithBrowser(text, sequence);
    }
  }
}

export function stopSpeech() {
  speechSequence += 1;
  clearBrowserTimers();
  browserUtterance = null;
  browserNeedsGesture = false;
  pendingBrowserSpeech = null;

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

if (
  typeof window !== "undefined" &&
  "speechSynthesis" in window
) {
  const resumeBrowserSpeech = () => {
    window.speechSynthesis.resume();

    if (!browserNeedsGesture || !pendingBrowserSpeech) {
      return;
    }

    const { text, sequence } = pendingBrowserSpeech;
    browserNeedsGesture = false;
    speakWithBrowser(text, sequence, {
      useDefaultVoice: true,
      isRetry: true,
    });
  };

  window.addEventListener("pointerdown", resumeBrowserSpeech, {
    passive: true,
  });
  window.addEventListener("keydown", resumeBrowserSpeech);
}
