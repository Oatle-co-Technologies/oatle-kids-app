import { useEffect, useRef, useState } from 'react';
import { storybooks } from '../data/storybooks';
import LocalBackButton from './LocalBackButton';
import './StorybookAdventure.css';

function BookReader({ book, onClose }) {
  const pages = [book.cover, ...book.pages];
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(null);
  const [simple, setSimple] = useState(false);
  const [zoom, setZoom] = useState(false);
  const stage = useRef(null);
  const [portraitReading, setPortraitReading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState({});
  const [failed, setFailed] = useState({});
  const dialog = useRef(null);
  const leaf = useRef(null);
  const locked = useRef(false);
  const touch = useRef(null);
  const current = pages[page];

  useEffect(() => {
    const modal = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    return () => { document.body.style.overflow = overflow; modal.close(); };
  }, []);

  useEffect(() => {
    const frame = stage.current;
    const observer = new ResizeObserver(([entry]) => {
      frame.style.setProperty('--stage-height', `${entry.contentRect.height}px`);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Keep only the current and neighbouring original images decoded in the reader.
  useEffect(() => {
    let active = true;
    for (const src of pages.slice(Math.max(0, page - 1), page + 2)) {
      const img = new Image();
      img.onload = () => { if (active) { setLoaded(old => ({ ...old, [src]: { ratio: img.naturalWidth / img.naturalHeight } })); setFailed(old => ({ ...old, [src]: false })); } };
      img.onerror = () => { if (active) setFailed(old => ({ ...old, [src]: true })); };
      img.src = src;
    }
    return () => { active = false; };
  // Only the selected book and current page affect the preload window.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, page, retry]);

  useEffect(() => {
    if (!turn) return;
    const element = leaf.current;
    const direction = turn.to > page ? -1 : 1;
    let animation;
    let active = true;
    const finish = () => {
      if (!active) return;
      setPage(turn.to);
      setTurn(null);
      locked.current = false;
    };
    // A time limit also completes a turn if the browser suspends animation events.
    const timeout = window.setTimeout(finish, 1000);
    try {
      animation = element.animate([
        { transform: 'rotateY(0deg)', filter: 'brightness(1)' },
        { transform: `rotateY(${direction * 90}deg)`, filter: 'brightness(.65)' },
      ], { duration: 280, easing: 'ease-in', fill: 'forwards' });
      animation.finished.then(() => {
        if (!active) return;
        // At the spine, exchange the leaf and unfold the next authored page.
        element.style.setProperty('--page-ratio', loaded[pages[turn.to]]?.ratio || 1.5);
        element.querySelector('img').src = pages[turn.to];
        animation = element.animate([
          { transform: `rotateY(${-direction * 90}deg)`, filter: 'brightness(.65)' },
          { transform: 'rotateY(0deg)', filter: 'brightness(1)' },
        ], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        animation.finished.then(finish).catch(finish);
      }).catch(finish);
    } catch { finish(); }
    return () => { active = false; clearTimeout(timeout); animation?.cancel(); };
  // The page list is fixed for this keyed reader instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, page]);

  const navigate = (delta) => {
    const to = page + delta;
    if (locked.current || to < 0 || to >= pages.length || !loaded[pages[to]] || failed[pages[to]]) return;
    if (simple || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !leaf.current?.animate) {
      setPage(to);
      return;
    }
    locked.current = true;
    setTurn({ to });
  };
  const last = page === pages.length - 1;
  const busy = Boolean(turn);
  return (
    <dialog ref={dialog} className="storybook-reader" aria-labelledby="storybook-title" onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.target.tagName === 'INPUT' || zoom) return;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
        }
      }}>
      <div className="storybook-reader-inner">
        <img className="storybook-art-backdrop" src={current} alt="" aria-hidden="true" />
        <header className="storybook-reader-header">
          <h2 id="storybook-title">{book.title}</h2>
          <button type="button" onClick={onClose} autoFocus aria-label="Back to bookshelf">← Books</button>
        </header>
        <div ref={stage} className={`storybook-stage ${zoom ? 'storybook-zoom' : ''}`} style={{ '--page-ratio': loaded[current]?.ratio || 1.5 }} aria-busy={busy}
          onTouchStart={(event) => { touch.current = event.touches.length === 1 && !zoom ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
          onTouchMove={(event) => { if (event.touches.length > 1) touch.current = null; }}
          onTouchCancel={() => { touch.current = null; }}
          onTouchEnd={(event) => {
            const start = touch.current; touch.current = null;
            if (!start || zoom || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(dx < 0 ? 1 : -1);
          }}>
          {!portraitReading && <div className="storybook-rotate-prompt">
            <span aria-hidden="true">↻ ▭</span>
            <h3>Turn your phone sideways</h3>
            <p>These picture books are best read in landscape.</p>
            <button type="button" onClick={() => setPortraitReading(true)}>Read here for now</button>
          </div>}
          {turn && <img className="storybook-underlay" src={pages[turn.to]} alt="" aria-hidden="true" />}
          <div ref={leaf} className="storybook-leaf" key={page}>
            <img src={current} alt={`${book.title} — ${page === 0 ? 'original cover' : `illustrated page ${page}`}`} draggable="false"
              onLoad={event => { const image = event.currentTarget; const src = new URL(image.src).pathname; const ratio = image.naturalWidth / image.naturalHeight; setLoaded(old => ({ ...old, [src]: { ratio } })); }}
              onError={() => setFailed(old => ({ ...old, [current]: true }))} />
          </div>
        </div>
        {pages.slice(Math.max(0, page - 1), page + 2).some(src => failed[src]) && <p role="alert">An illustration could not load. Reconnect and <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button>.</p>}
        {!loaded[current] && !failed[current] && <p role="status">Loading illustration…</p>}
        <footer className="storybook-reader-footer">
          <div className="storybook-navigation">
            <button type="button" onClick={() => navigate(-1)} disabled={busy || page === 0 || !loaded[pages[page - 1]]}>← Previous</button>
            <span role="status" aria-live="polite">{page === 0 ? 'Cover' : `Page ${page} of ${book.pages.length}`}</span>
            {last ? <button type="button" onClick={onClose}>Bookshelf →</button> : <button type="button" onClick={() => navigate(1)} disabled={busy || !loaded[pages[page + 1]] || failed[pages[page + 1]]}>{page === 0 ? 'Open book' : 'Next'} →</button>}
          </div>
          <details className="storybook-options"><summary>Reading options</summary><div className="storybook-reading-options">
            <button type="button" disabled={busy} aria-pressed={zoom} onClick={() => setZoom(value => !value)}>{zoom ? 'Fit page' : 'Enlarge page'}</button>
            <label><input type="checkbox" checked={simple} onChange={event => setSimple(event.target.checked)} /> Simple page turns</label>
          </div></details>
          <p>{zoom ? 'Scroll to explore the enlarged illustration. Use the buttons to turn pages.' : last ? 'The end. Read again, or choose another book.' : 'Swipe or use the arrows to turn the page. Enlarge for smaller text.'}</p>
        </footer>
      </div>
    </dialog>
  );
}

export default function StorybookAdventure({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [lastBook, setLastBook] = useState(null);
  const bookButtons = useRef({});
  const openBook = (book) => {
    setLastBook(book.id);
    setSelected(book);
  };
  const closeBook = () => {
    const id = selected.id;
    setSelected(null);
    requestAnimationFrame(() => bookButtons.current[id]?.focus());
  };
  return (
    <main className="storybook-library">
      <LocalBackButton onClick={onBack} label="Adventures" />
      <header><p className="eyebrow">OATLE KIDS · STORYBOOK ADVENTURE</p><h1>A little shelf of wonder</h1><p>Choose a book. A new adventure is waiting inside.</p></header>
      <section className="storybook-shelf" aria-label="Storybook bookshelf">
        {storybooks.map(book => <button type="button" key={book.id} ref={element => { bookButtons.current[book.id] = element; }} className={`storybook-cover ${lastBook === book.id ? 'storybook-selected' : ''}`}
          aria-label={`Read ${book.title}`} onClick={() => openBook(book)}>
          <img src={book.cover} alt={`${book.title} original cover`} loading="lazy" />
          <strong>{book.title}</strong><small>By {book.author}</small><span>{lastBook === book.id ? 'Read again' : 'Open book'} →</span>
        </button>)}
      </section>
      {selected && <BookReader key={selected.id} book={selected} onClose={closeBook} />}
    </main>
  );
}
