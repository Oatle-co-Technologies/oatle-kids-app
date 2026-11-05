import ResponsivePlanetJourney from './ResponsivePlanetJourney';
import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import mercury from '../assets/images/planets/mercury.webp';
import saturn from '../assets/images/planets/saturn.webp';
import earth from '../assets/images/planets/earth.webp';
import victory from '../sounds/victory.mp3';
import { BUILD_SIZE, PARTS, SPACE_BUILDS, fitsBlueprint, remainingParts } from './spaceBuilderLogic';
import './CosmicPuzzles.css';
import './SpaceBuilder.css';

const PLANETS = [mercury, saturn, earth];
const SAVE_KEY = 'oatle-space-builder-v1';
function readCompleted() {
  try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); return Array.isArray(saved) ? saved.filter(id => SPACE_BUILDS.some(b => b.id === id)) : []; } catch { return []; }
}
// Construction pieces are simple geometry; all decorative artwork is from the app.
function Part({ kind, turn = 0, outline = false }) {
  const colour = PARTS[kind].colour;
  return <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false" className="sb-part"><g transform={`rotate(${turn * 90} 30 30)`} fill={outline ? 'none' : colour} stroke={colour} strokeWidth="2" strokeDasharray={outline ? '4 4' : undefined}>
    {kind === 'nose' ? <path d="M30 5 55 55H5Z" /> : kind === 'panel' ? <rect x="3" y="14" width="54" height="32" rx="3" /> : <rect x="4" y="4" width="52" height="52" rx="7" />}
    {!outline && (kind === 'window' ? <circle cx="30" cy="30" r="15" fill="#18334e" stroke="#fff" /> : kind === 'panel' ? <path d="M16 16V44M30 16V44M44 16V44M5 30H55" stroke="#293664" /> : kind === 'hull' ? <path d="M15 15H45M15 45H45" stroke="#8b9fb9" /> : null)}
  </g></svg>;
}
function Blueprint({ build, className = '' }) {
  return <div className={`sb-blueprint ${className}`} role="img" aria-label={`${build.title} blueprint, ${build.parts.length} parts`}>
    {Array.from({ length: 25 }, (_, cell) => { const p = build.parts.find(item => item.cell === cell); return <div key={cell}>{p && <Part {...p} />}</div>; })}
  </div>;
}
export function SpaceBuilderEntry({ onClick }) {
  return <button className="cosmic-entry" type="button" onClick={onClick}><img src={mercury} alt="" /><span><small>SPACE CHALLENGE ARCADE</small><strong>Space Builder</strong><span>Read the blueprint. Build the mission.</span></span><b aria-hidden="true">→</b></button>;
}
export default function SpaceBuilder({ onBack, soundOn = true }) {
  const [screen, setScreen] = useState('missions');
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [choice, setChoice] = useState(null);
  const [guide, setGuide] = useState(false);
  const [message, setMessage] = useState('');
  const [ghost, setGhost] = useState(null);
  const [completed, setCompleted] = useState(readCompleted);
  const board = useRef(null), drag = useRef(null), suppressClick = useRef(false);
  const build = SPACE_BUILDS[index];

  useEffect(() => {
    window.scrollTo(0, 0); document.querySelector('.app')?.scrollTo(0, 0);
  }, [screen]);
  useEffect(() => {
    const prompt = screen === 'missions' ? 'Space Builder. Choose a construction mission.' : screen === 'briefing' ? `${build.title}. ${build.brief}` : screen === 'play' ? 'Copy the blueprint. Choose a part, rotate it if needed, then tap a square. You can drag parts too.' : `Mission accomplished! ${build.success}`;
    const audio = screen === 'complete' && soundOn ? new Audio(victory) : null;
    if (audio) { audio.volume = .55; void audio.play().catch(() => {}); }
    const timer = soundOn ? window.setTimeout(() => speak(prompt), audio ? 7800 : 220) : null;
    function stop() { window.clearTimeout(timer); stopSpeech(); audio?.pause(); }
    function hidden() { if (document.hidden) stop(); }
    document.addEventListener('visibilitychange', hidden);
    return () => { stop(); document.removeEventListener('visibilitychange', hidden); };
  }, [screen, build, soundOn]);

  function clearDrag() { drag.current = null; setGhost(null); }
  function go(next) { clearDrag(); setChoice(null); setMessage(''); stopSpeech(); setScreen(next); }
  function chooseMission(i) { setIndex(i); go('briefing'); }
  function launch() { setPlaced([]); setGuide(false); suppressClick.current = false; go('play'); }
  function feedback(text) { setMessage(text); if (soundOn) speak(text); }
  function place(selected, cell) {
    if (screen !== 'play') return;
    if (!selected) { feedback('Choose a part first.'); return; }
    if (!fitsBlueprint(build, placed, selected, cell)) {
      const target = build.parts.find(p => p.cell === cell);
      feedback(placed.some(p => p.cell === cell) ? 'That square is already built. Try an empty square.' : target?.kind === selected.kind ? 'Turn your part to match the blueprint. Try again.' : 'Check the blueprint. Try another square or part.'); return;
    }
    const next = [...placed, { ...selected, cell }]; setPlaced(next); setChoice(null);
    if (next.length === build.parts.length) {
      const saved = [...new Set([...completed, build.id])]; setCompleted(saved);
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch { /* Building works without storage. */ }
      go('complete');
    } else setMessage('Part secured! Choose the next part.');
  }
  function select(kind) { setChoice({ kind, turn: choice?.kind === kind ? choice.turn : 0 }); setMessage('Rotate if needed, then choose a square.'); }
  function down(event, kind) {
    if (event.isPrimary === false || event.button !== 0) return;
    suppressClick.current = false;
    const selected = { kind, turn: choice?.kind === kind ? choice.turn : 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { ...selected, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    setChoice(selected);
  }
  function move(event) {
    const d = drag.current; if (!d || d.id !== event.pointerId) return;
    if (!d.moved && Math.hypot(event.clientX - d.x, event.clientY - d.y) < 8) return;
    d.moved = true; setGhost({ ...d, x: event.clientX, y: event.clientY });
  }
  function up(event) {
    const d = drag.current; if (!d || d.id !== event.pointerId) return;
    clearDrag();
    if (d.moved) {
      suppressClick.current = true;
      const rect = board.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
      if (x >= 0 && x < 1 && y >= 0 && y < 1) place({ kind: d.kind, turn: d.turn }, Math.floor(y * BUILD_SIZE) * BUILD_SIZE + Math.floor(x * BUILD_SIZE));
      else setMessage('Bring the part into the construction grid.');
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <main className={`cosmic-page sb-page sb-screen-${screen}`}><div className="cosmic-shell">
    <header className="cosmic-header"><LocalBackButton label={screen === 'missions' ? 'Explore' : 'Missions'} onClick={() => screen === 'missions' ? onBack() : go('missions')} /><p className="eyebrow">SPACE CHALLENGE ARCADE / CONSTRUCTION CREW</p><h1>{screen === 'missions' ? 'Space Builder' : screen === 'complete' ? 'Mission accomplished!' : build.title}</h1><p>{screen === 'missions' ? 'From launch pad to lunar outpost. Your next build starts here.' : screen === 'complete' ? build.success : build.location}</p></header>
    {screen === 'missions' && <ResponsivePlanetJourney label="Construction missions" items={SPACE_BUILDS.map((item, i) => ({
      id: item.id, title: item.title, subtitle: item.location, image: PLANETS[i],
      complete: completed.includes(item.id), onSelect: () => chooseMission(i),
    }))} />}
    {screen === 'briefing' && <section className="cosmic-briefing"><Blueprint build={build} /><div className="cosmic-brief-copy"><img className="cosmic-planet" src={PLANETS[index]} alt="" /><p className="eyebrow">MISSION 0{index + 1} / BRIEFING</p><h2>Build it. Power the expedition.</h2><p>{build.brief}</p><p>{build.parts.length} parts. Match the shape, position and direction.</p><p className="cosmic-note">Tap a part, then a square. Or drag it into place. Rotate triangles and panels before placing them. The blueprint stays beside you, and a guide is available.</p><button className="cosmic-primary" type="button" onClick={launch}>Start construction →</button></div></section>}
    {screen === 'play' && <section aria-label="Construction workshop">
      <div className="cosmic-status"><span><b>{placed.length}/{build.parts.length}</b> parts secured</span><span>MISSION 0{index + 1}</span><span>Take your time</span></div><div className="cosmic-progress" role="progressbar" aria-label="Construction complete" aria-valuemin={0} aria-valuemax={build.parts.length} aria-valuenow={placed.length}><span style={{ width: `${placed.length / build.parts.length * 100}%` }} /></div>
      <div className="sb-workspace"><aside className="sb-reference"><p className="eyebrow">YOUR BLUEPRINT</p><Blueprint build={build} /><p>Match each row and column.</p><button className="cosmic-secondary" type="button" aria-pressed={guide} onClick={() => setGuide(value => !value)}>{guide ? 'Hide guide' : 'Show guide'}</button></aside>
        <div className="sb-build-area"><p className="eyebrow">CONSTRUCTION GRID</p><div className="sb-board" ref={board} aria-label="Construction grid">{Array.from({ length: 25 }, (_, cell) => { const p = placed.find(item => item.cell === cell), target = guide && build.parts.find(item => item.cell === cell); return <button type="button" key={cell} className={p ? 'is-built' : ''} aria-label={`Row ${Math.floor(cell / 5) + 1}, column ${cell % 5 + 1}${p ? `, ${PARTS[p.kind].name} secured` : ', empty'}`} onClick={() => place(choice, cell)}>{p ? <Part {...p} /> : target ? <Part {...target} outline /> : <span aria-hidden="true">·</span>}</button>; })}</div></div>
        <aside className="sb-supply"><p className="eyebrow">PARTS BAY</p><div className="sb-palette">{Object.entries(PARTS).filter(([kind]) => remainingParts(build, placed, kind) > 0).map(([kind, definition]) => <button type="button" key={kind} aria-label={`Choose ${definition.name}`} aria-pressed={choice?.kind === kind} className={choice?.kind === kind ? 'is-selected' : ''} onPointerDown={e => down(e, kind)} onPointerMove={move} onPointerUp={up} onPointerCancel={clearDrag} onLostPointerCapture={clearDrag} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return; } select(kind); }}><Part kind={kind} turn={choice?.kind === kind ? choice.turn : 0} /><span>{definition.name}<small>×{remainingParts(build, placed, kind)} left</small></span></button>)}</div><button type="button" className="cosmic-secondary sb-rotate" disabled={!choice || PARTS[choice.kind].turns === 1} onClick={() => { setChoice(p => ({ ...p, turn: (p.turn + 1) % PARTS[p.kind].turns })); setMessage('Part rotated. Choose its square.'); }}>Rotate part ↻</button><p className="sb-direction">{choice ? `${PARTS[choice.kind].name} · ${choice.turn * 90}°` : 'Choose a part to begin.'}</p></aside>
      </div><p className="cosmic-message" role="status">{message || 'Choose a part. Rotate if needed. Tap a square or drag it into place.'}</p><div className="sb-tools"><button className="cosmic-secondary" type="button" disabled={!placed.length} onClick={() => { setPlaced(p => p.slice(0, -1)); setChoice(null); setMessage('Last part returned to the parts bay.'); }}>Undo last part</button><button className="cosmic-text-button" type="button" onClick={launch}>Restart build ↻</button></div>
      {ghost && <div className="sb-ghost" style={{ left: ghost.x, top: ghost.y }}><Part {...ghost} /></div>}
    </section>}
    {screen === 'complete' && <section className="cosmic-finish"><div className="cosmic-finish-stamp">CONSTRUCTION COMPLETE ✓</div><div className="sb-finished"><img src={PLANETS[index]} alt="" /><Blueprint build={build} /></div><p>{build.parts.length} parts secured. Excellent engineering!</p><div className="cosmic-actions"><button className="cosmic-primary" type="button" onClick={() => index < SPACE_BUILDS.length - 1 ? chooseMission(index + 1) : go('missions')}>{index < SPACE_BUILDS.length - 1 ? 'Next mission →' : 'Choose a mission →'}</button><button className="cosmic-secondary" type="button" onClick={() => go('briefing')}>Build again</button></div></section>}
  </div></main>;
}
