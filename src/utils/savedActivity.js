import { learningStorage } from '../lib/profileStorage.js';
// Reading storage must never replace existing progress with defaults on refresh.
export function readSavedActivity(key, fallback) {
  try {
    const value = JSON.parse(learningStorage.getItem(key));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}
export function saveActivity(key, value) {
  try { learningStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep play available when storage is unavailable. */ }
}
export function resumeScreen(saved, allowed, fallback) {
  return allowed.includes(saved?.screen) ? saved.screen : fallback;
}
