import { drawingToolCursor } from "./drawingToolCursor";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./Scribbler.css";
import "./SentenceWritingMission.css";
import { speak, stopSpeech } from "../utils/speech";

const SENTENCES = [
  {
    id: "name",
    build: ({ name }) =>
      name ? `My name is ${name}.` : "My name is ___.",
  },
  {
    id: "age",
    build: ({ age }) =>
      age ? `I am ${age} years old.` : "I am ___ years old.",
  },
  {
    id: "colour",
    build: ({ favouriteColour }) =>
      favouriteColour
        ? `I like ${favouriteColour}.`
        : "I like ___.",
  },
  {
    id: "siblings",
    build: ({ siblings }) => {
      if (siblings === "" || siblings == null) {
        return "I have ___ siblings.";
      }

      const count = Number(siblings);

      if (count === 0) return "I have no siblings.";
      if (count === 1) return "I have 1 sibling.";

      return `I have ${count} siblings.`;
    },
  },
];

const TOOLS = {
  pencil: { size: 3, opacity: 0.85 },
  pen: { size: 5, opacity: 1 },
  brush: { size: 10, opacity: 0.8 },
  eraser: { size: 18, opacity: 1 },
};

const FONT_FAMILY = '"Andika", "Comic Sans MS", "Chalkboard SE", sans-serif';
const DEFAULT_COLOR = "#000000";

/*
  Each workbook row has three guides:
  top line
  middle line
  baseline

  The sentence is drawn only in the first row. The rest of the
  paper stays available as additional preschool writing rows.
*/
const ROWS = 3;
const MAX_SENTENCE_LINES = ROWS;
const MEASUREMENT_FONT_SIZE = 100;

function measureSentence(text, context) {
  if (!context) {
    return Math.max(1, text.length * MEASUREMENT_FONT_SIZE * 0.58);
  }

  context.font = `700 ${MEASUREMENT_FONT_SIZE}px ${FONT_FAMILY}`;
  return Math.max(1, context.measureText(text).width);
}

function balanceSentenceWords(words, lineCount, context) {
  if (lineCount <= 1 || words.length <= 1) {
    return [words.join(" ")];
  }

  const wordCount = words.length;
  const costs = Array.from({ length: lineCount + 1 }, () =>
    Array(wordCount + 1).fill(Number.POSITIVE_INFINITY)
  );
  const breaks = Array.from({ length: lineCount + 1 }, () =>
    Array(wordCount + 1).fill(-1)
  );

  costs[0][0] = 0;

  for (let lines = 1; lines <= lineCount; lines += 1) {
    for (let end = lines; end <= wordCount; end += 1) {
      for (let start = lines - 1; start < end; start += 1) {
        if (!Number.isFinite(costs[lines - 1][start])) continue;

        const line = words.slice(start, end).join(" ");
        const width = measureSentence(line, context);
        const cost = Math.max(costs[lines - 1][start], width);

        if (cost < costs[lines][end]) {
          costs[lines][end] = cost;
          breaks[lines][end] = start;
        }
      }
    }
  }

  const lines = [];
  let end = wordCount;

  for (let lineIndex = lineCount; lineIndex > 0; lineIndex -= 1) {
    const start = breaks[lineIndex][end];
    if (start < 0) return [words.join(" ")];
    lines.unshift(words.slice(start, end).join(" "));
    end = start;
  }

  return lines;
}

function createSentenceLayout(sentence, width, height) {
  const words = sentence.trim().split(/\s+/).filter(Boolean);

  if (!words.length || width <= 0 || height <= 0) {
    return { lines: [sentence], fontSize: 64 };
  }

  const measurementCanvas = document.createElement("canvas");
  const context = measurementCanvas.getContext("2d");
  const usableWidth = Math.max(1, width * 0.9);
  const rowHeight = Math.max(1, (height * 0.88) / ROWS);
  const heightLimit = Math.min(120, rowHeight * 0.78);
  const possibleLineCounts = Math.min(MAX_SENTENCE_LINES, words.length);

  let best = null;

  for (let lineCount = 1; lineCount <= possibleLineCounts; lineCount += 1) {
    const lines = balanceSentenceWords(words, lineCount, context);
    const widestLine = Math.max(
      ...lines.map((line) => measureSentence(line, context))
    );
    const widthLimit =
      (usableWidth * MEASUREMENT_FONT_SIZE) / Math.max(1, widestLine);
    const fontSize = Math.max(8, Math.min(heightLimit, widthLimit));

    if (
      !best ||
      fontSize > best.fontSize + 1 ||
      (Math.abs(fontSize - best.fontSize) <= 1 && lines.length < best.lines.length)
    ) {
      best = { lines, fontSize };
    }
  }

  return {
    lines: best?.lines || [sentence],
    fontSize: Math.round((best?.fontSize || 64) * 10) / 10,
  };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m5.5 17.5-1 3 3-1L18 9l-3-3z" fill="#ffd45c" />
      <path d="m15 6 3 3" stroke="#e98d9f" strokeWidth="2.2" />
      <path d="m4.5 20.5 3-1" stroke="#202020" strokeWidth="1.3" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.2 18.2 16.5 4.9l2.6 2.6-9.3 13.3-4 1.4-4 1.4z" fill="#55c6ff" />
      <path d="m16.5 4.9 1.1-1.1a1.7 1.7 0 0 1 2.4 0l.2.2a1.7 1.7 0 0 1 0 2.4l-1.1 1.1z" fill="#234a8a" />
      <path d="m7.2 18.2-1.4 4 4-1.4z" fill="#202020" />
      <path d="m9.3 17.1 2.6 1.8" stroke="#fff" strokeWidth="1.2" opacity=".6" />
    </svg>
  );
}

function BrushIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m14.5 3.5 6 6-8.3 8.3-6-6z" fill="#a875e8" />
      <path d="m6.1 11.8 6 6-2.5 2.5-6-6z" fill="#ff9f43" />
      <path d="M3.6 14.3c-2 2-1.7 5.1.5 6.1 1-.1 2.4-.7 3.5-2.1z" fill="#ffd45c" />
      <path d="m14.5 3.5 6 6" stroke="#fff" strokeWidth="1.2" opacity=".5" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="m6.5 15.5 7.9-7.9a2.2 2.2 0 0 1 3.1 0l2.9 2.9a2.2 2.2 0 0 1 0 3.1l-7.9 7.9H8.2l-2.2-2.2a2.7 2.7 0 0 1 .5-3.8Z"
        fill="currentColor"
      />
      <path
        d="m11.2 20.5 5.5-5.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity=".75"
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

export default function SentenceWritingMission({
  onBack,
  onComplete,
  childProfile,
  initialStep = 0,
  onProgress,
  soundOn = true,
}) {
  const canvasRef = useRef(null);
  const targetCanvasRef = useRef(null);
  const guideDisplayRef = useRef(null);
  const writingAreaRef = useRef(null);

  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const completedRef = useRef(false);
  const hasDrawingRef = useRef(false);

  const [sentenceIndex, setSentenceIndex] = useState(() =>
    Math.min(Math.max(initialStep, 0), SENTENCES.length - 1)
  );
  const [tool, setTool] = useState("pencil");
  const [progress, setProgress] = useState(0);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [sentenceLayout, setSentenceLayout] = useState({
    lines: [""],
    fontSize: 64,
  });

  const profile = childProfile || {};
  const current = SENTENCES[sentenceIndex];
  const sentence = current.build(profile);
  const sentenceLayoutKey = `${sentenceLayout.fontSize}:${sentenceLayout.lines.join("|")}`;

  useLayoutEffect(() => {
    const writingArea = writingAreaRef.current;
    if (!writingArea) return undefined;

    let frameId;

    const updateLayout = () => {
      if (frameId) window.cancelAnimationFrame(frameId);

      frameId = window.requestAnimationFrame(() => {
        const rect = writingArea.getBoundingClientRect();
        const nextLayout = createSentenceLayout(
          sentence,
          rect.width,
          rect.height
        );

        setSentenceLayout((currentLayout) => {
          const currentKey = `${currentLayout.fontSize}:${currentLayout.lines.join("|")}`;
          const nextKey = `${nextLayout.fontSize}:${nextLayout.lines.join("|")}`;
          return currentKey === nextKey ? currentLayout : nextLayout;
        });
      });
    };

    const observer = new ResizeObserver(updateLayout);
    observer.observe(writingArea);
    updateLayout();

    document.fonts?.ready.then(updateLayout).catch(() => {});

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [sentence]);

  useEffect(() => {
    if (!soundOn) {
      stopSpeech();
      return undefined;
    }

    const timer = window.setTimeout(() => {
      speak("Trace the sentence");
    }, 250);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [sentence, soundOn]);

  const getCanvasPoint = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  /*
    The visible sentence guide is HTML, just like the Alphabet
    tracing activity. This means the uppercase/lowercase geometry
    is controlled by CSS instead of being approximated inside canvas.
  */
  const renderSentenceCharacters = () => {
    return sentenceLayout.lines.map((line, lineIndex) => (
      <div
        className="sentence-target-line"
        key={`${line}-${lineIndex}`}
      >
        {[...line].map((character, characterIndex) => {
          const isUppercase =
            character !== character.toLowerCase() &&
            character === character.toUpperCase();

          const className = isUppercase
            ? "sentence-uppercase"
            : "sentence-lowercase";

          return (
            <span
              key={`${character}-${characterIndex}`}
              className={className}
              aria-hidden="true"
            >
              {character === " " ? "\u00A0" : character}
            </span>
          );
        })}
      </div>
    ));
  };

  /*
    The target canvas mirrors the actual HTML guide positions.
    We read each rendered character's DOM rectangle and font,
    then paint the same glyph into the hidden tracing mask.
  */
  const prepareTargetCanvas = () => {
    const drawingCanvas = canvasRef.current;
    const targetCanvas = targetCanvasRef.current;
    const guideDisplay = guideDisplayRef.current;

    if (!drawingCanvas || !targetCanvas || !guideDisplay) return;

    const rect = drawingCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    targetCanvas.width = width;
    targetCanvas.height = height;

    const targetCtx = targetCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!targetCtx) return;

    targetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    targetCtx.clearRect(0, 0, rect.width, rect.height);
    targetCtx.fillStyle = "#000000";
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "alphabetic";

    const characters = guideDisplay.querySelectorAll(
      ".sentence-uppercase, .sentence-lowercase"
    );

    characters.forEach((element) => {
      const character = element.textContent || "";
      if (!character || character === "\u00A0") return;

      const elementRect = element.getBoundingClientRect();
      const computed = window.getComputedStyle(element);

      const fontSize = parseFloat(computed.fontSize) || 170;
      const fontWeight = computed.fontWeight || "700";
      const fontFamily = computed.fontFamily || FONT_FAMILY;
      targetCtx.font =
        `${fontWeight} ${fontSize}px ${fontFamily}`;

      /*
        The HTML element's top/height is the source of truth.
        Use its actual bounding box so the hidden target follows
        the CSS geometry exactly.
      */
      const x =
        elementRect.left -
        rect.left +
        elementRect.width / 2;

      const top =
        elementRect.top -
        rect.top;

      const metrics = targetCtx.measureText(character);

      const ascent =
        metrics.actualBoundingBoxAscent ||
        fontSize * 0.75;

      /*
        The glyph is drawn so its top aligns with the top of the
        corresponding CSS handwriting block.
      */
      const baseline =
        top + ascent;

      targetCtx.fillText(character, x, baseline);
    });
  };

  const prepareCanvases = () => {
    const drawingCanvas = canvasRef.current;
    const targetCanvas = targetCanvasRef.current;

    if (!drawingCanvas || !targetCanvas) return;

    const rect = drawingCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    drawingCanvas.width = width;
    drawingCanvas.height = height;

    const drawingCtx = drawingCanvas.getContext("2d");
    if (drawingCtx) {
      drawingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    requestAnimationFrame(() => {
      prepareTargetCanvas();
    });
  };

  useEffect(() => {
    let frameId;

    const setup = () => {
      if (frameId) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        prepareCanvases();
      });
    };

    setup();
    window.addEventListener("resize", setup);
    window.addEventListener("orientationchange", setup);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", setup);
      window.removeEventListener("orientationchange", setup);
    };
  }, [sentenceIndex, sentenceLayoutKey]);

  const coverageReached = () => {
    const drawingCanvas = canvasRef.current;
    const targetCanvas = targetCanvasRef.current;
    if (!drawingCanvas || !targetCanvas) return 0;

    const targetCtx = targetCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const drawingCtx = drawingCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!targetCtx || !drawingCtx) return 0;

    const target = targetCtx.getImageData(
      0, 0, targetCanvas.width, targetCanvas.height
    ).data;
    const drawing = drawingCtx.getImageData(
      0, 0, drawingCanvas.width, drawingCanvas.height
    ).data;

    let targetPixels = 0;
    let coveredPixels = 0;

    for (let i = 3; i < target.length; i += 12) {
      if (target[i] > 0) {
        targetPixels += 1;
        if (drawing[i] > 25 || drawing[i - 1] > 25 || drawing[i - 2] > 25) {
          coveredPixels += 1;
        }
      }
    }

    return targetPixels ? coveredPixels / targetPixels : 0;
  };

  const drawPoint = (point) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const currentTool = TOOLS[tool];
    context.save();

    if (tool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.globalAlpha = 1;
    } else {
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = currentTool.opacity;
      context.strokeStyle = DEFAULT_COLOR;
      context.fillStyle = DEFAULT_COLOR;
    }

    context.lineWidth = currentTool.size;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.arc(point.x, point.y, currentTool.size / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const drawLine = (from, to) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const currentTool = TOOLS[tool];
    context.save();

    if (tool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.globalAlpha = 1;
    } else {
      context.globalCompositeOperation = "source-over";
      context.globalAlpha = currentTool.opacity;
      context.strokeStyle = DEFAULT_COLOR;
    }

    context.lineWidth = currentTool.size;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.restore();
  };

  const checkTracingProgress = () => {
    if (completedRef.current) return;

    const coverage = coverageReached();
    setProgress(Math.min(100, Math.round(coverage * 100)));

    if (coverage >= 0.28) {
      setProgress(100);
    }
  };

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current;
    if (!canvas || completedRef.current) return;

    if (
      activePointerIdRef.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) return;

    event.preventDefault();
    canvas.setPointerCapture?.(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    drawingRef.current = true;

    const point = getCanvasPoint(event, canvas);
    lastPointRef.current = point;
    drawPoint(point);
    hasDrawingRef.current = true;
    setHasDrawing(true);
    setProgress(100);
  };

  const handlePointerMove = (event) => {
    if (
      !drawingRef.current ||
      event.pointerId !== activePointerIdRef.current
    ) return;
    event.preventDefault();

    const events = event.getCoalescedEvents
      ? event.getCoalescedEvents()
      : [event];

    events.forEach((coalescedEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(coalescedEvent, canvas);
      const lastPoint = lastPointRef.current;

      if (!lastPoint) {
        lastPointRef.current = point;
        return;
      }

      drawLine(lastPoint, point);
      lastPointRef.current = point;
    });

    if (hasDrawingRef.current) {
      setProgress(100);
    }
  };

  const releasePointer = (event) => {
    event.preventDefault();

    if (event.pointerId !== activePointerIdRef.current) return;

    drawingRef.current = false;
    lastPointRef.current = null;
    activePointerIdRef.current = null;

    const canvas = canvasRef.current;
    if (
      canvas &&
      event?.pointerId != null &&
      canvas.hasPointerCapture?.(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }

    checkTracingProgress();
  };

  const clearWritingCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    hasDrawingRef.current = false;
    setHasDrawing(false);
    setProgress(0);
  };

  const handleNext = () => {
    if (!hasDrawingRef.current) return;

    if (sentenceIndex === SENTENCES.length - 1) {
      onComplete?.();
      return;
    }

    clearWritingCanvas();
    setSentenceIndex((index) => {
      const next = index + 1;
      onProgress?.(next);
      return next;
    });
  };

  return (
    <main className="scribbler-page sentence-writing-page">
      <div className="sentence-portrait-message" aria-live="polite">
        <strong>Landscape gives you more writing space</strong>
        <span>You can continue here, or turn your device for the best experience.</span>
      </div>

      <header className="sentence-writing-header">
        <button
          className="scribbler-back"
          type="button"
          onClick={onBack}
          aria-label="Back to Writing Map"
        >
          ← Back
        </button>

        <div>
          <span>Writing Mission 4</span>
          <h1>Write Sentences</h1>
        </div>

        <div className="sentence-writing-progress">
          {sentenceIndex + 1} / {SENTENCES.length} · {progress}%
        </div>
      </header>

      <section className="scribbler-paper sentence-writing-paper">
        <div className="sentence-writing-content">
          <div ref={writingAreaRef} className="sentence-writing-area">
            <div className="sentence-workbook-lines" aria-hidden="true">
              {Array.from({ length: ROWS * 3 }, (_, index) => (
                <div className="sentence-workbook-line" key={index} />
              ))}
            </div>

            <div
              ref={guideDisplayRef}
              className="sentence-target-display"
              aria-hidden="true"
              style={{
                "--sentence-font-size": `${sentenceLayout.fontSize}px`,
              }}
            >
              {renderSentenceCharacters()}
            </div>

            <canvas
              ref={canvasRef}
              style={drawingToolCursor(tool, DEFAULT_COLOR)}
              className={`scribbler-canvas scribbler-canvas-${tool}`}
              data-tool={tool}
              aria-label="Trace the sentence"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={releasePointer}
              onPointerCancel={releasePointer}
              onContextMenu={(event) => event.preventDefault()}
            />

            <canvas
              ref={targetCanvasRef}
              className="sentence-target-canvas"
              aria-hidden="true"
            />
          </div>
        </div>

      </section>

      <aside
        className="scribbler-toolbar sentence-writing-toolbar"
        aria-label="Writing tools"
      >
        <button
          type="button"
          className="sentence-next-button"
          onClick={handleNext}
          disabled={!hasDrawing}
          aria-label={
            sentenceIndex === SENTENCES.length - 1
              ? "Complete writing mission"
              : "Next sentence"
          }
        >
          →
        </button>

        <div className="scribbler-tool-tools">
          {["pencil", "brush", "pen"].map((toolName) => (
            <button
              key={toolName}
              type="button"
              className={`scribbler-tool ${tool === toolName ? "selected" : ""}`}
              onClick={() => setTool(toolName)}
              aria-label={toolName}
              aria-pressed={tool === toolName}
              title={toolName}
            >
              <ToolIcon type={toolName} />
            </button>
          ))}

          <button
            type="button"
            className={`scribbler-eraser ${tool === "eraser" ? "selected" : ""}`}
            onClick={() => setTool("eraser")}
            aria-label="Eraser"
            aria-pressed={tool === "eraser"}
            title="Eraser"
          >
            <EraserIcon />
          </button>

        </div>
      </aside>

      <p className="sentence-writing-hint">
        Trace the whole sentence.
      </p>
    </main>
  );
}
