// Archive device learning state by authenticated account before switching parents.
// Unowned legacy state is retained locally but never attributed or emailed automatically.
export function prepareAccountStorage(storage, userId) {
 const owner = storage.getItem('oatle-storage-owner');
 if (owner === userId) return false;
 const keys = Object.keys(storage).filter(key => /^(atli-|oatle-)/.test(key) && !key.startsWith('oatle-account-state-') && key !== 'oatle-storage-owner');
 const snapshot = Object.fromEntries(keys.map(key => [key,storage.getItem(key)]));
 if (keys.length) storage.setItem(`oatle-account-state-${owner || 'unlinked'}`,JSON.stringify(snapshot));
 for (const key of keys) storage.removeItem(key);
 storage.removeItem('oatle-storage-owner');
 if (userId) {
  const saved = JSON.parse(storage.getItem(`oatle-account-state-${userId}`) || '{}');
  for (const [key,value] of Object.entries(saved)) storage.setItem(key,value);
  storage.setItem('oatle-storage-owner',userId);
 }
 return true;
}
