import { useEffect, useState } from 'react';
import { FEELINGS } from './feelingsData';
import { feelingRounds, feelingsStep, initialFeelingsState } from './feelingsLogic';
import { FeelingsFace } from './FeelingsArtwork';
import MakeAFace from './MakeAFace';
import { speak, stopSpeech } from '../utils/speech';
import './FeelingsAdventure.css';

function LittleFeelingFriends({ onBack, onComplete, soundOn = true }) {
  const [state, setState] = useState(initialFeelingsState);
  const [muted, setMuted] = useState(false);
  const rounds = feelingRounds();
  const round = rounds[state.index];
  const audioOn = soundOn && !muted;
  const narration = state.phase === 'welcome'
    ? 'Welcome, little feeling friend. Listen for a feeling, then tap the matching child’s face. Let’s play together!'
    : state.phase === 'complete' ? 'Well done, feeling friend! Every feeling is okay. We can be kind and ask a trusted grown-up for help.'
      : state.feedback || `Find ${FEELINGS[round.target].label.toLowerCase()}. Tap the child’s face.`;
  useEffect(() => { if (audioOn) speak(narration); return () => stopSpeech(); }, [narration, audioOn]);
  function send(event) {
    const next = feelingsStep(state, event);
    setState(next);
    if (next.phase === 'complete' && state.phase !== 'complete') onComplete?.();
  }
  const back = () => { stopSpeech(); onBack?.(); };
  return <main className="feelings-adventure feelings-little">
    <header className="feelings-toolbar"><button type="button" onClick={back}>← Adventures</button><div className="feelings-toolbar-title">Little Feeling Friends</div><div className="feelings-sound-tools"><button type="button" aria-label="Listen again" disabled={!audioOn} onClick={() => speak(narration)}>♪ Listen</button><button type="button" aria-label="Mute activity voice" aria-pressed={muted} disabled={!soundOn} onClick={() => setMuted(!muted)}>{audioOn ? 'Sound on' : 'Sound off'}</button></div></header>
    {state.phase === 'welcome' || state.phase === 'complete' ? <section className="feelings-welcome">
      <div className="feelings-welcome-faces"><FeelingsFace feeling="happy" variant={0} decorative /><FeelingsFace feeling={state.phase === 'complete' ? 'calm' : 'surprised'} variant={1} decorative /><FeelingsFace feeling="happy" variant={2} decorative /></div>
      <p className="feelings-eyebrow">{state.phase === 'complete' ? 'ADVENTURE COMPLETE' : 'LET’S LEARN ABOUT FEELINGS'}</p>
      <h1>{state.phase === 'complete' ? 'Well done, feeling friend!' : 'Meet your feeling friends.'}</h1>
      <p>{state.phase === 'complete' ? 'You practised finding happy, sad, angry and surprised faces.' : 'Listen, look and find the feeling face.'}</p>
      <button type="button" className="feelings-primary" onClick={() => send({ type: state.phase === 'complete' ? 'RESTART' : 'START' })}>{state.phase === 'complete' ? 'Play again ↻' : 'Let’s play →'}</button>
      {state.phase === 'complete' ? <button type="button" onClick={back}>Back to adventures</button> : <p className="feelings-grownup">Grown-ups: play together and talk about the faces.</p>}
    </section> : <section className="feelings-play" aria-label="Find the feeling">
      <div className="feelings-progress"><span>Feeling {state.index + 1} of {rounds.length}</span><div aria-hidden="true">{rounds.map((item, i) => <span key={item.id} className={i <= state.index ? 'is-reached' : ''} />)}</div></div>
      <p className="feelings-eyebrow">LISTEN AND LOOK</p><h1>Find <span>{FEELINGS[round.target].label.toLowerCase()}</span></h1><p className="feelings-instruction">Tap the child’s face.</p>
      <div className="feelings-face-choices" role="group" aria-label="Feeling faces">{round.choices.map((id, i) => <button key={id} type="button" aria-label={FEELINGS[id].label} aria-pressed={state.feeling === id} disabled={state.phase !== 'feeling'} style={{ '--feeling-tint': FEELINGS[id].colour }} onClick={() => send({ type: 'FEELING', id })}><FeelingsFace feeling={id} variant={state.index + i} decorative /><span>{FEELINGS[id].label}</span></button>)}</div>
      <div className={`feelings-feedback ${state.feedback ? 'has-feedback' : ''}`} role="status">{state.feedback || 'Take your time. Listen again whenever you like.'}</div>
      {state.phase === 'matched' && <button type="button" className="feelings-primary feelings-next" onClick={() => send({ type: 'NEXT' })}>{state.index === rounds.length - 1 ? 'Finish adventure ✓' : 'Next feeling →'}</button>}
    </section>}
  </main>;
}

export default function FeelingsAdventure(props) {
  return props.ageGroup === 'little' ? <LittleFeelingFriends {...props} /> : <MakeAFace onBack={props.onBack} soundOn={props.soundOn} />;
}
