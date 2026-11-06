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
