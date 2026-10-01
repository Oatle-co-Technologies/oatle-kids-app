import mercuryImage from "../assets/images/planets/mercury.webp";
import venusImage from "../assets/images/planets/venus.webp";
import earthImage from "../assets/images/planets/earth.webp";
import marsImage from "../assets/images/planets/mars.webp";
import jupiterImage from "../assets/images/planets/jupitor.webp";
import saturnImage from "../assets/images/planets/saturn.webp";
import uranusImage from "../assets/images/planets/uranus.webp";
import neptuneImage from "../assets/images/planets/neptune.webp";
import plutoImage from "../assets/images/planets/pluto.webp";

import { numberQuestions } from "./numberQuestions";

import {
  shapeIntroductionQuestions,
  shapeFactQuestions,
  shapeRecognitionQuestions,
} from "./shapeQuestions";

import { countingShapeQuestions } from "./countingShapeQuestions";
import { colourIntroductionQuestions } from "./colourIntroductionQuestions";
import { colourQuestions } from "./colourQuestions";
import { colourMixingQuestions } from "./colourMixingQuestions";
import { mathMatchingQuestions } from "./mathMatchingQuestions";
import { additionQuestions } from "./additionQuestions";
import { subtractionQuestions } from "./subtractionQuestions";
import { groupingQuestions } from "./groupingQuestions";
import { mathAssessmentQuestions } from "./mathAssessmentQuestions";

export const mathMissions = [
  {
    id: 1,
    title: "Number Recognition",
    description: "Recognize the numbers from 0 to 20.",
    color: "#ffbd59",
    image: mercuryImage,
    questionBanks: [numberQuestions],
  },

  {
    id: 2,
    title: "Shape Explorers",
    description: "Learn shape names, sides, and corners.",
    color: "#55c6ff",
    image: venusImage,
    questionBanks: [
      shapeIntroductionQuestions,
      shapeFactQuestions,
      shapeRecognitionQuestions,
    ],
  },

  {
    id: 3,
    title: "Counting Shapes",
    description: "Count shapes and objects in space.",
    color: "#55c6ff",
    image: earthImage,
    questionBanks: [countingShapeQuestions],
  },

  {
    id: 4,
    title: "Colour Explorers",
    description: "Learn colours and discover colour mixing.",
    color: "#ef5b5b",
    image: marsImage,
    questionBanks: [
      colourIntroductionQuestions,
      colourMixingQuestions,
      colourQuestions,
    ],
  },

  {
    id: 5,
    title: "Matching & Sorting",
    description: "Learn which things belong together.",
    color: "#66d17a",
    image: jupiterImage,
    questionBanks: [mathMatchingQuestions],
  },

  {
    id: 6,
    title: "Adding Numbers",
    description: "Put groups together to find the total.",
    color: "#ff9f43",
    image: saturnImage,
    questionBanks: [additionQuestions],
  },

  {
    id: 7,
    title: "Taking Away",
    description: "Take objects away and find what is left.",
    color: "#76d8e8",
    image: uranusImage,
    questionBanks: [subtractionQuestions],
  },

  {
    id: 8,
    title: "Equal Groups & Sharing",
    description: "Make equal groups and learn to share.",
    color: "#c260a8",
    image: neptuneImage,
    questionBanks: [groupingQuestions],
  },

  {
    id: 9,
    title: "Maths Assessment",
    description: "Show what you know across your maths adventures.",
    color: "#d9c5a4",
    image: plutoImage,
    assessment: true,
    questionBanks: [mathAssessmentQuestions],
  },
];
