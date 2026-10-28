import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import puzzleScenes from '../assets/images/puzzles/puzzle-scenes.png';
import './PuzzleAdventure.css';

const PUZZLES = [
  {
    id: 'garden', title: 'Safari Friends', scene: 0, count: 10,
    pieces: [
      { id: 'sun', art: '☀️', label: 'sunny sky', colour: '#66caff' },
      { id: 'cloud', art: '☁️', label: 'soft cloud', colour: '#8ad7f4' }, { id: 'rainbow', art: '🌈', label: 'rainbow', colour: '#6cc8e9' }, { id: 'bird', art: '🐦', label: 'little bird', colour: '#72ccec' },
      { id: 'flower', art: '🌷', label: 'flower garden', colour: '#75cd7a' },
      { id: 'tulip', art: '🌼', label: 'yellow flower', colour: '#80cf76' }, { id: 'bee', art: '🐝', label: 'busy bee', colour: '#72c977' }, { id: 'butterfly', art: '🦋', label: 'butterfly', colour: '#75c978' }, { id: 'tree', art: '🌳', label: 'green tree', colour: '#6bbe72' }, { id: 'grass', art: '🌱', label: 'new grass', colour: '#66ba6e' },
    ],
  },
  {
    id: 'farm', title: 'Farm Friends', scene: 1, count: 10,
    pieces: [
      { id: 'tractor', art: '🚜', label: 'farm tractor', colour: '#f4bb53' },
      { id: 'sun', art: '☀️', label: 'farm sunshine', colour: '#75c7e9' }, { id: 'cloud', art: '☁️', label: 'farm cloud', colour: '#8bdaf2' },
      { id: 'cow', art: '🐮', label: 'happy cow', colour: '#86c977' },
      { id: 'barn', art: '🏠', label: 'red barn', colour: '#df746d' }, { id: 'chicken', art: '🐔', label: 'little chicken', colour: '#e9c85d' }, { id: 'sheep', art: '🐑', label: 'fluffy sheep', colour: '#86ca77' }, { id: 'field', art: '🌾', label: 'golden field', colour: '#e8c75d' }, { id: 'fence', art: '🪵', label: 'farm fence', colour: '#b88355' }, { id: 'apple', art: '🍎', label: 'red apple', colour: '#79c777' },
    ],
  },
  {
    id: 'ocean', title: 'Ocean Friends', scene: 2, count: 10,
    pieces: [
      { id: 'fish', art: '🐠', label: 'little fish', colour: '#4bb7e5' },
      { id: 'dolphin', art: '🐬', label: 'dolphin', colour: '#579cdd' },
      { id: 'whale', art: '🐳', label: 'friendly whale', colour: '#5f92df' },
      { id: 'octopus', art: '🐙', label: 'octopus', colour: '#7b82d5' },
      { id: 'shell', art: '🐚', label: 'seashell', colour: '#f0a7c4' },
      { id: 'star', art: '⭐', label: 'starfish', colour: '#e5bd55' },
      { id: 'crab', art: '🦀', label: 'little crab', colour: '#e78577' }, { id: 'turtle', art: '🐢', label: 'sea turtle', colour: '#61bc9b' }, { id: 'coral', art: '🪸', label: 'coral reef', colour: '#e18aa5' }, { id: 'wave', art: '🌊', label: 'ocean wave', colour: '#42a9dc' },
    ],
  },
];

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

export function PuzzleIcon() {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path d="M10 50h24a12 12 0 1 1 22 0h34v40H10z" fill="#ffdc70" />
    <path d="M10 10h40v25a12 12 0 1 0 0 22v33H10z" fill="#70c6ff" />
    <path d="M50 10h40v40H66a12 12 0 1 0-22 0H10" fill="#ff8496" />
    <path d="M50 50h40v40H50V66a12 12 0 1 1 0-22" fill="#83d696" />
  </svg>;
}

export default function PuzzleAdventure({ onBack, soundOn }) {
  const [mode, setMode] = useState('menu');
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [order, setOrder] = useState(() => shuffle(PUZZLES[0].pieces));
  const [placed, setPlaced] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const slotRefs = useRef({});
  const [message, setMessage] = useState('');
  const puzzle = PUZZLES[puzzleIndex];
  const complete = placed.length === puzzle.pieces.length;
  const fragmentStyle = (piece, index) => ({ '--piece-colour': piece.colour, backgroundImage: `url(${puzzleScenes})`, backgroundSize: '1500% 200%', backgroundPosition: `${((puzzle.scene * 5 + index % 5) / 14) * 100}% ${Math.floor(index / 5) * 100}%` });

  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const prompt = mode === 'menu' ? 'Puzzle adventure. Put together a big, beautiful picture.'
      : mode === 'choose' ? 'Choose a picture puzzle.'
        : `Put the ${puzzle.title} picture together. Tap a piece, then tap its matching space.`;
    const timer = window.setTimeout(() => speak(prompt), 220);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [mode, puzzle, soundOn]);

  function reset(index = puzzleIndex) {
    setPuzzleIndex(index);
    setOrder(shuffle(PUZZLES[index].pieces));
    setPlaced([]);
    setSelectedId(null);
    setDragging(null);
    setMessage('');
  }

  function choosePuzzle(index) {
    reset(index);
    setMode('play');
  }

  function placePiece(piece) {
    if (!selectedId || placed.includes(piece.id) || complete) return;
    if (selectedId !== piece.id) {
      setMessage('Try the matching space.');
      return;
    }
    const next = [...placed, piece.id];
    setPlaced(next);
    setSelectedId(null);
    const done = next.length === puzzle.pieces.length;
    const feedback = done ? `You made the ${puzzle.title} picture!` : 'It fits! Choose another piece.';
    setMessage(feedback);
    if (soundOn) speak(feedback);
  }
  function startDrag(piece, event) { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); setDragging({ piece, pointerId: event.pointerId, x: event.clientX, y: event.clientY }); setMessage(`Find the ${piece.label} part of the picture.`); }
  function moveDrag(piece, event) { if (dragging?.piece.id === piece.id && dragging.pointerId === event.pointerId) setDragging((current) => current ? { ...current, x: event.clientX, y: event.clientY } : current); }
  function endDrag(piece, event) { if (dragging?.piece.id !== piece.id || dragging.pointerId !== event.pointerId) return; const target = puzzle.pieces.find((item) => { const rect = slotRefs.current[item.id]?.getBoundingClientRect(); return rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom; }); setDragging(null); if (!target) { setMessage('Drop it onto the picture board.'); return; } placePiece(target); }

  const title = mode === 'menu' ? 'Puzzle Adventure' : mode === 'choose' ? 'Choose a Picture' : puzzle.title;

  return <main className="little-explorers-page puzzle-page">
    <header className="puzzle-header">
      <LocalBackButton label={mode === 'menu' ? 'Adventures' : mode === 'play' ? 'Pictures' : 'Puzzle Adventure'} onClick={() => mode === 'menu' ? onBack() : mode === 'play' ? setMode('choose') : setMode('menu')} />
      <p className="eyebrow">LITTLE EXPLORERS / PUZZLES</p>
      <h1>{title}</h1>
      <p>{mode === 'menu' ? 'Little pieces make a whole picture.' : mode === 'choose' ? 'Start with a big, simple picture.' : 'Tap a picture piece, then tap where it belongs.'}</p>
    </header>

    {mode === 'menu' ? <section className="puzzle-mode-grid" aria-label="Puzzle activities">
      <button className="puzzle-mode-card" type="button" onClick={() => setMode('choose')}>
        <span className="puzzle-mode-art" aria-hidden="true">🧩</span><span>01 · BIG PICTURES</span><strong>Put It Together</strong><small>Put large picture pieces in the right spaces.</small><b>Choose a picture ↗</b>
      </button>
      <p className="puzzle-grownup">Start with two pieces, then try a bigger picture together.</p>
    </section> : mode === 'choose' ? <section className="puzzle-choice-grid" aria-label="Choose a picture puzzle">
      {PUZZLES.map((item, index) => <button type="button" key={item.id} onClick={() => choosePuzzle(index)}>
        <span aria-hidden="true">{item.pieces.map((piece) => piece.art).join(' ')}</span><strong>{item.title}</strong><small>{item.count} big pieces</small>
      </button>)}
    </section> : <section className="puzzle-workshop" aria-label={`${puzzle.title} picture puzzle`}>
      <div className={`puzzle-board puzzle-board-${puzzle.pieces.length}`}>
        {puzzle.pieces.map((piece, index) => <div key={piece.id} ref={(node) => { slotRefs.current[piece.id] = node; }} className={`puzzle-slot ${placed.includes(piece.id) ? 'is-filled' : ''}`} style={fragmentStyle(piece, index)}>
          {!placed.includes(piece.id) && <span className="puzzle-slot-hint">{piece.art}</span>}
        </div>)}
      </div>
      <p className="puzzle-help">{complete ? 'Your whole picture is ready!' : 'Choose a piece below.'}</p>
      <div className="puzzle-piece-tray" aria-label="Picture pieces">
        {order.filter((piece) => !placed.includes(piece.id)).map((piece) => { const index = puzzle.pieces.findIndex((item) => item.id === piece.id); return <button key={piece.id} type="button" className={`puzzle-piece ${dragging?.piece.id === piece.id ? 'is-dragging' : ''}`} style={fragmentStyle(piece, index)} onPointerDown={(event) => startDrag(piece, event)} onPointerMove={(event) => moveDrag(piece, event)} onPointerUp={(event) => endDrag(piece, event)} onPointerCancel={() => setDragging(null)} aria-label={`Drag ${piece.label} to the picture`}><span>{piece.art}</span></button>; })}
      </div>
      {dragging && <div className="puzzle-drag-ghost" style={{ left: dragging.x, top: dragging.y, '--piece-colour': dragging.piece.colour }} aria-hidden="true"><span>{dragging.piece.art}</span></div>}
      {complete && <button className="puzzle-again" type="button" onClick={() => reset()}>Play this picture again</button>}
      <p className="puzzle-feedback" role="status" aria-live="polite">{message || (selectedId ? 'Now tap its matching space.' : 'Choose a big picture piece.')}</p>
    </section>}
  </main>;
}
