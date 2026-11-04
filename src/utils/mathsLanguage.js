const BASIC_SHAPES = new Set(['circle', 'square', 'triangle', 'rectangle']);
const BASIC_COLOURS = new Set(['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white']);
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const familiarUnit = shape => ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'].includes(shape) ? shape : 'shape';
const plural = word => `${word}s`;

export function isCoreMathQuestion(question) {
  if (question.type.startsWith('shape-')) return BASIC_SHAPES.has(question.shape);
  if (question.type === 'number') return Number(question.answer) <= 10;
  if (question.type === 'colour-recognition') return BASIC_COLOURS.has(question.answer);
  if (question.type === 'colour-mixing') return ['orange', 'green', 'purple', 'pink'].includes(question.answer);
  return true;
}

// One wording layer feeds both the visible question and its spoken instructions.
// IDs, choices, answers and activity positions stay independent of this wording.
export function prepareMathQuestion(source) {
  const q = { ...source, extension: !isCoreMathQuestion(source) };
  const type = q.type;
  if (type.startsWith('addition') || type.startsWith('subtraction')) {
    const adding = type.startsWith('addition');
    const [first, second] = q.values || (adding ? [2, 2] : [4, 2]);
    q.values = [first, second]; q.operation = adding ? '+' : '-';
    // Number practice gets the same concrete picture support as object practice.
    q.object = q.object || 'circle';
    const unit = familiarUnit(q.object);
    const units = plural(unit);
    q.prompt = adding
      ? `Start with ${first} ${units}. Add ${second} more. How many are there now?`
      : `Start with ${first} ${units}. Take away ${second}. How many are left?`;
    if (q.teaching) q.teachingText = adding
      ? `Adding means putting things together. Count both groups. There are ${first + second} ${units} altogether.`
      : `Subtracting means taking things away. The crossed-out ${units} have been taken away. There are ${first - second} left.`;
    if (type.endsWith('introduction')) q.teachingText += adding ? ' The plus sign means add.' : ' The minus sign means take away.';
  } else if (type.startsWith('multiplication') || type === 'equal-groups') {
    const count = q.groupsCount ?? q.values?.[0] ?? 2;
    const size = q.groups?.[0] ?? q.values?.[1] ?? 2;
    q.groupsCount = count; q.groups = Array(count).fill(size); q.total = count * size;
    q.object = q.object || 'circle';
    const units = plural(familiarUnit(q.object));
    const each = !q.multiplication && !type.startsWith('multiplication');
    q.prompt = each
      ? `Look at the groups of ${units}. How many are in one group?`
      : `There ${count === 1 ? 'is' : 'are'} ${count} ${count === 1 ? 'group' : 'groups'}. Each group has ${size} ${units}. How many are there altogether?`;
    if (q.teaching) q.teachingText = `Equal groups have the same number in each group. Count ${size} in each group. There are ${count * size} ${units} altogether.`;
  } else if (type.startsWith('division') || type === 'sharing') {
    const total = q.total ?? q.dividend ?? 4;
    const count = q.groupsCount ?? q.friends ?? q.divisor ?? 2;
    q.total = total; q.groupsCount = count; q.groups = Array(count).fill(total / count); q.object = q.object || 'circle';
    const units = plural(familiarUnit(q.object));
    q.prompt = `Share ${total} ${units} equally into ${count} ${count === 1 ? 'group' : 'groups'}. How many go in one group?`;
    if (q.teaching) q.teachingText = `Give each group the same number. Each group gets ${total / count} ${units}.`;
  } else if (type === 'number') {
    q.prompt = 'Look at this number. Tap the same number below.';
  } else if (type === 'counting-shapes') {
    q.prompt = 'Count the shapes. Tap how many you can see.';
  } else if (type === 'shape-recognition') {
    q.prompt = 'Look at this shape. Tap the shape that is the same.';
  } else if (type === 'shape-sides') {
    q.prompt = 'Count the straight sides of this shape. Tap how many.';
  } else if (type === 'shape-corners') {
    const feature = ['star', 'heart', 'crescent'].includes(q.shape) ? 'pointy tips' : 'corners';
    q.prompt = `Count the ${feature} of this shape. Tap how many.`;
  } else if (type === 'shape-introduction') {
    const descriptions = { circle: 'It is round. It has no straight sides or corners.', square: 'It has four straight sides and four corners. Its sides are the same length.', triangle: 'It has three straight sides and three corners.', rectangle: 'It has four straight sides and four corners.', oval: 'It is round and stretched out, like an egg.', diamond: 'It looks like a tilted square.', star: 'Look at its five pointy tips.', heart: 'Look at the point at the bottom.', pentagon: 'Count its five straight sides.', hexagon: 'Count its six straight sides.', octagon: 'Count its eight straight sides.', crescent: 'It looks like a thin moon.', semicircle: 'It is half a circle. It has one straight side and one curved edge.' };
    q.teachingText = descriptions[q.shape] || q.teachingText;
  } else if (type === 'colour-recognition' && !q.teaching) {
    q.prompt = 'Look at this colour. Tap the same colour below.';
  } else if (type === 'matching') {
    if (q.quantity) q.prompt = 'Count the shapes. Tap how many you can see.';
    else if (q.match?.color && !q.match?.shape) q.prompt = 'Look at this colour. Tap the same colour below.';
    else if (BASIC_COLOURS.has(q.answer)) q.prompt = 'Look at this colour. Tap the same colour below.';
    else q.prompt = 'Look at this shape. Tap the shape that is the same.';
  } else if (type === 'sorting') {
    if (q.items && q.zones) {
      const zone = q.zones[0];
      const target = zone.targetShape ? plural(zone.targetShape) : `${zone.targetColor || 'matching'} shapes`;
      q.prompt = `Drag the ${target} into the box. Leave the other shapes where they are.`;
    }
    else if (q.twoProperties) q.prompt = `${q.prompt} Tap the group with that colour and shape.`;
  }
  return q;
}

export function mathsQuestionNarration(question) {
  const parts = [question.prompt];
  if (question.teaching && question.teachingText && question.teachingText !== question.prompt) parts.push(question.teachingText);
  return parts.join(' ').replace(/\b\d+\b/g, n => NUMBER_WORDS[Number(n)] ?? n);
}
