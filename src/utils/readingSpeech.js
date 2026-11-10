// Speak the task, without revealing assessment answers.
export function getReadingSpeechText(planetId, question) {
  if (!question) {
    return null;
  }

  switch (planetId) {
    case 1:
      return question.target
        ? `Find ${question.target}.`
        : null;

    case 2:
      return question.target
        ? `Find ${question.target}.`
        : null;

    case 3:
      if (
        question.target &&
        question.target === question.target.toUpperCase()
      ) {
        return "Match the uppercase letter to its lowercase letter.";
      }

      return "Match the lowercase letter to its uppercase letter.";

    case 4:
      return "Listen to the word and put it in the right order.";

    case 5:
      return "What is this?";

    case 6:
      return "Find the missing letter.";

    case 7:
      return "Build the sentence. Tap the words in order. Tap a chosen word to put it back.";

    case 8:
      return question.text?.join(" ") || null;

    case 9:
      if (
        question.skill === "reading" ||
        question.type === "reading"
      ) {
        return "What is this? Tap the matching word.";
      }

      switch (question.skill) {
        case "capital":
          return question.target
            ? `Find ${question.target}.`
            : null;

        case "lowercase":
          return question.target
            ? `Find ${question.target}.`
            : null;

        case "matching":
          if (
            question.target &&
            question.target === question.target.toUpperCase()
          ) {
            return "Match the uppercase letter to its lowercase letter.";
          }

          return "Match the lowercase letter to its uppercase letter.";

        case "word-order":
          return "Listen to the word and put it in the right order.";

        case "phonics":
          return "Listen carefully.";

        case "missing":
          return "Find the missing letter.";

        case "sentences":
          return "Build the sentence. Tap the words in order. Tap a chosen word to put it back.";

        default:
          return null;
      }

    default:
      return null;
  }
}

