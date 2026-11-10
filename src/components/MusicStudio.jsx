import { learningStorage } from '../lib/profileStorage.js';
import { useEffect, useRef, useState } from 'react';
import StudioInstrument, { StudioArt } from './StudioInstrument';
import { INSTRUMENT_NAMES } from './musicStudioData';
import { createMusicAudio, renderMusicWave } from './musicAudio';
import { NOTE_ROUNDS, RECORDING_LIMIT_SECONDS, RECORDING_LIMIT_NOTES, validTune, scheduleTunePlayback } from './musicStudioData';
import './MusicStudio.css';
import MediaSaveDialog from './MediaSaveDialog';
// Read the monotonic clock only from input handlers and recording timers.
const recordingClock = () => window.performance.now();
const SAVE_KEY = 'oatle-music-tune-v1';
const freeKinds = ['piano', 'violin', 'drum', 'bongos', 'bell', 'xylophone'];
const bigKinds = ['piano', 'violin', 'xylophone', 'drum', 'bongos', 'bell'];
export default function MusicStudio({
  mode = 'free',
  soundOn = true,
  onBack,
  onComplete,
  onStart
}) {
  const [preparedFile, setPreparedFile] = useState(null);
  const [kind, setKind] = useState('piano'),
    [lit, setLit] = useState(null),
    [status, setStatus] = useState(''),
    [played, setPlayed] = useState(false);
  const [transport, setTransport] = useState('idle'),
    [notes, setNotes] = useState([]),
    [seconds, setSeconds] = useState(0),
    [saved, setSaved] = useState(() => {
      try {
        const value = JSON.parse(learningStorage.getItem(SAVE_KEY));
        return validTune(value) ? value : null;
      } catch {
        return null;
      }
    }),
    [exporting, setExporting] = useState(false);
  const [round, setRound] = useState(0),
    [lessonPhase, setLessonPhase] = useState('explore');
  const engine = useRef(null),
    timers = useRef(new Set()),
    started = useRef(0),
    recorded = useRef([]),
    transportRef = useRef('idle'),
    token = useRef(0),
    lightTimer = useRef(null);
  const compose = mode === 'compose',
    lesson = mode === 'notes',
    target = NOTE_ROUNDS[Math.min(round, 7)],
    finished = round === 8;
  const kinds = mode === 'free' ? freeKinds : lesson ? bigKinds.slice(0, 3) : bigKinds;
  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }
  function stop() {
    token.current++;
    for (const id of timers.current) clearTimeout(id);
    timers.current.clear();
    engine.current?.stop();
    transportRef.current = 'idle';
    setTransport('idle');
    setLit(null);
  }
  function endRecording() {
    setNotes([...recorded.current]);
    stop();
    setStatus(recorded.current.length ? 'Your tune is ready. Listen back or save it.' : 'Tap Record, then play some notes.');
  }
  useEffect(() => {
    const lifecycle = token;
    const pending = timers.current;
    function hidden() {
      if (!document.hidden) return;
      token.current++;
      pending.forEach(clearTimeout);
      pending.clear();
      engine.current?.stop();
      if (transportRef.current === 'recording') {
        setNotes([...recorded.current]);
        setStatus('Recording stopped. Your tune is ready to listen to or save.');
      } else setStatus('');
      transportRef.current = 'idle';
      setTransport('idle');
      setLit(null);
      setLessonPhase('explore');
    }
    document.addEventListener('visibilitychange', hidden);
    return () => {
      lifecycle.current++;
      pending.forEach(clearTimeout);
      clearTimeout(lightTimer.current);
      engine.current?.dispose();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  useEffect(() => {
    if (transport !== 'recording') return undefined;
    const id = setInterval(() => setSeconds(Math.min(60, Math.floor((recordingClock() - started.current) / 1000))), 200);
    return () => clearInterval(id);
  }, [transport]);
  async function ready() {
    onStart?.();
    if (!soundOn) {
      setStatus('Sound is off. Ask a grown-up to turn sound on in Settings.');
      return false;
    }
    if (!engine.current) engine.current = createMusicAudio();
    const current = token.current;
    const ok = await engine.current.unlock();
    if (current !== token.current) return false;
    if (!ok) setStatus('Sound could not start. Tap again to try.');
    return ok;
  }
  function flash(noteKind, pitch) {
    setLit(`${noteKind}-${pitch}`);
    clearTimeout(lightTimer.current);
    lightTimer.current = setTimeout(() => setLit(null), 260);
  }
  async function play(noteKind, pitch) {
    if (transportRef.current === 'playing' || lessonPhase === 'listening') return;
    if (!(await ready())) return;
    engine.current.hit(noteKind, 0, pitch);
    flash(noteKind, pitch);
    setPlayed(true);
    if (transportRef.current === 'recording') {
      const time = (recordingClock() - started.current) / 1000;
      if (time <= 60 && recorded.current.length < RECORDING_LIMIT_NOTES) {
        recorded.current.push({
          kind: noteKind,
          pitch,
          time
        });
        setNotes([...recorded.current]);
      }
      if (recorded.current.length === RECORDING_LIMIT_NOTES) endRecording();
    }
    if (lesson && lessonPhase === 'answer') {
      if (pitch === target.pitch) {
        setLessonPhase('correct');
        setStatus(`Yes! That is ${target.name}.`);
      } else setStatus('Try again. Listen to the note, then find its key.');
    }
  }
  async function listen() {
    if (!(await ready())) return;
    stop();
    setLessonPhase('listening');
    setStatus(`Listen to ${target.name}.`);
    engine.current.hit(kind, 0, target.pitch);
    flash(kind, target.pitch);
    later(() => {
      setLessonPhase('answer');
      setStatus(`Your turn! Play ${target.name}.`);
    }, 900);
  }
  async function record() {
    if (!(await ready())) return;
    stop();
    recorded.current = [];
    setNotes([]);
    setSeconds(0);
    started.current = recordingClock();
    transportRef.current = 'recording';
    setTransport('recording');
    setStatus('Recording! Play your tune. You can change instruments too.');
    later(endRecording, RECORDING_LIMIT_SECONDS * 1000);
  }
  async function replay() {
    if (!validTune(notes) || !(await ready())) return;
    stop();
    transportRef.current = 'playing';
    setTransport('playing');
    setStatus('Playing your tune…');
    scheduleTunePlayback(notes, later, n => {
      engine.current.hit(n.kind, 0, n.pitch);
      setKind(n.kind);
      flash(n.kind, n.pitch);
    }, () => {
      stop();
      setStatus('That was your music!');
    });
  }

  function save() {
    try {
      learningStorage.setItem(SAVE_KEY, JSON.stringify(notes));
      setSaved([...notes]);
      setStatus('Saved on this device. You can open your tune next time.');
    } catch {
      setStatus('This device could not save your tune. Try Save audio instead.');
    }
  }
  async function download() {
    setExporting(true);
    try {
      const blob = await renderMusicWave(notes);
      setPreparedFile(new File([blob], 'Oatle-My-Music.wav', { type: 'audio/wav' }));
      setStatus('Your music is ready. Choose how to save it.');
    } catch {
      setStatus('Audio download could not start in this browser. Your saved tune can still be replayed here.');
    } finally {
      setExporting(false);
    }
  }
  function choose(next) {
    if (transport === 'playing') return;
    engine.current?.stop();
    setLit(null);
    setKind(next);
    if (lesson) {
      stop();
      setLessonPhase('explore');
      setStatus('');
    }
  }
  return <main className={`instrument-studio mode-${mode}`}>
 <MediaSaveDialog file={preparedFile} onClose={() => setPreparedFile(null)} />
 <header className="music-studio-header"><button type="button" onClick={() => {
        stop();
        onBack();
      }} aria-label="Back to music">← <span>Back</span></button><div><p>{mode === 'free' ? 'MY LITTLE BAND' : 'MUSIC ADVENTURE'}</p><h1>{lesson ? 'Meet the Notes' : compose ? 'My Music Studio' : 'Let’s make music'}</h1></div>{mode === 'free' && onComplete ? <button type="button" disabled={!played} onClick={() => {
        stop();
        onComplete();
      }}>Done ✓</button> : <span className="music-studio-header-note" aria-hidden="true">♫</span>}</header>
 {!soundOn && <p className="music-studio-muted" role="status">Sound is off. Ask a grown-up to turn sound on in Settings.</p>}
 {lesson ? <section className="music-studio-lesson" aria-label="Note challenge"><div><span className="music-studio-kicker">{finished ? 'BRILLIANT LISTENING' : `NOTE ${round + 1} OF 8`}</span><h2>{finished ? 'You met a whole octave!' : `Meet ${target.name}`}</h2><p>{finished ? 'C, D, E, F, G, A, B, C. Try another instrument!' : round === 0 ? 'Notes have letter names. C is our first note.' : 'Each step to the right sounds higher.'}</p></div><svg className="music-studio-staff" viewBox="0 0 180 150" role="img" aria-label={`${target.name} on a treble staff`}>{[52.5, 67.5, 82.5, 97.5, 112.5].map(y => <path key={y} d={`M10 ${y}h160`} stroke="#bab4cf" strokeWidth="2" />)}<text x="8" y="112" fontSize="72" fill="#61557c">𝄞</text>{(() => {
          const y = 75 - Math.min(round, 7) * 7.5;
          return <g fill="#7461ad"><ellipse cx="110" cy={y} rx="11" ry="8" transform={`rotate(-20 110 ${y})`} /><path d={`M101 ${y}v32`} stroke="#7461ad" strokeWidth="3" />{y <= 37.5 && <path d="M94 37.5h32" stroke="#7461ad" strokeWidth="2" />}{y === 22.5 && <path d="M94 22.5h32" stroke="#7461ad" strokeWidth="2" />}</g>;
        })()}</svg><div className="music-studio-lesson-actions">{finished ? <button onClick={() => {
          setRound(0);
          setLessonPhase('explore');
          setStatus('');
        }}>Try again ↻</button> : lessonPhase === 'correct' ? <button onClick={() => {
          setRound(round + 1);
          setLessonPhase('explore');
          setStatus('');
        }}>Next note →</button> : <button disabled={!soundOn || lessonPhase === 'listening'} onClick={listen}>▶ Listen to {target.name}</button>}</div></section> : <div className="music-studio-heading"><span className="music-studio-kicker">{compose ? 'YOUR SOUND. YOUR SONG.' : 'CHOOSE • TAP • PLAY'}</span><h2>{INSTRUMENT_NAMES[kind]}</h2><p>{compose ? 'Tap Record, then play a tune of your own.' : 'Tap to play. Slide across the keys to make a tune.'}</p></div>}
 <section className="music-studio-stage" aria-label={`Play the ${kind}`}><StudioInstrument key={kind} kind={kind} lit={lit} disabled={!soundOn || transport === 'playing' || lessonPhase === 'listening'} onPlay={(...args) => play(...args)} /></section>
 {compose && <section className="music-studio-recorder" aria-label="Music recorder"><div className="music-studio-transport"><button disabled={!soundOn || exporting} onClick={() => {
          if (transport === 'recording') endRecording();else if (transport === 'playing') {
            stop();
            setStatus('Playback stopped.');
          } else void record();
        }}>{transport === 'recording' || transport === 'playing' ? '■ Stop' : '● Record'}</button><button disabled={!notes.length || transport !== 'idle' || !soundOn || exporting} onClick={replay}>▶ Listen</button><strong aria-label={`${seconds} seconds recorded`}>{transport === 'recording' ? '● ' : ''}0:{String(seconds).padStart(2, '0')} <small>/ 1:00</small></strong></div><div className="music-studio-save-actions"><button disabled={!notes.length || transport !== 'idle' || exporting} onClick={save}>Save tune</button><button disabled={!saved || transport !== 'idle' || exporting} onClick={() => {
          setNotes([...saved]);
          recorded.current = [...saved];
          setSeconds(Math.floor(saved.at(-1).time));
          setStatus('Saved tune opened. Tap Listen.');
        }}>Open saved</button><button disabled={!notes.length || transport !== 'idle' || exporting} onClick={download}>{exporting ? 'Preparing…' : 'Save audio ↓'}</button></div><p>{notes.length} notes · One tune saved on this device · Record starts a new tune</p></section>}
 <p className="music-studio-status" role="status" aria-live="polite">{status || (lesson ? 'Choose an instrument. Listen, then find the note.' : compose ? 'Ready when you are.' : 'Every tap makes a sound. What can you create?')}</p>
 <nav className="music-studio-shelf" aria-label="Choose an instrument">{kinds.map(item => <button type="button" key={item} aria-label={`Choose ${item}`} aria-pressed={kind === item} disabled={transport === 'playing'} onClick={() => choose(item)}><StudioArt kind={item} /><span>{INSTRUMENT_NAMES[item]}</span></button>)}</nav>
 </main>;
}
export function BigMusicAdventure({
  soundOn,
  onBack
}) {
  const [mode, setMode] = useState(null);
  if (mode) return <MusicStudio key={mode} mode={mode} soundOn={soundOn} onBack={() => setMode(null)} />;
  return <main className="instrument-studio music-studio-mission-menu"><header className="music-studio-header"><button onClick={onBack}>← Adventures</button><div><p>AGES 4–7</p><h1>Music Adventure</h1></div><span aria-hidden="true">♫</span></header><div className="music-studio-menu-intro"><span className="music-studio-kicker">LITTLE NOTES. BIG IDEAS.</span><h2>A world of sound awaits</h2><p>Discover your notes. Then make something that’s all yours.</p></div><div className="music-studio-missions"><button onClick={() => setMode('notes')}><StudioArt kind="piano" /><span>MISSION 1</span><h2>Meet the Notes</h2><p>Explore piano, violin and xylophone. Listen and find each note.</p><strong>Let’s learn →</strong></button><button onClick={() => setMode('compose')}><StudioArt kind="violin" /><span>MISSION 2</span><h2>My Music Studio</h2><p>Play, record and save your own tune. You’re the composer!</p><strong>Let’s create →</strong></button></div></main>;
}
