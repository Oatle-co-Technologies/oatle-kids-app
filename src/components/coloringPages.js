import { LITTLE_EXTRA_PAGES, BIG_EXTRA_PAGES } from "./moreColoringPages.js";

// Original vector drawings. Each closed region can be coloured independently.
const shape = (id, label, type, attrs) => ({ id, label, type, attrs });
const oval = (id, label, cx, cy, rx, ry = rx) => shape(id, label, 'ellipse', { cx, cy, rx, ry });
const path = (id, label, d) => shape(id, label, 'path', { d });
const box = (id, label, x, y, width, height, rx = 6) => shape(id, label, 'rect', { x, y, width, height, rx });
const star = (id, x, y, size = 26) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? size * .45 : size;
    return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
  }).join(' ');
  return shape(id, 'Star', 'polygon', { points });
};
const flower = (x, y, prefix, size = 43, stemHeight = 160) => [
  box(`${prefix}-stem`, 'Stem', x - 9, y, 18, stemHeight, 8),
  path(`${prefix}-leaf`, 'Leaf', `M${x} ${y + stemHeight * .7}Q${x + Math.min(90, size * 2)} ${y + stemHeight * .15} ${x + Math.min(95, size * 2.2)} ${y + stemHeight * .55}Q${x + size} ${y + stemHeight * .9} ${x} ${y + stemHeight * .7}Z`),
  ...[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy], i) => oval(`${prefix}-petal-${i}`, 'Petal', x + dx * size, y + dy * size, size)),
  oval(`${prefix}-middle`, 'Flower centre', x, y, size * .68),
];
const rocket = (prefix, x, y, scale = 1) => {
  const p = (id, label, d) => shape(`${prefix}-${id}`, label, 'path', { d, transform: `translate(${x} ${y}) scale(${scale})` });
  return [
    p('flame', 'Flame', 'M-35 90Q-48 165 0 200Q48 165 35 90Z'),
    p('left', 'Left fin', 'M-48 0Q-115 45-95 115L-35 80Z'),
    p('right', 'Right fin', 'M48 0Q115 45 95 115L35 80Z'),
    p('body', 'Rocket body', 'M0-170Q-80-95-55 90H55Q80-95 0-170Z'),
    shape(`${prefix}-window`, 'Rocket window', 'circle', { cx: x, cy: y - 25 * scale, r: 30 * scale }),
  ];
};
export const COLORING_PAGES = {
  little: [
    { id: 'little-flower', title: 'My flower', hint: 'Give every big petal a lovely colour.', regions: flower(260, 150, 'flower', 65) },
    { id: 'little-fish', title: 'Friendly fish', hint: 'Choose a colour, then tap the fish.', regions: [
      path('tail', 'Tail', 'M385 220L520 110Q555 220 520 330Z'),
      oval('body', 'Fish body', 270, 220, 165, 115),
      path('fin', 'Fin', 'M250 210Q320 170 345 240Q280 285 250 210Z'),
      oval('eye', 'Eye', 175, 195, 15),
      oval('bubble', 'Bubble', 100, 75, 32),
    ], details: ['M145 255Q175 280 205 255'] },
    { id: 'little-rocket', title: 'My rocket', hint: 'Colour a rocket for your space adventure.', regions: rocket('rocket', 300, 215, .92) },
    { id: 'little-butterfly', title: 'Big butterfly', hint: 'Try a different colour on each wing.', regions: [
      oval('left-top', 'Top left wing', 195, 155, 105, 100),
      oval('right-top', 'Top right wing', 405, 155, 105, 100),
      oval('left-bottom', 'Bottom left wing', 205, 300, 90, 85),
      oval('right-bottom', 'Bottom right wing', 395, 300, 90, 85),
      oval('body', 'Butterfly body', 300, 235, 28, 125),
    ], details: ['M290 115Q265 55 245 65', 'M310 115Q335 55 355 65'] },
    ...LITTLE_EXTRA_PAGES,
  ],
  big: [
    { id: 'big-garden', title: 'Garden explorers', hint: 'Make a colourful garden. Try matching the petals or invent a pattern.', regions: [
      path('ground', 'Grass', 'M30 370Q170 320 300 365Q450 315 570 370V420H30Z'),
      oval('sun', 'Sun', 490, 75, 38),
      ...flower(170, 165, 'tall', 38), ...flower(370, 235, 'small', 29),
      oval('ladybird', 'Ladybird', 490, 345, 40, 30),
      oval('spot-one', 'Ladybird spot', 475, 337, 9), oval('spot-two', 'Ladybird spot', 505, 351, 9),
      oval('head', 'Ladybird head', 450, 345, 17),
    ], details: ['M490 315V375', 'M490 20V8M490 130V142M435 75H420M545 75H560M450 35L440 25M530 115L540 125'] },
    { id: 'big-space', title: 'Space adventure', hint: 'Design a rocket, then bring the planets and stars to life.', regions: [
      oval('planet', 'Planet', 455, 130, 62),
      path('ring', 'Planet ring', 'M370 130Q390 185 520 130L540 142Q465 225 370 155Z'),
      oval('moon', 'Moon', 115, 320, 55),
      oval('crater-one', 'Moon crater', 93, 302, 13), oval('crater-two', 'Moon crater', 133, 340, 19),
      ...rocket('rocket', 290, 210, .88),
      star('star-one', 95, 85), star('star-two', 500, 330), star('star-three', 405, 365, 20),
      star('star-four', 185, 165, 18), star('star-five', 365, 45, 18),
      oval('porthole', 'Inner window', 290, 188, 16),
    ] },
    { id: 'big-ocean', title: 'Under the sea', hint: 'Colour the turtle’s shell and the little fish around it.', regions: [
      path('sand', 'Sea floor', 'M25 380Q170 340 300 385Q470 345 575 380V420H25Z'),
      path('weed-left', 'Seaweed', 'M75 380Q30 290 70 200Q100 290 85 380Z'),
      path('weed-right', 'Seaweed', 'M500 380Q450 305 500 240Q520 315 515 380Z'),
      oval('back-flipper', 'Back flipper', 370, 300, 48, 24), oval('front-flipper', 'Front flipper', 250, 310, 55, 25),
      oval('head', 'Turtle head', 175, 235, 50, 42), oval('shell', 'Turtle shell', 300, 240, 105, 70),
      shape('shell-middle', 'Middle shell pattern', 'polygon', { points: '270,210 320,200 350,235 330,270 280,275 250,245' }),
      oval('eye', 'Turtle eye', 155, 223, 7),
      path('fish-tail', 'Fish tail', 'M410 100L465 65V135Z'), oval('fish', 'Fish body', 370, 100, 55, 35),
      oval('fish-eye', 'Fish eye', 342, 92, 6),
      oval('bubble-one', 'Bubble', 110, 110, 20), oval('bubble-two', 'Bubble', 150, 55, 12),
      star('starfish', 430, 370, 32),
      oval('pebble-one', 'Pebble', 170, 390, 24, 13), oval('pebble-two', 'Pebble', 215, 380, 16, 10),
    ], details: ['M300 170L300 204M395 220L345 235M355 300L330 270M225 285L270 263M205 215L260 225', 'M150 250Q170 263 185 250'] },
    { id: 'big-home', title: 'A happy home', hint: 'Colour the house, garden and sky. What colour will the front door be?', regions: [
      path('garden', 'Garden', 'M30 355Q300 310 570 355V420H30Z'),
      box('house', 'House walls', 155, 185, 285, 185, 2),
      path('roof', 'Roof', 'M115 190L295 55L480 190Z'),
      box('chimney', 'Chimney', 385, 70, 32, 65, 1),
      box('door', 'Front door', 270, 260, 60, 110, 3), oval('knob', 'Door handle', 315, 320, 5),
      ...[190, 355].flatMap((x, i) => [box(`window-${i}`, 'Window frame', x, 225, 55, 65, 2), box(`glass-${i}`, 'Window glass', x + 9, 234, 37, 47, 1)]),
      path('path', 'Garden path', 'M270 370H330L365 420H235Z'),
      box('tree-trunk', 'Tree trunk', 65, 280, 22, 85, 2), oval('tree', 'Tree leaves', 75, 245, 48, 63),
      oval('apple-one', 'Apple', 57, 230, 10), oval('apple-two', 'Apple', 89, 264, 10),
      oval('sun', 'Sun', 520, 70, 32),
      path('cloud', 'Cloud', 'M35 95Q10 65 45 55Q55 20 90 45Q125 30 135 65Q175 100 135 105H50Z'),
      ...flower(510, 320, 'flower', 18, 65),
    ], details: ['M199 258H236M217 234V280M364 258H401M382 234V280'] },
    ...BIG_EXTRA_PAGES,
  ],
};

export const COLORING_COLOURS = [
  ['Red', '#f25b68'], ['Orange', '#ff9f43'], ['Yellow', '#ffd45c'],
  ['Green', '#66c779'], ['Blue', '#55bafa'], ['Purple', '#a579db'],
  ['Pink', '#f48cba'], ['Turquoise', '#36bfba'], ['Brown', '#a96e46'], ['Black', '#303544'],
];
