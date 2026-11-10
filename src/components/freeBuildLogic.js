export const STUDIO_COLOURS = ['#ff7896', '#62cafa', '#ffda70', '#8bdfb6', '#b6a1f6', '#ffa96d'];
export const STUDIO_ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const STUDIO_LIMIT = 100;

export function studioPlacement(point, size, pieces, movingId = null) {
  const { width, height, cell } = size;
  if (![point?.x, point?.y, width, height, cell].every(Number.isFinite) || cell <= 0 || width < cell || height < cell || point.x < 0 || point.y < 0 || point.x > width || point.y > height || (!movingId && pieces.length >= STUDIO_LIMIT)) return null;
  const px = Math.max(0, Math.min(width - cell, Math.round((point.x - cell / 2) / cell) * cell));
  const py = Math.max(0, Math.min(height - cell, Math.round((point.y - cell / 2) / cell) * cell));
  if (pieces.some(piece => piece.id !== movingId && Math.abs(piece.x * (width - cell) - px) < cell - 2 && Math.abs(piece.y * (height - cell) - py) < cell - 2)) return null;
  return { x: width === cell ? 0 : px / (width - cell), y: height === cell ? 0 : py / (height - cell) };
}

export function recordStudioEdit(state, pieces) {
  return { past: [...state.past.slice(-49), state.pieces], pieces, future: [] };
}
export function undoStudioEdit(state) {
  return state.past.length ? { past: state.past.slice(0, -1), pieces: state.past.at(-1), future: [state.pieces, ...state.future] } : state;
}
export function redoStudioEdit(state) {
  return state.future.length ? { past: [...state.past, state.pieces], pieces: state.future[0], future: state.future.slice(1) } : state;
}
