import { useEffect, useState } from 'react';
import { FeelingsFace } from './FeelingsArtwork';
import { FacePartPreview } from './FaceFeatures';
import { FACE_CHALLENGES, FACE_PARTS, FEELING_FEATURES, changeFacePart, checkFace } from './faceBuilderData';
import { FEELINGS } from './feelingsData';
import { speak, stopSpeech } from '../utils/speech';
import './MakeAFace.css';

const PART_LABELS = { eyes: 'Eyes', brows: 'Eyebrows', mouth: 'Mouth' };

export default function MakeAFace({ onBack, soundOn = true }) {
  const [phase, setPhase] = useState('welcome');
  const [index, setIndex] = useState(0);
  const [features, setFeatures] = useState(() => ({ ...FEELING_FEATURES.calm }));
  const [variant, setVariant] = useState(0);
  const [part, setPart] = useState('mouth');
  const [result, setResult] = useState(null);
  const [muted, setMuted] = useState(false);
  const free = phase === 'free';
  const challenge = FACE_CHALLENGES[index];
  const audioOn = soundOn && !muted;
  const instruction = free ? 'Make any face you like!' : challenge.instruction;
  const narration = phase === 'welcome'
    ? 'Make a Face! Pick a child, then change the eyes, eyebrows and mouth. Watch the expression change. Try a feeling challenge, or just play.'
    : phase === 'complete' ? 'You made six different expressions! Faces can give us clues, but we can ask someone how they feel.'
      : result?.message || `${instruction} Choose ${PART_LABELS[part].toLowerCase()}. Tap a shape and watch the face change.`;

  useEffect(() => { if (audioOn) speak(narration); return () => stopSpeech(); }, [audioOn, narration]);
  const back = () => { stopSpeech(); onBack?.(); };
  function start(nextPhase = 'play') {
    setIndex(0); setFeatures({ ...FEELING_FEATURES.calm }); setPart('mouth'); setResult(null); setPhase(nextPhase);
  }
  function choose(value) { setFeatures(current => changeFacePart(current, part, value)); setResult(null); if (audioOn) speak(FACE_PARTS[part].find(option => option.id === value)?.label || ''); }
  function check() {
    const next = checkFace(challenge, features);
    setResult(next);
    if (next.part) setPart(next.part);
  }
  function next() {
    if (!result?.complete) return;
    if (index === FACE_CHALLENGES.length - 1) { setPhase('complete'); setResult(null); return; }
    setIndex(index + 1); setPart('mouth'); setResult(null);
  }

  return <main className="feelings-adventure make-a-face">
    <header className="feelings-toolbar">
      <button type="button" onClick={back}>← Adventures</button>
      <div className="face-brand"><span>FEELINGS ADVENTURE</span><strong>Make a Face</strong></div>
      <div className="feelings-sound-tools">
        <button type="button" aria-label="Listen again" disabled={!audioOn} onClick={() => speak(narration)}>♪ Listen</button>
        <button type="button" aria-label="Mute activity voice" aria-pressed={muted} disabled={!soundOn} onClick={() => setMuted(!muted)}>{audioOn ? 'Sound on' : 'Sound off'}</button>
      </div>
    </header>

    {phase === 'welcome' ? <section className="feelings-welcome face-welcome">
      <div className="feelings-welcome-faces"><FeelingsFace feeling="happy" variant={0} decorative /><FeelingsFace feeling="surprised" variant={1} decorative /><FeelingsFace feeling="calm" variant={2} decorative /></div>
      <p className="feelings-eyebrow">PICK. TAP. MAKE AN EXPRESSION.</p>
      <h1>What face will you make?</h1>
      <p>Change the eyes, eyebrows and mouth. See what happens!</p>
      <div className="feelings-complete-actions"><button type="button" className="feelings-primary" onClick={() => start()}>Let’s make faces →</button><button type="button" onClick={() => start('free')}>Just play</button></div>
    </section> : phase === 'complete' ? <section className="feelings-welcome">
      <div className="feelings-welcome-faces"><FeelingsFace feeling="happy" variant={variant} decorative /><FeelingsFace feeling="calm" variant={(variant + 1) % 4} decorative /></div>
      <p className="feelings-eyebrow">SIX EXPRESSIONS EXPLORED</p><h1>You’re a face maker!</h1>
      <p>Faces can give us clues. We can ask someone how they feel.</p>
      <div className="feelings-complete-actions"><button type="button" className="feelings-primary" onClick={() => start('free')}>Make any face</button><button type="button" onClick={() => start()}>Play again</button><button type="button" onClick={back}>Adventures</button></div>
    </section> : <section className="face-studio" aria-label="Make an expression">
      <div className="face-goal">
        <div><p className="feelings-eyebrow">{free ? 'FREE PLAY' : `EXPRESSION ${index + 1} OF ${FACE_CHALLENGES.length}`}</p><h1>{instruction}</h1></div>
        <button type="button" onClick={() => { setPhase(free ? 'play' : 'free'); setResult(null); }}>{free ? 'Try a challenge' : 'Just play'}</button>
      </div>
      <div className="face-workbench">
        <div className="face-character-area">
          <div className="face-character" style={{ '--face-tint': free ? '#eadcf4' : FEELINGS[challenge.id].colour }}>
            <FeelingsFace features={features} variant={variant} />
          </div>
          <div className="face-friends" role="group" aria-label="Choose a child">
            {[0, 1, 2, 3].map(friend => <button key={friend} type="button" aria-label={`Choose child ${friend + 1}`} aria-pressed={variant === friend} onClick={() => setVariant(friend)}><FeelingsFace features={features} variant={friend} decorative /></button>)}
          </div>
        </div>

        <div className="face-editor">
          <h2>Build your expression</h2>
          <div className="face-part-tabs" role="group" aria-label="Face parts">
            {Object.entries(PART_LABELS).map(([key, label]) => <button key={key} type="button" aria-pressed={part === key} onClick={() => setPart(key)}><FacePartPreview part={key} value={features[key]} /><span>{label}</span></button>)}
          </div>
          <h3>Choose {PART_LABELS[part].toLowerCase()}</h3>
          <div className="face-part-options" role="group" aria-label={`${PART_LABELS[part]} shapes`}>
            {FACE_PARTS[part].map(option => <button key={option.id} type="button" aria-label={option.label} aria-pressed={features[part] === option.id} onClick={() => choose(option.id)}><FacePartPreview part={part} value={option.id} /><span>{option.label}</span></button>)}
          </div>
          <p className={`face-result ${result?.complete ? 'is-complete' : ''}`} role="status">{result?.message || (free ? 'Mix things up. Every change makes a new expression!' : 'Try a shape. You can change your mind as often as you like.')}</p>
          {!free && (result?.complete ? <button type="button" className="feelings-primary face-check" onClick={next}>{index === FACE_CHALLENGES.length - 1 ? 'Finish ✓' : 'Next expression →'}</button> : <button type="button" className="feelings-primary face-check" onClick={check}>Check my face ✓</button>)}
          <p className="face-gentle-note">We’re drawing expressions. Real people can show feelings in different ways.</p>
        </div>
      </div>
    </section>}
  </main>;
}
