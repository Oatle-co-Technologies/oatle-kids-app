export const ORBIT_BREAKPOINT = 1024;
const BASE_WIDTH = 351;
const BASE_HEIGHT = 455;

export function isOrbitViewport(width) { return width < ORBIT_BREAKPOINT; }

// Geometry is presentation only; it never sorts, unlocks or modifies mission items.
export function planetOrbitLayout(count, hostWidth, viewportWidth, viewportHeight, measuredNavHeight) {
  const landscape = viewportWidth > viewportHeight && viewportHeight < 600;
  const navHeight = measuredNavHeight || (viewportWidth <= 700 ? 72 : 82);
  let width, height, radius, cx, cy, touch, planet, labelWidth, labelHeight, gap, scale;
  if (landscape) {
    width = Math.max(300, hostWidth);
    height = Math.max(235, viewportHeight - navHeight - 20);
    radius = Math.min(105, (height - 76) / 2);
    cx = width / 2; cy = height / 2 - 8;
    touch = 44; planet = 34; gap = 3;
    labelWidth = Math.min(100, Math.max(74, cx - radius - touch / 2 - gap - 8));
    labelHeight = height < 270 ? 47 : 50; scale = 1;
  } else {
    const availableHeight = Math.max(BASE_HEIGHT, viewportHeight - navHeight - 130);
    width = Math.min(hostWidth, 640, availableHeight / BASE_HEIGHT * BASE_WIDTH);
    // A minimum readable board may need a few pixels of vertical scroll on very small viewports.
    width = Math.max(Math.min(hostWidth, BASE_WIDTH), width);
    scale = width / BASE_WIDTH;
    height = BASE_HEIGHT * scale;
    radius = (count > 5 ? 154 : 148) * scale; cx = width / 2; cy = (count > 5 ? 228 : 218) * scale;
    touch = Math.max(44, 44 * scale); planet = 44 * scale;
    labelWidth = (count > 5 ? 74 : 90) * scale; labelHeight = (count > 5 ? 75 : 55) * scale; gap = 3 * scale;
  }
  const points = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count);
    const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius;
    let labelX, labelY;
    const ownLabelHeight = !landscape && count > 5 && (index === 0 || Math.sin(angle) > .7) ? 55 * scale : labelHeight;
    const ownLabelWidth = landscape && index === 0 ? Math.min(70, Math.max(50, radius * 1.286 - touch - 6)) : labelWidth;
    if (landscape) {
      if (index === 0) {
        labelX = x - ownLabelWidth / 2; labelY = y + touch / 2 + gap;
      } else {
        labelX = Math.cos(angle) >= 0 ? x + touch / 2 + gap : x - touch / 2 - gap - labelWidth;
        labelY = Math.sin(angle) > .7 ? height - labelHeight - 4 : y - labelHeight / 2;
      }
    } else if (count <= 5 || index === 0) {
      labelX = Math.max(0, Math.min(width - labelWidth, x - labelWidth / 2));
      labelY = y + touch / 2 + gap;
    } else if (Math.abs(Math.cos(angle)) > .94) {
      labelX = Math.cos(angle) > 0 ? x - touch / 2 - gap - labelWidth : x + touch / 2 + gap;
      labelY = y - ownLabelHeight / 2;
    } else {
      labelX = x - labelWidth / 2;
      labelY = Math.sin(angle) < -.35 ? y - touch / 2 - gap - ownLabelHeight : y + touch / 2 + gap;
    }
    return {
      x: x / width * 720, y, orbit: true, angle, cx: cx / width * 720, cy,
      rx: radius / width * 720, ry: radius,
      labelX: labelX - (x - touch / 2), labelY: labelY - (y - touch / 2),
      touchRect: { x: x - touch / 2, y: y - touch / 2, width: touch, height: touch },
      labelRect: { x: labelX, y: labelY, width: ownLabelWidth, height: ownLabelHeight },
    };
  });
  return {
    points, width, height, landscape, touch, planet, labelWidth, labelHeight,
    labelFont: (landscape && height < 270 ? 10 : 10.5) * scale, titleFont: (landscape && height < 270 ? 11 : 11.5) * scale,
    centerWidth: (landscape ? 56 : count > 5 ? 100 : 140) * scale,
    centerY: cy + (landscape ? (height < 270 ? 24 : 20) : count > 5 ? 12 : 27) * scale,
    centerHeight: landscape ? (height < 270 ? 56 : 76) : (count > 5 ? 110 : 140) * scale,
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
