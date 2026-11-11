import { selectProgressCache, replaceProgressCache } from './profileStorage.js';

// Revisions reject stale writes. Unsynced progress remains in the child's local cache.
export function childProgressSync(client, userId, childId, playKey, onStatus = () => {}) {
  const metaKey = `oatle-progress-meta:${userId}:${childId}`;
  let meta;
  try { meta = JSON.parse(localStorage.getItem(metaKey)) || {}; } catch { meta = {}; }
  let cache, timer, inFlight, stopped = false;
  const remember = () => localStorage.setItem(metaKey, JSON.stringify(meta));
  const changed = () => {
    if (stopped) return;
    meta.dirty = true; remember(); onStatus('Saving progress…');
    clearTimeout(timer); timer = setTimeout(() => { void flush().catch(() => {}); }, 700);
  };
  async function flush() {
    clearTimeout(timer);
    if (inFlight) { await inFlight; if (meta.dirty) return flush(); return; }
    if (!meta.dirty || stopped) return;
    const data = cache.snapshot();
    inFlight = (async () => {
      const { data: result, error } = await client.rpc('save_child_progress', { p_child_id: childId, p_play_key: playKey, p_revision: meta.revision, p_data: data });
      if (error || result?.outcome !== 'saved') {
        if (!stopped) onStatus(result?.outcome === 'conflict' ? 'Progress changed on another device. Your local copy is safe.' : 'Saved on this device. Waiting to sync.');
        throw new Error(result?.outcome || 'sync_unavailable');
      }
      if (stopped) return;
      meta.revision = result.revision;
      meta.dirty = JSON.stringify(data) !== JSON.stringify(cache.snapshot());
      remember(); onStatus(meta.dirty ? 'Saving progress…' : 'Progress saved');
    })();
    try { await inFlight; } finally { inFlight = null; }
    if (meta.dirty) return flush();
  }
  return {
    hydrate(remote, { importData, useLatest = false } = {}) {
      cache = selectProgressCache(userId, childId, changed);
      const local = cache.snapshot();
      const sameData = JSON.stringify(Object.entries(local).sort()) === JSON.stringify(Object.entries(remote.data || {}).sort());
      if (meta.dirty && meta.revision !== remote.revision && !sameData && !useLatest) throw new Error('progress_conflict');
      if (meta.dirty && meta.revision === remote.revision && !useLatest) {
        // Preserve edits made before the last refresh, including offline edits.
      } else {
        if (meta.dirty && !sameData) localStorage.setItem(`${metaKey}:backup`, JSON.stringify(local));
        replaceProgressCache(remote.data || {}); meta.dirty = false;
      }
      meta.revision = remote.revision;
      if (importData && !meta.dirty && !Object.keys(local).length && remote.revision === 0 && !Object.keys(remote.data || {}).length) {
        replaceProgressCache(importData); meta.dirty = true;
      }
      remember();
      onStatus(meta.dirty ? 'Saving progress…' : 'Progress saved');
    },
    flush,
    get revision() { return meta.revision; },
    stop() { stopped = true; clearTimeout(timer); cache?.clear(); },
  };
}
