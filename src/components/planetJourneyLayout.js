// Display geometry only. Item order, callbacks and unlocking stay with each adventure.
export function planetJourneyLayout(count, compact = false) {
  const columns = compact ? 2 : 3;
  const step = compact ? 340 : 310;
  const points = Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const xs = compact
      ? (row % 2 ? [540, 180] : [180, 540])
      : (row % 2 ? [590, 360, 130] : [145, 360, 575]);
    return { x: xs[column], y: 145 + row * step + (column % 2 ? 45 : 0) };
  });
  return { points, height: Math.max(390, Math.ceil(count / columns) * step + 115) };
}

// Original solar-system names used by the existing planet images and assignments.
export const PLANET_NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

export function planetJourneyProgress(items) {
  return { completed: items.filter(item => item.complete).length, total: items.length };
}
