import { numberQuestions } from "./numberQuestions";

import { shapeFactQuestions, shapeRecognitionQuestions } from "./shapeQuestions";

import { countingShapeQuestions } from "./countingShapeQuestions";

import { colourQuestions } from "./colourQuestions";

import { colourMixingQuestions } from "./colourMixingQuestions";

import { mathMatchingQuestions } from "./mathMatchingQuestions";

import { additionQuestions } from "./additionQuestions";

import { subtractionQuestions } from "./subtractionQuestions";

import { groupingQuestions } from "./groupingQuestions";

/*
  Mission 9 Assessment Pool

  This file contains assessment-ready questions only.

  The assessment itself should select a smaller randomized set
  from this pool when Mission 9 starts.

  Important:
  - Teaching cards are excluded.
  - Introduction cards are excluded.
  - Drag-and-drop sorting is excluded because that interaction
    does not use the normal assessment answer recorder.
  - Two-property click-based classification remains eligible.
*/

const isAssessmentQuestion = (question) => {
  if (!question) return false;

  // Explicit teaching flags
  if (question.teaching === true) return false;
  if (question.isTeaching === true) return false;

  // Teaching cards represented by an introduction type
  if (typeof question.type === "string") {
    if (question.type.endsWith("-introduction")) {
      return false;
    }
  }

  return true;
};

const addSkill = (questions, skill) =>
  questions
    .filter(isAssessmentQuestion)
    .map((question) => ({
      ...question,
      skill,
      assessmentId: [
        skill,
        question.type,
        question.assessmentKey || question.prompt,
        String(question.answer),
      ].join("::"),
    }));

/*
  NUMBER RECOGNITION

  The live number bank uses:

    type: "number"

  rather than "number-recognition".
*/
const numberAssessmentQuestions = addSkill(
  numberQuestions,
  "number-recognition"
);

/*
  SHAPES

  Assess both:
  - shape recognition
  - shape facts such as sides/corners

  Teaching/introduction cards are removed by isAssessmentQuestion().
*/
const shapeAssessmentQuestions = [
  ...addSkill(shapeRecognitionQuestions, "shapes"),
  ...addSkill(shapeFactQuestions, "shapes"),
];

/*
  COUNTING
*/
const countingAssessmentQuestions = addSkill(
  countingShapeQuestions,
  "counting"
);

/*
  COLOUR RECOGNITION
*/
const colourRecognitionAssessmentQuestions = addSkill(
  colourQuestions,
  "colour-recognition"
);

/*
  COLOUR MIXING
*/
const colourMixingAssessmentQuestions = addSkill(
  colourMixingQuestions,
  "colour-mixing"
);

/*
  MATCHING & SORTING

  Only normal matching questions and the click-based
  two-property classification questions are included.

  Physical drag-and-drop sorting is deliberately excluded
  from the assessment pool.
*/
const matchingAssessmentQuestions = addSkill(
  mathMatchingQuestions.filter(
    (question) =>
      question.type === "matching" ||
      (question.type === "sorting" && question.twoProperties === true)
  ),
  "matching-and-sorting"
);

/*
  ADDITION

  Includes:
  - visual addition questions
  - number-equation questions

  Introduction/teaching cards are removed.
*/
const additionAssessmentQuestions = addSkill(
  additionQuestions,
  "addition"
);

/*
  SUBTRACTION

  Includes:
  - visual subtraction questions
  - number-equation questions

  Introduction/teaching cards are removed.
*/
const subtractionAssessmentQuestions = addSkill(
  subtractionQuestions,
  "subtraction"
);

/*
  MULTIPLICATION / EQUAL GROUPS

  The live grouping bank uses:
  - equal-groups
  - multiplication-introduction
  - multiplication-numbers
  - sharing
  - division-introduction
  - division-numbers

  For this skill we want equal-groups and multiplication,
  but NOT sharing/division.
*/
const multiplicationAssessmentQuestions = addSkill(
  groupingQuestions.filter(
    (question) =>
      question.type === "equal-groups" ||
      question.type === "multiplication-numbers"
  ),
  "multiplication"
);

/*
  DIVISION / SHARING

  The live bank contains sharing and division questions.

  Division introduction cards are excluded by
  isAssessmentQuestion().
*/
const divisionAssessmentQuestions = addSkill(
  groupingQuestions.filter(
    (question) =>
      question.type === "sharing" ||
      question.type === "division-numbers"
  ),
  "division"
);

/*
  COMPLETE ASSESSMENT POOL

  This is intentionally larger than the actual assessment.

  MathSection should randomly select the questions used
  for the child's individual attempt.
*/
const completeAssessmentPool = [
  ...numberAssessmentQuestions,
  ...shapeAssessmentQuestions,
  ...countingAssessmentQuestions,
  ...colourRecognitionAssessmentQuestions,
  ...colourMixingAssessmentQuestions,
  ...matchingAssessmentQuestions,
  ...additionAssessmentQuestions,
  ...subtractionAssessmentQuestions,
  ...multiplicationAssessmentQuestions,
  ...divisionAssessmentQuestions,
];

export const mathAssessmentQuestions =
  completeAssessmentPool.filter(
    (question, index, questions) =>
      questions.findIndex(
        (candidate) =>
          candidate.assessmentId === question.assessmentId
      ) === index
  );

/*
  Skills used by the parent assessment report.
*/
export const assessmentSkills = [
  {
    id: "number-recognition",
    name: "Number recognition",
  },
  {
    id: "shapes",
    name: "Shapes",
  },
  {
    id: "counting",
    name: "Counting",
  },
  {
    id: "colour-recognition",
    name: "Colour recognition",
  },
  {
    id: "colour-mixing",
    name: "Colour mixing",
  },
  {
    id: "matching-and-sorting",
    name: "Matching and sorting",
  },
  {
    id: "addition",
    name: "Addition",
  },
  {
    id: "subtraction",
    name: "Subtraction",
  },
  {
    id: "multiplication",
    name: "Multiplication / equal groups",
  },
  {
    id: "division",
    name: "Division / sharing",
  },
];
