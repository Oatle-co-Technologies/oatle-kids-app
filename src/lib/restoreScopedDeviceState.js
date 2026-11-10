// Recover namespaced device caches archived by the earlier account-only release.
// Existing values win; unscoped legacy child data and auth tokens stay untouched.
export function restoreScopedDeviceState(storage) {
 for (const archive of Object.keys(storage).filter(key => key.startsWith('oatle-account-state-'))) {
  try {
   const saved = JSON.parse(storage.getItem(archive) || '{}');
   for (const [key,value] of Object.entries(saved)) {
    const scoped = /^oatle-(profile:|progress-meta:|report-queue-)/.test(key) || key === 'oatle-device-key';
    if (scoped && typeof value === 'string' && storage.getItem(key) === null) storage.setItem(key,value);
   }
  } catch { /* Retain the archive if storage is unavailable or malformed. */ }
 }
}
