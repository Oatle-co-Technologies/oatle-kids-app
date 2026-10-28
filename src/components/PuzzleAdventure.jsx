import { useEffect, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import './PuzzleAdventure.css';

const PUZZLES = [
  {
    id: 'garden', title: 'Sunny Garden', count: 2,
    pieces: [
      { id: 'sun', art: '☀️', label: 'sunny sky', colour: '#66caff' },
      { id: 'flower', art: '🌷', label: 'flower garden', colour: '#75cd7a' },
    ],
  },
  {
    id: 'farm', title: 'Farm Fun', count: 3,
    pieces: [
      { id: 'tractor', art: '🚜', label: 'farm tractor', colour: '#f4bb53' },
      { id: 'cow', art: '🐮', label: 'happy cow', colour: '#86c977' },
      { id: 'barn', art: '🌾', label: 'golden field', colour: '#e8c75d' },
    ],
  },
  {
    id: 'ocean', title: 'Ocean Friends', count: 4,
    pieces: [
      { id: 'fish', art: '🐠', label: 'little fish', colour: '#4bb7e5' },
      { id: 'whale', art: '🐳', label: 'friendly whale', colour: '#5f92df' },
      { id: 'shell', art: '🐚', label: 'seashell', colour: '#f0a7c4' },
      { id: 'star', art: '⭐', label: 'starfish', colour: '#e5bd55' },
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
  const [message, setMessage] = useState('');
  const puzzle = PUZZLES[puzzleIndex];
  const complete = placed.length === puzzle.pieces.length;

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
        {puzzle.pieces.map((piece) => <button key={piece.id} type="button" className={`puzzle-slot ${placed.includes(piece.id) ? 'is-filled' : ''}`} style={{ '--piece-colour': piece.colour }} onClick={() => placePiece(piece)} aria-label={`${placed.includes(piece.id) ? piece.label : `Place ${piece.label} here`} space`}>
          {placed.includes(piece.id) ? <span>{piece.art}</span> : <span className="puzzle-slot-hint">{piece.art}</span>}
        </button>)}
      </div>
      <p className="puzzle-help">{complete ? 'Your whole picture is ready!' : 'Choose a piece below.'}</p>
      <div className="puzzle-piece-tray" aria-label="Picture pieces">
        {order.filter((piece) => !placed.includes(piece.id)).map((piece) => <button key={piece.id} type="button" className={`puzzle-piece ${selectedId === piece.id ? 'is-selected' : ''}`} style={{ '--piece-colour': piece.colour }} onClick={() => { setSelectedId(piece.id); setMessage(`Now find the ${piece.label} space.`); }} aria-pressed={selectedId === piece.id}>
          <span>{piece.art}</span><b>{piece.label}</b>
        </button>)}
      </div>
      {complete && <button className="puzzle-again" type="button" onClick={() => reset()}>Play this picture again</button>}
      <p className="puzzle-feedback" role="status" aria-live="polite">{message || (selectedId ? 'Now tap its matching space.' : 'Choose a big picture piece.')}</p>
    </section>}
  </main>;
}
