export function littleHomeLayout(count, compact) {
  const columns = compact ? 2 : 3;
  const gap = compact ? 290 : 340;
  const points = Array.from({ length: count }, (_, index) => ({
    x: !compact && index === count - 1 && count % columns === 1 ? 360 : compact ? 180 + (index % columns) * 360 : 125 + (index % columns) * 235,
    y: 150 + Math.floor(index / columns) * gap,
  }));
  return { points, height: 150 + Math.ceil(count / columns) * gap };
}
