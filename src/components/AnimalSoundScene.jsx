import { useState } from 'react';
import { FeedingAnimal } from './FeedingArtwork';
import { feedingChoices } from './feedingChoices';
import './AnimalSoundScene.css';

export default function AnimalSoundScene({ animal, matched, soundOn, onListen, onChoose }) {
  const [heard, setHeard] = useState(false);
  const [starting, setStarting] = useState(false);
  async function listen() {
    if (starting || matched) return;
    setStarting(true);
    try { if (await onListen()) setHeard(true); }
    finally { setStarting(false); }
  }
  return <section className={`animal-sound-meadow ${matched ? 'is-celebrating' : ''}`} aria-label="Hear the animal sound">
    <p className="sound-scene-instruction">{matched ? 'You found me!' : 'Who is making that sound?'}</p>
    <div className="sound-scene-cloud" aria-hidden="true" />
    <button type="button" className="sound-listening-flower" aria-label={heard ? 'Hear it again' : 'Hear the animal sound'}
      onClick={listen} disabled={!soundOn || starting || matched}>
      <svg viewBox="0 0 160 170" aria-hidden="true" focusable="false">
        <path d="M80 160V90m0 46q-35-33-46-14 13 27 46 14m0 13q35-33 46-14-13 27-46 14" fill="#499b57" stroke="#499b57" strokeWidth="7" strokeLinecap="round" />
        <g fill="#ffdb75">{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="80" cy="36" rx="20" ry="29" transform={`rotate(${angle} 80 70)`} />)}</g>
        <circle cx="80" cy="70" r="33" fill="#fff1b6" stroke="#eab44f" strokeWidth="4" />
        <path d="M59 63h10l13-11v36L69 77H59Z" fill="#347b8e" /><path d="M92 61q12 9 0 18m7-26q22 17 0 34" fill="none" stroke="#347b8e" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span>{heard ? 'Hear it again' : 'Tap to listen'}</span>
    </button>
    <div className="sound-scene-animals" role="group" aria-label="Which animal did you hear?">{feedingChoices(animal.id).map(choice=><button key={choice.id} type="button"
      className={`sound-scene-animal ${matched && choice.id===animal.id ? 'is-found' : ''}`}
      aria-label={`Choose ${choice.name}`} disabled={!soundOn || !heard || matched} onClick={()=>onChoose(choice)}>
      <FeedingAnimal id={choice.id} happy={matched && choice.id===animal.id} />
      {matched && choice.id===animal.id && <span className="sound-happy-stars" aria-hidden="true">✦ ♥ ✦</span>}
    </button>)}</div>
    <p className="sound-scene-hint">{!soundOn ? 'Ask a grown-up to turn sound on in Settings.' : matched ? 'Happy animal, happy ears!' : heard ? 'Tap the animal you heard.' : 'Tap the flower. Listen. Then tap an animal.'}</p>
  </section>;
}
