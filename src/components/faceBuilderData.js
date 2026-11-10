export const FACE_PARTS = {
  eyes: [
    { id: 'bright', label: 'Bright eyes' }, { id: 'wide', label: 'Wide eyes' },
    { id: 'soft', label: 'Relaxed eyes' }, { id: 'downcast', label: 'Downcast eyes' },
    { id: 'narrow', label: 'Narrow eyes' },
  ],
  brows: [
    { id: 'relaxed', label: 'Relaxed eyebrows' }, { id: 'raised', label: 'Raised eyebrows' },
    { id: 'worried', label: 'Worried eyebrows' }, { id: 'frowning', label: 'Frowning eyebrows' },
  ],
  mouth: [
    { id: 'smile', label: 'Big smile' }, { id: 'frown', label: 'Downturned mouth' },
    { id: 'open', label: 'Round, open mouth' }, { id: 'gentle', label: 'Gentle smile' },
    { id: 'worry', label: 'Wobbly mouth' },
  ],
};

export const FEELING_FEATURES = {
  happy: { eyes: 'bright', brows: 'relaxed', mouth: 'smile' },
  sad: { eyes: 'downcast', brows: 'worried', mouth: 'frown' },
  angry: { eyes: 'narrow', brows: 'frowning', mouth: 'frown' },
  surprised: { eyes: 'wide', brows: 'raised', mouth: 'open' },
  scared: { eyes: 'wide', brows: 'worried', mouth: 'worry' },
  calm: { eyes: 'soft', brows: 'relaxed', mouth: 'gentle' },
};

// These are drawing challenges, not rules for interpreting a real child's feelings.
export const FACE_CHALLENGES = [
  { id: 'happy', label: 'Happy', instruction: 'Make a happy face.',
    accepted: { eyes: ['bright', 'soft'], brows: ['relaxed', 'raised'], mouth: ['smile'] },
    hints: { mouth: 'Try the big smiling mouth.', brows: 'Try relaxed or raised eyebrows.', eyes: 'Try bright or relaxed eyes.' },
    reflection: 'A big smile can help us draw happiness. People show happiness in different ways.' },
  { id: 'sad', label: 'Sad', instruction: 'Make a sad face.',
    accepted: { eyes: ['downcast', 'bright'], brows: ['worried'], mouth: ['frown'] },
    hints: { mouth: 'Try the mouth that turns down.', brows: 'Try the worried eyebrows, lifted in the middle.', eyes: 'Try downcast or bright eyes.' },
    reflection: 'Worried eyebrows and a downturned mouth can help us draw sadness. Sad feelings are okay.' },
  { id: 'angry', label: 'Angry', instruction: 'Make an angry face.',
    accepted: { eyes: ['narrow', 'bright'], brows: ['frowning'], mouth: ['frown', 'worry'] },
    hints: { mouth: 'Try a downturned or wobbly mouth.', brows: 'Try eyebrows that point down towards the nose.', eyes: 'Try narrow or bright eyes.' },
    reflection: 'Frowning eyebrows can help us draw anger. Feeling angry is okay; we can still choose kind actions.' },
  { id: 'surprised', label: 'Surprised', instruction: 'Make a surprised face.',
    accepted: { eyes: ['wide'], brows: ['raised'], mouth: ['open'] },
    hints: { mouth: 'Try the round, open mouth.', brows: 'Try the high, raised eyebrows.', eyes: 'Try the big, wide eyes.' },
    reflection: 'Wide eyes, raised eyebrows and an open mouth can help us draw surprise.' },
  { id: 'scared', label: 'Scared', instruction: 'Make a scared face.',
    accepted: { eyes: ['wide', 'downcast'], brows: ['worried'], mouth: ['worry', 'open'] },
    hints: { mouth: 'Try a wobbly or round, open mouth.', brows: 'Try the worried eyebrows.', eyes: 'Try wide or downcast eyes.' },
    reflection: 'Worried eyebrows can help us draw fear. It is okay to ask a trusted grown-up for comfort.' },
  { id: 'calm', label: 'Calm', instruction: 'Make a calm face.',
    accepted: { eyes: ['soft'], brows: ['relaxed'], mouth: ['gentle', 'smile'] },
    hints: { mouth: 'Try a gentle smile or a big smile.', brows: 'Try the relaxed eyebrows.', eyes: 'Try the relaxed eyes.' },
    reflection: 'Relaxed eyes and a gentle smile can help us draw calm. We can ask someone how they feel.' },
];

export function changeFacePart(features, part, value) {
  return FACE_PARTS[part]?.some(option => option.id === value) ? { ...features, [part]: value } : features;
}

export function checkFace(challenge, features) {
  for (const part of ['mouth', 'brows', 'eyes']) {
    if (!challenge.accepted[part].includes(features[part])) return { complete: false, part, message: challenge.hints[part] };
  }
  return { complete: true, part: null, message: challenge.reflection };
}
