import { useEffect, useId, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import useLittleMissionCompletion from './useLittleMissionCompletion';
import { speak, stopSpeech } from '../utils/speech';
import { BLOCKS, SHAPES, BUILDS, BOARD, CELL, MAX_BLOCKS, containsPoint, freePlacement, matchingTarget } from './buildingLogic';
import './BuildingAdventure.css';

function PieceArt({ piece, brick = false, outline = false }) {
  const id = useId().replace(/:/g, '');
  const { width: w, height: h, colour, shape } = piece;
  // Keep the full front face in the placement cell. The solid toy extends
  // upwards and to the right, like a wooden block viewed from above.
  const d = Math.min(w, h) * .27;
  const face = shape === 'triangle' ? `M${w / 2} 3 L${w - 3} ${h - 3} H3 Z`
    : shape === 'circle' ? null : `M8 2 H${w - 8} Q${w - 2} 2 ${w - 2} 8 V${h - 8} Q${w - 2} ${h - 2} ${w - 8} ${h - 2} H8 Q2 ${h - 2} 2 ${h - 8} V8 Q2 2 8 2 Z`;
  const surface = props => shape === 'circle'
    ? <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 3} ry={h / 2 - 3} {...props} />
    : <path d={face} strokeLinejoin="round" {...props} />;
  const letter = piece === BLOCKS.red ? 'A' : piece === BLOCKS.blue ? 'B' : null;
  return <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true" focusable="false" className="building-toy-art">
    <defs>
      <linearGradient id={`${id}-paint`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff" stopOpacity=".28" /><stop offset=".42" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".13" />
      </linearGradient>
      <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#ffe2a8" /><stop offset=".55" stopColor="#eec184" /><stop offset="1" stopColor="#d49b58" />
      </linearGradient>
      <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#000" stopOpacity=".12" /><stop offset="1" stopColor="#000" stopOpacity=".38" />
      </linearGradient>
    </defs>
    {outline ? surface({ fill: `${colour}16`, stroke: colour, strokeWidth: 3, strokeDasharray: '7 5' }) : <>
      {/* Separate solid faces, not an offset outline or a duplicate silhouette. */}
      {shape === 'circle' ? <>
        {surface({ transform: `translate(${d} ${-d})`, fill: colour })}
        <path d={`M${w / 2} 3 L${w / 2 + d} ${3 - d} A${w / 2 - 3} ${h / 2 - 3} 0 0 1 ${w / 2 + d} ${h - 3 - d} L${w / 2} ${h - 3} Z`} fill={colour} />
        <path d={`M${w / 2} 3 L${w / 2 + d} ${3 - d} A${w / 2 - 3} ${h / 2 - 3} 0 0 1 ${w / 2 + d} ${h - 3 - d} L${w / 2} ${h - 3} Z`} fill={`url(#${id}-side)`} />
      </> : shape === 'triangle' ? <>
        <path d={`M${w / 2} 3 l${d} ${-d} L${w - 3 + d} ${h - 3 - d} L${w - 3} ${h - 3} Z`} fill={colour} stroke={colour} strokeWidth="3" strokeLinejoin="round" />
        <path d={`M${w / 2} 3 l${d} ${-d} L${w - 3 + d} ${h - 3 - d} L${w - 3} ${h - 3} Z`} fill={`url(#${id}-side)`} />
        <path d={`M3 ${h - 3} L${w / 2} 3 l${d} ${-d} L${3 + d} ${h - 3 - d} Z`} fill={colour} />
      </> : <>
        <path d={`M5 4 L${5 + d} ${4 - d} H${w - 5 + d} L${w - 5} 4 Z`} fill={colour} stroke={colour} strokeWidth="5" strokeLinejoin="round" />
        <path d={`M5 4 L${5 + d} ${4 - d} H${w - 5 + d} L${w - 5} 4 Z`} fill="#fff" opacity=".32" />
        <path d={`M${w - 3} 5 l${d} ${-d} V${h - 7 - d} q0 5 -5 8 L${w - 8} ${h - 2} Z`} fill={colour} stroke={colour} strokeWidth="3" strokeLinejoin="round" />
        <path d={`M${w - 3} 5 l${d} ${-d} V${h - 7 - d} q0 5 -5 8 L${w - 8} ${h - 2} Z`} fill={`url(#${id}-side)`} />
        <path d={`M${d + 10} ${1 - d / 2} H${w - 10 + d / 2}`} fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1.5" />
      </>}
      {surface({ fill: letter ? `url(#${id}-wood)` : colour, stroke: '#000', strokeOpacity: .12, strokeWidth: 1 })}
      {surface({ fill: `url(#${id}-paint)` })}
      {letter ? <>
        <rect x="9" y="9" width={w - 18} height={h - 18} rx="3" fill={colour} stroke="#a46732" strokeOpacity=".3" strokeWidth="1.5" />
        <path d={`M11 ${h - 10} V12 H${w - 11}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" />
        <text x={w / 2} y={h / 2 + 1} dominantBaseline="central" textAnchor="middle" fill="#fff1cf" stroke="#000" strokeOpacity=".08" strokeWidth=".5" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize={h * .52}>{letter}</text>
      </> : shape !== 'triangle' && shape !== 'circle' && <>
        <path d={`M8 ${h - 10} V10 Q8 7 12 7 H${w - 10}`} stroke="#fff" strokeOpacity=".48" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M12 ${h - 7} H${w - 11}`} stroke="#000" strokeOpacity=".1" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>}
      {shape === 'triangle' && <path d={`M10 ${h - 10} L${w / 2} 9`} fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2.5" strokeLinecap="round" />}
      {shape === 'circle' && <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 8} ry={h / 2 - 8} fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" />}
      {brick && !letter && <path d={`M12 ${h - 13} Q${w / 2} ${h - 15} ${w - 12} ${h - 12}`} fill="none" stroke="#75451e" strokeOpacity=".1" strokeWidth="1" />}
    </>}
  </svg>;
}

function BuildPicture({ build, className = '' }) {
  const left = Math.min(...build.targets.map(t => t.x)) - 18;
  const top = Math.min(...build.targets.map(t => t.y)) - 35;
  const width = Math.max(...build.targets.map(t => t.x + SHAPES[t.kind].width)) - left + 35;
  const height = Math.max(...build.targets.map(t => t.y + SHAPES[t.kind].height)) - top + 18;
  return <svg className={`building-picture ${className}`} viewBox={`${left} ${top} ${width} ${height}`} aria-label={build.title} role="img">
    {build.targets.map(target => <g key={target.id} transform={`translate(${target.x},${target.y})`}>
      <PieceArt piece={SHAPES[target.kind]} />
    </g>)}
  </svg>;
}

export function BuildingIcon() {
  return <svg viewBox="0 -10 155 160" aria-hidden="true" focusable="false">
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
  const pieces = isCopy ? build.targets.map(target => filled.find(piece => piece.targetId === target.id)).filter(Boolean) : [...freePieces].sort((a, b) => b.y - a.y || a.x - b.x);
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
