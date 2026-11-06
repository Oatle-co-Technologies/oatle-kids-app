import { useEffect } from "react";
import { drawingToolArtwork } from "./drawingToolArtwork";

// Coordinates in the original 24 × 24 artwork: graphite/nib, bristle contact,
// and the centre of the eraser's lower edge. Native CSS cursors do not intercept
// pointer events or add overlays over a child's touch tracing.
const hotspots = { pencil: [4, 21], pen: [5.8, 22.2], brush: [4.1, 20.4], eraser: [10.3, 21.5] };

export function drawingToolCursor(tool, color = "#202020") {
  if (!hotspots[tool]) return undefined;
  // Only accept plain hex colours before embedding in SVG.
  const ink = /^#[\da-f]{3,8}$/i.test(color) ? color : "#202020";
  let artwork = drawingToolArtwork[tool].replaceAll("currentColor", "#f27bbd");
  if (tool === "brush") artwork = artwork.replace('fill="#ffd45c"', `fill="${ink}"`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">${artwork}</svg>`;
  const [x, y] = hotspots[tool].map(value => Math.round(value * 2));
  return { cursor: `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, crosshair` };
}

// A visible tool also works on touchscreens, where CSS cursors are not drawn.
export function useDrawingToolCursor(canvasRef, tool, color, enabled = true) {
  useEffect(() => {
    if (!enabled || !hotspots[tool]) return;
    const indicator = document.createElement("div");
    indicator.setAttribute("aria-hidden", "true");
    const ink = /^#[\da-f]{3,8}$/i.test(color) ? color : "#202020";
    let artwork = drawingToolArtwork[tool].replaceAll("currentColor", "#f27bbd");
    if (tool === "brush") artwork = artwork.replace('fill="#ffd45c"', `fill="${ink}"`);
    indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">${artwork}</svg>`;
    Object.assign(indicator.style, {
      position: "fixed", left: "0", top: "0", width: "48px", height: "48px",
      pointerEvents: "none", zIndex: "2147483647", display: "none",
      filter: "drop-shadow(0 1px 1px white)",
    });
    document.body.appendChild(indicator);
    let activeCanvas;
    let previousCursor;
    const hide = () => {
      indicator.style.display = "none";
      if (activeCanvas) activeCanvas.style.cursor = previousCursor;
      activeCanvas = null;
    };
    const move = (event) => {
      const canvas = canvasRef.current;
      if (!canvas || event.target !== canvas) { hide(); return; }
      if (event.pointerType !== "mouse" && !event.buttons) { hide(); return; }
      if (activeCanvas !== canvas) {
        hide();
        activeCanvas = canvas;
        previousCursor = canvas.style.cursor;
      }
      canvas.style.cursor = "none";
      const [x, y] = hotspots[tool];
      indicator.style.transform = `translate(${event.clientX - x * 2}px, ${event.clientY - y * 2}px)`;
      indicator.style.display = "block";
    };
    const release = (event) => { if (event.pointerType !== "mouse") hide(); };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerdown", move);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", hide);
    document.addEventListener("pointerout", hide);
    window.addEventListener("blur", hide);
    return () => {
      hide();
      indicator.remove();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", hide);
      document.removeEventListener("pointerout", hide);
      window.removeEventListener("blur", hide);
    };
  }, [canvasRef, tool, color, enabled]);
}
