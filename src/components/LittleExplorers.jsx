import { useEffect, useLayoutEffect, useRef, useState } from "react";
import LocalBackButton from "./LocalBackButton";
import {
  EraserIcon,
  ScribblerStickerPicker,
  StickerShape,
} from "./Scribbler";
import { speak, stopSpeech } from "../utils/speech";
import "./LittleExplorers.css";

const LITTLE_PROGRESS_KEY = "oatle-little-explorers-progress";
const BALLOON_SESSION_KEY = "oatle-balloon-learning-session";

const BALLOON_POSITIONS = [
  { x: 20, y: 60, delay: "0s" },
  { x: 50, y: 52, delay: "-0.8s" },
  { x: 80, y: 62, delay: "-1.5s" },
];

const SHAPE_BALLOON_POSITIONS = [
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
    target: "square",
    prompt: "Pop all the squares",
    choices: ["square", "circle", "square", "triangle", "square", "rectangle"],
  },
  {
    target: "circle",
    prompt: "Pop all the circles",
    choices: ["star", "circle", "triangle", "circle", "square", "circle"],
  },
  {
    target: "triangle",
    prompt: "Pop all the triangles",
    choices: ["triangle", "rectangle", "circle", "triangle", "star", "triangle"],
    breakAfter: true,
  },
  {
    target: "rectangle",
    prompt: "Pop all the rectangles",
    choices: ["circle", "rectangle", "rectangle", "star", "triangle", "rectangle"],
  },
  {
    target: "star",
    prompt: "Pop all the stars",
    choices: ["star", "square", "circle", "star", "rectangle", "star"],
  },
];

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
  shapes: {
    kind: "shapes",
    title: "Shape Balloons",
    cardTitle: "Five Shapes",
    cardText: "Find every matching shape",
    icon: "△○□",
    progressId: "balloons-shapes-5",
    rounds: SHAPE_ROUNDS,
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
  shapes: {
    title: "Shape Balloons",
    cardTitle: "Pop the Shapes",
    cardText: "Learn five basic shapes",
    icon: "△○□",
    lessonKeys: ["shapes"],
  },
};

const BALLOON_PALETTE = ["#ff6f91", "#ffd45c", "#55c6ff"];
const SHAPE_BALLOON_PALETTE = [
  "#ff6f91", "#ffd45c", "#55c6ff", "#a875e8", "#66d17a", "#ff9f43",
];
const BALLOON_LESSON_KEYS = Object.keys(BALLOON_LESSONS);
const BALLOON_CATEGORY_KEYS = Object.keys(BALLOON_CATEGORIES);
const BALLOON_PRAISE = ["Correct!", "Amazing!", "Good job!"];

const TRAIL_PATTERNS = {
  straight: {
    title: "Straight Line",
    cardText: "Across the sky",
    icon: "➖",
    prompt: "Follow the stars in a straight line.",
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
    prompt: "Follow the zigzag stars.",
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
    prompt: "Follow the stars around the big curve.",
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
    prompt: "Follow the stars around the circle.",
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
    prompt: "Follow the spiral stars into the middle.",
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
    const saved = JSON.parse(localStorage.getItem(LITTLE_PROGRESS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function readBalloonSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(BALLOON_SESSION_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveBalloonSession(mode, round) {
  const sessions = readBalloonSessions();

  if (round === null) delete sessions[mode];
  else sessions[mode] = round;

  localStorage.setItem(BALLOON_SESSION_KEY, JSON.stringify(sessions));
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
        <p>{instruction}</p>
      </div>
    </header>
  );
}

export default function LittleExplorers({
  backLabel = "Explore",
  onBack,
  soundOn = true,
}) {
  const [screen, setScreen] = useState("map");
  const [completed, setCompleted] = useState(readProgress);
  const [popped, setPopped] = useState([]);
  const [balloonCategory, setBalloonCategory] = useState(null);
  const [balloonMode, setBalloonMode] = useState(null);
  const [balloonRound, setBalloonRound] = useState(0);
  const [wrongBalloon, setWrongBalloon] = useState(null);
  const [balloonFinished, setBalloonFinished] = useState(false);
  const [balloonBreak, setBalloonBreak] = useState(false);
  const [breakPopped, setBreakPopped] = useState([]);
  const [trailPattern, setTrailPattern] = useState(null);
  const [trailStep, setTrailStep] = useState(0);
  const [drawingColor, setDrawingColor] = useState(DRAWING_COLORS[0]);
  const [drawingTool, setDrawingTool] = useState("draw");
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickers, setStickers] = useState([]);

  const canvasRef = useRef(null);
  const activePointerRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const canvasSizedRef = useRef(false);
  const balloonTimerRef = useRef(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelector(".app")?.scrollTo(0, 0);
  }, [screen]);

  const completeActivity = (activity) => {
    setCompleted((current) => {
      if (current.includes(activity)) return current;
      const next = [...current, activity];
      localStorage.setItem(LITTLE_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!soundOn) return undefined;

    const prompts = {
      map: "Choose a little space adventure.",
      balloons: balloonBreak
        ? "Bubble break! Pop the balloons!"
        : balloonMode
          ? BALLOON_LESSONS[balloonMode].rounds[balloonRound]?.prompt
          : balloonCategory
            ? `Choose a ${BALLOON_CATEGORIES[balloonCategory].title} game.`
            : "Choose numbers, letters, colours, or shapes.",
      trail: trailPattern
        ? TRAIL_PATTERNS[trailPattern].prompt
        : "Choose a star trail pattern.",
      scribble: "Draw anything you like in space!",
    };

    const timer = window.setTimeout(() => speak(prompts[screen]), 220);

    return () => window.clearTimeout(timer);
  }, [balloonBreak, balloonCategory, balloonMode, balloonRound, screen, soundOn, trailPattern]);

  useEffect(() => () => {
    stopSpeech();
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
  }, []);

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
    setBalloonCategory(null);
    setBalloonMode(null);
    setTrailPattern(null);
    setScreen("map");
  };

  const startActivity = (activity) => {
    if (activity === "balloons") {
      setPopped([]);
      setBalloonCategory(null);
      setBalloonMode(null);
      setBalloonRound(0);
      setWrongBalloon(null);
      setBalloonFinished(false);
      setBalloonBreak(false);
      setBreakPopped([]);
    }
    if (activity === "trail") {
      setTrailPattern(null);
      setTrailStep(0);
    }
    setScreen(activity);
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

  const completeBalloonLesson = (mode) => {
    const progressId = BALLOON_LESSONS[mode].progressId;

    setCompleted((current) => {
      const next = current.includes(progressId) ? [...current] : [...current, progressId];
      const allLessonsDone = BALLOON_LESSON_KEYS.every((key) =>
        next.includes(BALLOON_LESSONS[key].progressId)
      );

      if (allLessonsDone && !next.includes("balloons")) next.push("balloons");
      localStorage.setItem(LITTLE_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const finishBalloonRound = (lesson, round) => {
    if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
    balloonTimerRef.current = window.setTimeout(() => {
      if (balloonRound === lesson.rounds.length - 1) {
        setBalloonFinished(true);
        saveBalloonSession(balloonMode, null);
        completeBalloonLesson(balloonMode);
        if (soundOn) speak(`${lesson.title} complete! Amazing!`);
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

  const chooseShapeBalloon = (choice, index) => {
    if (!balloonMode || balloonBreak || balloonFinished || popped.includes(index)) return;

    const lesson = BALLOON_LESSONS[balloonMode];
    const round = lesson.rounds[balloonRound];
    const targetCount = round.choices.filter((shape) => shape === round.target).length;
    if (popped.length >= targetCount) return;

    if (choice !== round.target) {
      setWrongBalloon(index);
      if (soundOn) speak(`That is a ${choice}. Try again.`);
      if (balloonTimerRef.current) window.clearTimeout(balloonTimerRef.current);
      balloonTimerRef.current = window.setTimeout(() => setWrongBalloon(null), 650);
      return;
    }

    const nextPopped = [...popped, index];

    setWrongBalloon(null);
    setPopped(nextPopped);
    playBoop(soundOn, balloonRound * SHAPE_BALLOON_POSITIONS.length + nextPopped.length);
    if (soundOn) {
      speak(BALLOON_PRAISE[(balloonRound + nextPopped.length - 1) % BALLOON_PRAISE.length]);
    }

    if (nextPopped.length === targetCount) finishBalloonRound(lesson, round);
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

  const showTrailMenu = () => {
    stopSpeech();
    setTrailPattern(null);
    setTrailStep(0);
  };

  const startTrailPattern = (pattern) => {
    setTrailPattern(pattern);
    setTrailStep(0);
  };

  const completeTrailPattern = (pattern) => {
    const progressId = TRAIL_PATTERNS[pattern].progressId;

    setCompleted((current) => {
      const next = current.includes(progressId) ? [...current] : [...current, progressId];
      const allPatternsDone = TRAIL_PATTERN_KEYS.every((key) =>
        next.includes(TRAIL_PATTERNS[key].progressId)
      );

      if (allPatternsDone && !next.includes("trail")) next.push("trail");
      localStorage.setItem(LITTLE_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const tapTrailStar = (index) => {
    if (!trailPattern) return;
    if (index !== trailStep) return;

    const pattern = TRAIL_PATTERNS[trailPattern];
    const next = trailStep + 1;
    setTrailStep(next);
    playBoop(soundOn, next + 1);

    if (next === pattern.stars.length) {
      completeTrailPattern(trailPattern);
      window.setTimeout(() => {
        if (soundOn) speak(`${pattern.title} complete! Well done!`);
      }, 260);
    }
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
      completeActivity("scribble");
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

    completeActivity("scribble");
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

  if (screen === "balloons") {
    if (!balloonMode) {
      const category = balloonCategory ? BALLOON_CATEGORIES[balloonCategory] : null;
      const menuKeys = category ? category.lessonKeys : BALLOON_CATEGORY_KEYS;

      return (
        <main className="little-explorers-page little-activity-page">
          <ActivityHeader
            title={category?.title || "Balloon Learning"}
            instruction={category ? "Choose where to begin." : "Choose a little learning game."}
            backLabel={category ? "Balloon games" : "Little Explorers"}
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
          title={lesson.title}
          instruction={balloonBreak ? "Celebration bubble break!" : round.prompt}
          backLabel="Balloon games"
          onBack={showBalloonCategory}
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
              <div className="balloon-learning-prompt" aria-live="polite">
                <span>Round {balloonRound + 1} of {lesson.rounds.length}</span>
                <strong>{round.prompt}</strong>
                {lesson.kind === "colours" ? (
                  <i
                    className="balloon-target-colour"
                    style={{ "--target-colour": BALLOON_COLOURS[round.target] }}
                    aria-hidden="true"
                  />
                ) : lesson.kind === "shapes" ? (
                  <span className="balloon-target-shape" aria-hidden="true">
                    <i className={`balloon-shape balloon-shape-${round.target}`} />
                  </span>
                ) : (
                  <b aria-hidden="true">{round.target}</b>
                )}
              </div>

              {round.choices.map((choice, index) => {
                const isShapeLesson = lesson.kind === "shapes";
                const positions = isShapeLesson ? SHAPE_BALLOON_POSITIONS : BALLOON_POSITIONS;
                const position = positions[index];
                const balloonColour =
                  lesson.kind === "colours"
                    ? BALLOON_COLOURS[choice]
                    : isShapeLesson
                      ? SHAPE_BALLOON_PALETTE[index]
                      : BALLOON_PALETTE[index];

                return (
                  <button
                    key={`${balloonRound}-${choice}-${index}`}
                    type="button"
                    className={`space-balloon learning-balloon ${
                      isShapeLesson ? "shape-learning-balloon" : ""
                    } ${
                      popped.includes(index) ? "popped" : ""
                    } ${wrongBalloon === index ? "wrong" : ""}`}
                    style={{
                      "--balloon-color": balloonColour,
                      "--balloon-x": `${position.x}%`,
                      "--balloon-y": `${position.y}%`,
                      "--balloon-delay": position.delay,
                    }}
                    onClick={() =>
                      isShapeLesson
                        ? chooseShapeBalloon(choice, index)
                        : chooseBalloon(choice, index)
                    }
                    disabled={popped.includes(index)}
                    aria-label={`Choose ${choice}`}
                  >
                    <span aria-hidden="true" />
                    {isShapeLesson ? (
                      <i
                        className={`balloon-shape balloon-shape-${choice}`}
                        aria-hidden="true"
                      />
                    ) : lesson.kind !== "colours" && (
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

  if (screen === "trail") {
    if (!trailPattern) {
      return (
        <main className="little-explorers-page little-activity-page">
          <ActivityHeader
            title="Star Trail Patterns"
            instruction="Choose a trail and follow its shape."
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
    const finished = trailStep === pattern.stars.length;
    const rocketPoint = pattern.stars[Math.min(trailStep, pattern.stars.length - 1)];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title={pattern.title}
          instruction="Tap the glowing stars in order and help the rocket fly."
          backLabel="Star trails"
          onBack={showTrailMenu}
        />

        <section className="star-trail-space" aria-label={`${pattern.title} star trail`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={pattern.path} />
          </svg>

          <span
            className={`trail-rocket ${finished ? "finished" : ""}`}
            style={{ "--star-x": `${rocketPoint.x}%`, "--star-y": `${rocketPoint.y}%` }}
            aria-hidden="true"
          >
            🚀
          </span>

          {pattern.stars.map((star, index) => (
            <button
              key={`${star.x}-${star.y}`}
              type="button"
              className={`trail-star ${index < trailStep ? "visited" : ""} ${index === trailStep ? "current" : ""}`}
              style={{ "--star-x": `${star.x}%`, "--star-y": `${star.y}%` }}
              onClick={() => tapTrailStar(index)}
              aria-label={index === trailStep ? "Tap the glowing star" : `Star ${index + 1}`}
            >
              ★
            </button>
          ))}

          {finished && (
            <div className="little-success-card" role="status">
              <span aria-hidden="true">🌟🚀</span>
              <strong>Star trail complete!</strong>
              <div>
                <button type="button" onClick={() => setTrailStep(0)}>
                  ↻ Again
                </button>
                <button type="button" onClick={showTrailMenu}>
                  ⭐ Trails
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (screen === "scribble") {
    return (
      <main className="little-explorers-page little-activity-page little-scribble-page">
        <ActivityHeader
          title="Magic Space Scribbler"
          instruction="Draw, erase, and add stickers to your space picture."
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
        </div>
      </main>
    );
  }

  return (
    <main className="little-explorers-page little-map-page">
      <LocalBackButton
        className="page-back-button"
        label={backLabel}
        onClick={onBack}
      />

      <header className="little-map-header">
        <p className="eyebrow">AGES 2–3 · LITTLE EXPLORERS</p>
        <h1>First Space Adventures</h1>
        <p>Big buttons, happy boops and lots of room to explore.</p>
      </header>

      <section className="little-planet-grid" aria-label="Little Explorer activities">
        <button type="button" onClick={() => startActivity("balloons")}>
          <span className="little-planet little-planet-balloon" aria-hidden="true">🎈</span>
          <strong>Learning Balloons</strong>
          <small>Numbers, letters, colours and shapes</small>
          {BALLOON_LESSON_KEYS.every((key) =>
            completed.includes(BALLOON_LESSONS[key].progressId)
          ) && <b aria-label="Completed">✓</b>}
        </button>

        <button type="button" onClick={() => startActivity("trail")}>
          <span className="little-planet little-planet-trail" aria-hidden="true">⭐</span>
          <strong>Star Trail Patterns</strong>
          <small>Five shapes for the rocket</small>
          {TRAIL_PATTERN_KEYS.every((key) =>
            completed.includes(TRAIL_PATTERNS[key].progressId)
          ) && <b aria-label="Completed">✓</b>}
        </button>

        <button type="button" onClick={() => startActivity("scribble")}>
          <span className="little-planet little-planet-scribble" aria-hidden="true">🖍️</span>
          <strong>Magic Scribbler</strong>
          <small>Draw colourful space trails</small>
          {completed.includes("scribble") && <b aria-label="Completed">✓</b>}
        </button>
      </section>

      <p className="little-grownup-note">
        Grown-ups: these tiny adventures are made for playing together.
      </p>
    </main>
  );
}
