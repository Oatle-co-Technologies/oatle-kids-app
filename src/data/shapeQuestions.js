import { shapes } from "./mathConstants.js";

const introduction = (name, connection) => ({
  type: "shape-introduction",
  teaching: true,
  prompt: `This is a ${name}.`,
  teachingText: connection,
  shape: name,
  options: [],
});

const property = (type, prompt, shape, answer, options) => ({
  type,
  prompt,
  shape,
  answer: String(answer),
  options: options.map(String),
});

const recognition = (shape, options) => ({
  type: "shape-recognition",
  prompt: "Which shape is this?",
  shape,
  answer: shape,
  options,
});

/*
 * Mission 2 — Shape Explorers
 *
 * Part 1: Learn the shape names.
 * Part 2: Learn sides and corners.
 * Part 3: Recognize the shapes.
 *
 * The 13 shapes are intentionally introduced
 * one at a time in this exact order.
 */

export const shapeIntroductionQuestions = [
  introduction(
    shapes.circle,
    "A ball is shaped like a circle."
  ),

  introduction(
    shapes.square,
    "A window can be shaped like a square."
  ),

  introduction(
    shapes.triangle,
    "A roof can be shaped like a triangle."
  ),

  introduction(
    shapes.rectangle,
    "A door can be shaped like a rectangle."
  ),

  introduction(
    shapes.oval,
    "An egg is shaped like an oval."
  ),

  introduction(
    shapes.diamond,
    "A kite can be shaped like a diamond."
  ),

  introduction(
    shapes.star,
    "A star in the sky has a star shape."
  ),

  introduction(
    shapes.heart,
    "A card can have a heart shape."
  ),

  introduction(
    shapes.pentagon,
    "A house badge can be shaped like a pentagon."
  ),

  introduction(
    shapes.hexagon,
    "A honeycomb cell is shaped like a hexagon."
  ),

  introduction(
    shapes.octagon,
    "A stop sign is shaped like an octagon."
  ),

  introduction(
    shapes.crescent,
    "The moon can look like a crescent."
  ),

  introduction(
    shapes.semicircle,
    "A half moon is shaped like a semicircle."
  ),
];

export const shapeFactQuestions = [
  // Circle
  property(
    "shape-sides",
    "How many straight sides does a circle have?",
    shapes.circle,
    0,
    [0, 1, 2]
  ),

  property(
    "shape-corners",
    "How many corners does a circle have?",
    shapes.circle,
    0,
    [0, 1, 2]
  ),

  // Square
  property(
    "shape-sides",
    "How many straight sides does a square have?",
    shapes.square,
    4,
    [3, 4, 5]
  ),

  property(
    "shape-corners",
    "How many corners does a square have?",
    shapes.square,
    4,
    [3, 4, 5]
  ),

  // Triangle
  property(
    "shape-sides",
    "How many straight sides does a triangle have?",
    shapes.triangle,
    3,
    [2, 3, 4]
  ),

  property(
    "shape-corners",
    "How many corners does a triangle have?",
    shapes.triangle,
    3,
    [2, 3, 4]
  ),

  // Rectangle
  property(
    "shape-sides",
    "How many straight sides does a rectangle have?",
    shapes.rectangle,
    4,
    [3, 4, 5]
  ),

  property(
    "shape-corners",
    "How many corners does a rectangle have?",
    shapes.rectangle,
    4,
    [3, 4, 5]
  ),

  // Oval
  property(
    "shape-sides",
    "How many straight sides does an oval have?",
    shapes.oval,
    0,
    [0, 1, 2]
  ),

  property(
    "shape-corners",
    "How many corners does an oval have?",
    shapes.oval,
    0,
    [0, 1, 2]
  ),

  // Diamond
  property(
    "shape-sides",
    "How many straight sides does a diamond have?",
    shapes.diamond,
    4,
    [3, 4, 5]
  ),

  property(
    "shape-corners",
    "How many corners does a diamond have?",
    shapes.diamond,
    4,
    [3, 4, 5]
  ),

  // Star
  property(
    "shape-sides",
    "How many straight sides does a star have?",
    shapes.star,
    10,
    [9, 10, 11]
  ),

  property(
    "shape-corners",
    "How many corners does a star have?",
    shapes.star,
    5,
    [4, 5, 6]
  ),

  // Heart
  property(
    "shape-sides",
    "How many straight sides does a heart have?",
    shapes.heart,
    0,
    [0, 1, 2]
  ),

  property(
    "shape-corners",
    "How many corners does a heart have?",
    shapes.heart,
    1,
    [0, 1, 2]
  ),

  // Pentagon
  property(
    "shape-sides",
    "How many straight sides does a pentagon have?",
    shapes.pentagon,
    5,
    [4, 5, 6]
  ),

  property(
    "shape-corners",
    "How many corners does a pentagon have?",
    shapes.pentagon,
    5,
    [4, 5, 6]
  ),

  // Hexagon
  property(
    "shape-sides",
    "How many straight sides does a hexagon have?",
    shapes.hexagon,
    6,
    [5, 6, 7]
  ),

  property(
    "shape-corners",
    "How many corners does a hexagon have?",
    shapes.hexagon,
    6,
    [5, 6, 7]
  ),

  // Octagon
  property(
    "shape-sides",
    "How many straight sides does an octagon have?",
    shapes.octagon,
    8,
    [7, 8, 9]
  ),

  property(
    "shape-corners",
    "How many corners does an octagon have?",
    shapes.octagon,
    8,
    [7, 8, 9]
  ),

  // Crescent
  property(
    "shape-sides",
    "How many straight sides does a crescent have?",
    shapes.crescent,
    0,
    [0, 1, 2]
  ),

  property(
    "shape-corners",
    "How many corners does a crescent have?",
    shapes.crescent,
    2,
    [1, 2, 3]
  ),

  // Semicircle
  property(
    "shape-sides",
    "How many straight sides does a semicircle have?",
    shapes.semicircle,
    1,
    [1, 2, 3]
  ),

  property(
    "shape-corners",
    "How many corners does a semicircle have?",
    shapes.semicircle,
    2,
    [1, 2, 3]
  ),
];

export const shapeRecognitionQuestions = [
  recognition(
    shapes.circle,
    [shapes.circle, shapes.square, shapes.triangle]
  ),

  recognition(
    shapes.square,
    [shapes.triangle, shapes.square, shapes.oval]
  ),

  recognition(
    shapes.triangle,
    [shapes.rectangle, shapes.diamond, shapes.triangle]
  ),

  recognition(
    shapes.rectangle,
    [shapes.rectangle, shapes.circle, shapes.star]
  ),

  recognition(
    shapes.oval,
    [shapes.heart, shapes.oval, shapes.square]
  ),

  recognition(
    shapes.diamond,
    [shapes.star, shapes.diamond, shapes.hexagon]
  ),

  recognition(
    shapes.star,
    [shapes.star, shapes.heart, shapes.pentagon]
  ),

  recognition(
    shapes.heart,
    [shapes.crescent, shapes.heart, shapes.circle]
  ),

  recognition(
    shapes.pentagon,
    [shapes.hexagon, shapes.octagon, shapes.pentagon]
  ),

  recognition(
    shapes.hexagon,
    [shapes.hexagon, shapes.diamond, shapes.rectangle]
  ),

  recognition(
    shapes.octagon,
    [shapes.circle, shapes.octagon, shapes.semicircle]
  ),

  recognition(
    shapes.crescent,
    [shapes.oval, shapes.crescent, shapes.star]
  ),

  recognition(
    shapes.semicircle,
    [shapes.semicircle, shapes.triangle, shapes.rectangle]
  ),
];