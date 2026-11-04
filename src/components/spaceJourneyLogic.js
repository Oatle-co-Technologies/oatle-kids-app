export const JOURNEY_WIDTH = 720;
export const JOURNEY_STEP = 190;

export function journeyPoints(count) {
  const bends = [190, 515, 255, 520, 195, 465];
  return Array.from({ length: count }, (_, index) => ({ x: bends[index % bends.length], y: 100 + index * JOURNEY_STEP }));
}

export function routeBetween(points, from, to) {
  if (!points[from] || !points[to]) return '';
  let path = `M ${points[from].x} ${points[from].y}`;
  const direction = to > from ? 1 : -1;
  for (let index = from; index !== to; index += direction) {
    const a = points[index], b = points[index + direction];
    const mid = (a.y + b.y) / 2;
    path += ` C ${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y}`;
  }
  return path;
}

// Presentation only: locked flags always come from the existing activity rules.
export function currentDestination(items, preferredId) {
  const preferred = items.findIndex(item => item.id === preferredId && !item.locked);
  if (preferred >= 0) return preferred;
  const next = items.findIndex(item => !item.locked && !item.complete);
  return next >= 0 ? next : Math.max(0, items.findLastIndex(item => !item.locked));
}

// Add a visual completion marker without advancing or replacing existing progress.
export function withCompletedDestination(progress, id) {
  if (progress.completedMissions?.[id]) return progress;
  return { ...progress, completedMissions: { ...progress.completedMissions, [id]: true } };
}
