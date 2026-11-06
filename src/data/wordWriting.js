export const WRITING_WORDS = ['cat', 'dog', 'sun', 'hat', 'pen', 'bag', 'cup', 'bed', 'pig', 'hen'];

// Version 1 had sentences at step 4. Insert words at 4, move sentences to 5,
// and preserve access to the sentence mission for children who already had it.
export function migrateWritingProgress(saved) {
  const defaults = { version: 2, unlocked: 1, missions: {}, startedMissions: {}, completedMissions: {} };
  if (!saved) return defaults;
  if (saved.version >= 2) return { ...defaults, ...saved };
  const moveSentences = values => Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [key === '4' ? '5' : key, value]));
  const oldUnlocked = Math.max(1, Math.min(4, saved.unlocked || 1));
  const inferredCompleted = Object.fromEntries(Array.from({ length: oldUnlocked - 1 }, (_, i) => [i + 1, true]));
  return {
    ...defaults, ...saved, version: 2,
    unlocked: oldUnlocked >= 4 || saved.completedMissions?.[4] ? 5 : oldUnlocked,
    missions: moveSentences(saved.missions),
    startedMissions: moveSentences(saved.startedMissions),
    completedMissions: { ...inferredCompleted, ...moveSentences(saved.completedMissions), 4: false },
  };
}
