import { drawingToolCursor } from "./drawingToolCursor";
import { useEffect, useRef, useState } from "react";

import "./AlphabetTracingMission.css";
import { speak, stopSpeech } from "../utils/speech";

const NUMBERS = Array.from({ length: 21 }, (_, index) => index);

const DEFAULT_COLOR = "#000000";

const TOOLS = {
  pencil: {
    size: 3,
    opacity: 0.85,
  },
  pen: {
    size: 5,
    opacity: 1,
  },
  brush: {
    size: 10,
    opacity: 0.8,
  },
  eraser: {
    size: 24,
    opacity: 1,
  },
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M13 34.5 11 39l4.5-2L35 17.5 30.5 13 13 34.5Z"
        fill="#F6C453"
      />
      <path
        d="m30.5 13 4.5 4.5"
        stroke="#E58B8B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="m11 39 2-4.5"
        stroke="#333"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m30.5 13 2.2-2.2a2.5 2.5 0 0 1 3.5 0l1 1a2.5 2.5 0 0 1 0 3.5L35 17.5"
        fill="#E58B8B"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="m15 35 2.5-7L31 14.5l5.5 5.5L23 34.5 15 35Z"
        fill="#4D9FD1"
      />
      <path
        d="m31 14.5 2-2a2.8 2.8 0 0 1 4 0l1.5 1.5a2.8 2.8 0 0 1 0 4l-2 2"
        fill="#2F78AA"
      />
      <path
        d="m15 35 7.5-.5"
        stroke="#333"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="m13 35 6-5 14-14 5 5-14 14-7 2-4 2 0-4Z"
        fill="#9A72C9"
      />
      <path
        d="m19 30-5-5 7-7 5 5-7 7Z"
        fill="#E59B62"
      />
      <path
        d="m12 39 4-2"
        stroke="#333"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="m14 29 13-13a4 4 0 0 1 5.7 0l5.3 5.3a4 4 0 0 1 0 5.7L27 38H18l-4-4a3.5 3.5 0 0 1 0-5Z"
        fill="#F39AB5"
      />
      <path
        d="m14 29 9 9"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 38h9"
        stroke="#333"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToolIcon({ type }) {
  if (type === "pencil") return <PencilIcon />;
  if (type === "pen") return <PenIcon />;
  if (type === "brush") return <BrushIcon />;
  return <EraserIcon />;
}

export default function NumberTracingMission({
  onBack,
  onComplete,
  initialStep = 0,
  onProgress,
  soundOn = true,
}) {
  const canvasRef = useRef(null);

  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const activePointerIdRef = useRef(null);

  const [numberIndex, setNumberIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), NUMBERS.length - 1)
  );
  const [tool, setTool] = useState("pencil");

  const currentNumber = NUMBERS[numberIndex];

  /* =========================
     TEXT TO SPEECH
     ========================= */

  useEffect(() => {
    if (!soundOn) {
      stopSpeech();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      speak(`Trace the number ${currentNumber}`);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [currentNumber, soundOn]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    let frameId;

    const setupCanvas = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();

        // The activity is hidden while the phone is in landscape.
        // Wait until it is visible instead of locking in a 1px canvas.
        if (!rect.width || !rect.height) return;

        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);

        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
      });
    };

    const observer = new ResizeObserver(setupCanvas);
    observer.observe(canvas);
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    window.addEventListener("orientationchange", setupCanvas);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", setupCanvas);
      window.removeEventListener("orientationchange", setupCanvas);
    };
  }, [currentNumber]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;

    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    if (
      activePointerIdRef.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) return;

    drawingRef.current = true;
    activePointerIdRef.current = event.pointerId;

    lastPointRef.current = getPoint(event);

    canvas.setPointerCapture?.(event.pointerId);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const settings = TOOLS[tool];
    ctx.save();
    ctx.globalAlpha = tool === "eraser" ? 1 : settings.opacity;
    ctx.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";
    ctx.fillStyle = DEFAULT_COLOR;
    ctx.beginPath();
    ctx.arc(
      lastPointRef.current.x,
      lastPointRef.current.y,
      settings.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  };

  const draw = (event) => {
    if (
      !drawingRef.current ||
      event.pointerId !== activePointerIdRef.current
    ) return;

    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const point = getPoint(event);
    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      lastPointRef.current = point;
      return;
    }

    const settings = TOOLS[tool];

    ctx.save();

    ctx.globalAlpha = settings.opacity;

    ctx.lineWidth = settings.size;

    ctx.lineCap = "round";

    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = DEFAULT_COLOR;
    }

    ctx.beginPath();

    ctx.moveTo(lastPoint.x, lastPoint.y);

    ctx.lineTo(point.x, point.y);

    ctx.stroke();

    ctx.restore();

    lastPointRef.current = point;
  };

  const stopDrawing = (event) => {
    if (event.pointerId !== activePointerIdRef.current) return;

    drawingRef.current = false;

    lastPointRef.current = null;
    activePointerIdRef.current = null;

    const canvas = canvasRef.current;

    if (canvas && event?.pointerId != null) {
      try {
        canvas.releasePointerCapture?.(event.pointerId);
      } catch {
        // The browser may already have released capture during rotation.
      }
    }
  };

  const handleNext = () => {
    if (numberIndex === NUMBERS.length - 1) {
      onComplete?.();
      return;
    }

    setNumberIndex((current) => {
      const next = current + 1;
      onProgress?.(next);
      return next;
    });
  };

  return (
    <div className="alphabet-tracing-mission number-tracing-mission">

      <div className="alphabet-portrait-message">
        <div className="alphabet-portrait-title">
          Turn your device upright
        </div>

        <div className="alphabet-portrait-subtitle">
          This writing adventure works in portrait mode.
        </div>
      </div>

      <header className="alphabet-mission-header">

        <button
          type="button"
          className="alphabet-back-button"
          onClick={onBack}
          aria-label="Go back"
        >
          ←
        </button>

        <div className="alphabet-mission-title">

          <span>Writing Mission 2</span>

          <strong>Trace Numbers</strong>

        </div>

        <div className="alphabet-mission-progress">
          {currentNumber} / 20
        </div>

      </header>

      <main className="alphabet-mission-content">

        <div className="alphabet-paper-area">

          <div className="alphabet-paper">

            <div className="alphabet-target-display">
              <div className="alphabet-uppercase">
                {currentNumber}
              </div>
            </div>

            <canvas
              ref={canvasRef}
              style={drawingToolCursor(tool, DEFAULT_COLOR)}
              className="alphabet-tracing-canvas"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
            />

            <button
              type="button"
              className="alphabet-next-button"
              onClick={handleNext}
              aria-label={
                numberIndex === NUMBERS.length - 1
                  ? "Complete mission"
                  : "Next number"
              }
            >
              →
            </button>

          </div>

          <aside
            className="alphabet-tool-bar"
            aria-label="Writing tools"
          >
            {["pencil", "brush", "pen", "eraser"].map((toolName) => (
              <button
                key={toolName}
                type="button"
                className={`alphabet-tool ${
                  tool === toolName ? "selected" : ""
                }`}
                onClick={() => setTool(toolName)}
                aria-label={toolName}
              >
                <ToolIcon type={toolName} />
              </button>
            ))}
          </aside>

          <div className="alphabet-mission-hint">
            Trace the number.
          </div>

        </div>

      </main>

    </div>
  );
}
