import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import artwork from '../assets/images/puzzle-portraits.png';
import { shuffleTiles, swapTiles, isSolved } from './puzzleLogic';
import './PuzzleAdventure.css';
const PICTURES = ['Lion', 'Cow', 'Turtle'];
function Picture({ scene, tile = null }) {
  const box = tile === null ? '0 0 1000 1000' : `${tile % 5 * 200} ${Math.floor(tile / 5) * 500} 200 500`;
  return <svg viewBox={box} aria-hidden="true" focusable="false" className="picture-art"><image href={artwork} x={-scene * 1000} y="0" width="3000" height="1000" preserveAspectRatio="none" /></svg>;
}
export function PuzzleIcon() {
  return <svg viewBox="0 0 100 100" aria-hidden="true"><rect x="8" y="8" width="84" height="84" rx="16" fill="#ffd36f" /><path d="M8 50H92M50 8V92" stroke="#24395a" strokeWidth="5" /><circle cx="50" cy="33" r="9" fill="#82d5cd" /></svg>;
}
export default function PuzzleAdventure({ onBack, soundOn }) {
  const [scene, setScene] = useState(null);
  const [tiles, setTiles] = useState(shuffleTiles);
  const [selected, setSelected] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [message, setMessage] = useState('');
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const solved = isSolved(tiles);
  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const timer = window.setTimeout(() => speak(scene === null ? 'Choose a picture puzzle.' : `Let’s make the ${PICTURES[scene]} picture. Move a piece onto another piece to swap them.`), 220);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [scene, soundOn]);
  function clearDrag() { dragRef.current = null; setGhost(null); }
  function start(index) { clearDrag(); setSelected(null); setMessage(''); setTiles(shuffleTiles()); setScene(index); }
  function swap(from, to) {
    setSelected(null);
    if (from === to || solved) return;
    const next = swapTiles(tiles, from, to); setTiles(next);
    if (isSolved(next)) {
      const text = `You made the ${PICTURES[scene]} picture! Well done!`;
      setMessage(text); if (soundOn) speak(text);
    } else setMessage('Pieces swapped. Keep putting your picture together.');
  }
  function tap(index) {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (solved) return;
    if (selected === null) { setSelected(index); setMessage('Tap another piece to swap them.'); }
    else swap(selected, index);
  }
  function down(event, index) {
    if (solved || event.isPrimary === false || event.button !== 0) return;
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { index, tile: tiles[index], pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height, moved: false };
  }
  function move(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
    drag.moved = true; setSelected(null); setGhost({ ...drag, x: event.clientX, y: event.clientY });
  }
  function up(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = boardRef.current.getBoundingClientRect(); clearDrag();
    if (drag.moved) {
      suppressClick.current = true;
      const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
      if (x >= 0 && x < 1 && y >= 0 && y < 1) swap(drag.index, Math.floor(y * 2) * 5 + Math.floor(x * 5));
      else setMessage('Move a piece onto another piece inside the picture.');
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <main className="little-explorers-page puzzle-page">
    <header className="puzzle-header">
      <LocalBackButton label={scene === null ? 'Adventures' : 'Pictures'} onClick={() => { clearDrag(); setSelected(null); scene === null ? onBack() : setScene(null); }} />
      <p className="eyebrow">LITTLE EXPLORERS / PUZZLES</p>
      <h1>{scene === null ? 'Puzzle Adventure' : `${PICTURES[scene]} Puzzle`}</h1>
      <p>{scene === null ? 'Choose a picture. Put its ten pieces back together.' : 'Drag one piece onto another to swap them.'}</p>
    </header>
    {scene === null ? <section className="picture-choices" aria-label="Choose a picture puzzle">
      {PICTURES.map((name, index) => <button type="button" key={name} onClick={() => start(index)}><Picture scene={index} /><strong>{name}</strong><span>10 pieces · Let’s play</span></button>)}
    </section> : <section className="picture-workshop" aria-label={`${PICTURES[scene]} puzzle`}>
      <figure className="picture-reference"><Picture scene={scene} /><figcaption>Let’s make this picture</figcaption></figure>
      <div className={`picture-board ${solved ? 'is-solved' : ''}`} ref={boardRef} aria-label="Ten picture pieces">
        {tiles.map((tile, position) => <button type="button" key={position} data-piece={tile} className={`picture-tile ${selected === position ? 'is-selected' : ''} ${ghost?.index === position ? 'is-moving' : ''}`} aria-label={`Piece ${tile + 1}, position ${position + 1}`} aria-pressed={selected === position} disabled={solved} onClick={() => tap(position)} onPointerDown={event => down(event, position)} onPointerMove={move} onPointerUp={up} onPointerCancel={clearDrag} onLostPointerCapture={clearDrag}><Picture scene={scene} tile={tile} /></button>)}
      </div>
      {ghost && <div className="picture-ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.width, height: ghost.height }}><Picture scene={scene} tile={ghost.tile} /></div>}
      <p className="picture-message" role="status">{message || 'You can also tap two pieces to swap them.'}</p>
      {solved && <div className="picture-celebration"><span aria-hidden="true">🌟</span><h2>You put it together!</h2><button type="button" onClick={() => start(scene)}>Play again</button><button type="button" onClick={() => setScene(null)}>Choose another picture</button></div>}
    </section>}
  </main>;
}
