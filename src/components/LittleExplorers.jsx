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

const BREAK_BALLOONS = [
  { id: 1, color: "#ff6f91", x: 14, y: 35, delay: "0s" },
  { id: 2, color: "#ffd45c", x: 36, y: 62, delay: "-0.8s" },
  { id: 3, color: "#55c6ff", x: 58, y: 38, delay: "-1.5s" },
  { id: 4, color: "#a875e8", x: 82, y: 61, delay: "-2.1s" },
  { id: 5, color: "#66d17a", x: 27, y: 40, delay: "-0.4s" },
  { id: 6, color: "#ff9f43", x: 72, y: 43, delay: "-1.1s" },
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
const BALLOON_LESSON_KEYS = Object.keys(BALLOON_LESSONS);
const BALLOON_CATEGORY_KEYS = Object.keys(BALLOON_CATEGORIES);
const BALLOON_PRAISE = ["Correct!", "Amazing!", "Good job!"];

const TRAIL_STARS = [
  { x: 10, y: 72 },
  { x: 26, y: 45 },
  { x: 43, y: 64 },
  { x: 61, y: 34 },
  { x: 78, y: 51 },
  { x: 91, y: 20 },
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
            : "Choose numbers, letters, or colours.",
      trail: "Tap the glowing stars and help the rocket fly!",
      scribble: "Draw anything you like in space!",
    };

    const timer = window.setTimeout(() => speak(prompts[screen]), 220);

    return () => window.clearTimeout(timer);
  }, [balloonBreak, balloonCategory, balloonMode, balloonRound, screen, soundOn]);

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
    if (activity === "trail") setTrailStep(0);
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

  const continueBalloonLesson = () => {
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

  const tapTrailStar = (index) => {
    if (index !== trailStep) return;

    const next = trailStep + 1;
    setTrailStep(next);
    playBoop(soundOn, next + 1);

    if (next === TRAIL_STARS.length) {
      completeActivity("trail");
      window.setTimeout(() => {
        if (soundOn) speak("The rocket found every star! Well done!");
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
      return (
        <main className="little-explorers-page little-activity-page">
          <ActivityHeader
            title="Balloon Learning"
            instruction="Choose a little learning game."
            onBack={showMap}
          />

          <section className="balloon-space balloon-lesson-menu" aria-label="Balloon learning games">
            <div className="balloon-lesson-grid">
              {BALLOON_LESSON_KEYS.map((mode) => {
                const lesson = BALLOON_LESSONS[mode];
                const isComplete = completed.includes(lesson.progressId);

                return (
                  <button key={mode} type="button" onClick={() => startBalloonLesson(mode)}>
                    <span aria-hidden="true">{lesson.icon}</span>
                    <strong>{lesson.cardTitle}</strong>
                    <small>{lesson.cardText}</small>
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
          instruction={round.prompt}
          backLabel="Balloon games"
          onBack={showBalloonMenu}
        />

        <section className="balloon-space balloon-learning-space" aria-label={lesson.title}>
          <div className="balloon-learning-prompt" aria-live="polite">
            <span>Round {balloonRound + 1} of {lesson.rounds.length}</span>
            <strong>{round.prompt}</strong>
            {balloonMode === "colours" ? (
              <i
                className="balloon-target-colour"
                style={{ "--target-colour": BALLOON_COLOURS[round.target] }}
                aria-hidden="true"
              />
            ) : (
              <b aria-hidden="true">{round.target}</b>
            )}
          </div>

          {round.choices.map((choice, index) => {
            const position = BALLOON_POSITIONS[index];
            const balloonColour =
              balloonMode === "colours"
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
                {balloonMode !== "colours" && (
                  <strong className="balloon-choice-label" aria-hidden="true">
                    {choice}
                  </strong>
                )}
              </button>
            );
          })}

          {balloonFinished && (
            <div className="little-success-card" role="status">
              <span aria-hidden="true">🎈✨</span>
              <strong>{lesson.title} complete!</strong>
              <div>
                <button type="button" onClick={() => startBalloonLesson(balloonMode)}>
                  ↻ Again
                </button>
                <button type="button" onClick={showBalloonMenu}>
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
    const finished = trailStep === TRAIL_STARS.length;
    const rocketPoint = TRAIL_STARS[Math.min(trailStep, TRAIL_STARS.length - 1)];

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title="Follow the Star Trail"
          instruction="Tap the glowing star and help the rocket fly."
          onBack={showMap}
        />

        <section className="star-trail-space" aria-label="Star trail">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M10 72 C20 25 35 80 48 55 S72 20 91 20" />
          </svg>

          <span
            className={`trail-rocket ${finished ? "finished" : ""}`}
            style={{ "--star-x": `${rocketPoint.x}%`, "--star-y": `${rocketPoint.y}%` }}
            aria-hidden="true"
          >
            🚀
          </span>

          {TRAIL_STARS.map((star, index) => (
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
                <button type="button" onClick={showMap}>
                  🪐 Map
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
          <small>Numbers, letters and colours</small>
          {BALLOON_LESSON_KEYS.every((key) =>
            completed.includes(BALLOON_LESSONS[key].progressId)
          ) && <b aria-label="Completed">✓</b>}
        </button>

        <button type="button" onClick={() => startActivity("trail")}>
          <span className="little-planet little-planet-trail" aria-hidden="true">⭐</span>
          <strong>Star Trail</strong>
          <small>Tap and help the rocket</small>
          {completed.includes("trail") && <b aria-label="Completed">✓</b>}
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
