import { useEffect, useRef, useState } from 'react';
import useLittleMissionCompletion from './useLittleMissionCompletion';
import { speak, stopSpeech } from '../utils/speech';
import { createMusicAudio } from './musicAudio';
import GardenInstrument, { InstrumentArt } from './MusicGardenInstruments';
import { COPY_INSTRUMENTS, MUSIC_INSTRUMENTS, DANCE_SONGS, MUSIC_LICENCE } from './musicGardenData';
import './MusicGarden.css';

const ACTIVITIES = [
  { id:'play', title:'My Little Band', kind:'drum' },
  { id:'copy', title:'Copy My Music', kind:'xylophone' },
  { id:'dance', title:'Dance & Freeze', kind:'piano' },
];
const INSTRUCTIONS = {
  menu:'Choose a music adventure.',
  play:'Tap any instrument to play. Try the drums, bongos, bell, piano and xylophone. Tap the tick when you are finished.',
  copy:'Let’s copy two sounds. Tap the listening flower. Listen, then play the same instrument twice.',
  dance:'Choose a song flower. Tap play. Dance when the music plays. When it stops, freeze! You can wave your hands too.',
};
export function MusicIcon() { return <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 22C26 22 30 54 18 69q-4 8 5 10h54q9-2 5-10C70 54 74 22 50 22" fill="#ffce69" stroke="#9b6a39" strokeWidth="4" /><circle cx="50" cy="17" r="8" fill="none" stroke="#9b6a39" strokeWidth="4" /><path d="M39 83q11 16 22 0" fill="#d28b4f" /></svg>; }
export default function MusicAdventure(props) { return <MusicGarden key={String(props.soundOn)} {...props} />; }
function MusicGarden({ onBack, soundOn=true, mission, onComplete }) {
  const [activity,setActivity]=useState(mission?.mode || 'menu');
  const [phase,setPhase]=useState('ready');
  const [round,setRound]=useState(0);
  const [progress,setProgress]=useState(0);
  const [lit,setLit]=useState(null);
  const [hasPlayed,setHasPlayed]=useState(false);
  const [songIndex,setSongIndex]=useState(0);
  const [message,setMessage]=useState('');
  const [credits,setCredits]=useState(false);
  const audio=useRef(null);
  const recording=useRef(null);
  const timers=useRef(new Set());
  const generation=useRef(0);
  const phaseRef=useRef('ready');
  const copied=useRef(0);
  const intro=useRef(null);
  const creditDialog=useRef(null);
  const copyKind=COPY_INSTRUMENTS[round];
  const finished=(activity==='copy' && phase==='success' && round===COPY_INSTRUMENTS.length-1) || (activity==='dance' && phase==='finished');
  useLittleMissionCompletion(finished,onComplete);
  const setStatePhase=next=>{phaseRef.current=next;setPhase(next);};
  function later(fn,ms) { const id=window.setTimeout(()=>{timers.current.delete(id);fn();},ms);timers.current.add(id);return id; }
  function quietIntro() { window.clearTimeout(intro.current);stopSpeech(); }
  function clear() {
    generation.current++;for(const id of timers.current)window.clearTimeout(id);timers.current.clear();
    audio.current?.stop();recording.current?.pause();quietIntro();
  }
  function reset() { clear();setStatePhase('ready');setLit(null);setProgress(0);copied.current=0;setMessage(''); }
  function say(text) { setMessage(text);if(soundOn)speak(text); }
  async function readyAudio() {
    if(!soundOn)return false;
    if(!audio.current)audio.current=createMusicAudio();
    const token=generation.current;
    const ready=await audio.current.unlock();
    if(token!==generation.current)return false;
    if(!ready){setStatePhase('ready');say('Tap again to start the sound.');}
    return ready;
  }
  useEffect(()=>{
    if(!soundOn)return undefined;
    intro.current=window.setTimeout(()=>speak(INSTRUCTIONS[activity]),220);
    return ()=>{window.clearTimeout(intro.current);stopSpeech();};
  },[activity,soundOn]);
  useEffect(()=>{
    const pending=timers.current;
    const lifecycle=generation;
    function hidden() {
      if(!document.hidden)return;
      lifecycle.current++;for(const id of pending)window.clearTimeout(id);pending.clear();
      window.clearTimeout(intro.current);audio.current?.stop();recording.current?.pause();stopSpeech();
      phaseRef.current='ready';setPhase('ready');setLit(null);setProgress(0);copied.current=0;
    }
    document.addEventListener('visibilitychange',hidden);
    return ()=>{lifecycle.current++;for(const id of pending)window.clearTimeout(id);pending.clear();window.clearTimeout(intro.current);audio.current?.dispose();recording.current?.pause();stopSpeech();document.removeEventListener('visibilitychange',hidden);};
  },[]);
  useEffect(()=>{if(credits)creditDialog.current?.showModal();else creditDialog.current?.close();},[credits]);
  async function play(kind,pitch=0,key=kind) {
    quietIntro();
    if(activity==='copy') {
      if(phaseRef.current!=='answer')return;
      audio.current?.hit(kind,0,pitch);setLit(key);later(()=>setLit(null),230);
      copied.current++;setProgress(copied.current);
      if(copied.current===2){setStatePhase('success');later(()=>say('You copied the music!'),500);}
      return;
    }
    if(!await readyAudio())return;
    audio.current.hit(kind,0,pitch);setHasPlayed(true);setLit(key);later(()=>setLit(null),220);
  }
  async function listen(next=round) {
    reset();setStatePhase('listening');
    if(!await readyAudio())return;
    const kind=COPY_INSTRUMENTS[next];
    [250,1050].forEach(ms=>{audio.current.hit(kind,ms/1000,0);later(()=>setLit(kind==='piano'||kind==='xylophone'?`${kind}-0`:kind),ms);later(()=>setLit(null),ms+260);});
    later(()=>{setStatePhase('answer');say('Your turn. Tap twice!');},1800);
  }
  async function dance() {
    reset();setStatePhase('starting');
    if(!soundOn){setStatePhase('ready');return;}
    const token=generation.current;
    const song=new Audio(DANCE_SONGS[songIndex].src);song.preload='auto';song.volume=.55;song.loop=true;recording.current=song;
    async function moving(turn) {
      try {await song.play();}catch {if(token===generation.current){reset();say('Tap play to try the music again.');}return;}
      if(token!==generation.current){song.pause();return;}
      setStatePhase('dance');setProgress(turn);setMessage('Dance!');
      later(()=>{
        song.pause();setStatePhase('freeze');say('Freeze!');
        later(()=>{stopSpeech();if(turn<3)void moving(turn+1);else{setStatePhase('finished');say('Wonderful dancing!');}},3200);
      },6200);
    }
    void moving(1);
  }
  function back() {reset();if(mission || activity==='menu')onBack();else setActivity('menu');}
  const activeDance=['starting','dance','freeze'].includes(phase);
  return <main className={`music-garden ${activity==='menu'?'music-garden-menu':'music-garden-immersive'} garden-mode-${activity}`}>
    <button type="button" className="garden-back garden-control" aria-label={mission?'Back to Music & Movement map':'Back to music activities'} onClick={back}><span aria-hidden="true">←</span></button>
    <h1 className={activity==='menu'?'':'garden-sr-only'}>{ACTIVITIES.find(a=>a.id===activity)?.title || 'Music & Movement'}</h1>
    {activity==='menu' ? <div className="garden-activity-choices">{ACTIVITIES.map(item=><button type="button" key={item.id} onClick={()=>{reset();setRound(0);setHasPlayed(false);setActivity(item.id);}}><InstrumentArt kind={item.kind} /><strong>{item.title}</strong></button>)}</div> : <>
      {!soundOn && <span className="garden-muted" role="img" aria-label="Sound is off. Ask a grown-up to turn sound on in Settings.">♪̸</span>}
      {activity==='play' && <>
        <section className="garden-band" aria-label="Play any instrument">{MUSIC_INSTRUMENTS.map(kind=><GardenInstrument key={kind} kind={kind} disabled={!soundOn} lit={lit} onPlay={play} />)}</section>
        {mission && <button type="button" className="garden-done garden-control" disabled={!hasPlayed} aria-label="Finish playing" onClick={()=>{clear();onComplete();}}><span aria-hidden="true">✓</span></button>}
      </>}
      {activity==='copy' && <>
        <div className="garden-copy-stars" aria-label={`${progress} of 2 sounds copied`}><span aria-hidden="true">{progress>0?'★':'☆'} {progress>1?'★':'☆'}</span></div>
        <button type="button" className="garden-listen-flower" disabled={!soundOn || phase==='listening' || finished} aria-label="Listen to the pattern" onClick={()=>listen()}><Flower symbol="listen" /></button>
        <section className="garden-copy-instrument" aria-label={`Copy the ${copyKind}`}><GardenInstrument kind={copyKind} disabled={!soundOn || phase!=='answer'} lit={lit} onPlay={play} /></section>
        {phase==='success' && (!finished || !mission) && <button type="button" className="garden-done garden-control" aria-label={finished?'Play again':'Next instrument'} onClick={()=>{const next=(round+1)%COPY_INSTRUMENTS.length;setRound(next);void listen(next);}}><span aria-hidden="true">→</span></button>}
      </>}
      {activity==='dance' && <>
        <div className="garden-song-flowers" role="group" aria-label="Choose a dance song">{DANCE_SONGS.map((song,index)=><button type="button" key={song.id} disabled={activeDance} aria-label={`Choose ${song.title}`} aria-pressed={index===songIndex} onClick={()=>{reset();setSongIndex(index);}}><Flower symbol={song.symbol} /></button>)}</div>
        <div className={`garden-dancers ${phase==='dance'?'is-dancing':''} ${phase==='freeze'?'is-frozen':''}`} aria-label={phase==='freeze'?'Freeze':phase==='dance'?'Dance':'Dancing friends'}>
          <img src="/music-garden/dancing-friends.webp" alt="Two children, a puppy and a bunny ready to dance" draggable="false" />
          {phase==='freeze' && <span className="garden-freeze-sparkles" aria-hidden="true">✦ ✦ ✦</span>}
        </div>
        {(!finished || !mission) && <button type="button" className="garden-dance-play garden-control" disabled={!soundOn || phase==='starting'} aria-label={activeDance?'Stop dancing':'Start dancing'} onClick={activeDance?reset:dance}><span aria-hidden="true">{activeDance?'■':'▶'}</span></button>}
      </>}
    </>}
    <p className="garden-sr-only" role="status" aria-live="polite">{message}</p>
    <button type="button" className="garden-credits-button garden-control" aria-label="Music credits" onClick={()=>{if(activity!=='menu')reset();setCredits(true);}}>ⓘ</button>
    <dialog ref={creditDialog} className="garden-credits" onCancel={()=>setCredits(false)} onClose={()=>setCredits(false)}>
      <h2>Music credits</h2><p>Dance recordings by Kevin MacLeod (<a href="https://incompetech.com/">incompetech.com</a>), licensed under <a href={MUSIC_LICENCE}>Creative Commons Attribution 4.0</a>.</p>
      <ul>{DANCE_SONGS.map(song=><li key={song.id}><a href={song.source}>{song.title}</a> — Kevin MacLeod.</li>)}</ul>
      <p>Recordings excerpted to 45 seconds, with volume adjusted and pauses for Dance & Freeze. Interactive instrument tones are generated by Oatle Kids.</p>
      <button type="button" onClick={()=>setCredits(false)}>Close credits</button>
    </dialog>
  </main>;
}
function Flower({ symbol }) {
  return <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g fill="#ffd66d">{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="60" cy="28" rx="17" ry="24" transform={`rotate(${angle} 60 60)`} />)}</g><circle cx="60" cy="60" r="28" fill="#c6a3dc" stroke="#fff1bd" strokeWidth="3" />
    {symbol==='listen'?<><path d="M42 54h10l12-9v30l-12-9H42Z" fill="#fff6e6" /><path d="M73 49q13 11 0 22" stroke="#fff6e6" strokeWidth="5" fill="none" strokeLinecap="round" /></>:symbol==='sun'?<circle cx="60" cy="60" r="16" fill="#fff19c" />:symbol==='star'?<path d="m60 39 6 13 15 2-11 11 3 15-13-7-13 7 3-15-11-11 15-2Z" fill="#fff19c" />:symbol==='rainbow'?<><path d="M39 71a21 21 0 0 1 42 0" stroke="#ee766a" strokeWidth="8" fill="none" /><path d="M46 71a14 14 0 0 1 28 0" stroke="#ffe69d" strokeWidth="7" fill="none" /><path d="M53 71a7 7 0 0 1 14 0" stroke="#9bd7bb" strokeWidth="6" fill="none" /></>:<><circle cx="60" cy="60" r="13" fill="#ffeab1" />{[0,90,180,270].map(angle=><ellipse key={angle} cx="60" cy="44" rx="7" ry="11" fill="#fff3c8" transform={`rotate(${angle} 60 60)`} />)}</>}
  </svg>;
}
