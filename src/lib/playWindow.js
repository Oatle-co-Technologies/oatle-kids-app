// A device can reuse its lease after a window closes only while the browser
// guarantees that another window on this origin is not using the same key.
export async function acquirePlayWindow(locks, name) {
  if (!locks) return undefined;
  return new Promise((resolve, reject) => {
    locks.request(name, { ifAvailable: true }, lock => {
      if (!lock) {
        resolve(null);
        return;
      }
      return new Promise(release => resolve(release));
    }).catch(reject);
  });
}
