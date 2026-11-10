import { readSavedActivity, saveActivity } from '../utils/savedActivity';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { COLORING_COLOURS, COLORING_PAGES } from './coloringPages';
import { changeColouring, colourRegion, emptyColouring, redoColouring, undoColouring } from './coloringLogic';
import { speak, stopSpeech } from '../utils/speech';
import './ColoringBook.css';
import MediaSaveDialog from './MediaSaveDialog';

function Picture({ page, colours = {}, little, onColour, pictureRef, titleId }) {
  const artRef = useRef(null);
  const [viewBox, setViewBox] = useState('0 0 600 440');
  useLayoutEffect(() => {
    const bounds = artRef.current?.getBBox();
    if (!bounds || !bounds.width || !bounds.height) return;
    const padding = little ? 20 : 14;
    setViewBox(`${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`);
  }, [page, little]);
  return <svg ref={pictureRef} className="colouring-picture" xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
    style={{ backgroundColor: colours.background || '#ffffff' }}
    onClick={onColour ? event => { if (event.target === event.currentTarget) onColour('background', 'Background'); } : undefined}
    role={onColour ? 'group' : 'img'} aria-labelledby={titleId}>
    <title id={titleId}>{page.title}{onColour ? '. Choose a colour and tap a part of the picture.' : ''}</title>
    {/* Cover the fitted viewBox, including its padding, so every blank area is paintable. */}
    <rect x={viewBox.split(' ')[0]} y={viewBox.split(' ')[1]}
      width={viewBox.split(' ')[2]} height={viewBox.split(' ')[3]}
      fill={colours.background || '#ffffff'}
      className={onColour ? 'colouring-region' : undefined}
      role={onColour ? 'button' : undefined} tabIndex={onColour ? 0 : undefined}
      aria-label={onColour ? 'Colour background' : undefined}
      onClick={onColour ? () => onColour('background', 'Background') : undefined}
      onKeyDown={onColour ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onColour('background', 'Background'); } } : undefined} />
    <g ref={artRef}>
    {page.regions.map(({ id, label, type: Shape, attrs }) => <Shape key={id} {...attrs}
      fill={colours[id] || '#ffffff'} stroke="#273449" strokeWidth={little ? 9 : 5}
      strokeLinejoin="round" strokeLinecap="round"
      className={onColour ? 'colouring-region' : undefined}
      role={onColour ? 'button' : undefined} tabIndex={onColour ? 0 : undefined}
      aria-label={onColour ? `Colour ${label.toLowerCase()}` : undefined}
      onClick={onColour ? () => onColour(id, label) : undefined}
      onKeyDown={onColour ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onColour(id, label); } } : undefined} />)}
    {page.details?.map((d, i) => <path key={i} d={d} fill="none" stroke="#273449" strokeWidth={little ? 7 : 4} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />)}
    </g>
  </svg>;
}

export default function ColoringBook({ ageGroup = 'big', onBack, onComplete, soundOn = true }) {
  const little = ageGroup === 'little';
  const pictures = COLORING_PAGES[little ? 'little' : 'big'];
  const storageKey = `oatle-colouring-${ageGroup}`;
  const [pageIndex, setPageIndex] = useState(() => Math.max(0, Math.min(pictures.length - 1, readSavedActivity(storageKey, {}).pageIndex || 0)));
  const [book, setBook] = useState(() => readSavedActivity(storageKey, {}).book || {});
  useEffect(() => { saveActivity(storageKey, { pageIndex, book }); }, [storageKey, pageIndex, book]);
  const [colour, setColour] = useState(COLORING_COLOURS[0][1]);
  const [erasing, setErasing] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [message, setMessage] = useState('Choose a colour, then tap a part of the picture.');
  const [preparedFile, setPreparedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const pictureRef = useRef(null);
  const mounted = useRef(true);
  const titleId = useId();
  const page = pictures[pageIndex];
  const state = book[page.id] || emptyColouring();
  const coloured = Object.keys(state.colours).length;

  useEffect(() => {
    mounted.current = true;
    if (soundOn) speak('Coloring Book. Choose a colour, then tap a part of your picture.');
    return () => { mounted.current = false; stopSpeech(); };
  }, [soundOn]);

  function update(edit) {
    setBook(current => ({ ...current, [page.id]: edit(current[page.id] || emptyColouring()) }));
    setFinished(false);
  }
  function fill(region, label) {
    update(current => colourRegion(current, region, erasing ? null : colour));
    setMessage(erasing ? `${label} erased.` : `${label} coloured. Make it your own!`);
  }
  function choosePage(index) {
    setPageIndex(index); setFinished(false);
    setMessage(`${pictures[index].title}. Your other pictures stay here while you colour.`);
  }
  async function downloadPicture() {
    if (saving || !pictureRef.current) return;
    setSaving(true);
    let imageUrl;
    try {
      const svg = pictureRef.current.cloneNode(true);
      svg.setAttribute('width', '1200'); svg.setAttribute('height', '880');
      imageUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = imageUrl; });
      if (!mounted.current) return;
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 880;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Picture export unavailable');
      context.fillStyle = state.colours.background || '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob || !mounted.current) return;
      setPreparedFile(new File([blob], `oatle-kids-${page.id}.png`, { type: 'image/png' }));
      setMessage('Your picture is ready! Choose how to save it.');
    } catch {
      if (mounted.current) setMessage('Your picture could not download. Please try again.');
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (mounted.current) setSaving(false);
    }
  }
  function finish() {
    if (!coloured || finished) return;
    stopSpeech(); setFinished(true); setMessage('Beautiful colouring! You finished your picture.');
    if (soundOn && !onComplete) speak('Beautiful colouring! You finished your picture.');
    onComplete?.();
  }

  return <main className={`colouring-book ${little ? 'colouring-book-little' : ''}`} aria-label="Coloring Book">
    <header className="colouring-heading">
      <button type="button" className="colouring-back" aria-label="Back" onClick={onBack}>← Back</button>
      <div className="colouring-page-navigation" aria-label="Picture navigation">
        <button type="button" aria-label="Previous picture" disabled={pageIndex === 0} onClick={() => choosePage(pageIndex - 1)}>←</button>
        <div className="colouring-page-title"><h1>{page.title}</h1><span>Coloring Book · {pageIndex + 1} of {pictures.length}</span></div>
        <button type="button" aria-label="Next picture" disabled={pageIndex === pictures.length - 1} onClick={() => choosePage(pageIndex + 1)}>→</button>
      </div>
      <button type="button" className="colouring-tools-toggle" aria-label="Picture tools" aria-expanded={toolsOpen} onClick={() => setToolsOpen(!toolsOpen)}>⋯ <span>Tools</span></button>
      <button type="button" className="colouring-done" disabled={!coloured || finished} onClick={finish}>✓ {finished ? 'Finished!' : 'Done'}</button>
    </header>
    <div className="colouring-actions" role="group" aria-label="Picture tools" hidden={!toolsOpen} onClick={() => setToolsOpen(false)}>
      <button type="button" aria-pressed={erasing} onClick={() => { setErasing(!erasing); setMessage(erasing ? 'Choose a colour and tap.' : 'Tap a coloured shape to erase it.'); }}>◇ Erase</button>
      <button type="button" disabled={!state.past.length} onClick={() => { update(undoColouring); setMessage('Last change undone.'); }}>↶ Undo</button>
      <button type="button" disabled={!state.future.length} onClick={() => { update(redoColouring); setMessage('Change redone.'); }}>↷ Redo</button>
      <button type="button" aria-label="Start again" disabled={!coloured} onClick={() => { update(current => changeColouring(current, {})); setMessage('Fresh page! Tap Undo to bring your colours back.'); }}>↺ Clear</button>
      <button type="button" disabled={!coloured || saving} onClick={downloadPicture}>{saving ? 'Preparing…' : '↓ Save picture'}</button>
    </div>
    <section className="colouring-paper" aria-label="Colour your picture">
      <Picture page={page} colours={state.colours} little={little} onColour={fill} pictureRef={pictureRef} titleId={titleId} />
    </section>
    <MediaSaveDialog file={preparedFile} onClose={() => setPreparedFile(null)} />
    <footer className="colouring-palette" role="group" aria-label="Colours">
      {COLORING_COLOURS.map(([name, value]) => <button key={name} type="button" aria-label={name} title={name} aria-pressed={!erasing && colour === value}
        style={{ '--paint': value }} onClick={() => { setColour(value); setErasing(false); setMessage(`${name} selected. Tap a part of the picture.`); if (soundOn) speak(name); }}><span aria-hidden="true">{!erasing && colour === value ? '✓' : ''}</span></button>)}
    </footer>
    <p className={`colouring-message ${finished || message.includes("ready!") || message.includes("could not") ? "colouring-feedback" : ""}`} role="status">{message}</p>
  </main>;
}
