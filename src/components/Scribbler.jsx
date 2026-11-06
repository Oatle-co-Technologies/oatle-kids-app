import { drawingToolCursor } from "./drawingToolCursor";
import { DrawingToolIcon } from "./DrawingToolIcon";
import { useLayoutEffect, useRef, useState } from "react";

import "./Scribbler.css";

const COLORS = [
  { name: "Black", value: "#202020" },
  { name: "Gray", value: "#777777" },
  { name: "Red", value: "#ef5b5b" },
  { name: "Yellow", value: "#ffd45c" },
  { name: "Blue", value: "#55c6ff" },
  { name: "Green", value: "#66d17a" },
  { name: "Orange", value: "#ff9f43" },
  { name: "Purple", value: "#a875e8" },
  { name: "Pink", value: "#f27bbd" },
  { name: "Turquoise", value: "#35c7c4" },
];

const TOOLS = {
  pencil: {
    name: "Pencil",
    size: 2,
    opacity: 0.9,
  },
  pen: {
    name: "Pen",
    size: 3.5,
    opacity: 1,
  },
  brush: {
    name: "Paintbrush",
    size: 7,
    opacity: 0.78,
  },
};

const STICKERS = [
  { name: "Star", type: "star", color: "#ffd45c" },
  { name: "Heart", type: "heart", color: "#ef5b5b" },
  { name: "Flower", type: "flower", color: "#f27bbd" },
  { name: "Sun", type: "sun", color: "#ff9f43" },
  { name: "Moon", type: "moon", color: "#a875e8" },
  { name: "Cloud", type: "cloud", color: "#55c6ff" },
  { name: "Tree", type: "tree", color: "#66d17a" },
  { name: "Sunflower", type: "sunflower", color: "#ffd45c" },
  { name: "Leaf", type: "leaf", color: "#66d17a" },
  { name: "Rainbow", type: "rainbow", color: "#ef5b5b" },
  { name: "Mushroom", type: "mushroom", color: "#ef5b5b" },
  { name: "Cactus", type: "cactus", color: "#66d17a" },
  { name: "Butterfly", type: "butterfly", color: "#a875e8" },
  { name: "Bee", type: "bee", color: "#ffd45c" },
  { name: "Car", type: "car", color: "#ef5b5b" },
  { name: "Dinosaur", type: "dinosaur", color: "#66d17a" },
  { name: "Rocket", type: "rocket", color: "#55c6ff" },
  { name: "Robot", type: "robot", color: "#777777" },
  { name: "UFO", type: "ufo", color: "#35c7c4" },
  { name: "Ball", type: "ball", color: "#ff9f43" },
];

export function StickerShape({ type, color }) {
  if (type === "star") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="m24 4 5.7 11.6 12.8 1.9-9.2 9 2.2 12.7L24 33.2 12.5 39.2l2.2-12.7-9.2-9 12.8-1.9z"
        />
      </svg>
    );
  }

  if (type === "heart") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M24 40S7 30 7 18.8C7 12.8 11.2 9 16.5 9c3.2 0 5.9 1.6 7.5 4.1C25.6 10.6 28.3 9 31.5 9 36.8 9 41 12.8 41 18.8 41 30 24 40 24 40Z"
        />
      </svg>
    );
  }

  if (type === "flower") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M24 20c-5-10-14-7.4-12 1.1-8.5-2-11.1 7-1.1 9.9-5 7.2 3.2 13.5 9.1 6.7 4.7 7.5 13.7 2.2 10-6.2 8.5-3 5.9-12.8-4-10.5 1.8-8.4-6.6-12-12-1Z"
        />
        <circle
          cx="24"
          cy="24"
          r="5"
          fill="#ffd45c"
        />
      </svg>
    );
  }

  if (type === "sun") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r="10"
          fill={color}
        />

        <path
          fill={color}
          d="M21.5 3h5v8h-5zm0 34h5v8h-5zM3 21.5h8v5H3zm34 0h8v5h-8zM8.1 11.6l3.5-3.5 5.7 5.7-3.5 3.5zm22.6 22.6 3.5-3.5 5.7 5.7-3.5 3.5zM32.2 13.8l5.7-5.7 3.5 3.5-5.7 5.7zM8.1 36.4l5.7-5.7 3.5 3.5-5.7 5.7z"
        />
      </svg>
    );
  }

  if (type === "moon") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M35.8 31.5A17 17 0 0 1 16.5 12.2 17 17 0 1 0 35.8 31.5Z"
        />
      </svg>
    );
  }

  if (type === "tree") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#8f2d56"
          d="M21 28h6v15h-6z"
        />

        <path
          fill={color}
          d="M24 5 17 15h4l-7 9h6l-8 10h24l-8-10h6l-7-9h4z"
        />
      </svg>
    );
  }

  if (type === "sunflower") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <g fill={color}>
          <circle cx="24" cy="10" r="5" />
          <circle cx="34" cy="14" r="5" />
          <circle cx="38" cy="24" r="5" />
          <circle cx="34" cy="34" r="5" />
          <circle cx="24" cy="38" r="5" />
          <circle cx="14" cy="34" r="5" />
          <circle cx="10" cy="24" r="5" />
          <circle cx="14" cy="14" r="5" />
        </g>

        <circle
          cx="24"
          cy="24"
          r="8"
          fill="#8f2d56"
        />

        <path
          d="M24 31v13"
          stroke="#66d17a"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "leaf") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M39 8C20 8 9 17 9 31c0 5 3 9 8 9 14 0 22-11 22-32Z"
        />

        <path
          d="M11 38 34 14"
          stroke="#fff"
          strokeWidth="2"
          opacity=".55"
        />
      </svg>
    );
  }

  if (type === "rainbow") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M7 37a17 17 0 0 1 34 0"
          fill="none"
          stroke="#ef5b5b"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M12 37a12 12 0 0 1 24 0"
          fill="none"
          stroke="#ffd45c"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <path
          d="M17 37a7 7 0 0 1 14 0"
          fill="none"
          stroke="#55c6ff"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "mushroom") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#fff"
          d="M17 27h14v15H17z"
        />

        <path
          fill={color}
          d="M8 25c0-10 7-16 16-16s16 6 16 16H8Z"
        />

        <circle
          cx="18"
          cy="17"
          r="2.5"
          fill="#fff"
        />

        <circle
          cx="30"
          cy="14"
          r="2.5"
          fill="#fff"
        />
      </svg>
    );
  }

  if (type === "cactus") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M18 41V18a6 6 0 0 1 12 0v5h4v-5a4 4 0 0 1 8 0v9a6 6 0 0 1-6 6h-6v8z"
        />

        <path
          d="M13 25v-6a4 4 0 0 1 8 0v4"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "butterfly") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M23 23c-5-13-16-14-17-7-1 6 5 11 14 13-8 2-12 7-8 11 5 4 11-3 13-10z"
        />

        <path
          fill="#55c6ff"
          d="M25 23c5-13 16-14 17-7 1 6-5 11-14 13 8 2 12 7 8 11-5 4-11-3-13-10z"
        />

        <rect
          x="22"
          y="19"
          width="4"
          height="17"
          rx="2"
          fill="#202020"
        />
      </svg>
    );
  }

  if (type === "bee") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <ellipse
          cx="17"
          cy="16"
          rx="7"
          ry="5"
          fill="#55c6ff"
          opacity=".75"
        />

        <ellipse
          cx="31"
          cy="16"
          rx="7"
          ry="5"
          fill="#55c6ff"
          opacity=".75"
        />

        <ellipse
          cx="24"
          cy="27"
          rx="11"
          ry="9"
          fill={color}
        />

        <path
          d="M16 24h16M15 29h18"
          stroke="#202020"
          strokeWidth="3"
        />

        <circle
          cx="20"
          cy="25"
          r="1.5"
          fill="#202020"
        />

        <circle
          cx="28"
          cy="25"
          r="1.5"
          fill="#202020"
        />

        <path
          d="M21 34h6"
          stroke="#202020"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "ufo") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#55c6ff"
          d="M17 25c0-7 3-11 7-11s7 4 7 11z"
        />

        <ellipse
          cx="24"
          cy="27"
          rx="18"
          ry="7"
          fill={color}
        />

        <circle
          cx="15"
          cy="27"
          r="2"
          fill="#ffd45c"
        />

        <circle
          cx="24"
          cy="29"
          r="2"
          fill="#ffd45c"
        />

        <circle
          cx="33"
          cy="27"
          r="2"
          fill="#ffd45c"
        />
      </svg>
    );
  }

  if (type === "ball") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r="17"
          fill={color}
        />

        <path
          d="m24 16 5 4-2 6h-6l-2-6zM24 16l-4-6M29 20l7-2M27 26l4 7M21 26l-4 7M19 20l-7-2"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          opacity=".8"
        />
      </svg>
    );
  }

  if (type === "car") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M8 27.5 12.2 17h23.6L40 27.5v8H8z"
        />

        <path
          fill="#55c6ff"
          d="m14.5 19.5-2.3 6h23.6l-2.3-6z"
        />

        <circle
          cx="15"
          cy="36"
          r="4"
          fill="#202020"
        />

        <circle
          cx="33"
          cy="36"
          r="4"
          fill="#202020"
        />

        <circle
          cx="15"
          cy="36"
          r="1.5"
          fill="#ffd45c"
        />

        <circle
          cx="33"
          cy="36"
          r="1.5"
          fill="#ffd45c"
        />
      </svg>
    );
  }

  if (type === "dinosaur") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M9 34c0-6 3-10 8-12V14c0-5 4-8 9-8 5 0 9 3 9 8v4h6v7h-9v9h-6v-6h-7v6H13v-4z"
        />

        <circle
          cx="29"
          cy="13"
          r="1.8"
          fill="#202020"
        />

        <path
          d="m18 20-3-4m8 2-2-5m8 5-1-5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".7"
        />
      </svg>
    );
  }

  if (type === "rocket") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill={color}
          d="M28 5c8 2 12 8 10 17l-9 12-12-12 12-9c-1-3-1-6-1-8Z"
        />

        <circle
          cx="31"
          cy="14"
          r="3"
          fill="#fff"
          opacity=".8"
        />

        <path
          fill="#ef5b5b"
          d="m17 24-8 2 7 7 2-8zM22 30l-2 10 7-8z"
        />

        <path
          fill="#ffd45c"
          d="m19 32-2 7 6-5z"
        />
      </svg>
    );
  }

  if (type === "robot") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect
          x="9"
          y="12"
          width="30"
          height="27"
          rx="7"
          fill={color}
        />

        <rect
          x="14"
          y="19"
          width="20"
          height="12"
          rx="4"
          fill="#55c6ff"
        />

        <circle
          cx="20"
          cy="25"
          r="2.2"
          fill="#202020"
        />

        <circle
          cx="28"
          cy="25"
          r="2.2"
          fill="#202020"
        />

        <path
          d="M24 12V7"
          stroke="#777"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="24"
          cy="6"
          r="2.5"
          fill="#ffd45c"
        />

        <path
          d="M5 22v9m38-9v9"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill={color}
        d="M10 34h28a8 8 0 0 0 0-16 12 12 0 0 0-22.5 2.5A6.8 6.8 0 0 0 10 34Z"
      />
    </svg>
  );
}

export function ScribblerStickerPicker({
  selectedSticker,
  onSelect,
  className = "scribbler-sticker-tools",
  buttonClassName = "scribbler-sticker",
}) {
  return (
    <div className={className} aria-label="Stickers">
      {STICKERS.map((sticker) => (
        <button
          key={sticker.type}
          type="button"
          className={`${buttonClassName} ${
            selectedSticker?.type === sticker.type ? "selected" : ""
          }`}
          onClick={() => onSelect(sticker)}
          aria-label={`${sticker.name} sticker`}
          aria-pressed={selectedSticker?.type === sticker.type}
          title={sticker.name}
        >
          <StickerShape type={sticker.type} color={sticker.color} />
        </button>
      ))}
    </div>
  );
}

function PencilIcon() {
  return <DrawingToolIcon tool="pencil" />;
}

function PenIcon() {
  return <DrawingToolIcon tool="pen" />;
}

function BrushIcon() {
  return <DrawingToolIcon tool="brush" />;
}

export function EraserIcon() {
  return <DrawingToolIcon tool="eraser" />;
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 12a8 8 0 1 0 2.3-5.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M4 5v5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const getCanvasPoint = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

export default function Scribbler({ onBack }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const activePointerIdRef = useRef(null);

  const [selectedColor, setSelectedColor] =
    useState(COLORS[0].value);

  const [tool, setTool] =
    useState("pencil");

  const [selectedSticker, setSelectedSticker] =
    useState(null);

  const [stickers, setStickers] =
    useState([]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const resizeCanvas = () => {
      const rect =
        canvas.getBoundingClientRect();

      const nextWidth = Math.max(
        1,
        Math.round(rect.width)
      );

      const nextHeight = Math.max(
        1,
        Math.round(rect.height)
      );

      const dpr =
        window.devicePixelRatio || 1;

      if (
        canvas.width ===
          Math.round(nextWidth * dpr) &&
        canvas.height ===
          Math.round(nextHeight * dpr)
      ) {
        return;
      }

      const oldCanvas =
        document.createElement("canvas");

      oldCanvas.width = canvas.width;
      oldCanvas.height = canvas.height;

      if (
        canvas.width &&
        canvas.height
      ) {
        const oldContext =
          oldCanvas.getContext("2d");

        oldContext.drawImage(
          canvas,
          0,
          0
        );
      }

      canvas.width = Math.round(
        nextWidth * dpr
      );

      canvas.height = Math.round(
        nextHeight * dpr
      );

      const context =
        canvas.getContext("2d");

      context.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      if (
        oldCanvas.width &&
        oldCanvas.height
      ) {
        context.drawImage(
          oldCanvas,
          0,
          0,
          oldCanvas.width /
            (window.devicePixelRatio ||
              1),
          oldCanvas.height /
            (window.devicePixelRatio ||
              1),
          0,
          0,
          nextWidth,
          nextHeight
        );
      }
    };

    resizeCanvas();

    const observer =
      new ResizeObserver(
        resizeCanvas
      );

    observer.observe(canvas);

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, []);

  const draw = (event) => {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !drawingRef.current ||
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    const context =
      canvas.getContext("2d");

    const point =
      getCanvasPoint(
        event,
        canvas
      );

    context.globalCompositeOperation =
      tool === "eraser"
        ? "destination-out"
        : "source-over";

    context.strokeStyle =
      selectedColor;

    context.globalAlpha =
      tool === "eraser"
        ? 1
        : TOOLS[tool].opacity;

    context.lineWidth =
      tool === "eraser"
        ? 18
        : TOOLS[tool].size;

    context.lineCap = "round";
    context.lineJoin = "round";

    context.lineTo(
      point.x,
      point.y
    );

    context.stroke();

    context.beginPath();

    context.moveTo(
      point.x,
      point.y
    );

    context.globalAlpha = 1;
  };

  const handlePointerDown = (
    event
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    // One physical gesture owns one stroke. Ignore extra fingers and
    // palm touches until the active finger or stylus has been released.
    if (
      activePointerIdRef.current !== null ||
      (event.pointerType === "touch" && !event.isPrimary)
    ) {
      return;
    }

    event.preventDefault();

    const point =
      getCanvasPoint(
        event,
        canvas
      );

    if (selectedSticker) {
      setStickers(
        (current) => [
          ...current,
          {
            id: `${selectedSticker.type}-${Date.now()}-${Math.random()}`,
            type: selectedSticker.type,
            color: selectedSticker.color,
            x: point.x,
            y: point.y,
          },
        ]
      );

      return;
    }

    activePointerIdRef.current = event.pointerId;

    canvas.setPointerCapture?.(
      event.pointerId
    );

    const context =
      canvas.getContext("2d");

    drawingRef.current =
      true;

    context.globalCompositeOperation =
      tool === "eraser"
        ? "destination-out"
        : "source-over";

    context.globalAlpha =
      tool === "eraser"
        ? 1
        : TOOLS[tool].opacity;

    context.strokeStyle =
      selectedColor;

    context.lineWidth =
      tool === "eraser"
        ? 18
        : TOOLS[tool].size;

    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();

    context.moveTo(
      point.x,
      point.y
    );

    context.lineTo(
      point.x + 0.01,
      point.y + 0.01
    );

    context.stroke();

    context.beginPath();

    context.moveTo(
      point.x,
      point.y
    );

    context.globalAlpha = 1;
  };

  const handlePointerMove = (
    event
  ) => {
    if (
      !drawingRef.current ||
      event.pointerId !== activePointerIdRef.current
    ) {
      return;
    }

    if (
      event.getCoalescedEvents
    ) {
      const events =
        event.getCoalescedEvents();

      events.forEach(
        (coalescedEvent) => {
          draw(coalescedEvent);
        }
      );

      return;
    }

    draw(event);
  };

  const releasePointer = (
    event
  ) => {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    const canvas =
      canvasRef.current;

    drawingRef.current =
      false;
    activePointerIdRef.current = null;

    if (
      canvas &&
      canvas.hasPointerCapture?.(
        event.pointerId
      )
    ) {
      try {
        canvas.releasePointerCapture?.(
          event.pointerId
        );
      } catch {
        // Rotation can release pointer capture before this handler runs.
      }
    }

    const context =
      canvas?.getContext("2d");

    if (context) {
      context.globalAlpha = 1;

      context.globalCompositeOperation =
        "source-over";
    }
  };

  const selectTool = (
    nextTool
  ) => {
    setTool(nextTool);
    setSelectedSticker(null);
  };

  const erase = () => {
    setTool("eraser");
    setSelectedSticker(null);
  };

  // Clears everything on the page.
  // This does not affect progress,
  // navigation, or the selected color.
  const refreshPage = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const context =
      canvas.getContext("2d");

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    setStickers([]);
    setSelectedSticker(null);
    setTool("pencil");
  };

  return (
    <main className="scribbler-page scribbler-with-landscape-tip">
      <div className="scribbler-landscape-tip" role="note">
        <strong>Landscape recommended</strong>
        <span>Portrait works too.</span>
      </div>
      <button
        className="scribbler-back"
        type="button"
        onClick={onBack}
        aria-label="Back to Writing"
      >
        ← Back
      </button>

      <section
        className="scribbler-paper"
        aria-label="Writing page"
      >
        <div
          className="scribbler-lines"
          aria-hidden="true"
        >
          {Array.from(
            { length: 8 },
            (_, index) => (
              <div
                className="scribbler-line"
                key={index}
              />
            )
          )}
        </div>

        <div
          className="scribbler-sticker-layer"
          aria-hidden="true"
        >
          {stickers.map(
            (sticker) => (
              <span
                key={sticker.id}
                className="scribbler-sticker-on-page"
                style={{
                  left: sticker.x,
                  top: sticker.y,
                }}
              >
                <StickerShape
                  type={
                    sticker.type
                  }
                  color={
                    sticker.color
                  }
                />
              </span>
            )
          )}
        </div>

        <canvas
          ref={canvasRef}
              style={selectedSticker ? undefined : drawingToolCursor(tool, selectedColor)}
          className={`scribbler-canvas scribbler-canvas-${tool} ${
            selectedSticker
              ? "scribbler-canvas-sticker-mode"
              : ""
          }`}
          data-tool={tool}
          aria-label="Scribble and write on the page"
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            releasePointer
          }
          onPointerCancel={
            releasePointer
          }
          onPointerLeave={() => {}}
        />
      </section>

      <div
        className="scribbler-scroll-control"
        aria-label="Page scrolling"
      >
        <button
          type="button"
          className="scribbler-scroll-button"
          onClick={() =>
            window.scrollBy({
              top:
                -window.innerHeight *
                0.7,
              behavior: "smooth",
            })
          }
          aria-label="Scroll up"
        >
          ↑
        </button>

        <div
          className="scribbler-scroll-track"
          aria-hidden="true"
        >
          <span className="scribbler-scroll-thumb" />
        </div>

        <button
          type="button"
          className="scribbler-scroll-button"
          onClick={() =>
            window.scrollBy({
              top:
                window.innerHeight *
                0.7,
              behavior: "smooth",
            })
          }
          aria-label="Scroll down"
        >
          ↓
        </button>
      </div>

      <aside
        className="scribbler-toolbar"
        aria-label="Writing tools"
      >
        <div className="scribbler-tool-tools">
          <button
            type="button"
            className={`scribbler-tool ${
              tool === "pencil"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              selectTool("pencil")
            }
            aria-label="Pencil"
            aria-pressed={
              tool === "pencil"
            }
            title="Pencil"
          >
            <PencilIcon />
          </button>

          <button
            type="button"
            className={`scribbler-tool ${
              tool === "pen"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              selectTool("pen")
            }
            aria-label="Pen"
            aria-pressed={
              tool === "pen"
            }
            title="Pen"
          >
            <PenIcon />
          </button>

          <button
            type="button"
            className={`scribbler-tool ${
              tool === "brush"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              selectTool("brush")
            }
            aria-label="Paintbrush"
            aria-pressed={
              tool === "brush"
            }
            title="Paintbrush"
          >
            <BrushIcon />
          </button>

          <button
            type="button"
            className={`scribbler-eraser ${
              tool === "eraser"
                ? "selected"
                : ""
            }`}
            onClick={erase}
            aria-label="Eraser"
            aria-pressed={
              tool === "eraser"
            }
            title="Eraser"
          >
            <EraserIcon />
          </button>

          {/* CLEAR PAGE */}
          <button
            type="button"
            className="scribbler-refresh"
            onClick={
              refreshPage
            }
            aria-label="Clear page"
            title="Clear page"
          >
            <RefreshIcon />
          </button>
        </div>

        <div className="scribbler-color-tools">
          {COLORS.map(
            (color) => (
              <button
                key={
                  color.value
                }
                type="button"
                className={`scribbler-color ${
                  selectedColor ===
                    color.value &&
                  tool !==
                    "eraser"
                    ? "selected"
                    : ""
                }`}
                style={{
                  "--scribbler-color":
                    color.value,
                }}
                onClick={() => {
                  setSelectedColor(
                    color.value
                  );
                  setTool(
                    "pencil"
                  );
                  setSelectedSticker(
                    null
                  );
                }}
                aria-label={`${color.name} color`}
                aria-pressed={
                  selectedColor ===
                    color.value &&
                  tool !==
                    "eraser"
                }
                title={
                  color.name
                }
              >
                <span />
              </button>
            )
          )}
        </div>

        <ScribblerStickerPicker
          selectedSticker={selectedSticker}
          onSelect={(sticker) => {
            setSelectedSticker(sticker);
            setTool("pencil");
          }}
        />
      </aside>
    </main>
  );
}
