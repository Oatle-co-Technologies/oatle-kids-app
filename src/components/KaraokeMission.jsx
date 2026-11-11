import { useEffect, useRef, useState } from 'react';
import { stopSpeech } from '../utils/speech';
import { KARAOKE_SONGS } from './karaokeData';
import { karaokePosition } from './karaokeLogic';
import './KaraokeMission.css';
import KaraokeSongArt from './KaraokeSongArt';

export default function KaraokeMission({ onBack, onComplete, soundOn = true, onStart }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [heard, setHeard] = useState([]);
  const [message, setMessage] = useState('Choose a song. Follow the glowing words and sing!');
  const audio = useRef(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const song = KARAOKE_SONGS[index];
  const cue = karaokePosition(song, elapsed);
  const lineIndex = Math.max(0, cue.line);
  const line = song.lines[lineIndex];
  const activeLetter = song.id === 'abc' && cue.word >= 0 ? song.lines[cue.line].words[cue.word].text : '';

  function stop() {
    generation.current++;
    pending.current = false;
    audio.current?.pause();
    setPlaying(false); setStarting(false);
    stopSpeech();
  }
  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    const tick = () => { setElapsed(audio.current?.currentTime || 0); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => {
    const player = audio.current;
    const lifecycle = generation;
    function hidden() {
      if (!document.hidden) return;
      lifecycle.current++; pending.current = false;
      player?.pause(); setPlaying(false); setStarting(false); stopSpeech();
    }
    document.addEventListener('visibilitychange', hidden);
    return () => { lifecycle.current++; player?.pause(); stopSpeech(); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => { if (!soundOn) audio.current?.pause(); }, [soundOn]);

  function choose(next) {
    stop();
    if (audio.current) audio.current.currentTime = 0;
    setElapsed(0); setIndex((next + KARAOKE_SONGS.length) % KARAOKE_SONGS.length);
    setMessage('Tap play. After four gentle beats, start singing.');
  }
  function replay() { stop(); if (audio.current) audio.current.currentTime = 0; setElapsed(0); setMessage('Ready to sing again. Tap play.'); }
  async function toggle() {
    if (!soundOn || pending.current) return;
    if (playing) { stop(); return; }
    onStart?.(); stopSpeech();
    const player = audio.current;
    const token = ++generation.current;
    pending.current = true; setStarting(true);
    if (player.error) player.load();
    if (player.ended) { player.currentTime = 0; setElapsed(0); }
    try {
      await player.play();
      if (token !== generation.current) return;
      setPlaying(true); setMessage(`Sing ${song.title}. Follow the highlighted words.`);
    } catch {
      if (token === generation.current) { setPlaying(false); setMessage('The music could not start. Tap play to try again.'); }
    } finally { if (token === generation.current) { pending.current = false; setStarting(false); } }
  }
  return <main className="music-garden music-garden-immersive karaoke-garden">
    <header className="karaoke-toolbar">
      <button type="button" className="garden-control" aria-label="Back to Music Adventure map" onClick={() => { stop(); onBack(); }}>←</button>
      <h1>Karaoke Mission</h1>
      {onComplete && <button type="button" className="garden-control" aria-label="Finish karaoke" disabled={!heard.length} onClick={() => { stop(); onComplete(); }}>✓</button>}
    </header>
    <section className="karaoke-stage" aria-label="Sing along with the instruments">
      <div className="karaoke-song-heading"><KaraokeSongArt id={song.id} /><h2>{song.title}</h2></div>
      {!soundOn && <p className="karaoke-instruction">Ask a grown-up to turn sound on in Settings.</p>}
      <div className="karaoke-lyric-card">
        <div className="karaoke-count-space">{cue.count > 0 && <div className="karaoke-count" aria-label={`Count in ${cue.count} of 4`}><span>Ready to sing</span><div aria-hidden="true">{[1,2,3,4].map(n => <b key={n} className={playing && n === cue.count ? 'is-current' : ''}>{n}</b>)}</div></div>}</div>
        <p className="karaoke-line" aria-label={line.words.map(word => word.text).join(' ')}>{line.words.map((word, i) => <span key={i} className={cue.line === lineIndex && cue.word === i ? 'is-current' : ''} aria-current={cue.line === lineIndex && cue.word === i ? 'true' : undefined}>{word.text}</span>)}</p>
        <p className="karaoke-next-line">{song.lines[lineIndex + 1]?.words.map(word => word.text).join(' ') || 'Sing it again whenever you like.'}</p>
        {song.id === 'abc' && <div className="karaoke-alphabet" aria-label="Follow the alphabet">{Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => <span key={letter} className={activeLetter === letter ? 'is-current' : ''} aria-current={activeLetter === letter ? 'true' : undefined}>{letter}</span>)}</div>}
      </div>
      <audio ref={audio} src={song.src} preload="none" onPause={() => setPlaying(false)} onTimeUpdate={() => setElapsed(audio.current?.currentTime || 0)} onEnded={() => {
        setPlaying(false); setStarting(false); pending.current = false;
        setElapsed(song.duration);
        setHeard(current => current.includes(song.id) ? current : [...current, song.id]);
        setMessage('Lovely singing! Choose another song or tap the tick to finish.');
      }} onError={() => { setPlaying(false); setStarting(false); pending.current = false; setMessage('The music could not load. Tap play to try again.'); }} />
      <div className="karaoke-controls">
        <button type="button" className="garden-control" aria-label="Previous karaoke song" onClick={() => choose(index - 1)}>‹</button>
        <button type="button" className="garden-control karaoke-play" aria-label={playing ? 'Pause karaoke' : 'Play karaoke'} disabled={!soundOn || starting} onClick={toggle}>{starting ? '♪' : playing ? 'Ⅱ' : '▶'}</button>
        <button type="button" className="garden-control" aria-label="Restart karaoke song" onClick={replay}>↻</button>
        <button type="button" className="garden-control" aria-label="Next karaoke song" onClick={() => choose(index + 1)}>›</button>
      </div>
    </section>
    <nav className="karaoke-song-grid" aria-label="Choose a karaoke song">{KARAOKE_SONGS.map((item, i) => <button type="button" key={item.id} aria-label={`Choose ${item.title}`} aria-pressed={index === i} onClick={() => choose(i)}><KaraokeSongArt id={item.id} /><strong>{item.title}</strong>{heard.includes(item.id) && <span className="karaoke-heard" aria-label="Sung">✓</span>}</button>)}</nav>
    <footer className="karaoke-footer"><p>{heard.length} of {KARAOKE_SONGS.length} songs sung</p><a href="/karaoke/credits.html" target="_blank" rel="noreferrer">Music credits</a></footer>
    <p className="garden-sr-only" role="status" aria-live="polite">{message}</p>
  </main>;
}
