import { questions } from "./questions";
import { lowercaseQuestions } from "./lowercaseQuestions";
import { matchingQuestions } from "./matchingQuestions";
import { wordOrderQuestions } from "./wordOrderQuestions";
import { readingQuestions } from "./readingQuestions";
import { missingLettersQuestions } from "./missingLettersQuestions";
import { sentenceQuestions } from "./sentenceQuestions";

export const assessmentSkills = [
  { id: "capital", name: "Capital letters" },
  { id: "lowercase", name: "Lowercase letters" },
  { id: "matching", name: "Upper/lowercase matching" },
  { id: "word-order", name: "Listening and building words" },
  { id: "reading", name: "Reading simple words" },
  { id: "missing", name: "Missing letters" },
  { id: "sentences", name: "Building simple sentences" },
];

export const assessmentQuestions = [
  ...questions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `capital-${index}`, skill: "capital", type: "letters" })),
  ...lowercaseQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `lowercase-${index}`, skill: "lowercase", type: "letters" })),
  ...matchingQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `matching-${index}`, skill: "matching", type: "letters" })),
  ...wordOrderQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `word-order-${index}`, skill: "word-order", type: "word-order" })),
  ...readingQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `reading-${index}`, skill: "reading", type: "reading" })),
  ...missingLettersQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `missing-${index}`, skill: "missing", type: "missing" })),
  ...sentenceQuestions.slice(0, 4).map((question, index) => ({ ...question, assessmentId: `sentences-${index}`, skill: "sentences", type: "sentences" })),
];
