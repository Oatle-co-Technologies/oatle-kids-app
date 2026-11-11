import { learningStorage } from '../lib/profileStorage.js';
import { readSavedActivity, saveActivity, resumeScreen } from '../utils/savedActivity';
import { drawingToolCursor, useDrawingToolCursor } from "./drawingToolCursor";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import StarTrailTrace from "./StarTrailTrace";
import ColoringBook from "./ColoringBook";
import FeelingsAdventure from "./FeelingsAdventure";
import SavePictureButton from "./SavePictureButton";
import LittleAdventureHomes from "./LittleAdventureHomes";
import ResponsivePlanetJourney from "./ResponsivePlanetJourney";
import StorybookAdventure from "./StorybookAdventure";
import LocalBackButton from "./LocalBackButton";
import BuildingAdventure from "./BuildingAdventure";
import AnimalAdventure, { AnimalIcon } from "./AnimalAdventure";
import PuzzleAdventure, { PuzzleIcon } from "./PuzzleAdventure";
import MusicAdventure, { MusicIcon } from "./MusicAdventure";
import { makeExtraAdventures, isLittleMissionLocked } from "./littleMissionCatalog";
import {
  EraserIcon,
  ScribblerStickerPicker,
  StickerShape,
} from "./Scribbler";
import { speak, stopSpeech } from "../utils/speech";
import victorySound from "../sounds/victory.mp3";
import mercuryImage from "../assets/images/planets/mercury.webp";
import venusImage from "../assets/images/planets/venus.webp";
import earthImage from "../assets/images/planets/earth.webp";
import marsImage from "../assets/images/planets/mars.webp";
import jupiterImage from "../assets/images/planets/jupitor.webp";
import "./LittleExplorers.css";

const LITTLE_PROGRESS_KEY = "oatle-little-explorers-progress";
const LITTLE_STARTED_KEY = "oatle-little-explorers-started";
const BALLOON_SESSION_KEY = "oatle-balloon-learning-session";

const BALLOON_POSITIONS = [
  { x: 20, y: 60, delay: "0s" },
  { x: 50, y: 52, delay: "-0.8s" },
  { x: 80, y: 62, delay: "-1.5s" },
];

const SHAPE_POP_POSITIONS = [
  { x: 14, y: 43, delay: "0s" },
  { x: 43, y: 43, delay: "-0.7s" },
  { x: 76, y: 43, delay: "-1.4s" },
  { x: 25, y: 73, delay: "-2s" },
  { x: 56, y: 73, delay: "-0.4s" },
  { x: 88, y: 73, delay: "-1.1s" },
];

const BREAK_BALLOONS = [
  { id: 1, color: "#ff6f91", x: 12, y: 40, delay: "0s" },
  { id: 2, color: "#ffd45c", x: 28, y: 68, delay: "-0.8s" },
  { id: 3, color: "#55c6ff", x: 44, y: 42, delay: "-1.5s" },
  { id: 4, color: "#a875e8", x: 60, y: 68, delay: "-2.1s" },
  { id: 5, color: "#66d17a", x: 76, y: 40, delay: "-0.4s" },
  { id: 6, color: "#ff9f43", x: 90, y: 68, delay: "-1.1s" },
];

const BALLOON_COLOURS = {
  red: "#ff5c72",
  blue: "#55c6ff",
  yellow: "#ffd45c",
  green: "#66d17a",
  purple: "#a875e8",
  orange: "#ff9f43",
  pink: "#f27bbd",
  black: "#242534",
  white: "#fffdf5",
  brown: "#9a633f",
};

const NUMBER_NAMES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];

function makeBalloonRounds(values, makePrompt, breakAfterIndex) {
  return values.map((target, index) => {
    const next = values[(index + 1) % values.length];
    const following = values[(index + 2) % values.length];
    const choiceSets = [
      [target, next, following],
      [following, target, next],
      [next, following, target],
    ];

    return {
      target,
      prompt: makePrompt(target),
      choices: choiceSets[index % choiceSets.length],
      breakAfter: index === breakAfterIndex,
    };
  });
}

const NUMBER_ZERO_TO_TEN = Array.from({ length: 11 }, (_, index) => String(index));
const NUMBER_ELEVEN_TO_TWENTY = Array.from({ length: 10 }, (_, index) => String(index + 11));
const LETTER_A_TO_M = "ABCDEFGHIJKLM".split("");
const LETTER_N_TO_Z = "NOPQRSTUVWXYZ".split("");
const TEN_COLOURS = [
  "red", "blue", "yellow", "green", "purple", "orange", "pink", "black", "white", "brown",
];

const SHAPE_ROUNDS = [
  {
    target: "circle",
    colour: "red",
    prompt: "Pop the red circles",
    choices: ["circle", "square", "circle", "triangle", "circle", "rectangle"],
  },
  {
    target: "square",
    colour: "yellow",
    prompt: "Pop the yellow squares",
    choices: ["star", "square", "triangle", "square", "circle", "square"],
  },
  {
    target: "triangle",
    colour: "blue",
    prompt: "Pop the blue triangles",
    choices: ["triangle", "rectangle", "circle", "triangle", "star", "triangle"],
  },
  {
    target: "rectangle",
    colour: "green",
    prompt: "Pop the green rectangles",
    choices: ["circle", "rectangle", "rectangle", "star", "triangle", "rectangle"],
  },
  {
    target: "star",
    colour: "purple",
    prompt: "Pop the purple stars",
    choices: ["star", "square", "circle", "star", "rectangle", "star"],
  },
];

const SHAPE_COLOURS = {
  circle: "#ff5c72",
  square: "#ffd45c",
  triangle: "#55c6ff",
  rectangle: "#66d17a",
  star: "#a875e8",
};

const BALLOON_LESSONS = {
  "numbers-0-10": {
    kind: "numbers",
    title: "Numbers 0 to 10",
    cardTitle: "Numbers 0–10",
    cardText: "Start with zero and count to ten",
    icon: "0–10",
    progressId: "balloons-numbers-0-10",
    rounds: makeBalloonRounds(
      NUMBER_ZERO_TO_TEN,
      (number) => `Pop number ${NUMBER_NAMES[Number(number)]}`,
      5
    ),
  },
  "numbers-11-20": {
    kind: "numbers",
    title: "Numbers 11 to 20",
    cardTitle: "Numbers 11–20",
    cardText: "Keep counting up to twenty",
    icon: "11–20",
    progressId: "balloons-numbers-11-20",
    rounds: makeBalloonRounds(
      NUMBER_ELEVEN_TO_TWENTY,
      (number) => `Pop number ${NUMBER_NAMES[Number(number)]}`,
      4
    ),
  },
  "letters-a-m": {
    kind: "letters",
    title: "Letters A to M",
    cardTitle: "Letters A–M",
    cardText: "The first half of the alphabet",
    icon: "A–M",
    progressId: "balloons-letters-a-m",
    rounds: makeBalloonRounds(LETTER_A_TO_M, (letter) => `Pop letter ${letter}`, 6),
  },
  "letters-n-z": {
    kind: "letters",
    title: "Letters N to Z",
    cardTitle: "Letters N–Z",
    cardText: "The second half of the alphabet",
    icon: "N–Z",
    progressId: "balloons-letters-n-z",
    rounds: makeBalloonRounds(LETTER_N_TO_Z, (letter) => `Pop letter ${letter}`, 6),
  },
  colours: {
    kind: "colours",
    title: "Ten Colour Balloons",
    cardTitle: "Ten Colours",
    cardText: "Find ten bright colours",
    icon: "🎨",
    progressId: "balloons-colours-10",
    rounds: makeBalloonRounds(TEN_COLOURS, (colour) => `Pop the ${colour} balloon`, 4),
  },
};

const BALLOON_CATEGORIES = {
  numbers: {
    title: "Number Balloons",
    cardTitle: "Pop the Numbers",
    cardText: "Learn numbers 0 to 20",
    icon: "123",
    lessonKeys: ["numbers-0-10", "numbers-11-20"],
  },
  letters: {
    title: "Alphabet Balloons",
    cardTitle: "Pop the Letters",
    cardText: "Learn all 26 letters",
    icon: "ABC",
    lessonKeys: ["letters-a-m", "letters-n-z"],
  },
  colours: {
    title: "Colour Balloons",
    cardTitle: "Pop the Colours",
    cardText: "Learn ten colours",
    icon: "🎨",
    lessonKeys: ["colours"],
  },
};

const BALLOON_PALETTE = ["#ff6f91", "#ffd45c", "#55c6ff"];
const BALLOON_CATEGORY_KEYS = Object.keys(BALLOON_CATEGORIES);
const BALLOON_PRAISE = ["Correct!", "Amazing!", "Good job!"];

const TRAIL_PATTERNS = {
  straight: {
    title: "Straight Line",
    cardText: "Across the sky",
    icon: "➖",
    prompt: "Start at the glowing star. Slide your finger along the dotted line.",
    progressId: "trail-straight",
    path: "M10 52 L90 52",
    stars: [
      { x: 10, y: 52 }, { x: 26, y: 52 }, { x: 42, y: 52 },
      { x: 58, y: 52 }, { x: 74, y: 52 }, { x: 90, y: 52 },
    ],
  },
  zigzag: {
    title: "Zigzag",
    cardText: "Up, down, up",
    icon: "⚡",
    prompt: "Start at the glowing star. Trace the zigzag line with your finger.",
    progressId: "trail-zigzag",
    path: "M9 72 L25 30 L41 72 L57 30 L73 72 L91 30",
    stars: [
      { x: 9, y: 72 }, { x: 25, y: 30 }, { x: 41, y: 72 },
      { x: 57, y: 30 }, { x: 73, y: 72 }, { x: 91, y: 30 },
    ],
  },
  curve: {
    title: "Big Curve",
    cardText: "Around the moon",
    icon: "〰",
    prompt: "Start at the glowing star. Trace the curved line with your finger.",
    progressId: "trail-curve",
    path: "M9 74 C22 22 72 12 91 70",
    stars: [
      { x: 9, y: 74 }, { x: 20, y: 43 }, { x: 35, y: 25 },
      { x: 52, y: 20 }, { x: 69, y: 28 }, { x: 82, y: 47 }, { x: 91, y: 70 },
    ],
  },
  circle: {
    title: "Circle Orbit",
    cardText: "Round and round",
    icon: "⭕",
    prompt: "Start at the glowing star. Trace all the way around the circle.",
    progressId: "trail-circle",
    path: "M50 14 C75 14 88 32 88 51 C88 72 72 87 50 87 C28 87 12 72 12 51 C12 31 28 14 50 14 Z",
    stars: [
      { x: 50, y: 14 }, { x: 76, y: 23 }, { x: 88, y: 51 }, { x: 75, y: 77 },
      { x: 50, y: 87 }, { x: 25, y: 77 }, { x: 12, y: 51 }, { x: 25, y: 24 },
    ],
  },
  spiral: {
    title: "Space Spiral",
    cardText: "Curl into the middle",
    icon: "🌀",
    prompt: "Start at the glowing star. Trace the spiral line into the middle.",
    progressId: "trail-spiral",
    path: "M10 77 C12 24 84 12 90 55 C94 90 38 94 29 61 C22 34 65 25 73 51 C79 70 49 78 43 59 C40 48 52 43 58 51",
    stars: [
      { x: 10, y: 77 }, { x: 18, y: 31 }, { x: 53, y: 16 }, { x: 86, y: 37 },
      { x: 83, y: 74 }, { x: 49, y: 84 }, { x: 29, y: 61 }, { x: 40, y: 36 },
      { x: 68, y: 45 }, { x: 58, y: 65 }, { x: 46, y: 55 },
    ],
  },
};

const TRAIL_PATTERN_KEYS = Object.keys(TRAIL_PATTERNS);

const DISCOVERY_LESSONS = {
  counting: {
    kind: "counting",
    title: "Count the Space Objects",
    progressId: "discovery-counting-1-5",
    rounds: [
      { target: 1, symbol: "⭐", prompt: "Tap one star", choices: [2, 1, 3] },
      { target: 2, symbol: "🚀", prompt: "Tap two rockets", choices: [3, 1, 2] },
      { target: 3, symbol: "🌙", prompt: "Tap three moons", choices: [3, 4, 2] },
      { target: 4, symbol: "🪐", prompt: "Tap four planets", choices: [5, 4, 3] },
      { target: 5, symbol: "⭐", prompt: "Tap five stars", choices: [4, 6, 5] },
    ],
  },
  sizes: {
    kind: "sizes",
    title: "Big and Small",
    progressId: "discovery-big-and-small",
    rounds: [
      { target: "big", symbol: "🚀", name: "rocket", prompt: "Tap the big rocket", choices: ["small", "big"] },
      { target: "small", symbol: "⭐", name: "star", prompt: "Tap the small star", choices: ["big", "small"] },
      { target: "big", symbol: "🌙", name: "moon", prompt: "Tap the big moon", choices: ["big", "small"] },
      { target: "small", symbol: "🪐", name: "planet", prompt: "Tap the small planet", choices: ["small", "big"] },
      { target: "big", symbol: "☀️", name: "sun", prompt: "Tap the big sun", choices: ["small", "big"] },
    ],
  },
};

const PLANET_ART = [
  { name: "Mercury", image: mercuryImage, colour: "#c7b8aa" },
  { name: "Venus", image: venusImage, colour: "#efb75f" },
  { name: "Earth", image: earthImage, colour: "#55c6ff" },
  { name: "Mars", image: marsImage, colour: "#ef6b5b" },
  { name: "Jupiter", image: jupiterImage, colour: "#d6b44c" },
];

const LITTLE_ADVENTURES = [
  ...makeExtraAdventures(PLANET_ART),
  {
    id: "balloons",
    title: "Balloon Adventure",
    icon: "🎈",
    description: "Pop balloons and learn numbers, letters and colours.",
    planets: [
      { lesson: "numbers-0-10", missionTitle: "Numbers 0 to 10", description: "We are going to learn numbers zero to ten." },
      { lesson: "numbers-11-20", missionTitle: "Numbers 11 to 20", description: "We are going to learn numbers eleven to twenty." },
      { lesson: "letters-a-m", missionTitle: "Letters A to M", description: "We are going to learn letters A to M." },
      { lesson: "letters-n-z", missionTitle: "Letters N to Z", description: "We are going to learn letters N to Z." },
      { lesson: "colours", missionTitle: "Ten Colours", description: "We are going to learn ten bright colours." },
    ].map((planet, index) => ({
      ...PLANET_ART[index],
      ...planet,
      id: index + 1,
      activity: "balloons",
      progressId: BALLOON_LESSONS[planet.lesson].progressId,
    })),
  },
  {
    id: "shapes",
    title: "Shape Adventure",
    icon: "◆",
    description: "Find circles, squares, triangles, rectangles and stars.",
    planets: SHAPE_ROUNDS.map((round, index) => ({
      ...PLANET_ART[index],
      id: index + 1,
      activity: "shapes",
      shapeRound: index,
      progressId: `shape-${round.target}-${round.colour}`,
      missionTitle: `${round.colour[0].toUpperCase()}${round.colour.slice(1)} ${round.target}s`,
      description: `We are going to find and pop the ${round.colour} ${round.target}s.`,
    })),
  },
  {
    id: "trail",
    title: "Star Trail Adventure",
    icon: "⭐",
    description: "Follow five star paths and guide the rocket through space.",
    planets: TRAIL_PATTERN_KEYS.map((patternKey, index) => {
      const pattern = TRAIL_PATTERNS[patternKey];
      return {
        ...PLANET_ART[index],
        id: index + 1,
        activity: "trail",
        pattern: patternKey,
        progressId: pattern.progressId,
        missionTitle: pattern.title,
        description: `We are going to follow the ${pattern.title.toLowerCase()} star path.`,
      };
    }),
  },
  {
    id: "scribble",
    title: "Drawing Adventure",
    icon: "🖍️",
    description: "Draw, erase and decorate a space picture.",
    planets: [
      {
        ...PLANET_ART[0],
        id: 1,
        activity: "scribble",
        progressId: "scribble",
        missionTitle: "Magic Space Scribbler",
        description: "We are going to draw, scribble and make a space picture.",
      },
      {
        ...PLANET_ART[1],
        id: 2,
        activity: "coloring",
        progressId: "scribble-coloring",
        missionTitle: "Coloring Book",
        description: "Choose a colour and tap the big shapes to colour your own picture.",
      },
    ],
  },
  {
    id: "discovery",
    title: "Discovery Adventure",
    icon: "🔭",
    description: "Count space objects and discover big and small.",
    planets: [
      {
        ...PLANET_ART[0],
        id: 1,
        activity: "discovery",
        discoveryLesson: "counting",
        progressId: DISCOVERY_LESSONS.counting.progressId,
        missionTitle: "Count the Space Objects",
        description: "We are going to count space objects from one to five.",
      },
      {
        ...PLANET_ART[1],
        id: 2,
        activity: "discovery",
        discoveryLesson: "sizes",
        progressId: DISCOVERY_LESSONS.sizes.progressId,
        missionTitle: "Big and Small",
        description: "We are going to find big and small space objects.",
      },
    ],
  },
];

const DRAWING_COLORS = [
  "#ffd45c",
  "#55c6ff",
  "#ff6f91",
  "#66d17a",
  "#a875e8",
  "#ffffff",
];

let sharedAudioContext;

function readProgress() {
  try {
    const saved = JSON.parse(learningStorage.getItem(LITTLE_PROGRESS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readStartedPlanets() {
  try {
    const saved = JSON.parse(learningStorage.getItem(LITTLE_STARTED_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readBalloonSessions() {
  try {
    const saved = JSON.parse(learningStorage.getItem(BALLOON_SESSION_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveBalloonSession(mode, round) {
  const sessions = readBalloonSessions();

  if (round === null) delete sessions[mode];
  else sessions[mode] = round;

  learningStorage.setItem(BALLOON_SESSION_KEY, JSON.stringify(sessions));
}

function playBoop(soundOn, step = 0) {
  if (!soundOn || typeof window === "undefined") return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  sharedAudioContext ||= new AudioContextClass();
  const context = sharedAudioContext;

  if (context.state === "suspended") {
    void context.resume();
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(360 + step * 42, now);
  oscillator.frequency.exponentialRampToValueAtTime(560 + step * 46, now + 0.09);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.17);
}

function LittlePlanetVisual({ planet, className = "" }) {
  return (
    <span
      className={`little-planet-visual ${className}`}
      style={{ "--little-planet-colour": planet.colour }}
    >
      <img src={planet.image} alt={planet.name} />
    </span>
  );
}

function ActivityHeader({ title, instruction, onBack, backLabel = "Little Explorers" }) {
  return (
    <header className="little-activity-header">
      <LocalBackButton
        className="page-back-button little-activity-back"
        label={backLabel}
        onClick={onBack}
      />
      <div>
        <p className="eyebrow">LITTLE EXPLORERS</p>
        <h1>{title}</h1>
        {instruction && <p>{instruction}</p>}
      </div>
    </header>
  );
}

export default function LittleExplorers({
  backLabel = "Explore",
  onBack,
  soundOn = true,
}) {
  const [screen, setScreen] = useState(() => resumeScreen(readSavedActivity('oatle-little-location', {}), ['adventures', 'map', 'planet', 'coloring', 'building'], 'adventures'));
  const [completed, setCompleted] = useState(readProgress);
  const [startedPlanets, setStartedPlanets] = useState(readStartedPlanets);
  const [activeAdventureId, setActiveAdventureId] = useState(() => readSavedActivity('oatle-little-location', {}).adventure || 'balloons');
  const [activePlanetId, setActivePlanetId] = useState(() => readSavedActivity('oatle-little-location', {}).planet || 1);
  useEffect(() => { saveActivity('oatle-little-location', { screen, adventure: activeAdventureId, planet: activePlanetId }); }, [screen, activeAdventureId, activePlanetId]);
  const [popped, setPopped] = useState([]);
  const [balloonCategory, setBalloonCategory] = useState(null);
  const [balloonMode, setBalloonMode] = useState(null);
  const [balloonRound, setBalloonRound] = useState(0);
  const [wrongBalloon, setWrongBalloon] = useState(null);
  const [balloonFinished, setBalloonFinished] = useState(false);
  const [balloonBreak, setBalloonBreak] = useState(false);
  const [breakPopped, setBreakPopped] = useState([]);
  const [shapeRound, setShapeRound] = useState(0);
  const [shapePopped, setShapePopped] = useState([]);
  const [wrongShape, setWrongShape] = useState(null);
  const [trailPattern, setTrailPattern] = useState(null);
  const [discoveryRound, setDiscoveryRound] = useState(0);
  const [wrongDiscoveryChoice, setWrongDiscoveryChoice] = useState(null);
  const [correctDiscoveryChoice, setCorrectDiscoveryChoice] = useState(null);
  const [drawingColor, setDrawingColor] = useState(DRAWING_COLORS[0]);
  const [drawingTool, setDrawingTool] = useState("draw");
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickers, setStickers] = useState([]);

  const canvasRef = useRef(null);
  useDrawingToolCursor(canvasRef, drawingTool === "eraser" ? "eraser" : "brush", drawingColor, !selectedSticker);
  const activePointerRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const canvasSizedRef = useRef(false);
  const balloonTimerRef = useRef(null);
  const celebrationTimerRef = useRef(null);
  const victoryAudioRef = useRef(null);
  const activeAdventure = LITTLE_ADVENTURES.find(
    (adventure) => adventure.id === activeAdventureId
  ) || LITTLE_ADVENTURES[0];
  const activePlanet = activeAdventure.planets.find(
    (planet) => planet.id === activePlanetId
  ) || activeAdventure.planets[0];
  const isPlanetComplete = (planet, adventure = activeAdventure) =>
    completed.includes(planet.progressId) ||
    (planet.activity !== "coloring" && completed.includes(adventure.id)) ||
    (adventure.id === "shapes" && completed.includes("balloons-shapes-5"));

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector(".app")?.scrollTo(0, 0);
  }, [screen]);

  const completePlanet = (planet = activePlanet, adventure = activeAdventure) => {
    setCompleted((current) => {
      const next = current.includes(planet.progressId)
        ? [...current]
        : [...current, planet.progressId];
      const adventureComplete = adventure.planets.every(
        (item) => next.includes(item.progressId) || (item.activity !== "coloring" && current.includes(adventure.id))
      );

      if (adventureComplete && !next.includes(adventure.id)) next.push(adventure.id);
      learningStorage.setItem(LITTLE_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const playVictorySong = () => {
    if (!soundOn) return;

    victoryAudioRef.current?.pause();
    const effect = new Audio(victorySound);
    effect.volume = 0.55;
    victoryAudioRef.current = effect;
    effect.addEventListener(
      "ended",
      () => {
        if (victoryAudioRef.current === effect) {
          victoryAudioRef.current = null;
        }
      },
      { once: true }
    );
    effect.play().catch(() => {
      if (victoryAudioRef.current === effect) {
        victoryAudioRef.current = null;
      }
    });
  };

  const celebratePlanet = (delay = 0, playSong = true) => {
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);

    if (playSong) playVictorySong();

    if (delay > 0) {
      celebrationTimerRef.current = window.setTimeout(() => setScreen("celebration"), delay);
      return;
    }

    setScreen("celebration");
  };

  const openAdventure = (adventureId) => {
    const adventure = LITTLE_ADVENTURES.find(item => item.id === adventureId);
    const next = adventure?.planets.find(planet => !isPlanetComplete(planet, adventure));
    setActiveAdventureId(adventureId);
    setActivePlanetId(next?.id || adventure?.planets.at(-1)?.id || 1);
    setScreen("map");
  };

  const openPlanet = (planetId) => {
    setActivePlanetId(planetId);
    setScreen("planet");
  };

  const markPlanetStarted = (progressId) => {
    setStartedPlanets((current) => {
      if (current.includes(progressId)) return current;
      const next = [...current, progressId];
      learningStorage.setItem(LITTLE_STARTED_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!soundOn) return undefined;

    const prompts = {
      map: `${activeAdventure.title}. Choose a planet.`,
      planet: `Welcome to planet ${activePlanet.name} in the ${activeAdventure.title}. ${activePlanet.description}`,
      celebration: `Mission accomplished! You completed the ${activePlanet.missionTitle} mission on planet ${activePlanet.name}.`,
      balloons: balloonBreak
        ? "Bubble break! Pop the balloons!"
        : balloonMode
          ? BALLOON_LESSONS[balloonMode].rounds[balloonRound]?.prompt
          : balloonCategory
            ? `Choose a ${BALLOON_CATEGORIES[balloonCategory].title} game.`
            : "Choose numbers, letters, or colours.",
      shapes: SHAPE_ROUNDS[shapeRound]?.prompt,
      trail: trailPattern
        ? TRAIL_PATTERNS[trailPattern].prompt
        : "Choose a star trail pattern.",
      discovery:
        DISCOVERY_LESSONS[activePlanet.discoveryLesson]?.rounds[discoveryRound]?.prompt,
      scribble: "Draw anything you like in space!",
    };

    const prompt = prompts[screen];
    if (!prompt) return undefined;

    const timer = window.setTimeout(() => speak(prompt), screen === "celebration" ? 7800 : 220);

    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [
    activePlanet.name,
    activePlanet.description,
    activePlanet.missionTitle,
    activeAdventure.title,
    balloonBreak,
    balloonCategory,
    balloonMode,
    balloonRound,
    screen,
    shapeRound,
    soundOn,
    trailPattern,
    discoveryRound,
    activePlanet.discoveryLesson,
  ]);

  useEffect(() => () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    victoryAudioRef.current?.pause();
  }, []);

  useEffect(() => {
    if (screen === "celebration" && soundOn) {
      return;
    }

    if (victoryAudioRef.current) {
      victoryAudioRef.current.pause();
      victoryAudioRef.current.currentTime = 0;
      victoryAudioRef.current = null;
    }
  }, [screen, soundOn]);

  useEffect(() => {
    if (screen !== "scribble") return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let frameId;

    const resizeCanvas = () => {
      if (frameId) window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const dpr = window.devicePixelRatio || 1;
        let previousCanvas;

        if (canvasSizedRef.current) {
          previousCanvas = document.createElement("canvas");
          previousCanvas.width = canvas.width;
          previousCanvas.height = canvas.height;
          previousCanvas.getContext("2d")?.drawImage(canvas, 0, 0);
        }

        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);

        const context = canvas.getContext("2d");
        context?.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (context && previousCanvas) {
          context.drawImage(
            previousCanvas,
            0,
            0,
            previousCanvas.width,
            previousCanvas.height,
            0,
            0,
            rect.width,
            rect.height
          );
        }

        canvasSizedRef.current = true;
      });
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
      canvasSizedRef.current = false;
    };
  }, [screen]);

  const showMap = () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    setBalloonCategory(null);
    setBalloonMode(null);
    setShapePopped([]);
    setWrongShape(null);
    setTrailPattern(null);
    setDiscoveryRound(0);
    setWrongDiscoveryChoice(null);
    setCorrectDiscoveryChoice(null);
    setScreen("map");
  };

  const showAdventures = () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    setScreen("adventures");
  };

  const startPlanetMission = () => {
    stopSpeech();
    markPlanetStarted(activePlanet.progressId);
    startActivity(activePlanet);
  };

  const unlockNextPlanet = () => {
    stopSpeech();
    const currentIndex = activeAdventure.planets.findIndex(
      (planet) => planet.id === activePlanet.id
    );
    const nextPlanet = activeAdventure.planets[currentIndex + 1];

    if (!nextPlanet) {
      showMap();
      return;
    }

    setActivePlanetId(nextPlanet.id);
    setScreen("planet");
  };

  const startActivity = (planet) => {
    if (planet.activity === "balloons") {
      startBalloonLesson(planet.lesson, BALLOON_LESSONS[planet.lesson].kind);
    }
    if (planet.activity === "trail") {
      setTrailPattern(planet.pattern);
    }
    if (planet.activity === "shapes") {
      setShapeRound(planet.shapeRound);
      setShapePopped([]);
      setWrongShape(null);
    }
    if (planet.activity === "discovery") {
      setDiscoveryRound(0);
      setWrongDiscoveryChoice(null);
      setCorrectDiscoveryChoice(null);
    }
    setScreen(planet.activity);
  };

  const showBalloonMenu = () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    setBalloonCategory(null);
    setBalloonMode(null);
    setBalloonRound(0);
    setPopped([]);
    setWrongBalloon(null);
    setBalloonFinished(false);
    setBalloonBreak(false);
    setBreakPopped([]);
  };

  const openBalloonCategory = (category) => {
    const { lessonKeys } = BALLOON_CATEGORIES[category];

    if (lessonKeys.length === 1) {
      startBalloonLesson(lessonKeys[0], category);
      return;
    }

    setBalloonCategory(category);
    setBalloonMode(null);
  };

  const showBalloonCategory = () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);

    if (balloonCategory && BALLOON_CATEGORIES[balloonCategory].lessonKeys.length > 1) {
      setBalloonMode(null);
      setBalloonRound(0);
      setPopped([]);
      setWrongBalloon(null);
      setBalloonFinished(false);
      setBalloonBreak(false);
      setBreakPopped([]);
      return;
    }

    showBalloonMenu();
  };

  function startBalloonLesson(mode, category = balloonCategory) {
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    const savedRound = Number(readBalloonSessions()[mode]);
    const lessonLength = BALLOON_LESSONS[mode].rounds.length;

    setBalloonCategory(category);
    setBalloonMode(mode);
    setBalloonRound(
      Number.isInteger(savedRound) && savedRound > 0 && savedRound < lessonLength
        ? savedRound
        : 0
    );
    setPopped([]);
    setWrongBalloon(null);
    setBalloonFinished(false);
    setBalloonBreak(false);
    setBreakPopped([]);
  }

  const finishBalloonRound = (lesson, round) => {
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    balloonTimerRef.current = window.setTimeout(() => {
      if (balloonRound === lesson.rounds.length - 1) {
        setBalloonFinished(true);
        saveBalloonSession(balloonMode, null);
        completePlanet();
        playVictorySong();
        celebratePlanet(650, false);
        return;
      }

      const nextRound = balloonRound + 1;
      saveBalloonSession(balloonMode, nextRound);

      if (round.breakAfter) {
        setBalloonBreak(true);
        setBreakPopped([]);
        setPopped([]);
        return;
      }

      setBalloonRound((current) => current + 1);
      setPopped([]);
    }, 720);
  };

  const chooseBalloon = (choice, index) => {
    if (!balloonMode || balloonBreak || popped.length || balloonFinished) return;

    const lesson = BALLOON_LESSONS[balloonMode];
    const round = lesson.rounds[balloonRound];
    const spokenChoice =
      lesson.kind === "letters"
        ? `letter ${choice}`
        : lesson.kind === "numbers"
          ? `number ${choice}`
          : choice;

    if (choice !== round.target) {
      setWrongBalloon(index);
      if (soundOn) speak(`That is ${spokenChoice}. Try again.`);
      if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = window.setTimeout(() => setWrongBalloon(null), 650);
      return;
    }

    setWrongBalloon(null);
    setPopped([index]);
    playBoop(soundOn, balloonRound + 1);
    if (soundOn) speak(BALLOON_PRAISE[balloonRound % BALLOON_PRAISE.length]);

    finishBalloonRound(lesson, round);
  };

  const chooseShape = (choice, index) => {
    if (shapePopped.includes(index)) return;

    const round = SHAPE_ROUNDS[shapeRound];
    const targetCount = round.choices.filter((shape) => shape === round.target).length;

    if (choice !== round.target) {
      setWrongShape(index);
      if (soundOn) speak(`That is a ${SHAPE_ROUNDS.find((item) => item.target === choice)?.colour} ${choice}. Try again.`);
      if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = window.setTimeout(() => setWrongShape(null), 650);
      return;
    }

    const nextPopped = [...shapePopped, index];
    setWrongShape(null);
    setShapePopped(nextPopped);
    playBoop(soundOn, shapeRound * SHAPE_POP_POSITIONS.length + nextPopped.length);
    if (soundOn) {
      speak(BALLOON_PRAISE[(shapeRound + nextPopped.length - 1) % BALLOON_PRAISE.length]);
    }

    if (nextPopped.length !== targetCount) return;

    completePlanet();
    playVictorySong();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    balloonTimerRef.current = window.setTimeout(
      () => celebratePlanet(0, false),
      850
    );
  };

  const continueBalloonLesson = () => {
    if (balloonTimerRef.current) {
      window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = null;
    }
    setBalloonBreak(false);
    setBreakPopped([]);
    setPopped([]);
    setBalloonRound((current) => current + 1);
  };

  const popBreakBalloon = (balloonId) => {
    if (breakPopped.includes(balloonId)) return;

    const next = [...breakPopped, balloonId];
    setBreakPopped(next);
    playBoop(soundOn, next.length + 2);

    if (next.length === BREAK_BALLOONS.length) {
      if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = window.setTimeout(continueBalloonLesson, 500);
    }
  };

  const chooseDiscoveryAnswer = (choice, index) => {
    if (correctDiscoveryChoice !== null) return;

    const lesson = DISCOVERY_LESSONS[activePlanet.discoveryLesson];
    const round = lesson.rounds[discoveryRound];

    if (choice !== round.target) {
      setWrongDiscoveryChoice(index);
      if (soundOn) speak("Try again.");
      if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = window.setTimeout(
        () => setWrongDiscoveryChoice(null),
        650
      );
      return;
    }

    setWrongDiscoveryChoice(null);
    setCorrectDiscoveryChoice(index);
    playBoop(soundOn, discoveryRound + 2);
    if (soundOn) {
      speak(BALLOON_PRAISE[discoveryRound % BALLOON_PRAISE.length]);
    }

    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    balloonTimerRef.current = window.setTimeout(() => {
      if (discoveryRound < lesson.rounds.length - 1) {
        setDiscoveryRound((current) => current + 1);
        setCorrectDiscoveryChoice(null);
        return;
      }

      completePlanet();
      playVictorySong();
      celebratePlanet(500, false);
    }, 800);
  };

  const startTrailPattern = (pattern) => {
    setTrailPattern(pattern);
  };

  const finishTrail = () => {
    completePlanet();
    playVictorySong();
    celebratePlanet(650, false);
  };

  const getCanvasPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawDot = (point) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.save();
    context.globalCompositeOperation =
      drawingTool === "eraser" ? "destination-out" : "source-over";
    context.fillStyle = drawingColor;
    context.beginPath();
    context.arc(
      point.x,
      point.y,
      drawingTool === "eraser" ? 15 : 7,
      0,
      Math.PI * 2
    );
    context.fill();
    context.restore();
  };

  const drawLine = (from, to) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.save();
    context.globalCompositeOperation =
      drawingTool === "eraser" ? "destination-out" : "source-over";
    context.strokeStyle = drawingColor;
    context.lineWidth = drawingTool === "eraser" ? 30 : 14;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.restore();
  };

  const handleDrawStart = (event) => {
    if (
      activePointerRef.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) return;

    event.preventDefault();
    const point = getCanvasPoint(event);

    if (selectedSticker) {
      setStickers((current) => [
        ...current,
        {
          id: `${selectedSticker.type}-${Date.now()}-${Math.random()}`,
          type: selectedSticker.type,
          color: selectedSticker.color,
          x: point.x,
          y: point.y,
        },
      ]);
      return;
    }

    canvasRef.current?.setPointerCapture?.(event.pointerId);
    activePointerRef.current = event.pointerId;
    drawingRef.current = true;
    lastPointRef.current = point;
    drawDot(point);
  };

  const handleDrawMove = (event) => {
    if (
      !drawingRef.current ||
      event.pointerId !== activePointerRef.current
    ) return;

    event.preventDefault();

    const events = event.getCoalescedEvents
      ? event.getCoalescedEvents()
      : [event];

    events.forEach((pointerEvent) => {
      const point = getCanvasPoint(pointerEvent);
      if (lastPointRef.current) drawLine(lastPointRef.current, point);
      lastPointRef.current = point;
    });
  };

  const handleDrawEnd = (event) => {
    if (event.pointerId !== activePointerRef.current) return;

    event.preventDefault();
    drawingRef.current = false;
    lastPointRef.current = null;
    activePointerRef.current = null;

    if (canvasRef.current?.hasPointerCapture?.(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    setStickers([]);
    setSelectedSticker(null);
    setDrawingTool("draw");
  };

  const finishScribble = () => {
    completePlanet();
    celebratePlanet(280);
  };

  const finishExtraMission = () => {
    stopSpeech();
    completePlanet();
    celebratePlanet();
  };

  if (screen === "coloring") {
    return <ColoringBook ageGroup="little" soundOn={soundOn} onBack={showMap} onComplete={finishExtraMission} />;
  }

  if (screen === "feelings") {
    return <FeelingsAdventure ageGroup="little" soundOn={soundOn} onBack={showAdventures} onComplete={() => {
      setCompleted(current => {
        if (current.includes("feelings")) return current;
        const next = [...current, "feelings"];
        try { learningStorage.setItem(LITTLE_PROGRESS_KEY, JSON.stringify(next)); } catch { /* Play still works without storage. */ }
        return next;
      });
    }} />;
  }

  if (screen === "storybooks") {
    return <StorybookAdventure soundOn={soundOn} onBack={showAdventures} />;
  }

  if (screen === "building") {
    return <BuildingAdventure key={activePlanet.progressId} mission={activePlanet} onComplete={finishExtraMission} onBack={showMap} soundOn={soundOn} />;
  }

  if (screen === "animals") {
    return <AnimalAdventure key={activePlanet.progressId} mission={activePlanet} onComplete={finishExtraMission} onBack={showMap} soundOn={soundOn} />;
  }

  if (screen === "puzzles") {
    return <PuzzleAdventure key={activePlanet.progressId} mission={activePlanet} onComplete={finishExtraMission} onBack={showMap} soundOn={soundOn} />;
  }

  if (screen === "music") {
    return <MusicAdventure key={activePlanet.progressId} mission={activePlanet} onComplete={finishExtraMission} onBack={showMap} soundOn={soundOn} />;
  }

  if (screen === "planet") {
    const missionStarted = startedPlanets.includes(activePlanet.progressId);
    const missionComplete = isPlanetComplete(activePlanet);

    return (
      <main className="little-explorers-page little-planet-overview">
        <LocalBackButton
          className="page-back-button"
          label={`${activeAdventure.title} map`}
          onClick={showMap}
        />

        <LittlePlanetVisual planet={activePlanet} className="little-overview-planet" />
        <p className="eyebrow">PLANET {activePlanet.id}</p>
        <h1>Welcome to Planet {activePlanet.name}</h1>
        <strong>{activeAdventure.title}: {activePlanet.missionTitle}</strong>
        <p>{activePlanet.description}</p>

        <button className="primary-button" type="button" onClick={startPlanetMission}>
          {missionComplete
            ? "Play mission again"
            : missionStarted
              ? "Return to mission"
              : "Start mission"}
        </button>
      </main>
    );
  }

  if (screen === "celebration") {
    const activePlanetIndex = activeAdventure.planets.findIndex(
      (planet) => planet.id === activePlanet.id
    );
    const hasNextPlanet = activePlanetIndex < activeAdventure.planets.length - 1;

    return (
      <main className="little-explorers-page little-planet-celebration">
        <LocalBackButton
          className="page-back-button"
          label={`${activeAdventure.title} map`}
          onClick={showMap}
        />

        <p className="eyebrow">MISSION COMPLETE</p>
        <h1>Mission accomplished!</h1>
        <p>You completed the {activePlanet.missionTitle} mission on Planet {activePlanet.name}.</p>
        <LittlePlanetVisual planet={activePlanet} className="little-celebration-planet" />
        <strong>{activeAdventure.title}</strong>

        <button
          className={hasNextPlanet ? "primary-button" : "secondary-button"}
          type="button"
          onClick={hasNextPlanet ? unlockNextPlanet : showMap}
        >
          {hasNextPlanet ? "Unlock next planet →" : `Back to ${activeAdventure.title} map`}
        </button>
      </main>
    );
  }

  if (screen === "balloons") {
    if (!balloonMode) {
      const category = balloonCategory ? BALLOON_CATEGORIES[balloonCategory] : null;
      const menuKeys = category ? category.lessonKeys : BALLOON_CATEGORY_KEYS;

      return (
        <main className="little-explorers-page little-activity-page">
          <ActivityHeader
            title={category?.title || "Balloon Learning"}
            instruction={category ? "Choose where to begin." : "Choose a little learning game."}
            backLabel={category ? "Balloon games" : "Planet map"}
            onBack={category ? showBalloonMenu : showMap}
          />

          <section className="balloon-space balloon-lesson-menu" aria-label="Balloon learning games">
            <div
              className={`balloon-lesson-grid ${
                category ? "balloon-lesson-grid-two" : "balloon-category-grid"
              }`}
            >
              {menuKeys.map((key) => {
                const item = category ? BALLOON_LESSONS[key] : BALLOON_CATEGORIES[key];
                const isComplete = category
                  ? completed.includes(item.progressId)
                  : item.lessonKeys.every((lessonKey) =>
                      completed.includes(BALLOON_LESSONS[lessonKey].progressId)
                    );

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      category
                        ? startBalloonLesson(key, balloonCategory)
                        : openBalloonCategory(key)
                    }
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <strong>{item.cardTitle}</strong>
                    <small>{item.cardText}</small>
                    {isComplete && <b aria-label="Completed">✓</b>}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      );
    }

    const lesson = BALLOON_LESSONS[balloonMode];
    const round = lesson.rounds[balloonRound];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title="Balloon Adventure"
          instruction={balloonBreak ? "Celebration bubble break!" : undefined}
          backLabel={`${activeAdventure.title} map`}
          onBack={showMap}
        />

        <section className="balloon-space balloon-learning-space" aria-label={lesson.title}>
          {balloonBreak ? (
            <>
              <div className="balloon-break-prompt" aria-live="polite">
                <span aria-hidden="true">✨🎈✨</span>
                <strong>Bubble break!</strong>
                <small>Pop them just for fun.</small>
              </div>

              {BREAK_BALLOONS.map((balloon) => (
                <button
                  key={balloon.id}
                  type="button"
                  className={`space-balloon break-balloon ${
                    breakPopped.includes(balloon.id) ? "popped" : ""
                  }`}
                  style={{
                    "--balloon-color": balloon.color,
                    "--balloon-x": `${balloon.x}%`,
                    "--balloon-y": `${balloon.y}%`,
                    "--balloon-delay": balloon.delay,
                  }}
                  onClick={() => popBreakBalloon(balloon.id)}
                  disabled={breakPopped.includes(balloon.id)}
                  aria-label="Pop celebration balloon"
                >
                  <span aria-hidden="true" />
                </button>
              ))}

              <button
                type="button"
                className="balloon-break-continue"
                onClick={continueBalloonLesson}
              >
                Continue →
              </button>
            </>
          ) : (
            <>
              <div className="balloon-learning-prompt">
                <span>Round {balloonRound + 1} of {lesson.rounds.length}</span>
                <button
                  type="button"
                  className="balloon-listen-again"
                  aria-label="Listen again"
                  disabled={!soundOn || balloonFinished}
                  onClick={() => speak(round.prompt)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4 9h4l5-4v14l-5-4H4Z" fill="currentColor" />
                    <path d="M16 8q4 4 0 8m3-11q7 7 0 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {round.choices.map((choice, index) => {
                const position = BALLOON_POSITIONS[index];
                const balloonColour =
                  lesson.kind === "colours"
                    ? BALLOON_COLOURS[choice]
                    : BALLOON_PALETTE[index];

                return (
                  <button
                    key={`${balloonRound}-${choice}-${index}`}
                    type="button"
                    className={`space-balloon learning-balloon ${
                      popped.includes(index) ? "popped" : ""
                    } ${wrongBalloon === index ? "wrong" : ""}`}
                    style={{
                      "--balloon-color": balloonColour,
                      "--balloon-x": `${position.x}%`,
                      "--balloon-y": `${position.y}%`,
                      "--balloon-delay": position.delay,
                    }}
                    onClick={() => chooseBalloon(choice, index)}
                    disabled={popped.includes(index)}
                    aria-label={`Choose ${choice}`}
                  >
                    <span aria-hidden="true" />
                    {lesson.kind !== "colours" && (
                      <strong className="balloon-choice-label" aria-hidden="true">
                        {choice}
                      </strong>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {balloonFinished && (
            <div className="little-success-card" role="status">
              <span aria-hidden="true">🎈✨</span>
              <strong>{lesson.title} complete!</strong>
              <div>
                <button type="button" onClick={() => startBalloonLesson(balloonMode)}>
                  ↻ Again
                </button>
                <button type="button" onClick={showBalloonCategory}>
                  🎈 Games
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (screen === "discovery") {
    const lesson = DISCOVERY_LESSONS[activePlanet.discoveryLesson];
    const round = lesson.rounds[discoveryRound];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title={lesson.title}
          instruction={round.prompt}
          backLabel={`${activeAdventure.title} map`}
          onBack={showMap}
        />

        <section
          className={`discovery-space discovery-${lesson.kind}-space`}
          aria-label={lesson.title}
        >
          <div className="discovery-prompt" aria-live="polite">
            <span>Round {discoveryRound + 1} of {lesson.rounds.length}</span>
            <strong>{round.prompt}</strong>
          </div>

          <div className={`discovery-choice-grid discovery-${lesson.kind}-grid`}>
            {round.choices.map((choice, index) => (
              <button
                key={`${discoveryRound}-${choice}-${index}`}
                type="button"
                className={`discovery-choice ${
                  wrongDiscoveryChoice === index ? "wrong" : ""
                } ${correctDiscoveryChoice === index ? "correct" : ""}`}
                onClick={() => chooseDiscoveryAnswer(choice, index)}
                disabled={correctDiscoveryChoice !== null}
                aria-label={
                  lesson.kind === "counting"
                    ? `${choice} ${choice === 1 ? "object" : "objects"}`
                    : `${choice} ${round.name}`
                }
              >
                {lesson.kind === "counting" ? (
                  <span className="discovery-object-group" aria-hidden="true">
                    {Array.from({ length: choice }, (_, objectIndex) => (
                      <i key={objectIndex}>{round.symbol}</i>
                    ))}
                  </span>
                ) : (
                  <>
                    <span
                      className={`discovery-size-object discovery-size-${choice}`}
                      aria-hidden="true"
                    >
                      {round.symbol}
                    </span>
                    <strong>{choice === "big" ? "Big" : "Small"}</strong>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (screen === "shapes") {
    const round = SHAPE_ROUNDS[shapeRound];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title="Shape Pop"
          instruction={round.prompt}
          backLabel={`${activeAdventure.title} map`}
          onBack={showMap}
        />

        <section className="shape-pop-space" aria-label="Shape Pop">
          <div className="shape-pop-prompt" aria-live="polite">
            <span>Level {shapeRound + 1} of {SHAPE_ROUNDS.length}</span>
            <strong>{round.prompt}</strong>
            <i
              className={`shape-pop-target shape-pop-${round.target}`}
              style={{ "--shape-colour": SHAPE_COLOURS[round.target] }}
              aria-hidden="true"
            />
          </div>

          {round.choices.map((choice, index) => {
            const position = SHAPE_POP_POSITIONS[index];
            const colour = SHAPE_COLOURS[choice];

            return (
              <button
                key={`${shapeRound}-${choice}-${index}`}
                type="button"
                className={`shape-pop-piece ${
                  shapePopped.includes(index) ? "popped" : ""
                } ${wrongShape === index ? "wrong" : ""}`}
                style={{
                  "--shape-x": `${position.x}%`,
                  "--shape-y": `${position.y}%`,
                  "--shape-delay": position.delay,
                  "--shape-colour": colour,
                }}
                onClick={() => chooseShape(choice, index)}
                disabled={shapePopped.includes(index)}
                aria-label={`Pop the ${SHAPE_ROUNDS.find((item) => item.target === choice)?.colour} ${choice}`}
              >
                <i className={`shape-pop-visual shape-pop-${choice}`} aria-hidden="true" />
              </button>
            );
          })}
        </section>
      </main>
    );
  }

  if (screen === "trail") {
    if (!trailPattern) {
      return (
        <main className="little-explorers-page little-activity-page">
          <ActivityHeader
            title="Star Trail Patterns"
            instruction="Choose a trail and follow its shape."
            backLabel="Planet map"
            onBack={showMap}
          />

          <section className="star-trail-space trail-pattern-menu" aria-label="Star trail patterns">
            <div className="trail-pattern-grid">
              {TRAIL_PATTERN_KEYS.map((key) => {
                const pattern = TRAIL_PATTERNS[key];
                const isComplete = completed.includes(pattern.progressId);

                return (
                  <button key={key} type="button" onClick={() => startTrailPattern(key)}>
                    <span aria-hidden="true">{pattern.icon}</span>
                    <strong>{pattern.title}</strong>
                    <small>{pattern.cardText}</small>
                    {isComplete && <b aria-label="Completed">✓</b>}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      );
    }

    const pattern = TRAIL_PATTERNS[trailPattern];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title={pattern.title}
          instruction="Slide your finger along the dotted line."
          backLabel={`${activeAdventure.title} map`}
          onBack={showMap}
        />

        <StarTrailTrace key={trailPattern} pattern={pattern} onComplete={finishTrail}
          onReach={index => playBoop(soundOn, index + 1)} />
      </main>
    );
  }

  if (screen === "scribble") {
    return (
      <main className="little-explorers-page little-activity-page little-scribble-page">
        <ActivityHeader
          title="Magic Space Scribbler"
          instruction="Draw, erase, and add stickers to your space picture."
          backLabel={`${activeAdventure.title} map`}
          onBack={showMap}
        />

        <section className="little-scribble-space">
          <div className="little-scribble-stars" aria-hidden="true">✦ · ✧ · ✦</div>
          <div className="little-scribble-sticker-layer" aria-hidden="true">
            {stickers.map((sticker) => (
              <span
                key={sticker.id}
                className="little-sticker-on-canvas"
                style={{ left: sticker.x, top: sticker.y }}
              >
                <StickerShape type={sticker.type} color={sticker.color} />
              </span>
            ))}
          </div>
          <canvas
            ref={canvasRef}
              style={selectedSticker ? undefined : drawingToolCursor(drawingTool === "eraser" ? "eraser" : "brush", drawingColor)}
            className={selectedSticker ? "little-canvas-sticker-mode" : ""}
            aria-label="Draw colourful space trails"
            onPointerDown={handleDrawStart}
            onPointerMove={handleDrawMove}
            onPointerUp={handleDrawEnd}
            onPointerCancel={handleDrawEnd}
            onContextMenu={(event) => event.preventDefault()}
          />
        </section>

        <div className="little-drawing-tools" aria-label="Scribbler tools">
          <SavePictureButton canvasRef={canvasRef} filename="oatle-kids-little-scribbler.png" />
          <div className="little-drawing-main-tools" aria-label="Drawing colours and eraser">
            {DRAWING_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`little-colour-button ${
                  drawingColor === color &&
                  drawingTool === "draw" &&
                  !selectedSticker
                    ? "selected"
                    : ""
                }`}
                style={{ "--drawing-color": color }}
                onClick={() => {
                  setDrawingColor(color);
                  setDrawingTool("draw");
                  setSelectedSticker(null);
                }}
                aria-label={`Use ${color} colour`}
                aria-pressed={
                  drawingColor === color &&
                  drawingTool === "draw" &&
                  !selectedSticker
                }
              />
            ))}

            <button
              className={`little-eraser-tool ${drawingTool === "eraser" ? "selected" : ""}`}
              type="button"
              onClick={() => {
                setDrawingTool("eraser");
                setSelectedSticker(null);
              }}
              aria-label="Eraser"
              aria-pressed={drawingTool === "eraser"}
            >
              <EraserIcon />
              <span>Eraser</span>
            </button>

            <button className="little-clear-drawing" type="button" onClick={clearDrawing}>
              ↻
              <span>Clear</span>
            </button>
          </div>

          <ScribblerStickerPicker
            className="little-sticker-tools"
            buttonClassName="little-sticker-tool"
            selectedSticker={selectedSticker}
            onSelect={(sticker) => {
              setSelectedSticker(sticker);
              setDrawingTool("draw");
            }}
          />

          <button className="little-finish-drawing" type="button" onClick={finishScribble}>
            ✓
            <span>Done</span>
          </button>
        </div>
      </main>
    );
  }

  if (screen === "adventures") {
    return <LittleAdventureHomes onBack={onBack} backLabel={backLabel} soundOn={soundOn} items={[
      ...LITTLE_ADVENTURES.map(adventure => {
        const completeCount = adventure.planets.filter(planet => isPlanetComplete(planet, adventure)).length;
        return { id: adventure.id, title: adventure.title,
          subtitle: `${completeCount} of ${adventure.planets.length} planets explored`,
          complete: completeCount === adventure.planets.length,
          onSelect: () => openAdventure(adventure.id) };
      }),
      { id: "storybooks", title: "Storybook Adventure", subtitle: "A little world of picture books", onSelect: () => { stopSpeech(); setScreen("storybooks"); } },
      { id: "feelings", title: "Feelings Adventure", subtitle: "Meet happy, sad, angry and surprised", image: "/little-adventure-homes/feelings.webp", complete: completed.includes("feelings"), onSelect: () => { stopSpeech(); setScreen("feelings"); } },
    ]} />;
  }

  return (
    <main className="little-explorers-page little-map-page">
      <LocalBackButton
        className="page-back-button"
        label="Adventures"
        onClick={showAdventures}
      />

      <header className="little-map-header">
        <p className="eyebrow">{activeAdventure.title.toUpperCase()}</p>
        <h1>{activeAdventure.title} Map</h1>
        <p>{activeAdventure.id === "scribble" ? "All drawing activities are free. Choose any planet!" : "Complete each planet to unlock the next mission."}</p>
      </header>

      <ResponsivePlanetJourney adventureId={activeAdventure.id} centerTitle={activeAdventure.title} centerImage={activeAdventure.id === "building" ? "/adventure-homes/builder.webp" : undefined} centerEmblem={activeAdventure.id === "animals" ? <AnimalIcon /> : activeAdventure.id === "puzzles" ? <PuzzleIcon /> : activeAdventure.id === "music" ? <MusicIcon /> : activeAdventure.icon || "✦"} key={activeAdventure.id} playful label={`${activeAdventure.title} planet journey`} currentId={activePlanetId} items={activeAdventure.planets.map((planet, index) => ({
        id: planet.id, title: planet.name, subtitle: planet.missionTitle, image: planet.image, color: planet.colour,
        locked: isLittleMissionLocked(activeAdventure, index, isPlanetComplete),
        free: activeAdventure.id === "scribble",
        complete: isPlanetComplete(planet), onSelect: () => openPlanet(planet.id),
      }))} />

      <p className="little-grownup-note">
        Grown-ups: these little missions are made for playing together.
      </p>
    </main>
  );
}
