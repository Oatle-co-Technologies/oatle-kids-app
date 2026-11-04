// Coordinates are inputs to the existing rocket engine; mission-map geometry is unchanged.
export function galaxyHomeLayout(compact = false) {
  return compact
    ? { height: 1080, points: [{ x: 180, y: 150 }, { x: 540, y: 200 }, { x: 180, y: 470 }, { x: 540, y: 520 }, { x: 180, y: 790 }, { x: 540, y: 840 }] }
    : { height: 890, points: [{ x: 125, y: 155 }, { x: 360, y: 190 }, { x: 595, y: 155 }, { x: 145, y: 455 }, { x: 575, y: 475 }, { x: 360, y: 690 }] };
}
