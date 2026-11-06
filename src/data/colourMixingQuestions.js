import { colors } from "./mathConstants.js";

export const colourMixingQuestions = [
  // -------------------------------------------------------
  // SECONDARY COLOURS — TEACH
  // -------------------------------------------------------

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix red and yellow. We made orange!",
    answer: "orange",
    options: [],
    mix: [colors.red, colors.yellow],
    mixNames: ["red", "yellow"],
    resultColor: colors.orange,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix yellow and blue. We made green!",
    answer: "green",
    options: [],
    mix: [colors.yellow, colors.blue],
    mixNames: ["yellow", "blue"],
    resultColor: colors.green,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix blue and red. We made purple!",
    answer: "purple",
    options: [],
    mix: [colors.blue, colors.red],
    mixNames: ["blue", "red"],
    resultColor: colors.purple,
  },

  // -------------------------------------------------------
  // SECONDARY COLOURS — PRACTICE
  // -------------------------------------------------------

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Red + yellow = ?",
    prompt: "Let's mix red and yellow. Tap the colour we get.",
    answer: "orange",
    options: ["orange", "green", "purple"],
    mix: [colors.red, colors.yellow],
    mixNames: ["red", "yellow"],
    resultColor: colors.orange,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Yellow + blue = ?",
    prompt: "Let's mix yellow and blue. Tap the colour we get.",
    answer: "green",
    options: ["purple", "orange", "green"],
    mix: [colors.yellow, colors.blue],
    mixNames: ["yellow", "blue"],
    resultColor: colors.green,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Blue + red = ?",
    prompt: "Let's mix blue and red. Tap the colour we get.",
    answer: "purple",
    options: ["green", "purple", "orange"],
    mix: [colors.blue, colors.red],
    mixNames: ["blue", "red"],
    resultColor: colors.purple,
  },

  // -------------------------------------------------------
  // NEW COLOURS — TEACH
  // -------------------------------------------------------

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix red and orange. We made vermilion!",
    answer: "vermilion",
    options: [],
    mix: [colors.red, colors.orange],
    mixNames: ["red", "orange"],
    resultColor: "#e34234",
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix yellow and orange. We made gold!",
    answer: "gold",
    options: [],
    mix: [colors.yellow, colors.orange],
    mixNames: ["yellow", "orange"],
    resultColor: colors.gold,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix yellow and green. We made lime!",
    answer: "lime",
    options: [],
    mix: [colors.yellow, colors.green],
    mixNames: ["yellow", "green"],
    resultColor: colors.lime,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix blue and green. We made turquoise!",
    answer: "turquoise",
    options: [],
    mix: [colors.blue, colors.green],
    mixNames: ["blue", "green"],
    resultColor: colors.turquoise,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix blue and purple. We made violet!",
    answer: "violet",
    options: [],
    mix: [colors.blue, colors.purple],
    mixNames: ["blue", "purple"],
    resultColor: colors.violet,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix red and purple. We made maroon!",
    answer: "maroon",
    options: [],
    mix: [colors.red, colors.purple],
    mixNames: ["red", "purple"],
    resultColor: colors.maroon,
  },

  {
    type: "colour-mixing",
    teaching: true,
    prompt: "Let's mix red and white. We made pink!",
    answer: "pink",
    options: [],
    mix: [colors.red, "#ffffff"],
    mixNames: ["red", "white"],
    resultColor: colors.pink,
  },

  // -------------------------------------------------------
  // NEW COLOURS — PRACTICE
  // -------------------------------------------------------

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Red + orange = ?",
    prompt: "Let's mix red and orange. Tap the colour we get.",
    answer: "vermilion",
    options: ["vermilion", "gold", "maroon"],
    mix: [colors.red, colors.orange],
    mixNames: ["red", "orange"],
    resultColor: "#e34234",
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Yellow + orange = ?",
    prompt: "Let's mix yellow and orange. Tap the colour we get.",
    answer: "gold",
    options: ["lime", "gold", "violet"],
    mix: [colors.yellow, colors.orange],
    mixNames: ["yellow", "orange"],
    resultColor: colors.gold,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Yellow + green = ?",
    prompt: "Let's mix yellow and green. Tap the colour we get.",
    answer: "lime",
    options: ["turquoise", "lime", "gold"],
    mix: [colors.yellow, colors.green],
    mixNames: ["yellow", "green"],
    resultColor: colors.lime,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Blue + green = ?",
    prompt: "Let's mix blue and green. Tap the colour we get.",
    answer: "turquoise",
    options: ["turquoise", "violet", "lime"],
    mix: [colors.blue, colors.green],
    mixNames: ["blue", "green"],
    resultColor: colors.turquoise,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Blue + purple = ?",
    prompt: "Let's mix blue and purple. Tap the colour we get.",
    answer: "violet",
    options: ["maroon", "violet", "turquoise"],
    mix: [colors.blue, colors.purple],
    mixNames: ["blue", "purple"],
    resultColor: colors.violet,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Red + purple = ?",
    prompt: "Let's mix red and purple. Tap the colour we get.",
    answer: "maroon",
    options: ["pink", "maroon", "violet"],
    mix: [colors.red, colors.purple],
    mixNames: ["red", "purple"],
    resultColor: colors.maroon,
  },

  {
    type: "colour-mixing",
    // Keep saved assessment identities stable when the wording changes.
    assessmentKey: "Red + white = ?",
    prompt: "Let's mix red and white. Tap the colour we get.",
    answer: "pink",
    options: ["pink", "gold", "lime"],
    mix: [colors.red, "#ffffff"],
    mixNames: ["red", "white"],
    resultColor: colors.pink,
  },
];