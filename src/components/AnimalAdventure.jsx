import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import useLittleMissionCompletion from './useLittleMissionCompletion';
import { speak, stopSpeech } from '../utils/speech';
import { ANIMALS, isRightFood, isRightHome } from './animalLogic';
import dogSound from '../sounds/animals/dog.mp3';
import catSound from '../sounds/animals/cat.mp3';
import cowSound from '../sounds/animals/cow.mp3';
import sheepSound from '../sounds/animals/sheep.mp3';
import elephantSound from '../sounds/animals/elephant.mp3';
import './AnimalAdventure.css';
import FeedAnimalScene from './FeedAnimalScene';
import AnimalHomesScene from './AnimalHomesScene';
import AnimalSoundScene from './AnimalSoundScene';

export function AnimalIcon() {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle cx="50" cy="52" r="32" fill="#ffcf72" /><circle cx="28" cy="28" r="18" fill="#ffb65b" /><circle cx="72" cy="28" r="18" fill="#ffb65b" />
    <circle cx="39" cy="50" r="5" fill="#28345d" /><circle cx="61" cy="50" r="5" fill="#28345d" /><path d="M44 65 Q50 70 56 65" fill="none" stroke="#28345d" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

const ACTIVITY_INFO = {
  feed: { number: '01 · CARE PLAY', title: 'Feed the Animal', copy: 'Bring some food from the basket to the animal.' },
  homes: { number: '02 · MATCHING', title: 'Animal Homes', copy: 'Help each animal find its home.' },
  sounds: { number: '03 · LISTENING', title: 'Hear the Sound', copy: 'Listen, then find the animal.' },
};

const ANIMAL_SOUNDS = { dog: dogSound, cat: catSound, cow: cowSound, sheep: sheepSound, elephant: elephantSound };

export default function AnimalAdventure({ onBack, soundOn, mission, onComplete }) {
  const [mode, setMode] = useState(mission?.mode || 'menu');
  const [round, setRound] = useState(0);
  const [done, setDone] = useState([]);
  const [fedFoods, setFedFoods] = useState([]);
  const [soundMatches, setSoundMatches] = useState([]);
  const [message, setMessage] = useState('');
  const audioRef = useRef(null);
  const roundTimer = useRef(null);
  const narrationTimer = useRef(null);
  const advancing = useRef(false);
  const current = ANIMALS[round % ANIMALS.length];
  const homesFinished = done.length === ANIMALS.length;
  const feedingFinished = fedFoods.length === ANIMALS.length;
  const soundsFinished = soundMatches.length === ANIMALS.length;
  useLittleMissionCompletion((mode === 'feed' && feedingFinished) || (mode === 'homes' && homesFinished) || (mode === 'sounds' && soundsFinished), onComplete);

  useEffect(() => {
    if (!soundOn) { stopSpeech(); audioRef.current?.pause(); return undefined; }
    const prompt = mode === 'menu' ? 'Animal adventure. Feed an animal, find animal homes, or listen for animal sounds.'
      : mode === 'feed' ? `This is a ${current.name.toLowerCase()}. Drag food from the basket to the animal. You can also tap the food, then tap the animal.`
        : mode === 'homes' ? `Help the ${current.name.toLowerCase()} find its home. Drag the animal to a home, or tap the animal and then a home.`
          : 'Tap the flower to hear a sound. Then tap the animal you heard.';
    const timer = window.setTimeout(() => speak(prompt), 220);
    narrationTimer.current = timer;
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [mode, current, soundOn]);

  useEffect(() => () => { audioRef.current?.pause(); window.clearTimeout(roundTimer.current); }, []);

  function chooseMode(next) {
    window.clearTimeout(roundTimer.current); advancing.current = false;
    audioRef.current?.pause();
    setMode(next);
    setRound(0);
    setDone([]);
    setFedFoods([]);
    setSoundMatches([]);
    setMessage('');
  }
  function nextRound() { advancing.current = false; setRound((value) => (value + 1) % ANIMALS.length); setMessage(''); }
  function celebrate(text) { setMessage(text); if (soundOn) speak(text); }
  function selectFood(food) {
    if (advancing.current || fedFoods.includes(current.food)) return;
    if (isRightFood(current.id, food)) {
      const foods = [...fedFoods, food];
      setFedFoods(foods);
      celebrate(foods.length === ANIMALS.length ? 'Every animal has had their favourite food!' : `${current.name} loves that!`);
      if (foods.length < ANIMALS.length) { advancing.current = true; roundTimer.current = window.setTimeout(nextRound, 1600); }
    }
    else { celebrate('Let’s try the other food.'); }
  }
  function matchAnimalToHome(home) {
    if (advancing.current || done.includes(current.id)) return;
    if (isRightHome(current.id, home)) {
      const next = [...done, current.id];
      setDone(next);
      celebrate(`${current.name} is home!`);
      if (next.length < ANIMALS.length) {
        advancing.current = true;
        roundTimer.current = window.setTimeout(nextRound, 1600);
      }
    } else celebrate('Let’s look at the other home.');
  }
  function chooseSound(animal) {
    if (advancing.current || soundMatches.includes(current.id)) return;
    audioRef.current?.pause();
    if (animal.id !== current.id) {
      const feedback = 'Let’s listen again and try the other animal.';
      setMessage(feedback);
      if (soundOn) speak(feedback);
      return;
    }
    const matches = [...soundMatches, animal.id];
    setSoundMatches(matches);
    celebrate(`Yes! That is ${animal.name}!`);
    if (matches.length === ANIMALS.length) return;
    advancing.current = true;
    roundTimer.current = window.setTimeout(nextRound, 1600);
  }
  async function playSound(animal = current) {
    if (!soundOn || advancing.current || soundMatches.includes(current.id)) return false;
    window.clearTimeout(narrationTimer.current);
    stopSpeech();
    audioRef.current?.pause();
    const audio = new Audio(ANIMAL_SOUNDS[animal.id]);
    audio.volume = 1;
    audioRef.current = audio;
    setMessage('Listen carefully.');
    try { await audio.play(); return true; }
    catch { setMessage('Tap the flower once more to hear the sound.'); return false; }
  }
  const title = mode === 'menu' ? 'Animal Adventure' : ACTIVITY_INFO[mode].title;

  return <main className={`little-explorers-page animal-page ${mode === 'feed' ? 'is-feeding' : mode === 'homes' ? 'is-homing' : mode === 'sounds' ? 'is-listening' : ''}`}>
    <header className="animal-header">
      <LocalBackButton label={mission ? 'Animal Adventure map' : mode === 'menu' ? 'Adventures' : 'Animal Adventure'} onClick={() => mission || mode === 'menu' ? onBack() : chooseMode('menu')} />
      <p className="eyebrow">{mission ? `PLANET ${mission.name.toUpperCase()} / ANIMALS` : 'LITTLE EXPLORERS / ANIMALS'}</p><h1>{title}</h1>
      <p>{mode === 'menu' ? 'Meet, match and care for friendly animals.' : ACTIVITY_INFO[mode].copy}</p>
    </header>
    {mode === 'menu' ? <section className="animal-mode-grid" aria-label="Animal activities">
      {Object.entries(ACTIVITY_INFO).map(([id, info]) => <button key={id} type="button" className={`animal-mode-card animal-${id}-card`} onClick={() => chooseMode(id)}>
        <span className="animal-mode-art" aria-hidden="true">{id === 'feed' ? '🐰🥕' : id === 'homes' ? '🐵🌴' : '🐧🎵'}</span><span>{info.number}</span><strong>{info.title}</strong><small>{info.copy}</small><b>Let’s play ↗</b>
      </button>)}
      <p className="animal-grownup">Play together: name the animals, foods and homes as you go.</p>
    </section> : mode === 'feed' ? <>
      <FeedAnimalScene key={current.id} animal={current} fed={fedFoods.includes(current.food)} onFood={selectFood} />
      {feedingFinished && !mission && <button className="animal-again" type="button" onClick={() => chooseMode('feed')}>Play again</button>}
    </> : mode === 'homes' ? <>
      <AnimalHomesScene key={current.id} animal={current} matched={done.includes(current.id)} onHome={matchAnimalToHome} />
      {homesFinished && !mission && <button className="animal-again" type="button" onClick={() => chooseMode('homes')}>Play again</button>}
    </> : <>
      <AnimalSoundScene key={current.id} animal={current} matched={soundMatches.includes(current.id)} soundOn={soundOn} onListen={() => playSound()} onChoose={chooseSound} />
      {soundsFinished && !mission && <button className="animal-again" type="button" onClick={() => chooseMode('sounds')}>Play again</button>}
    </>}
    {mode !== 'menu' && <p className="animal-feedback" role="status" aria-live="polite">{message}</p>}
  </main>;
}
