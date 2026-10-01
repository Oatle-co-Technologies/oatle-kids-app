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

const BALLOONS = [
  { id: 1, color: "#ff6f91", x: 13, y: 18, delay: "0s" },
  { id: 2, color: "#ffd45c", x: 42, y: 10, delay: "-0.8s" },
  { id: 3, color: "#55c6ff", x: 72, y: 20, delay: "-1.5s" },
  { id: 4, color: "#a875e8", x: 23, y: 57, delay: "-2.1s" },
  { id: 5, color: "#66d17a", x: 55, y: 51, delay: "-0.4s" },
  { id: 6, color: "#ff9f43", x: 80, y: 62, delay: "-1.1s" },
];

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

function ActivityHeader({ title, instruction, onBack }) {
  return (
    <header className="little-activity-header">
      <LocalBackButton
        className="page-back-button little-activity-back"
        label="Little Explorers"
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
      balloons: "Boop all the space balloons!",
      trail: "Tap the glowing stars and help the rocket fly!",
      scribble: "Draw anything you like in space!",
    };

    const timer = window.setTimeout(() => speak(prompts[screen]), 220);

    return () => window.clearTimeout(timer);
  }, [screen, soundOn]);

  useEffect(() => () => stopSpeech(), []);

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
    setScreen("map");
  };

  const startActivity = (activity) => {
    if (activity === "balloons") setPopped([]);
    if (activity === "trail") setTrailStep(0);
    setScreen(activity);
  };

  const popBalloon = (balloonId) => {
    if (popped.includes(balloonId)) return;

    const next = [...popped, balloonId];
    setPopped(next);
    playBoop(soundOn, next.length);

    if (next.length === BALLOONS.length) {
      completeActivity("balloons");
      window.setTimeout(() => {
        if (soundOn) speak("You booped them all! Amazing!");
      }, 260);
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
    const finished = popped.length === BALLOONS.length;

    return (
      <main className="little-explorers-page little-activity-page">
        <ActivityHeader
          title="Boop the Balloons"
          instruction="Tap every balloon and make it go boop!"
          onBack={showMap}
        />

        <section className="balloon-space" aria-label="Space balloons">
          {BALLOONS.map((balloon) => (
            <button
              key={balloon.id}
              type="button"
              className={`space-balloon ${popped.includes(balloon.id) ? "popped" : ""}`}
              style={{
                "--balloon-color": balloon.color,
                "--balloon-x": `${balloon.x}%`,
                "--balloon-y": `${balloon.y}%`,
                "--balloon-delay": balloon.delay,
              }}
              onClick={() => popBalloon(balloon.id)}
              disabled={popped.includes(balloon.id)}
              aria-label={`Pop balloon ${balloon.id}`}
            >
              <span aria-hidden="true" />
            </button>
          ))}

          {finished && (
            <div className="little-success-card" role="status">
              <span aria-hidden="true">🚀✨</span>
              <strong>Amazing boops!</strong>
              <div>
                <button type="button" onClick={() => setPopped([])}>
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
          <strong>Boop the Balloons</strong>
          <small>Tap, pop and giggle</small>
          {completed.includes("balloons") && <b aria-label="Completed">✓</b>}
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
