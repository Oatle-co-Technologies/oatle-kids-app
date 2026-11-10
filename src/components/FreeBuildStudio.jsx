import { readSavedActivity, saveActivity } from '../utils/savedActivity';
import { useEffect, useRef, useState } from 'react';
import { STUDIO_COLOURS, STUDIO_ALPHABET, studioPlacement, recordStudioEdit, undoStudioEdit, redoStudioEdit } from './freeBuildLogic';
import './FreeBuildStudio.css';
import { speak, stopSpeech } from '../utils/speech';

function ToolIcon({ name }) {
  const paths = {
    back: 'M19 12H5m6-6-6 6 6 6', undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6',
    redo: 'm15 5 5 5-5 5m5-5H10a6 6 0 0 0-6 6',
    remove: 'M6 6l12 12M18 6 6 18', clear: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5m4-5v5',
    check: 'm5 12 4 4L19 6', cube: 'm12 3 8 4v10l-8 4-8-4V7l8-4Zm0 9v9M4 7l8 5 8-5',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
function StudioTool({ name, label, onClick, disabled = false }) {
  return <button type="button" className="studio-tool" title={label} aria-label={label} onClick={onClick} disabled={disabled}><ToolIcon name={name} /></button>;
}
function Square({ colour, letter = '' }) {
  return <span className="studio-square" style={{ '--block-colour': colour }} aria-hidden="true"><span>{letter}</span></span>;
}
const pieceStyle = (piece, cell) => ({ left: `calc(${piece.x * 100}% - ${piece.x * cell}px)`, top: `calc(${piece.y * 100}% - ${piece.y * cell}px)`, width: cell, height: cell });

export default function FreeBuildStudio({ onBack, onComplete, simple = false, soundOn = true, backLabel = 'Back to Building Adventure' }) {
  const storageKey = `oatle-block-build-${simple ? 'little' : 'big'}`;
  const [state, setState] = useState(() => readSavedActivity(storageKey, { past: [], pieces: [], future: [] }));
  useEffect(() => { saveActivity(storageKey, state); }, [storageKey, state]);
  const [colour, setColour] = useState(STUDIO_COLOURS[0]);
  const [letter, setLetter] = useState('');
  const [tab, setTab] = useState('blocks');
  const [lowercase, setLowercase] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [armed, setArmed] = useState(false);
  const placementReady = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0, cell: 56 });
  const [ghost, setGhost] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [focusCell, setFocusCell] = useState(0);
  const stage = useRef(null);
  const drag = useRef(null);
  const nextId = useRef(Math.max(0, ...[...state.pieces, ...state.past.flat(), ...state.future.flat()].map(piece => Number(piece.id?.split('-').at(-1)) || 0)));
  const introTimer = useRef(null);
  const { pieces } = state;
  const selected = pieces.find(piece => piece.id === selectedId);
  const cols = Math.max(1, Math.floor(size.width / size.cell));
  const rows = Math.max(1, Math.floor(size.height / size.cell));

  useEffect(() => {
    const node = stage.current;
    let frame;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height, cell: simple ? (rect.width < 600 ? 72 : 88) : (rect.width < 600 ? 48 : 64) });
    };
    frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [simple]);


  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const timer = window.setTimeout(() => speak(simple
      ? 'Choose a colour, then tap a space to place one block. Choose again for another block. Drag a block to move it.'
      : 'Build anything you like. Choose a block or a letter, then tap a space once. Choose again for each new block. Drag a block to move it.'), 220);
    introTimer.current = timer;
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [simple, soundOn]);

  function edit(next) { setState(current => recordStudioEdit(current, next)); }
  function point(event) {
    const rect = stage.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function disarm() { placementReady.current = false; setArmed(false); }
  function place(at, moving = selected) {
    if (!moving && !placementReady.current) { setAnnouncement('Choose a block before placing it.'); return; }
    const position = studioPlacement(at, size, pieces, moving?.id);
    if (!position) { setAnnouncement('Choose a little more space.'); return; }
    if (moving && position.x === moving.x && position.y === moving.y) return;
    disarm();
    const piece = { ...(moving || { id: `square-${++nextId.current}`, colour, letter }), ...position };
    edit(moving ? pieces.map(item => item.id === moving.id ? piece : item) : [...pieces, piece]);
    setSelectedId(null);
    setAnnouncement(`${piece.letter ? `Letter ${piece.letter}` : 'Square block'} placed.`);
  }
  function choose(nextColour, nextLetter = letter) { window.clearTimeout(introTimer.current); if (soundOn) speak(nextLetter ? `Letter ${nextLetter}.` : `${['Pink','Blue','Yellow','Green','Purple','Orange'][STUDIO_COLOURS.indexOf(nextColour)]} block.`); placementReady.current = true; setArmed(true); setColour(nextColour); setLetter(nextLetter); setSelectedId(null); }
  function startDrag(event, piece) {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    disarm();
    event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { piece, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    setSelectedId(piece.id);
  }
  function moveDrag(event) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 8) return;
    current.moved = true;
    const position = studioPlacement(point(event), size, pieces, current.piece.id);
    setGhost(position ? { ...current.piece, ...position } : null);
  }
  function endDrag(event) {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null; setGhost(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) place(point(event), current.piece);
  }
  function removeSelected() { if (selected) { edit(pieces.filter(piece => piece.id !== selected.id)); setSelectedId(null); } }
  function undo() { disarm(); setState(undoStudioEdit); setSelectedId(null); }
  function redo() { disarm(); setState(redoStudioEdit); setSelectedId(null); }
  function moveFocus(event, index) {
    const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[event.key];
    if (!offset) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(cols * rows - 1, index + offset));
    setFocusCell(next); stage.current.querySelector(`[data-studio-cell="${next}"]`)?.focus();
  }

  return <main className={`free-build-studio ${simple ? 'studio-little' : ''}`} aria-label={simple ? 'Little block playground' : 'Space building studio'} onKeyDown={event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
  }}>
    <div className="studio-nebula" aria-hidden="true" />
    <div className="studio-planet studio-planet-pink" aria-hidden="true" />
    <div className="studio-planet studio-planet-blue" aria-hidden="true" />
    <header className="studio-topbar">
      <StudioTool name="back" label={backLabel} onClick={onBack} />
      <div className="studio-history">
        <StudioTool name="undo" label="Undo" onClick={undo} disabled={!state.past.length} />
        {!simple && <StudioTool name="redo" label="Redo" onClick={redo} disabled={!state.future.length} />}
        {!simple && <StudioTool name="remove" label="Remove selected block" onClick={removeSelected} disabled={!selected} />}
        <StudioTool name="clear" label="Clear build" onClick={() => { disarm(); edit([]); setSelectedId(null); }} disabled={!pieces.length} />
      </div>
      <button className="studio-done" type="button" disabled={!pieces.length} onClick={onComplete || onBack}><ToolIcon name="check" />Done</button>
    </header>
    <p className="studio-sr-only" id="studio-help">{simple ? 'Choose a colour, then tap a space once. Choose a colour again for each new block. Drag a block to move it. Undo brings blocks back.' : 'Choose a coloured square or a letter, then tap the space once to place it. Choose a block again for each new placement. Drag a block to move it. Use arrow keys between spaces and Enter to build. Undo brings blocks back.'}</p>
    <section ref={stage} className="studio-stage" aria-label="Build anywhere in space" aria-describedby="studio-help">
      {size.width > 0 && Array.from({ length: cols * rows }, (_, index) => <button type="button" key={index} className="studio-cell" data-studio-cell={index} tabIndex={index === Math.min(focusCell, cols * rows - 1) ? 0 : -1}
        aria-label={`Place ${selected ? 'selected block' : letter || 'square block'}, row ${Math.floor(index / cols) + 1}, column ${index % cols + 1}`}
        style={{ left: index % cols * size.cell, top: Math.floor(index / cols) * size.cell, width: size.cell, height: size.cell }}
        onKeyDown={event => moveFocus(event, index)} onFocus={() => setFocusCell(index)}
        onClick={() => place({ x: (index % cols + .5) * size.cell, y: (Math.floor(index / cols) + .5) * size.cell })} />)}
      {pieces.map(piece => <button key={piece.id} type="button" className={`studio-piece ${selectedId === piece.id ? 'is-selected' : ''}`} aria-label={`Move ${piece.letter ? `letter ${piece.letter}` : 'square block'}`} aria-pressed={selectedId === piece.id}
        style={pieceStyle(piece, size.cell)} onClick={event => { event.stopPropagation(); if (event.detail === 0) setSelectedId(piece.id); }}
        onPointerDown={event => startDrag(event, piece)} onPointerMove={moveDrag} onPointerUp={endDrag}
        onPointerCancel={() => { drag.current = null; setGhost(null); }} onLostPointerCapture={() => { drag.current = null; setGhost(null); }}
        onKeyDown={event => { if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); edit(pieces.filter(item => item.id !== piece.id)); setSelectedId(null); } }}>
        <Square colour={piece.colour} letter={piece.letter} />
      </button>)}
      {ghost && <div className="studio-piece studio-ghost" style={pieceStyle(ghost, size.cell)}><Square colour={ghost.colour} letter={ghost.letter} /></div>}
      <div className="studio-horizon" aria-hidden="true" />
    </section>
    <aside className="studio-dock" aria-label="Building pieces">
      {!simple && <div className={`studio-dock-bar ${tab === 'letters' ? 'has-letters' : ''}`}>
        <div className="studio-tabs" role="group" aria-label="Piece type">
          <button type="button" aria-pressed={tab === 'blocks'} onClick={() => { setTab('blocks'); choose(colour, ''); }} aria-label="Coloured square blocks"><ToolIcon name="cube" /></button>
          <button type="button" aria-pressed={tab === 'letters'} onClick={() => { setTab('letters'); choose(colour, lowercase ? 'a' : 'A'); }} aria-label="Alphabet blocks">ABC</button>
        </div>
        {tab === 'letters' && <>
          <div className="studio-swatches" role="group" aria-label="Letter block colour">{STUDIO_COLOURS.map((value, index) => <button key={value} type="button" style={{ '--block-colour': value }} aria-label={`Letter colour ${['pink','blue','yellow','green','purple','orange'][index]}`} aria-pressed={colour === value} onClick={() => choose(value)}><span /></button>)}</div>
          <button type="button" className="studio-case" aria-label="Use lowercase letters" aria-pressed={lowercase} onClick={() => { setLowercase(!lowercase); choose(colour, !lowercase ? letter.toLowerCase() : letter.toUpperCase()); }}>Aa</button>
        </>}
      </div>}
      <div className={`studio-pieces-tray ${tab === 'letters' ? 'studio-letters' : 'studio-colours'}`} role="group" aria-label={tab === 'letters' ? 'Choose any letter' : 'Choose a square'}>
        {tab === 'blocks' ? STUDIO_COLOURS.map((value, index) => <button key={value} type="button" aria-label={`Choose ${['pink','blue','yellow','green','purple','orange'][index]} square`} aria-pressed={armed && colour === value && !selectedId} onClick={() => choose(value, '')}><Square colour={value} /></button>)
          : STUDIO_ALPHABET.map(value => { const display = lowercase ? value.toLowerCase() : value; return <button key={value} type="button" aria-label={`Choose letter ${display}`} aria-pressed={armed && letter === display && !selectedId} onClick={() => choose(colour, display)}><Square colour={colour} letter={display} /></button>; })}
      </div>
    </aside>
    <p className="studio-sr-only" role="status" aria-live="polite">{announcement}</p>
  </main>;
}
