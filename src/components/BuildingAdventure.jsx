import { useEffect, useId, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import useLittleMissionCompletion from './useLittleMissionCompletion';
import { speak, stopSpeech } from '../utils/speech';
import { BLOCKS, SHAPES, BUILDS, BOARD, CELL, MAX_BLOCKS, containsPoint, freePlacement, matchingTarget } from './buildingLogic';
import './BuildingAdventure.css';

function PieceArt({ piece, brick = false, outline = false }) {
  const id = useId().replace(/:/g, '');
  const { width: w, height: h, colour, shape } = piece;
  // Depth stays inside the original piece bounds, preserving placement geometry.
  const depth = 8;
  const right = w - depth - 3;
  const bottom = h - depth - 3;
  const face = shape === 'triangle'
    ? `M${w / 2 - 3} 4 Q${w / 2} 1 ${w / 2 + 3} 6 L${right} ${bottom - 4} Q${right + 2} ${bottom} ${right - 3} ${bottom} H7 Q3 ${bottom} 5 ${bottom - 5} Z`
    : undefined;
  const silhouette = (props) => shape === 'triangle' ? <path d={face} {...props} />
    : shape === 'circle' ? <ellipse cx={(right + 3) / 2} cy={(bottom + 3) / 2} rx={(right - 3) / 2} ry={(bottom - 3) / 2} {...props} />
      : <rect x="3" y="3" width={right - 3} height={bottom - 3} rx="9" {...props} />;
  return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#fff" stopOpacity=".48" /><stop offset=".35" stopColor={colour} /><stop offset="1" stopColor={colour} />
      </linearGradient>
      <linearGradient id={`${id}-edge`} x2="0" y2="1">
        <stop stopColor={colour} /><stop offset="1" stopColor="#142345" stopOpacity=".65" />
      </linearGradient>
    </defs>
    {outline ? silhouette({ fill: `${colour}18`, stroke: colour, strokeWidth: 3, strokeDasharray: '7 5', transform: 'translate(4 4)' }) : <>
      {silhouette({ transform: `translate(${depth} ${depth})`, fill: `url(#${id}-edge)`, stroke: '#10213c', strokeOpacity: .22, strokeWidth: 2 })}
      {shape !== 'circle' && <path d={shape === 'triangle'
        ? `M${right} ${bottom} l${depth} ${depth} H${7 + depth} L7 ${bottom} Z`
        : `M12 ${bottom} H${right - 7} Q${right} ${bottom} ${right} ${bottom - 8} V12 l${depth} ${depth} V${bottom} Q${right + depth} ${bottom + depth} ${right} ${bottom + depth} H${12 + depth} Z`}
        fill={colour} />}
      {silhouette({ fill: `url(#${id}-face)`, stroke: '#fff', strokeOpacity: .4, strokeWidth: 1.5 })}
      {shape !== 'triangle' && shape !== 'circle' && <rect x="9" y="9" width={right - 15} height={bottom - 15} rx="6" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="2" />}
      {brick && <path d={`M14 13 H${right - 12}`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />}
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
  return <svg viewBox="0 0 140 140" aria-hidden="true" focusable="false">
    <g transform="translate(8 74)"><PieceArt piece={BLOCKS.yellow} brick /></g>
    <g transform="translate(8 18)"><PieceArt piece={BLOCKS.red} brick /></g>
    <g transform="translate(68 18)"><PieceArt piece={BLOCKS.blue} brick /></g>
  </svg>;
}

const positionStyle = (piece, definition) => ({
  left: `${piece.x / BOARD.width * 100}%`, top: `${piece.y / BOARD.height * 100}%`,
  width: `${definition.width / BOARD.width * 100}%`, height: `${definition.height / BOARD.height * 100}%`,
});

export default function BuildingAdventure({ onBack, soundOn, mission, onComplete }) {
  const [mode, setMode] = useState(mission?.mode || 'menu');
  const [buildIndex, setBuildIndex] = useState(mission?.buildIndex ?? 0);
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
  useLittleMissionCompletion(complete, onComplete);
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
      <LocalBackButton label={mission ? 'Building Adventure map' : mode === 'menu' ? 'Adventures' : mode === 'copy' ? 'Build This' : 'Building'} onClick={() => mission || mode === 'menu' ? onBack() : changeMode(mode === 'copy' ? 'choose' : 'menu')} />
      <p className="eyebrow">{mission ? `PLANET ${mission.name.toUpperCase()} / BUILDING` : 'LITTLE EXPLORERS / BUILDING'}</p>
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
        {isCopy && !mission && <button type="button" className={complete ? 'building-next' : ''} onClick={() => changeMode('choose')}>{complete ? 'Build another picture' : 'Choose a picture'}</button>}
        {mission && !isCopy && <button type="button" className="building-next" disabled={!pieces.length} onClick={onComplete}>I’m finished ✓</button>}
      </div>
    </section>}
  </main>;
}
