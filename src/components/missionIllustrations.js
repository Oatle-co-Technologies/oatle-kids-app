// Visual associations only. IDs, curriculum, locks and completion come from callers.
export const MISSION_ILLUSTRATIONS = {
  reading: [['uppercase'], ['lowercase'], ['letter-pair'], ['ear'], ['book'], ['pencil'], ['blocks'], ['storybook'], ['trophy']],
  writing: [['uppercase', 'pencil'], ['numbers', 'pencil'], ['shapes', 'pencil'], ['blocks', 'pencil']],
  counting: [['numbers'], ['shapes'], ['shapes', 'numbers'], ['palette'], ['blocks', 'shapes'], ['plus'], ['minus'], ['sharing'], ['trophy']],
  balloons: [['numbers'], ['numbers'], ['uppercase'], ['uppercase'], ['palette']],
  shapes: [['circle'], ['square'], ['triangle'], ['rectangle'], ['star']],
  trail: [['pencil'], ['pencil'], ['pencil'], ['pencil'], ['pencil']],
  scribble: [['palette', 'pencil']],
  discovery: [['numbers', 'blocks'], ['blocks', 'blocks']],
  building: [['blocks'], ['house'], ['bridge'], ['rocket']],
  animals: [['animal-food'], ['house'], ['ear']],
  puzzles: [['lion-puzzle'], ['cow-puzzle'], ['turtle-puzzle']],
  music: [['music'], ['ear', 'music'], ['dance']],
};

export function missionIllustration(adventureId, item, index) {
  if (item.free || item.id === 'scribbler') return ['palette', 'pencil'];
  return MISSION_ILLUSTRATIONS[adventureId]?.[index] || [item.assessment ? 'trophy' : 'book'];
}

export function missionIconPath(key) {
  return key === 'rocket' ? '/rocket/oatle-rocket.png' : `/mission-icons/${key}.webp`;
}
