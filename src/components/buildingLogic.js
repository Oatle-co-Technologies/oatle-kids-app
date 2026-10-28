export const CELL = 60;
export const BOARD = { width: 360, height: 300 };
export const MAX_BLOCKS = 20;

export const BLOCKS = {
  red: { shape: 'square', colour: '#ff758a', name: 'red block', width: 60, height: 60 },
  blue: { shape: 'square', colour: '#66caff', name: 'blue block', width: 60, height: 60 },
  yellow: { shape: 'rectangle', colour: '#ffdc70', name: 'long yellow block', width: 120, height: 60 },
  green: { shape: 'rectangle', colour: '#85dca3', name: 'long green block', width: 120, height: 60 },
  purple: { shape: 'rectangle', colour: '#bba0f5', name: 'tall purple block', width: 60, height: 120 },
};

export const SHAPES = {
  square: { shape: 'square', colour: '#ffdc70', name: 'yellow square', width: 90, height: 90 },
  triangle: { shape: 'triangle', colour: '#ff758a', name: 'pink triangle', width: 120, height: 90 },
  rectangle: { shape: 'rectangle', colour: '#66caff', name: 'blue rectangle', width: 120, height: 60 },
  circle: { shape: 'circle', colour: '#85dca3', name: 'green circle', width: 60, height: 60 },
};

export const BUILDS = [
  { id: 'house', title: 'Little house', prompt: 'Build a little house. Put the triangle above the square.', targets: [
    { id: 'wall', kind: 'square', x: 135, y: 140 },
    { id: 'roof', kind: 'triangle', x: 120, y: 50 },
  ] },
  { id: 'bridge', title: 'Little bridge', prompt: 'Build a little bridge. Put the long rectangle across the two squares.', targets: [
    { id: 'left', kind: 'square', x: 75, y: 140 },
    { id: 'right', kind: 'square', x: 195, y: 140 },
    { id: 'top', kind: 'rectangle', x: 120, y: 80 },
  ] },
  { id: 'rocket', title: 'Little rocket', prompt: 'Build a little rocket. Add two rectangles, a triangle and a round window.', targets: [
    { id: 'body', kind: 'rectangle', x: 120, y: 120 },
    { id: 'base', kind: 'rectangle', x: 120, y: 180 },
    { id: 'nose', kind: 'triangle', x: 120, y: 30 },
    { id: 'window', kind: 'circle', x: 150, y: 120 },
  ] },
];

export function containsPoint(point, margin = 0) {
  return Number.isFinite(point?.x) && Number.isFinite(point?.y) &&
    point.x >= -margin && point.y >= -margin &&
    point.x <= BOARD.width + margin && point.y <= BOARD.height + margin;
}

export function freePlacement(kind, point, pieces, movingId = null) {
  const block = BLOCKS[kind];
  if (!block || !containsPoint(point, 12) || (!movingId && pieces.length >= MAX_BLOCKS)) return null;
  const x = Math.max(0, Math.min(BOARD.width - block.width, Math.round((point.x - block.width / 2) / CELL) * CELL));
  const y = Math.max(0, Math.min(BOARD.height - block.height, Math.round((point.y - block.height / 2) / CELL) * CELL));
  const overlaps = pieces.some(piece => {
    if (piece.id === movingId) return false;
    const other = BLOCKS[piece.kind];
    return x < piece.x + other.width && x + block.width > piece.x &&
      y < piece.y + other.height && y + block.height > piece.y;
  });
  return overlaps ? null : { kind, x, y };
}

export function matchingTarget(build, kind, point, filled) {
  if (!SHAPES[kind] || !containsPoint(point, 12)) return null;
  return build.targets.filter(target => target.kind === kind && !filled.some(piece => piece.targetId === target.id))
    .map(target => ({ target, distance: Math.hypot(point.x - target.x - SHAPES[kind].width / 2, point.y - target.y - SHAPES[kind].height / 2) }))
    .filter(item => item.distance <= 80)
    .sort((a, b) => a.distance - b.distance)[0]?.target || null;
}
