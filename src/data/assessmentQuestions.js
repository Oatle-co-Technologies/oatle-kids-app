import { questions } from "./questions";
import { lowercaseQuestions } from "./lowercaseQuestions";
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

// Use the current game banks, not a fixed four-question preview of each game.
const bank = (questions, skill, type) => questions.map(question => ({
  ...question, skill, type,
  assessmentId: `${skill}:${JSON.stringify([question.target, question.answer, question.word, question.words])}`,
}));

export const assessmentQuestions = [
  ...bank(questions, "capital", "letters"),
  ...bank(lowercaseQuestions, "lowercase", "letters"),
  ...bank(questions.flatMap(({ target }) => [
    { target, answer: target.toLowerCase() },
    { target: target.toLowerCase(), answer: target },
  ]), "matching", "matching"),
  ...bank(wordOrderQuestions.filter(q => q.word.length <= 3), "word-order", "word-order"),
  ...bank(readingQuestions.filter(q => q.answer.length <= 3), "reading", "reading"),
  ...bank(missingLettersQuestions.filter(q => q.word.length <= 3), "missing", "missing"),
  ...bank(sentenceQuestions, "sentences", "sentences"),
];
