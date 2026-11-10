import { learningStorage } from '../lib/profileStorage.js';
import ResponsivePlanetJourney from './ResponsivePlanetJourney';
import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import solarSystemImage from '../assets/images/puzzles/solar-system.webp';
import logoImage from '../assets/images/puzzles/oatle-kids.svg';
import astronautImage from '../assets/images/puzzles/astronaut.webp';
import mercuryImage from '../assets/images/planets/mercury.webp';
import saturnImage from '../assets/images/planets/saturn.webp';
import neptuneImage from '../assets/images/planets/neptune.webp';
import victorySound from '../sounds/victory.mp3';
import { PUZZLE_LEVELS, cosmicSolved, shuffleCosmicTiles, swapCosmicTiles } from './cosmicPuzzleLogic';
import './CosmicPuzzles.css';

// Keep mission IDs and level IDs stable so existing completion records survive.
const MISSIONS = [
  { id: 'solar', title: 'The Solar System', image: solarSystemImage, planet: mercuryImage, location: 'Our solar neighbourhood', subject: 'the Solar System', brief: 'Explore the Sun and the nine named worlds, including Pluto. Rebuild the picture to restore the view of our solar system.', success: 'Solar system restored. All nine worlds are back in view!' },
  { id: 'cargo', title: 'Oatle Kids', image: logoImage, planet: saturnImage, location: 'Your Oatle Kids mission', subject: 'the Oatle Kids logo', brief: 'The Oatle Kids logo has been scrambled. Bring its colours and letters back together to reveal the complete logo.', success: 'Logo restored. The Oatle Kids colours are shining again!' },
  { id: 'neptune', title: 'Space Explorer', image: astronautImage, planet: neptuneImage, location: 'An astronaut among the stars', subject: 'an astronaut in a spacesuit', brief: 'An astronaut is exploring a distant space landscape. Rebuild the whole picture, from helmet to boots.', success: 'Picture restored. Your space explorer is ready for the next adventure!' },
];
const SAVE_KEY = 'oatle-cosmic-puzzles-v1';
function readCompleted() {
  try {
    const saved = JSON.parse(learningStorage.getItem(SAVE_KEY));
    const allowed = MISSIONS.flatMap(mission => Object.keys(PUZZLE_LEVELS).map(level => `${mission.id}-${level}`));
    return Array.isArray(saved) ? saved.filter(key => allowed.includes(key)) : [];
  } catch { return []; }
}

function PuzzlePicture({ image, tile = null, columns = 5, rows = 4 }) {
  // Every tile and reference uses the same 3:2 canvas without cropping.
  const width = 1536 / columns, height = 1024 / rows;
  const viewBox = tile === null ? '0 0 1536 1024' : `${tile % columns * width} ${Math.floor(tile / columns) * height} ${width} ${height}`;
  return <svg className="cosmic-picture" viewBox={viewBox} aria-hidden="true" focusable="false"><image href={image} width="1536" height="1024" /></svg>;
}

export function CosmicPuzzleEntry({ onClick }) {
  return <button type="button" className="cosmic-entry" onClick={onClick}>
    <img src={saturnImage} alt="" /><span><small>SPACE CHALLENGE ARCADE</small><strong>Cosmic Puzzles</strong><span>Rebuild the picture. Complete the mission.</span></span><b aria-hidden="true">→</b>
  </button>;
}

export default function CosmicPuzzles({ onBack, soundOn = true }) {
  const [screen, setScreen] = useState('missions');
  const [missionIndex, setMissionIndex] = useState(0);
  const [levelId, setLevelId] = useState('explorer');
  const [tiles, setTiles] = useState(() => shuffleCosmicTiles(PUZZLE_LEVELS.explorer.pieces));
  const [selected, setSelected] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [showReference, setShowReference] = useState(true);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState('');
  const [completed, setCompleted] = useState(readCompleted);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const victoryRef = useRef(null);
  const narrationRef = useRef(null);
  const mission = MISSIONS[missionIndex];
  const level = PUZZLE_LEVELS[levelId];
  const restored = tiles.filter((tile, index) => tile === index).length;

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.app')?.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const prompt = screen === 'missions' ? 'Cosmic Puzzles. Choose your space mission.'
      : screen === 'briefing' ? `${mission.title}. ${mission.brief} Choose ten, twelve, sixteen or twenty pieces, then launch your mission.`
        : screen === 'play' ? `Restore the picture of ${mission.subject}. Drag one piece onto another, or tap two pieces to swap them.`
          : `Mission accomplished! ${mission.success}`;
    const timer = window.setTimeout(() => speak(prompt), screen === 'complete' ? 7800 : 220);
    narrationRef.current = timer;
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [screen, mission, soundOn]);

  useEffect(() => {
    if (screen !== 'complete' || !soundOn) return undefined;
    const audio = new Audio(victorySound); audio.volume = 0.55; victoryRef.current = audio;
    void audio.play().catch(() => {});
    return () => { audio.pause(); victoryRef.current = null; };
  }, [screen, soundOn]);

  useEffect(() => {
    function onHidden() { if (document.hidden) { window.clearTimeout(narrationRef.current); stopSpeech(); victoryRef.current?.pause(); } }
    document.addEventListener('visibilitychange', onHidden);
    return () => { document.removeEventListener('visibilitychange', onHidden); stopSpeech(); victoryRef.current?.pause(); };
  }, []);

  function clearDrag() { dragRef.current = null; setGhost(null); }
  function navigate(next) { clearDrag(); setSelected(null); setMessage(''); stopSpeech(); setScreen(next); }
  function choose(index) { setMissionIndex(index); navigate('briefing'); }
  function launch() {
    setTiles(shuffleCosmicTiles(level.pieces)); setMoves(0); setShowReference(levelId === 'explorer');
    suppressClick.current = false; navigate('play');
  }
  function swap(first, second) {
    setSelected(null);
    if (first === second || screen !== 'play') return;
    const next = swapCosmicTiles(tiles, first, second);
    setTiles(next); setMoves(count => count + 1);
    if (cosmicSolved(next, level.pieces)) {
      const key = `${mission.id}-${levelId}`;
      const saved = [...new Set([...completed, key])];
      setCompleted(saved);
      try { learningStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch { /* Play still works if storage is unavailable. */ }
      navigate('complete');
    } else setMessage('Pieces swapped. Keep restoring the picture.');
  }
  function tap(index) {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (selected === null) { setSelected(index); setMessage('Choose another piece to swap with this one.'); }
    else swap(selected, index);
  }
  function down(event, index) {
    if (event.isPrimary === false || event.button !== 0) return;
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
      if (x >= 0 && x < 1 && y >= 0 && y < 1) swap(drag.index, Math.floor(y * level.rows) * level.columns + Math.floor(x * level.columns));
      else setMessage('Drop your piece onto another piece inside the picture.');
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <main className={`cosmic-page cosmic-screen-${screen}`}>
    <div className="cosmic-shell">
      <header className="cosmic-header">
        <LocalBackButton label={screen === 'missions' ? 'Explore' : 'Missions'} onClick={() => screen === 'missions' ? onBack() : navigate('missions')} />
        <p className="eyebrow">SPACE CHALLENGE ARCADE</p>
        <h1>{screen === 'missions' ? 'Cosmic Puzzles' : screen === 'complete' ? 'Mission accomplished!' : mission.title}</h1>
        <p>{screen === 'missions' ? 'A scrambled transmission. A sharp-eyed explorer. Your next mission awaits.' : screen === 'complete' ? mission.success : mission.location}</p>
      </header>

      {screen === 'missions' && <ResponsivePlanetJourney label="Choose a puzzle mission" items={MISSIONS.map((item, index) => ({
        id: item.id, title: item.title, subtitle: item.location, image: item.planet,
        complete: Object.keys(PUZZLE_LEVELS).every(level => completed.includes(`${item.id}-${level}`)),
        onSelect: () => choose(index),
      }))} />}

      {screen === 'briefing' && <section className="cosmic-briefing" aria-label="Mission briefing">
        <figure><img src={mission.image} alt={`Complete picture of ${mission.subject}`} /><figcaption>Your transmission to restore</figcaption></figure>
        <div className="cosmic-brief-copy"><img className="cosmic-planet" src={mission.planet} alt="" /><p className="eyebrow">MISSION 0{missionIndex + 1} / BRIEFING</p><h2>Restore the whole picture.</h2><p>{mission.brief}</p>
          <fieldset className="cosmic-levels"><legend>Choose your challenge</legend>{Object.entries(PUZZLE_LEVELS).map(([id, option]) => <label key={id} className={levelId === id ? 'is-selected' : ''}><input type="radio" name="cosmic-level" value={id} checked={levelId === id} onChange={() => setLevelId(id)} /><span><strong>{option.title}</strong><small>{option.pieces} pieces</small></span></label>)}</fieldset>
          <p className="cosmic-note">Swap pieces by dragging or tapping two tiles. Use the reference picture whenever you need it. Take your time.</p>
          <button type="button" className="cosmic-primary" onClick={launch}>Launch mission →</button>
        </div>
      </section>}

      {screen === 'play' && <section className="cosmic-workshop" aria-label={`${mission.title} puzzle`}>
        <div className="cosmic-status"><span><b>{restored}/{level.pieces}</b> pieces in place</span><span>{moves} swaps</span><span>{level.title}</span></div>
        <div className="cosmic-progress" role="progressbar" aria-label="Picture restored" aria-valuemin={0} aria-valuemax={level.pieces} aria-valuenow={restored}><span style={{ width: `${restored / level.pieces * 100}%` }} /></div>
        <div className="cosmic-play-layout">
          <div className="cosmic-board" ref={boardRef} style={{ '--columns': level.columns, '--rows': level.rows }} aria-label={`${level.pieces} picture pieces`}>
            {tiles.map((tile, position) => <button type="button" key={position} data-piece={tile} aria-label={`Piece ${tile + 1}, position ${position + 1}`} aria-pressed={selected === position} className={`cosmic-tile ${selected === position ? 'is-selected' : ''} ${ghost?.index === position ? 'is-moving' : ''}`} onClick={() => tap(position)} onPointerDown={event => down(event, position)} onPointerMove={move} onPointerUp={up} onPointerCancel={clearDrag} onLostPointerCapture={clearDrag}><PuzzlePicture image={mission.image} tile={tile} columns={level.columns} rows={level.rows} /></button>)}
          </div>
          <aside className="cosmic-scanner"><img className="cosmic-planet" src={mission.planet} alt="" /><p className="eyebrow">MISSION CONTROL</p><button type="button" className="cosmic-secondary" aria-expanded={showReference} onClick={() => setShowReference(value => !value)}>{showReference ? 'Hide reference' : 'Show reference'}</button>
            {showReference && <figure><img src={mission.image} alt={`Reference picture of ${mission.subject}`} /><figcaption>Match the complete picture</figcaption></figure>}
            <p>Drag one tile onto another, or tap two tiles to swap them.</p><button type="button" className="cosmic-text-button" onClick={launch}>Restart puzzle ↻</button>
          </aside>
        </div>
        <p className="cosmic-message" role="status">{message || 'Transmission scrambled. Let’s put it back together.'}</p>
        {ghost && <div className="cosmic-ghost" style={{ left: ghost.x, top: ghost.y, width: ghost.width, height: ghost.height }}><PuzzlePicture image={mission.image} tile={ghost.tile} columns={level.columns} rows={level.rows} /></div>}
      </section>}

      {screen === 'complete' && <section className="cosmic-finish" aria-label="Completed mission">
        <div className="cosmic-finish-stamp">TRANSMISSION RESTORED ✓</div><img className="cosmic-restored-picture" src={mission.image} alt={`Restored picture of ${mission.subject}`} />
        <p>{level.pieces} pieces restored · {moves} swaps · {level.title}</p>
        <div className="cosmic-actions">{missionIndex < MISSIONS.length - 1 ? <button type="button" className="cosmic-primary" onClick={() => choose(missionIndex + 1)}>Next mission →</button> : <button type="button" className="cosmic-primary" onClick={() => navigate('missions')}>Choose a mission →</button>}<button type="button" className="cosmic-secondary" onClick={() => navigate('briefing')}>Play again</button></div>
      </section>}
    </div>
  </main>;
}
