import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import { BLOCKS, SHAPES, BUILDS, BOARD, CELL, MAX_BLOCKS, containsPoint, freePlacement, matchingTarget } from './buildingLogic';
import './BuildingAdventure.css';

function PieceArt({ piece, brick = false, outline = false }) {
  const { width: w, height: h, colour, shape } = piece;
  const fill = outline ? 'transparent' : colour;
  const common = { fill, stroke: outline ? colour : 'rgba(20,30,60,.18)', strokeWidth: outline ? 4 : 2, strokeDasharray: outline ? '8 6' : undefined };
  return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" focusable="false">
    {shape === 'triangle' ? <path d={`M${w / 2} 4 L${w - 4} ${h - 4} H4 Z`} {...common} />
      : shape === 'circle' ? <circle cx={w / 2} cy={h / 2} r={w / 2 - 4} {...common} />
        : <rect x="3" y="3" width={w - 6} height={h - 6} rx={brick ? 9 : 5} {...common} />}
    {brick && !outline && <>
      <path d={`M10 ${h - 12} H${w - 10}`} stroke="rgba(30,30,60,.16)" strokeWidth="5" strokeLinecap="round" />
      {Array.from({ length: w / CELL }, (_, i) => <g key={i}>
        <ellipse cx={30 + i * CELL} cy="20" rx="14" ry="8" fill="rgba(255,255,255,.33)" />
        <path d={`M${17 + i * CELL} 20 Q${30 + i * CELL} 32 ${43 + i * CELL} 20`} fill="none" stroke="rgba(20,30,60,.12)" strokeWidth="2" />
      </g>)}
    </>}
  </svg>;
}

function BuildPicture({ build, className = '' }) {
  const left = Math.min(...build.targets.map(t => t.x)) - 18;
  const top = Math.min(...build.targets.map(t => t.y)) - 18;
  const width = Math.max(...build.targets.map(t => t.x + SHAPES[t.kind].width)) - left + 18;
  const height = Math.max(...build.targets.map(t => t.y + SHAPES[t.kind].height)) - top + 18;
  return <svg className={`building-picture ${className}`} viewBox={`${left} ${top} ${width} ${height}`} aria-label={build.title} role="img">
    {build.targets.map(target => <g key={target.id} transform={`translate(${target.x},${target.y})`}>
      <PieceArt piece={SHAPES[target.kind]} />
    </g>)}
  </svg>;
}

export function BuildingIcon() {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <rect x="8" y="57" width="43" height="34" rx="6" fill="#ffdc70" />
    <rect x="55" y="57" width="36" height="34" rx="6" fill="#66caff" />
    <rect x="31" y="18" width="43" height="35" rx="6" fill="#ff758a" />
    <ellipse cx="29" cy="66" rx="10" ry="5" fill="#fff" opacity=".35" />
    <ellipse cx="73" cy="66" rx="10" ry="5" fill="#fff" opacity=".35" />
    <ellipse cx="52" cy="27" rx="10" ry="5" fill="#fff" opacity=".35" />
  </svg>;
}

const positionStyle = (piece, definition) => ({
  left: `${piece.x / BOARD.width * 100}%`, top: `${piece.y / BOARD.height * 100}%`,
  width: `${definition.width / BOARD.width * 100}%`, height: `${definition.height / BOARD.height * 100}%`,
});

export default function BuildingAdventure({ onBack, soundOn }) {
  const [mode, setMode] = useState('menu');
  const [buildIndex, setBuildIndex] = useState(0);
  const [freePieces, setFreePieces] = useState([]);
  const [history, setHistory] = useState([]);
  const [filled, setFilled] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [message, setMessage] = useState('');
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const idRef = useRef(0);
  const build = BUILDS[buildIndex];
  const isCopy = mode === 'copy';
  // Keep the picture's layers consistent even when a child builds in any order.
  const pieces = isCopy ? build.targets.map(target => filled.find(piece => piece.targetId === target.id)).filter(Boolean) : freePieces;
  const definitions = isCopy ? SHAPES : BLOCKS;
  const complete = isCopy && filled.length === build.targets.length;
  const title = mode === 'menu' ? 'Building Adventure' : mode === 'choose' ? 'Build This' : isCopy ? build.title : 'Build Anything';

  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const prompt = mode === 'menu' ? 'Building adventure. Build anything, or copy a little picture.'
      : mode === 'choose' ? 'Choose a little picture to build.'
        : mode === 'free' ? 'Build anything you like. Tap a block, then tap a space. You can drag blocks too.' : build.prompt;
    const timer = window.setTimeout(() => speak(prompt), 220);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [mode, build, soundOn]);

  function changeMode(next) {
    dragRef.current = null;
    setGhost(null); setSelected(null); setMessage(''); setMode(next);
  }

  function chooseBuild(index) {
    setBuildIndex(index); setFilled([]); changeMode('copy');
  }

  function pointAt(clientX, clientY) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return null;
    return { x: (clientX - rect.left) / rect.width * BOARD.width, y: (clientY - rect.top) / rect.height * BOARD.height };
  }

  function place(choice, point) {
    if (!choice || !point || complete) return;
    if (isCopy) {
      const target = matchingTarget(build, choice.kind, point, filled);
      if (!target) { setMessage('Try a matching outline.'); return; }
      const next = [...filled, { ...target, targetId: target.id }];
      setFilled(next); setSelected(null);
      if (next.length === build.targets.length) {
        setMessage(`You built the ${build.title.replace('Little ', '')}!`);
        if (soundOn) speak(`You built the ${build.title.replace('Little ', '')}! Wonderful building!`);
      } else { setMessage('It fits!'); }
      return;
    }
    const nextPiece = freePlacement(choice.kind, point, freePieces, choice.id);
    if (!nextPiece) {
      setMessage(freePieces.length >= MAX_BLOCKS && !choice.id ? 'Your building space is full. Move a block, or undo one.' : 'Try an empty space.');
      return;
    }
    if (choice.id && freePieces.some(p => p.id === choice.id && p.x === nextPiece.x && p.y === nextPiece.y)) return;
    setHistory(current => [...current.slice(-39), freePieces]);
    setFreePieces(choice.id ? freePieces.map(p => p.id === choice.id ? { ...p, ...nextPiece } : p) : [...freePieces, { ...nextPiece, id: `block-${++idRef.current}` }]);
    setSelected({ kind: choice.kind }); setMessage('Keep building!');
  }

  function startPointer(event, choice) {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { ...choice, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    setSelected(choice); setMessage('');
  }

  function movePointer(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8 && !drag.moved) return;
    drag.moved = true;
    const point = pointAt(event.clientX, event.clientY);
    setGhost(point && containsPoint(point) ? { kind: drag.kind, x: point.x - definitions[drag.kind].width / 2, y: point.y - definitions[drag.kind].height / 2 } : null);
  }

  function endPointer(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null; setGhost(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) place(drag, pointAt(event.clientX, event.clientY));
  }

  const pointerHandlers = choice => ({
    onPointerDown: event => startPointer(event, choice), onPointerMove: movePointer, onPointerUp: endPointer,
    onPointerCancel: () => { dragRef.current = null; setGhost(null); },
    onLostPointerCapture: () => { dragRef.current = null; setGhost(null); },
    onClick: event => { event.stopPropagation(); if (event.detail === 0) { setSelected(choice); setMessage(''); } },
  });

  function undo() {
    if (isCopy) { setFilled(current => current.slice(0, -1)); setMessage(''); setSelected(null); return; }
    if (!history.length) return;
    setFreePieces(history[history.length - 1]); setHistory(current => current.slice(0, -1)); setSelected(null); setMessage('');
  }

  function reset() {
    if (isCopy) setFilled([]);
    else if (freePieces.length) { setHistory(current => [...current.slice(-39), freePieces]); setFreePieces([]); }
    setSelected(null); setMessage('');
  }

  return <main className={`little-explorers-page building-page building-${mode}`}>
    <header className="building-header">
      <LocalBackButton label={mode === 'menu' ? 'Adventures' : mode === 'copy' ? 'Build This' : 'Building'} onClick={() => mode === 'menu' ? onBack() : changeMode(mode === 'copy' ? 'choose' : 'menu')} />
      <p className="eyebrow">LITTLE EXPLORERS / BUILDING</p>
      <h1>{title}</h1>
      <p>{mode === 'menu' ? 'Little pieces. Big possibilities.' : mode === 'choose' ? 'Pick a picture. Let’s make it together.' : isCopy ? 'Make the little picture with shapes.' : 'Stack, move and make something your own.'}</p>
    </header>

    {mode === 'menu' ? <section className="building-mode-grid" aria-label="Building activities">
      <button className="building-mode-card" type="button" onClick={() => changeMode('free')}>
        <span className="building-mode-art building-brick-art"><BuildingIcon /></span>
        <span className="building-mode-number">01 · BLOCK PLAY</span><strong>Build Anything</strong><small>Chunky blocks. Your own ideas.</small><span className="building-card-action">Let’s build <span aria-hidden="true">↗</span></span>
      </button>
      <button className="building-mode-card building-copy-card" type="button" onClick={() => changeMode('choose')}>
        <span className="building-mode-art"><BuildPicture build={BUILDS[0]} /></span>
        <span className="building-mode-number">02 · SHAPE PICTURES</span><strong>Build This</strong><small>A little picture to make together.</small><span className="building-card-action">Choose a picture <span aria-hidden="true">↗</span></span>
      </button>
      <p className="building-grownup">Play together: let your little builder choose, try and explore.</p>
    </section> : mode === 'choose' ? <section className="building-choice-grid" aria-label="Pictures to build">
      {BUILDS.map((picture, index) => <button type="button" key={picture.id} aria-label={`${picture.title}, ${picture.targets.length} shapes`} onClick={() => chooseBuild(index)}>
        <BuildPicture build={picture} /><strong>{picture.title}</strong><small>{picture.targets.length} shapes</small>
      </button>)}
    </section> : <section className="building-workshop" aria-label={title}>
      <div className="building-instructions" id="building-help">
        <span className="building-step-dot" aria-hidden="true">1</span><span>Tap a piece.</span>
        <span className="building-step-dot" aria-hidden="true">2</span><span>Tap {isCopy ? 'its outline.' : 'a space.'}</span>
        <span className="building-drag-hint">Or drag it into place.</span>
      </div>
      <div className="building-play-layout">
        {isCopy && <aside className="building-example"><span>LET’S MAKE THIS</span><BuildPicture build={build} /></aside>}
        <div className="building-board-wrap">
          <div ref={boardRef} className={`building-board ${complete ? 'building-complete' : ''}`} aria-label={isCopy ? 'Shape building area' : 'Block building area'} aria-describedby="building-help">
            {!isCopy && Array.from({ length: 30 }, (_, index) => <button key={index} className="building-space" type="button"
              aria-label={`Place selected block in row ${Math.floor(index / 6) + 1}, column ${index % 6 + 1}`}
              style={{ left: `${index % 6 / 6 * 100}%`, top: `${Math.floor(index / 6) / 5 * 100}%` }}
              onClick={() => { if (selected) place(selected, { x: (index % 6 + .5) * CELL, y: (Math.floor(index / 6) + .5) * CELL }); else setMessage('Choose a block below first.'); }} />)}
            {isCopy && build.targets.filter(target => !filled.some(p => p.targetId === target.id)).map(target => <button className="building-target" type="button" key={target.id}
              style={positionStyle(target, SHAPES[target.kind])} aria-label={`Place ${SHAPES[target.kind].name} on ${target.id} outline`}
              onClick={() => { if (selected) place(selected, { x: target.x + SHAPES[target.kind].width / 2, y: target.y + SHAPES[target.kind].height / 2 }); else setMessage('Choose a shape below first.'); }}>
              <PieceArt piece={SHAPES[target.kind]} outline />
            </button>)}
            {pieces.map(piece => isCopy ? <div key={piece.targetId} className="building-piece building-filled" style={positionStyle(piece, SHAPES[piece.kind])}><PieceArt piece={SHAPES[piece.kind]} /></div>
              : <button className={`building-piece ${selected?.id === piece.id ? 'is-selected' : ''}`} key={piece.id} type="button"
                aria-label={`Move ${BLOCKS[piece.kind].name}`} aria-pressed={selected?.id === piece.id || false} style={positionStyle(piece, BLOCKS[piece.kind])} {...pointerHandlers({ kind: piece.kind, id: piece.id })}>
                <PieceArt piece={BLOCKS[piece.kind]} brick />
              </button>)}
            {ghost && <div className="building-piece building-ghost" style={positionStyle(ghost, definitions[ghost.kind])}><PieceArt piece={definitions[ghost.kind]} brick={!isCopy} /></div>}
          </div>
          <p className="building-feedback" role="status" aria-live="polite">{message || (selected ? `${definitions[selected.kind].name} selected.` : isCopy ? 'Your picture goes here.' : 'What will you build?')}</p>
        </div>
      </div>
      <div className="building-palette" aria-label={isCopy ? 'Choose a shape' : 'Choose a block'}>
        {Object.entries(definitions).filter(([kind]) => !isCopy || build.targets.some(t => t.kind === kind)).map(([kind, definition]) => {
          const allUsed = isCopy && build.targets.filter(t => t.kind === kind).length === filled.filter(p => p.kind === kind).length;
          return <button type="button" className={selected?.kind === kind && !selected.id ? 'is-selected' : ''} key={kind}
            aria-label={`Choose ${definition.name}`} aria-pressed={selected?.kind === kind && !selected.id || false} disabled={allUsed || complete}
            {...pointerHandlers({ kind })}>
            <PieceArt piece={definition} brick={!isCopy} /><span>{isCopy ? definition.shape : kind}</span>
          </button>;
        })}
      </div>
      <div className="building-tools">
        <button type="button" onClick={undo} disabled={isCopy ? !filled.length : !history.length}>Undo</button>
        <button type="button" onClick={reset} disabled={!pieces.length}>Start again</button>
        {isCopy && <button type="button" className={complete ? 'building-next' : ''} onClick={() => changeMode('choose')}>{complete ? 'Build another picture' : 'Choose a picture'}</button>}
      </div>
    </section>}
  </main>;
}
