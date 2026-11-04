import { routeBetween } from './spaceJourneyLogic.js';

// Wide boards follow the approved four-above/five-below composition.
// Phones/tablets keep ordered winding rows with larger readable labels.
export function planetJourneyLayout(count, mode = false) {
  const phone = mode === true || mode === 'phone';
  const tablet = mode === 'tablet';
  if (!phone && !tablet && count <= 9) {
    const topCount = Math.min(4, count);
    const bottomCount = count - topCount;
    const topXs = topCount === 4 ? [165, 320, 475, 630] : Array.from({length:topCount}, (_, i) => 150 + i * 420 / Math.max(1, topCount - 1));
    const points = Array.from({length:count}, (_, index) => index < topCount
      ? { x: topXs[index], y: 130 + [0, 15, -5, 0][index], row: 0, wide: true }
      : { x: bottomCount === 1 ? 360 : 85 + (index - topCount) * 550 / (bottomCount - 1), y: 390 + ((index - topCount) % 2 ? 10 : 0), row: 1, wide: true });
    return { points, height: bottomCount ? 600 : 360 };
  }
  const columns = phone ? 2 : 3;
  const step = phone ? 285 : 280;
  const points = Array.from({length:count}, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    const xs = phone ? (row % 2 ? [540,180] : [180,540]) : (row % 2 ? [590,360,130] : [145,360,575]);
    return { x: xs[column], y: 125 + row * step + (column % 2 ? 30 : 0) };
  });
  return { points, height: Math.max(350, Math.ceil(count / columns) * step + 90) };
}

// The exact same gold curves drive the existing rocket sampler, including reverse travel.
export function planetJourneyRoute(points, from, to) {
  if (!points[from] || !points[to]) return '';
  if (!points[from].wide) return routeBetween(points, from, to);
  let path = `M ${points[from].x} ${points[from].y}`;
  const direction = to > from ? 1 : -1;
  for (let i = from; i !== to; i += direction) {
    const first = Math.min(i, i + direction), a = points[first], b = points[first + 1];
    let segments;
    if (a.row !== b.row) {
      segments = [
        [a, {x:715,y:a.y + 5}, {x:715,y:285}, {x:610,y:295}],
        [{x:610,y:295}, {x:450,y:310}, {x:130,y:280}, {x:35,y:330}],
        [{x:35,y:330}, {x:5,y:365}, {x:15,y:b.y}, b],
      ];
    } else {
      const dx = b.x - a.x;
      segments = [[a, {x:a.x + dx * .32,y:a.y + 42}, {x:b.x - dx * .32,y:b.y + 42}, b]];
    }
    if (direction < 0) segments = segments.reverse().map(([start,c1,c2,end]) => [end,c2,c1,start]);
    for (const [,c1,c2,end] of segments) path += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  }
  return path;
}

export const PLANET_NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

export function planetJourneyProgress(items) {
  const missions = items.filter(item => !item.free);
  return { completed: missions.filter(item => item.complete).length, total: missions.length };
}
