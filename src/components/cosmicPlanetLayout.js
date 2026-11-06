import { galaxyHomeLayout } from './galaxyHomeLayout.js';

// Use the Cosmic home coordinates, extending the same pattern for longer journeys.
export function cosmicPlanetLayout(count, compact = false) {
  const home = galaxyHomeLayout(compact);
  const points = Array.from({ length: count }, (_, index) => {
    const point = home.points[index % home.points.length];
    return { ...point, y: point.y + Math.floor(index / home.points.length) * (compact ? 960 : 890) };
  });
  if (count === 1) points[0].x = 360;
  return { points, height: Math.max(420, ...points.map(point => point.y + 240)) };
}
