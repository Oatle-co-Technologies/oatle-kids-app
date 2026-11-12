import { drawingToolCursor, useDrawingToolCursor } from "./drawingToolCursor";
import MissionBalloonBreak from './MissionBalloonBreak';
import WritingBackButton from "./WritingBackButton";
import { useEffect, useRef, useState } from "react";
import "./AlphabetTracingMission.css";
import { speak, stopSpeech } from "../utils/speech";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

/* ==================   TOOL ICONS
   ========================= */

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 48L18 36L43 11C45 9 48 9 50 11L53 14C55 16 55 19 53 21L28 46L16 50L14 48Z"
        fill="#FFD166"
        stroke="#333"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M39 15L49 25"
        stroke="#E85D75"
        strokeWidth="5"
      />
      <path
        d="M14 48L18 36L28 46L16 50L14 48Z"
        fill="#F4C7A1"
        stroke="#333"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M14 48L13 53L18 50"
        fill="#333"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17 49L21 36L45 12C47 10 50 10 52 12L54 14C56 16 56 19 54 21L30 45L17 49Z"
        fill="#4DA3FF"
        stroke="#263238"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M21 36L30 45"
        stroke="#263238"
        strokeWidth="3"
      />
      <path
        d="M17 49L15 54L21 51"
        fill="#263238"
      />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M35 12L51 28"
        stroke="#8B5CF6"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M32 15L49 32"
        stroke="#F28C28"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M14 50C19 49 24 46 27 42C30 38 30 34 27 31C24 28 20 28 17 31C14 34 14 38 17 41C19 43 18 46 14 50Z"
        fill="#8B5CF6"
        stroke="#333"
        strokeWidth="3"
      />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15 39L35 17C37 15 40 15 42 17L51 26C53 28 53 31 51 33L31 53H20L13 46C11 44 13 41 15 39Z"
        fill="#F5A6C8"
        stroke="#333"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M35 17L45 27L25 47L15 37L35 17Z"
        fill="#FFD6E7"
      />
      <path
        d="M25 47L31 53"
        stroke="#333"
        strokeWidth="3"
      />
    </svg>
  );
}

/* ==================   COMPONENT
   ========================= */

export default function AlphabetTracingMission({
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

  const [letterIndex, setLetterIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), LETTERS.length - 1)
  );
  const [tool, setTool] = useState("pencil");
  useDrawingToolCursor(canvasRef, tool, DEFAULT_COLOR);

  const letter = LETTERS[letterIndex];

  /* ==================     TEXT TO SPEECH
     ========================= */

  useEffect(() => {
    if (!soundOn) {
      stopSpeech();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      speak(`Trace the uppercase and lowercase ${letter}`);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [letter, soundOn]);

  /* ==================     CANVAS SETUP
     ========================= */

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();

      if (!rect.width || !rect.height) return;

      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      /*
       * The canvas is displayed in CSS pixels,
       * but rendered at device resolution for
       * crisp drawing on phones and tablets.
       */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, rect.width, rect.height);
    };

    setupCanvas();

    window.addEventListener("resize", setupCanvas);

    return () => {
      window.removeEventListener("resize", setupCanvas);
    };
  }, [letterIndex]);

  /* ==================     POINTER POSITION
     ========================= */

  function getCanvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  /* ==================     DRAW SETTINGS
     ========================= */

  function configureDrawing(ctx) {
    const currentTool = TOOLS[tool];

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.lineWidth = currentTool.size;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = currentTool.opacity;
      ctx.strokeStyle = DEFAULT_COLOR;
      ctx.lineWidth = currentTool.size;
    }
  }

  /* ==================     START DRAWING
     ========================= */

  function handlePointerDown(event) {
    event.preventDefault();

    const canvas = canvasRef.current;

    if (!canvas) return;

    if (
      activePointerIdRef.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) return;

    canvas.setPointerCapture?.(event.pointerId);
    activePointerIdRef.current = event.pointerId;

    drawingRef.current = true;

    const point = getCanvasPoint(event, canvas);

    lastPointRef.current = point;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    configureDrawing(ctx);

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);

    /*
     * Make sure a single tap creates a visible dot.
     */
    ctx.arc(
      point.x,
      point.y,
      ctx.lineWidth / 2,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = DEFAULT_COLOR;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.fill();
  }

  /* ==================     DRAWING
     ========================= */

  function handlePointerMove(event) {
    event.preventDefault();

    if (
      !drawingRef.current ||
      event.pointerId !== activePointerIdRef.current
    ) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const point = getCanvasPoint(event, canvas);

    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      lastPointRef.current = point;
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    configureDrawing(ctx);

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastPointRef.current = point;
  }

  /* ==================     STOP DRAWING
     ========================= */

  function handlePointerUp(event) {
    event.preventDefault();

    if (event.pointerId !== activePointerIdRef.current) return;

    drawingRef.current = false;
    lastPointRef.current = null;
    activePointerIdRef.current = null;

    if (event?.pointerId != null) {
      try {
        canvasRef.current?.releasePointerCapture?.(
          event.pointerId
        );
      } catch {
        // Pointer capture may already be released.
      }
    }
  }

  /* ==================     NEXT LETTER
     ========================= */

  const handlePrevious = () => {
    if (letterIndex === 0) return;
    const previous = letterIndex - 1;
    setLetterIndex(previous);
    onProgress?.(previous);
  };

  function handleNext() {
    /*
     * Last letter: Z
     * Finish the mission.
     */
    if (letterIndex === LETTERS.length - 1) {
      onComplete?.();
      return;
    }

    /*
     * Move to the next letter.
     */
    const next = letterIndex + 1;
    setLetterIndex(next);
    onProgress?.(next);

    /*
     * The canvas is cleared automatically when
     * the new letter is rendered.
     */
  }

  /* ==================     TOOL
     ========================= */

  function selectTool(nextTool) {
    setTool(nextTool);
  }

  /* ==================     RENDER
     ========================= */

  return (
    <div className="alphabet-tracing-mission">
      <MissionBalloonBreak step={letterIndex} total={LETTERS.length} soundOn={soundOn} resumePrompt={`Trace the uppercase and lowercase ${letter}`} />

      {/* ==================          HEADER
         ========================= */}

      <div className="alphabet-mission-header">

        <WritingBackButton onBack={onBack} />

        <div className="alphabet-mission-title">

          <div className="alphabet-mission-kicker">
            Writing Mission 1
          </div>

          <h1>
            Trace the Alphabet
          </h1>

        </div>

        <div className="alphabet-mission-progress">
          {letter} / 26
        </div>

      </div>

      {/* ==================          CONTENT
         ========================= */}

      <main className="alphabet-mission-content">

        <div className="alphabet-paper-area">

          {/* ==================              PAPER
             ========================= */}

          <div className="alphabet-paper">

            {/* ==================                TRACING LETTERS
               ========================= */}

            <div className="alphabet-target-display">

              <div className="alphabet-uppercase">
                {letter}
              </div>

              <div className="alphabet-lowercase">
                {letter.toLowerCase()}
              </div>

            </div>

            {/* ==================                CHILD DRAWING CANVAS
               ========================= */}

            <canvas
              ref={canvasRef}
              style={drawingToolCursor(tool, DEFAULT_COLOR)}
              className="alphabet-tracing-canvas"

              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}

              onContextMenu={(event) => {
                event.preventDefault();
              }}
            />


            {/* ==================                NEXT BUTTON
               ========================= */}

            <button
              type="button"
              className="alphabet-next-button alphabet-previous-button"
              onClick={handlePrevious}
              disabled={letterIndex === 0}
              aria-label="Previous letter"
            >
              ←
            </button>

            <button
              type="button"
              className="alphabet-next-button"
              onClick={handleNext}
              aria-label={
                letterIndex === LETTERS.length - 1
                  ? "Finish"
                  : "Next letter"
              }
            >
              →
            </button>

          </div>

            {/* ==================                TOOLS
               ========================= */}

            <aside
              className="alphabet-tool-bar"
              aria-label="Writing tools"
            >

              {/* Pencil */}

              <button
                type="button"
                className={`alphabet-tool ${
                  tool === "pencil"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectTool("pencil")
                }
                aria-label="Pencil"
              >
                <PencilIcon />
              </button>

              {/* Brush */}

              <button
                type="button"
                className={`alphabet-tool ${
                  tool === "brush"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectTool("brush")
                }
                aria-label="Paintbrush"
              >
                <BrushIcon />
              </button>

              {/* Pen */}

              <button
                type="button"
                className={`alphabet-tool ${
                  tool === "pen"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectTool("pen")
                }
                aria-label="Pen"
              >
                <PenIcon />
              </button>

              {/* Eraser */}

              <button
                type="button"
                className={`alphabet-tool ${
                  tool === "eraser"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectTool("eraser")
                }
                aria-label="Eraser"
              >
                <EraserIcon />
              </button>

            </aside>

          {/* ==================              INSTRUCTION
             ========================= */}

          <div className="alphabet-mission-hint">
            Trace the big letter and the little letter.
          </div>

        </div>

      </main>

      {/* ==================          PORTRAIT MESSAGE
         ========================= */}

      <div className="alphabet-portrait-message">

        <div className="alphabet-portrait-icon">
          ↔
        </div>

        <h2>
          Turn your device upright
        </h2>

        <p>
          This writing adventure works in portrait mode.
        </p>

      </div>

    </div>
  );
}
