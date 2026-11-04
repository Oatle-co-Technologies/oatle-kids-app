const COLOURS = [
  { colour: '#ff6f91', label: 'pink' },
  { colour: '#ffd45c', label: 'yellow' },
  { colour: '#55c6ff', label: 'blue' },
  { colour: '#8fe4b1', label: 'green' },
  { colour: '#bd9bff', label: 'purple' },
  { colour: '#ffac68', label: 'orange' },
  { colour: '#7ae4df', label: 'turquoise' },
];

// A brief, varied break: four to seven balloons, spread across distinct cells.
export function makeReadingBreakBalloons(random = Math.random) {
  const count = 4 + Math.floor(random() * 4);
  const slots = Array.from({ length: 8 }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const other = Math.floor(random() * (i + 1));
    [slots[i], slots[other]] = [slots[other], slots[i]];
  }
  return slots.slice(0, count).map((slot, index) => ({
    id: index,
    slot,
    ...COLOURS[index],
    edge: Math.floor(random() * 4),
    delay: index * 0.14,
  }));
}
