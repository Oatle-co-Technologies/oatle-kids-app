// More original, closed-shape drawings. Large regions for ages 2–3;
// layered scenes and smaller details for ages 4–7.
const p = (id, label, d) => ({ id, label, type: 'path', attrs: { d } });
const e = (id, label, cx, cy, rx, ry = rx) => ({ id, label, type: 'ellipse', attrs: { cx, cy, rx, ry } });
const r = (id, label, x, y, width, height, rx = 6) => ({ id, label, type: 'rect', attrs: { x, y, width, height, rx } });
const cloud = (id, x, y) => p(id, 'Cloud', `M${x} ${y}q-30-30 5-45q15-40 50-15q40-15 45 25q40 35-5 40Z`);
const tree = (id, x, y) => [r(`${id}-trunk`, 'Tree trunk', x - 9, y, 18, 85), e(`${id}-leaves`, 'Tree leaves', x, y - 25, 45, 58)];
const hill = (id, y) => p(id, 'Ground', `M20 ${y}Q180 ${y - 55}300 ${y}Q450 ${y - 40}580 ${y}V420H20Z`);

export const LITTLE_EXTRA_PAGES = [
  { id: 'little-apple', title: 'Juicy apple', hint: 'What colour is your apple?', regions: [
    r('stem', 'Stem', 288, 55, 25, 80),
    p('leaf', 'Leaf', 'M305 95Q325 20 410 50Q380 125 305 95Z'),
    p('apple', 'Apple', 'M300 145C170 50 70 175 140 315Q205 435 300 370Q395 435 460 315C530 175 430 50 300 145Z'),
  ] },
  { id: 'little-teddy', title: 'Teddy bear', hint: 'Make a cuddly, colourful teddy.', regions: [
    e('left-ear', 'Left ear', 200, 95, 55), e('right-ear', 'Right ear', 400, 95, 55),
    e('body', 'Teddy body', 300, 290, 125, 100),
    e('left-foot', 'Left foot', 205, 355, 60, 45), e('right-foot', 'Right foot', 395, 355, 60, 45),
    e('tummy', 'Tummy', 300, 295, 70, 65), e('head', 'Teddy head', 300, 155, 125, 100),
  ], details: ['M255 140h1M345 140h1', 'M282 175Q300 155 318 175L300 190Z', 'M300 190v12q-25 25-45 0M300 202q25 25 45 0'] },
  { id: 'little-car', title: 'My little car', hint: 'Choose bright colours for your car.', regions: [
    p('car', 'Car body', 'M80 235L145 210L210 120H360L435 210L510 235V330H80Z'),
    p('front-window', 'Front window', 'M300 145H350L400 210H300Z'),
    p('back-window', 'Back window', 'M225 145H275V210H180Z'),
    e('back-wheel', 'Back wheel', 175, 325, 60), e('front-wheel', 'Front wheel', 425, 325, 60),
    e('back-hub', 'Back wheel centre', 175, 325, 27), e('front-hub', 'Front wheel centre', 425, 325, 27),
  ] },
  { id: 'little-house', title: 'My little house', hint: 'Colour the roof, windows and door.', regions: [
    r('walls', 'House walls', 140, 190, 320, 205, 2), p('roof', 'Roof', 'M100 190L300 45L500 190Z'),
    r('door', 'Door', 270, 275, 65, 120), r('left-window', 'Left window', 170, 230, 65, 65),
    r('right-window', 'Right window', 365, 230, 65, 65), e('sun', 'Sun', 515, 70, 38),
  ], details: ['M318 335h1'] },
  { id: 'little-sun', title: 'Sunny day', hint: 'Give the sunshine a happy colour.', regions: [
    p('rays', 'Sun rays', 'M270 35H330L340 105L400 65L440 105L400 165L475 175V235L400 245L440 305L400 345L340 305L330 375H270L260 305L200 345L160 305L200 245L125 235V175L200 165L160 105L200 65L260 105Z'),
    e('sun', 'Sun', 300, 205, 110),
  ], details: ['M260 190h1M340 190h1', 'M255 230Q300 280 345 230'] },
  { id: 'little-icecream', title: 'Ice cream treat', hint: 'Imagine your favourite flavours.', regions: [
    p('cone', 'Cone', 'M190 215H410L300 405Z'), e('bottom-scoop', 'Ice cream scoop', 300, 205, 112, 70),
    e('top-scoop', 'Ice cream scoop', 300, 130, 90, 65), e('cherry', 'Cherry', 300, 55, 24),
  ], details: ['M230 250L330 350M275 245L355 325M370 250L270 350M325 245L245 325'] },
  { id: 'little-balloons', title: 'Party balloons', hint: 'Make each balloon a different colour.', regions: [
    e('left-balloon', 'Left balloon', 140, 175, 85, 110), e('middle-balloon', 'Middle balloon', 300, 130, 85, 110),
    e('right-balloon', 'Right balloon', 460, 175, 85, 110),
    p('left-knot', 'Left balloon knot', 'M140 285L123 310H157Z'),
    p('middle-knot', 'Middle balloon knot', 'M300 240L283 265H317Z'),
    p('right-knot', 'Right balloon knot', 'M460 285L443 310H477Z'),
  ], details: ['M140 310Q220 340 300 410M300 265V410M460 310Q380 340 300 410'] },
  { id: 'little-snail', title: 'Slow little snail', hint: 'Colour a cosy shell for the snail.', regions: [
    p('body', 'Snail body', 'M100 340Q80 270 155 270H395V190Q395 145 435 145Q480 145 480 195V310Q545 310 530 360H130Q100 360 100 340Z'),
    e('shell', 'Shell', 270, 235, 125, 115), e('shell-centre', 'Shell centre', 270, 235, 65),
  ], details: ['M415 155L400 95M455 150L475 95', 'M395 90h1M480 90h1', 'M430 220Q450 245 470 220'] },
];

export const BIG_EXTRA_PAGES = [
  { id: 'big-dinosaur', title: 'Dinosaur valley', hint: 'Invent your dinosaur’s colours, then colour its valley.', regions: [
    hill('ground', 365), ...tree('tree', 85, 295), e('sun', 'Sun', 500, 65, 30),
    p('tail', 'Dinosaur tail', 'M330 255Q455 300 530 190Q515 345 330 310Z'),
    ...[210, 310].map((x, i) => r(`leg-${i}`, 'Dinosaur leg', x, 290, 45, 85, 16)),
    e('body', 'Dinosaur body', 295, 250, 110, 80),
    p('neck', 'Dinosaur neck', 'M205 270L165 170Q145 100 200 90Q250 90 240 150L265 245Z'),
    e('head', 'Dinosaur head', 175, 115, 60, 40), e('belly', 'Dinosaur tummy', 292, 265, 65, 45),
    ...[0, 1, 2, 3].map((i) => p(`spike-${i}`, 'Back spike', `M${245 + i * 34} 180L${255 + i * 34} 140L${280 + i * 34} 185Z`)),
    e('egg-one', 'Dinosaur egg', 110, 365, 23, 33), e('egg-two', 'Dinosaur egg', 155, 375, 25, 33),
    e('rock', 'Rock', 480, 380, 55, 25),
  ], details: ['M150 105h1M125 125q25 20 50 0', 'M220 360v13M235 360v13M320 360v13M335 360v13'] },
  { id: 'big-robot', title: 'Robot friend', hint: 'Design a friendly robot with a colourful control panel.', regions: [
    r('antenna', 'Antenna', 293, 35, 14, 45), e('antenna-light', 'Antenna light', 300, 30, 15),
    r('left-arm', 'Left arm', 120, 210, 80, 35), r('right-arm', 'Right arm', 400, 210, 80, 35),
    e('left-hand', 'Left hand', 110, 230, 30), e('right-hand', 'Right hand', 490, 230, 30),
    r('left-leg', 'Left leg', 235, 320, 40, 65), r('right-leg', 'Right leg', 325, 320, 40, 65),
    r('left-foot', 'Left foot', 210, 375, 70, 30), r('right-foot', 'Right foot', 320, 375, 70, 30),
    r('body', 'Robot body', 190, 185, 220, 150, 20), r('head', 'Robot head', 205, 75, 190, 110, 22),
    e('left-eye', 'Left eye', 255, 115, 20), e('right-eye', 'Right eye', 345, 115, 20),
    r('mouth', 'Robot smile panel', 255, 150, 90, 18), r('panel', 'Control panel', 225, 215, 150, 85, 8),
    ...[250, 300, 350].map((x, i) => e(`button-${i}`, 'Robot button', x, 255, 13)),
  ], details: ['M275 150v18M300 150v18M325 150v18'] },
  { id: 'big-train', title: 'Countryside train', hint: 'Colour the engine, carriages and countryside.', regions: [
    hill('ground', 365), e('sun', 'Sun', 520, 65, 30), cloud('cloud', 65, 100), ...tree('tree', 510, 240),
    r('engine', 'Engine', 60, 255, 170, 90), r('cab', 'Driver cabin', 135, 180, 100, 100),
    r('cab-roof', 'Cabin roof', 120, 165, 130, 20), r('window', 'Driver window', 160, 200, 50, 45),
    r('chimney', 'Chimney', 80, 215, 35, 40),
    ...[270, 425].flatMap((x, i) => [r(`carriage-${i}`, 'Carriage', x, 240, 135, 105), r(`window-${i}-a`, 'Carriage window', x + 15, 260, 40, 35), r(`window-${i}-b`, 'Carriage window', x + 80, 260, 40, 35)]),
    ...[95, 195, 300, 375, 450, 530].map((x, i) => e(`wheel-${i}`, 'Train wheel', x, 345, 24)),
  ], details: ['M35 380H570M35 395H570M60 380v15M120 380v15M180 380v15M240 380v15M300 380v15M360 380v15M420 380v15M480 380v15M540 380v15', 'M230 320h40M405 320h20'] },
  { id: 'big-sailboat', title: 'Sailing day', hint: 'Give your boat bright sails and colour the sea.', regions: [
    p('sea', 'Sea', 'M20 285Q70 260 120 285T220 285T320 285T420 285T520 285L580 285V420H20Z'),
    p('hull', 'Boat hull', 'M130 290H440L385 350H200Z'), r('mast', 'Mast', 280, 75, 14, 220),
    p('left-sail', 'Left sail', 'M268 100V270H140Z'), p('right-sail', 'Right sail', 'M305 115L420 270H305Z'),
    p('flag', 'Flag', 'M294 70L370 85L294 110Z'), e('sun', 'Sun', 90, 70, 32), cloud('cloud', 450, 120),
    ...[215, 285, 355].map((x, i) => e(`porthole-${i}`, 'Porthole', x, 315, 12)),
    p('fish-tail', 'Fish tail', 'M435 385L465 365V405Z'), e('fish', 'Fish', 410, 385, 30, 18),
    e('bubble-one', 'Bubble', 480, 345, 10), e('bubble-two', 'Bubble', 505, 315, 15),
    p('island', 'Island', 'M40 260Q75 225 110 260Z'),
  ], details: ['M70 340q25-15 50 0M120 380q25-15 50 0M490 390q25-15 50 0', 'M395 380h1'] },
  { id: 'big-lion', title: 'Lion on safari', hint: 'Colour a lion resting in the warm savanna.', regions: [
    hill('ground', 360), ...tree('tree', 495, 260), e('sun', 'Sun', 90, 65, 30),
    p('tail', 'Lion tail', 'M370 290Q470 300 450 220L465 215Q505 320 370 310Z'), e('tail-tuft', 'Tail tuft', 452, 210, 18, 28),
    e('body', 'Lion body', 330, 290, 100, 65), e('left-paw', 'Left paw', 220, 355, 45, 23), e('right-paw', 'Right paw', 330, 355, 45, 23),
    e('mane', 'Lion mane', 240, 210, 105, 110), e('left-ear', 'Left ear', 175, 135, 25), e('right-ear', 'Right ear', 300, 135, 25),
    e('face', 'Lion face', 240, 205, 70, 75), e('muzzle', 'Lion muzzle', 240, 238, 43, 25),
    p('nose', 'Lion nose', 'M225 223H255L240 237Z'), e('rock', 'Rock', 95, 365, 38, 20),
    ...[190, 250].map((x, i) => e(`eye-${i}`, 'Lion eye', x + 20, 195, 8)),
  ], details: ['M240 237v12M240 249q-18 15-30 0M240 249q18 15 30 0', 'M480 340l10-25M500 342l5-35M520 342l12-20'] },
  { id: 'big-balloon', title: 'Up in a balloon', hint: 'Create a striped balloon above the hills.', regions: [
    hill('far-hill', 340), hill('near-hill', 390), e('sun', 'Sun', 505, 65, 30),
    cloud('left-cloud', 60, 135), cloud('right-cloud', 440, 190),
    p('balloon', 'Balloon canopy', 'M300 35C135 35 125 210 245 280H355C475 210 465 35 300 35Z'),
    p('left-stripe', 'Left balloon stripe', 'M300 35Q150 80 245 280H280Q220 100 300 35Z'),
    p('right-stripe', 'Right balloon stripe', 'M300 35Q450 80 355 280H320Q380 100 300 35Z'),
    p('middle-stripe', 'Middle balloon stripe', 'M300 35Q250 100 280 280H320Q350 100 300 35Z'),
    r('left-rope', 'Left rope', 260, 280, 8, 45, 1), r('right-rope', 'Right rope', 332, 280, 8, 45, 1),
    r('basket', 'Basket', 255, 320, 90, 55, 10),
    r('house', 'Little house', 70, 340, 65, 50), p('roof', 'Little roof', 'M55 340L102 305L150 340Z'), r('door', 'Little door', 95, 365, 18, 25),
    ...tree('tree', 500, 350),
  ], details: ['M260 340h80M260 355h80M280 325v45M300 325v45M320 325v45'] },
  { id: 'big-rainbow', title: 'Rainbow village', hint: 'Choose your own rainbow colours and brighten the village.', regions: [
    ...[180, 150, 120, 90].map((radius, i) => p(`rainbow-${i}`, 'Rainbow stripe', `M${300 - radius} 245A${radius} ${radius} 0 0 1 ${300 + radius} 245H${300 + radius - 30}A${radius - 30} ${radius - 30} 0 0 0 ${300 - radius + 30} 245Z`)),
    cloud('left-cloud', 75, 250), cloud('right-cloud', 440, 250), hill('grass', 360),
    ...[70, 245, 420].flatMap((x, i) => [r(`house-${i}`, 'House walls', x, 300, 100, 95), p(`roof-${i}`, 'Roof', `M${x - 15} 300L${x + 50} 255L${x + 115} 300Z`), r(`door-${i}`, 'Door', x + 40, 345, 25, 50), r(`window-${i}`, 'Window', x + 12, 320, 22, 22)]),
    e('sun', 'Sun', 525, 60, 28),
  ] },
  { id: 'big-rover', title: 'Moon rover', hint: 'Build your moon rover’s colour scheme. Try a pattern on the solar panels.', regions: [
    hill('moon', 350), e('planet', 'Planet', 505, 65, 35),
    r('body', 'Rover body', 155, 245, 280, 80, 16), r('cabin', 'Rover cabin', 235, 170, 120, 85, 15),
    r('window', 'Rover window', 255, 185, 80, 50, 12), r('antenna', 'Antenna', 288, 105, 12, 65, 2), e('antenna-tip', 'Antenna light', 294, 100, 14),
    ...[190, 260, 330, 400].flatMap((x, i) => [e(`wheel-${i}`, 'Rover wheel', x, 325, 32), e(`hub-${i}`, 'Wheel centre', x, 325, 13)]),
    r('left-panel', 'Left solar panel', 80, 165, 125, 65, 2), r('right-panel', 'Right solar panel', 390, 165, 125, 65, 2),
    ...[95, 145, 405, 455].map((x, i) => r(`cell-${i}`, 'Solar cell', x, 178, 35, 38, 2)),
    e('rock-one', 'Moon rock', 90, 385, 40, 18), e('rock-two', 'Moon rock', 505, 360, 35, 20),
    e('star-one', 'Star', 115, 70, 9), e('star-two', 'Star', 400, 50, 7), e('star-three', 'Star', 200, 105, 7),
  ], details: ['M205 210L235 245M390 210L355 245'] },
];
