const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/*
 * Each play session uses every letter once, while randomly choosing
 * whether the child matches uppercase to lowercase or the reverse.
 * This keeps the mission at 26 stars instead of 52.
 */
export function createMatchingQuestions() {
  return alphabet.map((letter) =>
    Math.random() < 0.5
      ? {
          target: letter,
          answer: letter.toLowerCase(),
        }
      : {
          target: letter.toLowerCase(),
          answer: letter,
        }
  );
}

export const matchingQuestions = createMatchingQuestions();
