import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import { createMusicAudio } from './musicAudio';
import './MusicAdventure.css';

const ACTIVITIES = [
  { id: 'play', title: 'My Little Band', icon: 'drum', description: 'Tap, play and make your own music.', label: 'Play instruments' },
  { id: 'copy', title: 'Copy My Music', icon: 'bell', description: 'Listen to two sounds. Then try them!', label: 'Listen & copy' },
  { id: 'dance', title: 'Dance & Freeze', icon: 'dance', description: 'Move to the music. Stop when it stops!', label: 'Move & pause' },
];
const PATTERNS = [['drum', 'drum'], ['bell', 'bell'], ['drum', 'bell']];
const INSTRUCTIONS = {
  menu: 'Let’s make music! Choose an activity.',
  play: 'Tap the drum, ring the bell, or play the colourful keys. Make your own music!',
  copy: 'Tap Listen. Hear the sounds, then tap the same instruments.',
  dance: 'Make some room. Dance when the music plays. When it stops, freeze! You can move your hands too.',
};

function InstrumentArt({ kind }) {
  return <svg viewBox="0 0 160 140" aria-hidden="true" focusable="false">
    {kind === 'drum' ? <><path d="M30 57v46c0 30 100 30 100 0V57" fill="#ee8174" stroke="#713e63" strokeWidth="5" /><path d="m35 65 17 45 20-40 20 40 20-40 15 36" fill="none" stroke="#ffe6a5" strokeWidth="5" /><ellipse cx="80" cy="57" rx="50" ry="20" fill="#fff1cc" stroke="#713e63" strokeWidth="5" /><path d="m24 17 47 33m65-32L92 48" stroke="#f7c96b" strokeWidth="9" strokeLinecap="round" /></>
      : kind === 'bell' ? <><circle cx="80" cy="25" r="12" fill="none" stroke="#97622a" strokeWidth="7" /><path d="M80 30c-35 0-31 47-45 64q-8 12 0 16h90q8-4 0-16C111 77 115 30 80 30" fill="#ffd46c" stroke="#97622a" strokeWidth="5" /><path d="M61 116q19 23 38 0" fill="#f18d69" /><path d="M60 48q-11 11-11 30" fill="none" stroke="#fff3c5" strokeWidth="7" strokeLinecap="round" /></>
      : <><path d="M64 94V33l67-13v62" fill="none" stroke="#aaecda" strokeWidth="13" strokeLinejoin="round" /><ellipse cx="48" cy="99" rx="23" ry="16" transform="rotate(-20 48 99)" fill="#aaecda" /><ellipse cx="115" cy="87" rx="23" ry="16" transform="rotate(-20 115 87)" fill="#aaecda" /><path d="m18 34 4 9 10 1-8 7 2 11-8-6-9 6 2-11-7-7 10-1" fill="#ffda7b" /></>}
  </svg>;
}

export function MusicIcon() { return <InstrumentArt kind="dance" />; }

export default function MusicAdventure(props) {
  // Reset a running activity if the app-wide sound setting changes.
  return <MusicActivities key={String(props.soundOn)} {...props} />;
}

function MusicActivities({ onBack, soundOn = true }) {
  const [activity, setActivity] = useState('menu');
  const [phase, setPhase] = useState('ready');
  const [message, setMessage] = useState('');
  const [lit, setLit] = useState(null);
  const [round, setRound] = useState(0);
  const [progress, setProgress] = useState(0);
  const audio = useRef(null);
  const timers = useRef(new Set());
  const generation = useRef(0);
  const phaseRef = useRef('ready');
  const answer = useRef(0);

  function later(callback, delay) {
    const id = window.setTimeout(() => { timers.current.delete(id); callback(); }, delay);
    timers.current.add(id);
    return id;
  }
  function changePhase(next) { phaseRef.current = next; setPhase(next); }
  function clear() {
    generation.current += 1;
    for (const id of timers.current) window.clearTimeout(id);
    timers.current.clear();
    audio.current?.stop();
    stopSpeech();
  }
  function say(text) { if (soundOn) speak(text); }
  function reset() { clear(); changePhase('ready'); setLit(null); setProgress(0); answer.current = 0; setMessage(''); }
  function choose(id) { reset(); setRound(0); setActivity(id); }
  async function readyAudio() {
    if (!soundOn) return false;
    if (!audio.current) audio.current = createMusicAudio();
    const token = generation.current;
    const ready = await audio.current.unlock();
    if (generation.current !== token) return false;
    if (!ready) { setMessage('Sound could not start. Tap again to retry.'); changePhase('ready'); }
    return ready;
  }

  useEffect(() => {
    if (!soundOn) return undefined;
    const id = window.setTimeout(() => speak(INSTRUCTIONS[activity]), 200);
    // Keep the introduction cancellable by the first instrument tap.
    const pending = timers.current;
    pending.add(id);
    return () => { window.clearTimeout(id); pending.delete(id); stopSpeech(); };
  }, [activity, soundOn]);

  useEffect(() => {
    const pending = timers.current;
    function pauseWhenHidden() {
      if (!document.hidden) return;
      generation.current += 1;
      for (const id of pending) window.clearTimeout(id);
      pending.clear();
      audio.current?.stop(); stopSpeech();
      phaseRef.current = 'ready'; setPhase('ready'); setLit(null); setProgress(0); answer.current = 0;
      setMessage('Ready when you are.');
    }
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      generation.current += 1;
      for (const id of pending) window.clearTimeout(id);
      pending.clear(); audio.current?.dispose(); audio.current = null; stopSpeech();
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, []);

  async function play(instrument, pitch = 0, key = instrument) {
    clear();
    if (!await readyAudio()) return;
    audio.current.hit(instrument, 0, pitch);
    setLit(key); later(() => setLit(null), 220);
  }

  async function listen(nextRound = round) {
    reset(); changePhase('listening');
    if (!await readyAudio()) return;
    setMessage('Listen…');
    PATTERNS[nextRound].forEach((instrument, index) => {
      audio.current.hit(instrument, 0.25 + index * 0.85);
      later(() => setLit(instrument), 250 + index * 850);
      later(() => setLit(null), 700 + index * 850);
    });
    later(() => { changePhase('answer'); setMessage('Your turn!'); say('Your turn!'); }, 1950);
  }

  function copy(instrument) {
    if (phaseRef.current !== 'answer') return;
    stopSpeech(); audio.current.hit(instrument); setLit(instrument);
    later(() => setLit(null), 250);
    if (PATTERNS[round][answer.current] !== instrument) {
      answer.current = 0; setProgress(0); changePhase('retry');
      setMessage('Let’s listen again. You can try as many times as you like.');
      later(() => say('Let’s listen again. Tap Listen to try again.'), 650);
      return;
    }
    answer.current += 1; setProgress(answer.current);
    if (answer.current === PATTERNS[round].length) {
      changePhase('success'); setMessage('You copied the music!');
      later(() => say('You copied the music! Well done!'), 650);
    }
  }

  async function dance() {
    reset(); changePhase('starting');
    if (!await readyAudio()) return;
    const melody = [0, 4, 7, 4, 5, 9, 7, 4, 0, 4, 2, 0];
    function moving(turn) {
      changePhase('dance'); setProgress(turn); setMessage('Dance, wiggle or wave!');
      melody.forEach((pitch, index) => {
        audio.current.hit('piano', index * 0.5, pitch);
        if (index % 2 === 0) audio.current.hit('drum', index * 0.5);
      });
      later(() => {
        audio.current.stop(); changePhase('freeze'); setMessage('Freeze! Stay still like a statue.'); say('Freeze!');
        later(() => {
          stopSpeech();
          if (turn < 3) moving(turn + 1);
          else { changePhase('finished'); setMessage('Wonderful moving! You danced and froze three times.'); say('Wonderful dancing!'); }
        }, 3200);
      }, 6200);
    }
    moving(1);
  }

  const selected = ACTIVITIES.find(item => item.id === activity);
  const playing = ['starting', 'dance', 'freeze'].includes(phase);
  return <main className="little-explorers-page music-page">
    <header className="music-header">
      <LocalBackButton label={activity === 'menu' ? 'Adventures' : 'Music activities'} onClick={() => { reset(); activity === 'menu' ? onBack() : setActivity('menu'); }} />
      <p className="eyebrow">LITTLE EXPLORERS / MUSIC & MOVEMENT</p>
      <h1>{selected?.title || 'Music & Movement'}</h1>
      <p>{activity === 'menu' ? 'Little sounds. Big smiles. Let’s play!' : selected.description}</p>
    </header>
    {!soundOn && <p className="music-notice" role="status">Sound is off. Ask a grown-up to turn on app sounds to play these activities.</p>}
    {activity === 'menu' ? <section className="music-choices" aria-label="Music activities">
      {ACTIVITIES.map(item => <button type="button" key={item.id} onClick={() => choose(item.id)}><InstrumentArt kind={item.icon} /><strong>{item.title}</strong><span>{item.description}</span><b>{item.label} <span aria-hidden="true">→</span></b></button>)}
    </section> : <section className="music-workshop" aria-label={selected.title}>
      {activity === 'play' && <>
        <p className="music-hint">Tap anything. Every sound is yours!</p>
        <div className="music-instruments">{['drum', 'bell'].map(kind => <button type="button" className={`music-pad ${lit === kind ? 'is-lit' : ''}`} disabled={!soundOn} key={kind} onClick={() => play(kind)}><InstrumentArt kind={kind} /><strong>{kind === 'drum' ? 'Drum' : 'Bell'}</strong></button>)}</div>
        <div className="music-keys" aria-label="Five piano keys">{['C', 'D', 'E', 'G', 'A'].map((note, index) => <button type="button" key={note} style={{ '--key-colour': ['#ef9894', '#ffd77d', '#a9e3b7', '#9ed9f3', '#ccbbf0'][index] }} className={lit === note ? 'is-lit' : ''} disabled={!soundOn} aria-label={`Play ${note}`} onClick={() => play('piano', [0, 2, 4, 7, 9][index], note)}><span aria-hidden="true">♪</span><b>{note}</b></button>)}</div>
        <p className="music-hint">Your little piano</p>
      </>}
      {activity === 'copy' && <>
        <p className="music-hint">Little tune {round + 1} of {PATTERNS.length} · Two sounds to copy</p>
        <div className="music-copy-progress" aria-label={`${progress} of 2 sounds copied`}>{PATTERNS[round].map((_, index) => <span key={index} className={index < progress ? 'is-complete' : ''} aria-hidden="true">{index < progress ? '★' : '♪'}</span>)}</div>
        <button type="button" className="music-primary" disabled={!soundOn || phase === 'listening'} onClick={() => listen()}>{phase === 'listening' ? 'Listening…' : phase === 'ready' ? '▶ Listen' : '↻ Listen again'}</button>
        <div className="music-instruments">{['drum', 'bell'].map(kind => <button type="button" key={kind} disabled={!soundOn || phase !== 'answer'} className={`music-pad ${lit === kind ? 'is-lit' : ''}`} onClick={() => copy(kind)}><InstrumentArt kind={kind} /><strong>{kind === 'drum' ? 'Drum' : 'Bell'}</strong></button>)}</div>
        {phase === 'success' && <button type="button" className="music-primary" onClick={() => { const next = (round + 1) % PATTERNS.length; setRound(next); void listen(next); }}>{round === PATTERNS.length - 1 ? 'Play again' : 'Next little tune'} <span aria-hidden="true">→</span></button>}
      </>}
      {activity === 'dance' && <>
        <p className="music-grownup">Grown-ups: make a little space and stay nearby. Seated dancing and waving hands work too.</p>
        <div className={`music-dance-stage ${phase === 'dance' ? 'is-dancing' : ''} ${phase === 'freeze' ? 'is-frozen' : ''}`}>
          <div className="music-mascot" aria-hidden="true">{phase === 'freeze' ? '🧊' : phase === 'finished' ? '🌟' : '🐻'}</div>
          <h2>{phase === 'dance' ? 'Dance!' : phase === 'freeze' ? 'Freeze!' : phase === 'finished' ? 'You did it!' : 'Ready to wiggle?'}</h2>
          <p>{playing ? `Round ${progress || 1} of 3` : 'Move when you hear the music'}</p>
        </div>
        <button type="button" className="music-primary" disabled={!soundOn} onClick={playing ? reset : dance}>{playing ? '■ Stop' : phase === 'finished' ? '▶ Dance again' : '▶ Start dancing'}</button>
      </>}
      <p className="music-message" role="status">{message || (activity === 'copy' ? 'Tap Listen when you’re ready.' : '')}</p>
    </section>}
  </main>;
}
