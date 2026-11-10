// Capture each visible layer before asynchronous SVG decoding starts. This keeps
// a download consistent even if the child keeps drawing or rotates the device.
export function captureDrawing(canvas) {
  if (!canvas || !canvas.width || !canvas.height) throw new Error('Drawing is not ready');
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) throw new Error('Drawing is not visible');
  const paper = canvas.parentElement;
  const ink = document.createElement('canvas');
  ink.width = canvas.width; ink.height = canvas.height;
  const context = ink.getContext('2d');
  if (!context) throw new Error('Drawing cannot be copied');
  context.drawImage(canvas, 0, 0);
  const relative = element => {
    const box = element.getBoundingClientRect();
    return { x: box.left - rect.left, y: box.top - rect.top, width: box.width, height: box.height };
  };
  const lines = [...paper.querySelectorAll('.scribbler-line')].map(line => ({ ...relative(line), colour: getComputedStyle(line).backgroundColor }));
  const stickers = [...paper.querySelectorAll('.scribbler-sticker-on-page svg, .little-sticker-on-canvas svg')].map(svg => {
    const copy = svg.cloneNode(true);
    const box = relative(svg);
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    copy.setAttribute('width', String(box.width)); copy.setAttribute('height', String(box.height));
    return { ...box, svg: new XMLSerializer().serializeToString(copy) };
  });
  const stars = paper.querySelector('.little-scribble-stars');
  const starStyle = stars && getComputedStyle(stars);
  return {
    width: rect.width, height: rect.height, ink, lines, stickers,
    background: getComputedStyle(paper).backgroundColor || '#fffdf5',
    stickersAboveInk: Boolean(paper.querySelector('.little-scribble-sticker-layer')),
    stars: stars ? { ...relative(stars), text: stars.textContent, colour: starStyle.color, font: starStyle.font, letterSpacing: starStyle.letterSpacing } : null,
  };
}

async function svgImage(svg) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export async function renderDrawing(snapshot, loadImage = svgImage) {
  const output = document.createElement('canvas');
  const scale = Math.min(2, 4096 / snapshot.width, 4096 / snapshot.height);
  output.width = Math.max(1, Math.round(snapshot.width * scale));
  output.height = Math.max(1, Math.round(snapshot.height * scale));
  const context = output.getContext('2d');
  if (!context) throw new Error('Picture export unavailable');
  const images = await Promise.all(snapshot.stickers.map(sticker => loadImage(sticker.svg)));
  context.scale(output.width / snapshot.width, output.height / snapshot.height);
  context.fillStyle = snapshot.background;
  context.fillRect(0, 0, snapshot.width, snapshot.height);
  for (const line of snapshot.lines) {
    context.fillStyle = line.colour;
    context.fillRect(line.x, line.y, line.width, line.height);
  }
  if (snapshot.stars) {
    const stars = snapshot.stars;
    context.font = stars.font; context.fillStyle = stars.colour;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.letterSpacing = stars.letterSpacing;
    context.fillText(stars.text, stars.x + stars.width / 2, stars.y + stars.height / 2);
  }
  const drawStickers = () => snapshot.stickers.forEach((sticker, i) => context.drawImage(images[i], sticker.x, sticker.y, sticker.width, sticker.height));
  if (!snapshot.stickersAboveInk) drawStickers();
  context.drawImage(snapshot.ink, 0, 0, snapshot.width, snapshot.height);
  if (snapshot.stickersAboveInk) drawStickers();
  return output;
}

export async function saveDrawing(canvas, filename) {
  const output = await renderDrawing(captureDrawing(canvas));
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Picture could not be prepared');
  return new File([blob], filename, { type: 'image/png' });
}
