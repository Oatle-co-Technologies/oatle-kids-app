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
const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);

export default function AnimalAdventure({ onBack, soundOn, mission, onComplete }) {
  const [mode, setMode] = useState(mission?.mode || 'menu');
  const [round, setRound] = useState(0);
  const [done, setDone] = useState([]);
  const [fedFoods, setFedFoods] = useState([]);
  const [homeMatches, setHomeMatches] = useState([]);
  const [homeAnimalOrder, setHomeAnimalOrder] = useState(() => shuffled(ANIMALS));
  const [homeOrder, setHomeOrder] = useState(() => shuffled(ANIMALS));
  const [dragging, setDragging] = useState(null);
  const [soundMatches, setSoundMatches] = useState([]);
  const [message, setMessage] = useState('');
  const audioRef = useRef(null);
  const roundTimer = useRef(null);
  const advancing = useRef(false);
  const homeRefs = useRef({});
  const current = ANIMALS[round % ANIMALS.length];
  const homesFinished = done.length === ANIMALS.length;
  const feedingFinished = fedFoods.length === ANIMALS.length;
  const soundsFinished = soundMatches.length === ANIMALS.length;
  useLittleMissionCompletion((mode === 'feed' && feedingFinished) || (mode === 'homes' && homesFinished) || (mode === 'sounds' && soundsFinished), onComplete);

  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const prompt = mode === 'menu' ? 'Animal adventure. Feed an animal, find animal homes, or listen for animal sounds.'
      : mode === 'feed' ? `This is a ${current.name.toLowerCase()}. Drag food from the basket to the animal. You can also tap the food, then tap the animal.`
        : mode === 'homes' ? 'Drag each animal to its home.'
          : 'Listen carefully. Which animal made this sound?';
    const timer = window.setTimeout(() => speak(prompt), 220);
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
    setHomeMatches([]);
    setHomeAnimalOrder(shuffled(ANIMALS));
    setHomeOrder(shuffled(ANIMALS));
    setDragging(null);
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
  function matchAnimalToHome(animal, home) {
    if (homeMatches.includes(home)) return;
    if (isRightHome(animal.id, home)) { const next = [...done, animal.id]; setDone(next); setHomeMatches((homes) => [...homes, home]); celebrate(next.length === ANIMALS.length ? 'All the animals are home!' : `${animal.name} is home!`); }
    else setMessage('Let’s try another home.');
  }
  function startDragging(animal, event) {
    if (done.includes(animal.id)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging({ animal, pointerId: event.pointerId, x: event.clientX, y: event.clientY });
    setMessage(`Find ${animal.name}'s home.`);
  }
  function moveDragging(animal, event) {
    if (!dragging || dragging.animal.id !== animal.id || dragging.pointerId !== event.pointerId) return;
    setDragging((current) => current ? { ...current, x: event.clientX, y: event.clientY } : current);
  }
  function finishDragging(animal, event) {
    if (!dragging || dragging.animal.id !== animal.id || dragging.pointerId !== event.pointerId) return;
    const target = homeOrder.find((homeAnimal) => {
      const rect = homeRefs.current[homeAnimal.home]?.getBoundingClientRect();
      return rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    });
    setDragging(null);
    if (!target) { setMessage('Try dropping the animal onto a home.'); return; }
    matchAnimalToHome(animal, target.home);
  }
  function chooseSound(animal) {
    if (advancing.current || soundMatches.includes(animal.id)) return;
    if (animal.id !== current.id) {
      const feedback = 'No, that’s not it. Try another one.';
      setMessage(feedback);
      if (soundOn) speak(feedback);
      return;
    }
    const matches = [...soundMatches, animal.id];
    setSoundMatches(matches);
    celebrate(`Yes! That is ${animal.name}!`);
    if (matches.length === ANIMALS.length) return;
    const nextAnimal = ANIMALS[(round + 1) % ANIMALS.length];
    advancing.current = true;
    roundTimer.current = window.setTimeout(() => {
      advancing.current = false;
      setRound((value) => (value + 1) % ANIMALS.length);
      setMessage('Listen carefully. Which animal made this sound?');
      playSound(nextAnimal);
    }, 850);
  }
  function playSound(animal = current) {
    if (!soundOn) return;
    audioRef.current?.pause();
    const audio = new Audio(ANIMAL_SOUNDS[animal.id]);
    audio.volume = 1;
    audioRef.current = audio;
    audio.play().catch(() => setMessage('Tap “Hear it again” once more to play the sound.'));
    setMessage('Listen carefully.');
  }
  const title = mode === 'menu' ? 'Animal Adventure' : ACTIVITY_INFO[mode].title;

  return <main className={`little-explorers-page animal-page ${mode === 'feed' ? 'is-feeding' : ''}`}>
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
    </> : mode === 'homes' ? <section className="animal-play" aria-label="Match animals to homes">
      <p className="animal-help">Drag each animal to the right home. The right animal and home will disappear.</p>
      <div className="animal-home-board">
        <section className="animal-home-column" aria-label="Animals to take home"><h2>Animals</h2><div className="animal-home-stack">{homeAnimalOrder.filter((animal) => !done.includes(animal.id)).map((animal) => <button key={animal.id} type="button" className={`animal-drag-card ${dragging?.animal.id === animal.id ? 'is-dragging' : ''}`} onPointerDown={(event) => startDragging(animal, event)} onPointerMove={(event) => moveDragging(animal, event)} onPointerUp={(event) => finishDragging(animal, event)} onPointerCancel={() => setDragging(null)} aria-label={`Drag ${animal.name} to its home`}><span>{animal.emoji}</span><b>{animal.name}</b></button>)}</div></section>
        <section className="animal-home-column" aria-label="Homes"><h2>Homes</h2><div className="animal-home-stack">{homeOrder.filter((animal) => !homeMatches.includes(animal.home)).map((animal) => <div key={animal.id} ref={(node) => { homeRefs.current[animal.home] = node; }} className="animal-home-drop" aria-label={`${animal.homeName} home`}><span>{animal.home}</span><b>{animal.homeName}</b></div>)}</div></section>
      </div>
      {dragging && <div className="animal-drag-ghost" style={{ left: dragging.x, top: dragging.y }} aria-hidden="true"><span>{dragging.animal.emoji}</span><b>{dragging.animal.name}</b></div>}
      {homesFinished && !mission && <button className="animal-again" type="button" onClick={() => chooseMode('homes')}>Play again</button>}
    </section> : <section className="animal-play" aria-label="Hear the animal sound">
      <button className="animal-listen" type="button" onClick={() => playSound()}><span aria-hidden="true">🔊</span> Hear it again</button><p className="animal-help">Which animal made that sound? The right animal will disappear, then you will hear a new sound.</p>
      <div className="animal-choice-row">{ANIMALS.filter((animal) => !soundMatches.includes(animal.id)).map((animal) => <button key={animal.id} type="button" onClick={() => chooseSound(animal)}><span>{animal.emoji}</span><b>{animal.name}</b></button>)}</div>
      {soundsFinished && !mission && <button className="animal-again" type="button" onClick={() => chooseMode('sounds')}>Play again</button>}
    </section>}
    {mode !== 'menu' && <p className="animal-feedback" role="status" aria-live="polite">{message || (mode === 'feed' ? '' : 'Choose and explore.')}</p>}
  </main>;
}
