export const ORBIT_BREAKPOINT = 1024;
export function isOrbitViewport(width) { return width < ORBIT_BREAKPOINT; }

// Presentation only: the supplied item sequence and navigation rules are untouched.
// The host is the actual grid area between the header and fixed bottom navigation.
export function planetOrbitLayout(count, hostWidth, viewportWidth, viewportHeight, measuredNavHeight, hostHeight) {
  const landscape = viewportWidth > viewportHeight && viewportHeight < 600;
  const navHeight = measuredNavHeight || (viewportWidth <= 700 ? 72 : 82);
  const reserved = landscape ? (viewportHeight <= 350 ? 8 : 20) : viewportHeight <= 750 ? 118 : 140;
  const width = Math.max(100, hostWidth);
  const height = Math.max(100, hostHeight || viewportHeight - navHeight - reserved);
  const diameter = Math.min(width, height);
  const touch = Math.max(44, Math.min(160, diameter * .215));
  const radius = Math.min(diameter * .38, (diameter - touch - 16) / 2);
  const cx = width / 2;
  const cy = height / 2;
  const centerSize = Math.max(24, Math.min(320, 2 * (radius - touch / 2 - 12)));
  const points = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    return {
      x: x / width * 720, y, orbit: true, angle,
      cx: cx / width * 720, cy, rx: radius / width * 720, ry: radius,
      touchRect: { x: x - touch / 2, y: y - touch / 2, width: touch, height: touch },
    };
  });
  return {
    points, width, height, landscape, touch, planet: touch,
    centerSize, centerY: cy,
    titleFont: Math.max(9.5, Math.min(20, centerSize * .085)),
  };
}

function arc(a, b, clockwise = true) {
  return ` A ${a.rx} ${a.ry} 0 0 ${clockwise ? 1 : 0} ${b.x} ${b.y}`;
}

export function planetOrbitRoute(points, from, to) {
  if (!points[from] || !points[to]) return '';
  let path = `M ${points[from].x} ${points[from].y}`;
  const direction = to > from ? 1 : -1;
  for (let index = from; index !== to; index += direction) path += arc(points[index], points[index + direction], direction > 0);
  return path;
}

export function planetOrbitClosingPath(points) {
  if (!points.length) return '';
  if (points.length === 1) {
    const point = points[0];
    const opposite = { ...point, x: 2 * point.cx - point.x, y: 2 * point.cy - point.y };
    return `M ${point.x} ${point.y}` + arc(point, opposite) + arc(opposite, point);
  }
  const last = points.at(-1);
  return `M ${last.x} ${last.y}` + arc(last, points[0]);
}
