// Auth tokens never enter child progress. Each child has an isolated local cache.
export const PROGRESS_KEYS = [
  'oatle-report-attempt-reading', 'oatle-report-attempt-maths',
  'atli-space-progress', 'atli-writing-progress', 'atli-space-assessment-results',
  'atli-reading-assessment-attempt', 'oatle-reading-assessment-attempt',
  'oatle-maths-progress', 'oatle-maths-assessment-attempt',
  'oatle-child-profile', 'oatle-age-group',
  'oatle-little-explorers-progress', 'oatle-little-explorers-started', 'oatle-balloon-learning-session',
  'oatle-app-location', 'oatle-maths-location', 'oatle-little-location',
  'oatle-colouring-little', 'oatle-colouring-big', 'oatle-block-build-little', 'oatle-block-build-big',
  'oatle-space-builder-v1', 'oatle-cosmic-puzzles-v1', 'oatle-music-tune-v1',
];
let prefix = '';
let onChange = null;
export function selectProgressCache(userId, childId, changed) {
  prefix = `oatle-profile:${userId}:${childId}:`;
  onChange = changed || null;
}
export function clearProgressCacheSelection() { prefix = ''; onChange = null; }
export function progressSnapshot() {
  return Object.fromEntries(PROGRESS_KEYS.map(key => [key, localStorage.getItem(prefix + key)]).filter(([,value]) => value !== null));
}
export function replaceProgressCache(data) {
  for (const key of PROGRESS_KEYS) {
    if (typeof data[key] === 'string') localStorage.setItem(prefix + key, data[key]);
    else localStorage.removeItem(prefix + key);
  }
}
export function legacyProgressSnapshot() {
  return Object.fromEntries(PROGRESS_KEYS.map(key => [key, localStorage.getItem(key)]).filter(([,value]) => value !== null));
}
export const learningStorage = {
  getItem(key) { return localStorage.getItem(prefix + key); },
  setItem(key,value) {
    const next = String(value);
    if (localStorage.getItem(prefix + key) === next) return;
    localStorage.setItem(prefix + key,next); onChange?.();
  },
  removeItem(key) {
    if (localStorage.getItem(prefix + key) === null) return;
    localStorage.removeItem(prefix + key); onChange?.();
  },
};
