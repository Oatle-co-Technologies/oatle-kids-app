// Warm only the upcoming screen/round; retain native eager image loading.
const requested = new Set();
export function preloadImages(sources) {
  if (typeof Image === 'undefined') return;
  for (const src of sources.filter(Boolean)) {
    if (requested.has(src)) continue;
    requested.add(src);
    const image = new Image();
    image.onerror = () => requested.delete(src);
    image.src = src;
  }
}
