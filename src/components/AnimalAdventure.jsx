import { useEffect, useRef, useState } from 'react';
import LocalBackButton from './LocalBackButton';
import { speak, stopSpeech } from '../utils/speech';
import { ANIMALS, byId, isRightFood, isRightHome } from './animalLogic';
import dogSound from '../sounds/animals/dog.mp3';
import catSound from '../sounds/animals/cat.mp3';
import cowSound from '../sounds/animals/cow.mp3';
import sheepSound from '../sounds/animals/sheep.mp3';
import elephantSound from '../sounds/animals/elephant.mp3';
import './AnimalAdventure.css';

export function AnimalIcon() {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <circle cx="50" cy="52" r="32" fill="#ffcf72" /><circle cx="28" cy="28" r="18" fill="#ffb65b" /><circle cx="72" cy="28" r="18" fill="#ffb65b" />
    <circle cx="39" cy="50" r="5" fill="#28345d" /><circle cx="61" cy="50" r="5" fill="#28345d" /><path d="M44 65 Q50 70 56 65" fill="none" stroke="#28345d" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

const ACTIVITY_INFO = {
  feed: { number: '01 · CARE PLAY', title: 'Feed the Animal', copy: 'Choose the food your animal loves.' },
  homes: { number: '02 · MATCHING', title: 'Animal Homes', copy: 'Help each animal find its home.' },
  sounds: { number: '03 · LISTENING', title: 'Hear the Sound', copy: 'Listen, then find the animal.' },
};

const ANIMAL_SOUNDS = { dog: dogSound, cat: catSound, cow: cowSound, sheep: sheepSound, elephant: elephantSound };

export default function AnimalAdventure({ onBack, soundOn }) {
  const [mode, setMode] = useState('menu');
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState([]);
  const [fedFoods, setFedFoods] = useState([]);
  const [homeMatches, setHomeMatches] = useState([]);
  const [soundMatches, setSoundMatches] = useState([]);
  const [message, setMessage] = useState('');
  const audioRef = useRef(null);
  const current = ANIMALS[round % ANIMALS.length];
  const homesFinished = done.length === ANIMALS.length;
  const feedingFinished = fedFoods.length === ANIMALS.length;

  useEffect(() => {
    if (!soundOn) { stopSpeech(); return undefined; }
    const prompt = mode === 'menu' ? 'Animal adventure. Feed an animal, find animal homes, or listen for animal sounds.'
      : mode === 'feed' ? `This is ${current.name}. What does ${current.name} like to eat?`
        : mode === 'homes' ? 'Tap an animal, then tap its home.'
          : 'Listen carefully. Which animal made this sound?';
    const timer = window.setTimeout(() => speak(prompt), 220);
    return () => { window.clearTimeout(timer); stopSpeech(); };
  }, [mode, current, soundOn]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function chooseMode(next) { audioRef.current?.pause(); setMode(next); setRound(0); setSelected(null); setDone([]); setFedFoods([]); setHomeMatches([]); setSoundMatches([]); setMessage(''); }
  function nextRound() { setRound((value) => (value + 1) % ANIMALS.length); setMessage(''); }
  function celebrate(text) { setMessage(text); if (soundOn) speak(text); }
  function selectFood(food) {
    if (fedFoods.includes(food)) return;
    if (isRightFood(current.id, food)) {
      const foods = [...fedFoods, food];
      setFedFoods(foods);
      celebrate(foods.length === ANIMALS.length ? 'Every animal has had their favourite food!' : `${current.name} loves that!`);
      if (foods.length < ANIMALS.length) window.setTimeout(nextRound, 750);
    }
    else { setMessage(`${current.name} is looking for something else.`); }
  }
  function selectHome(home) {
    if (!selected) { setMessage('Choose an animal first.'); return; }
    if (homeMatches.includes(home)) return;
    if (isRightHome(selected, home)) { const animal = byId(selected); const next = [...done, selected]; setDone(next); setHomeMatches((homes) => [...homes, home]); setSelected(null); celebrate(next.length === ANIMALS.length ? 'All the animals are home!' : `${animal.name} is home!`); }
    else setMessage('Let’s try another home.');
  }
  function chooseSound(animal) {
    if (soundMatches.includes(animal.id)) return;
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
    window.setTimeout(() => {
      setRound((value) => (value + 1) % ANIMALS.length);
      setMessage('Listen carefully. Which animal made this sound?');
      playSound(nextAnimal);
    }, 850);
  }
  function playSound(animal = current) {
    audioRef.current?.pause();
    const audio = new Audio(ANIMAL_SOUNDS[animal.id]);
    audio.volume = 1;
    audioRef.current = audio;
    audio.play().catch(() => setMessage('Tap “Hear it again” once more to play the sound.'));
    setMessage('Listen carefully.');
  }
  const title = mode === 'menu' ? 'Animal Adventure' : ACTIVITY_INFO[mode].title;

  return <main className="little-explorers-page animal-page">
    <header className="animal-header">
      <LocalBackButton label={mode === 'menu' ? 'Adventures' : 'Animal Adventure'} onClick={() => mode === 'menu' ? onBack() : chooseMode('menu')} />
      <p className="eyebrow">LITTLE EXPLORERS / ANIMALS</p><h1>{title}</h1>
      <p>{mode === 'menu' ? 'Meet, match and care for friendly animals.' : ACTIVITY_INFO[mode].copy}</p>
    </header>
    {mode === 'menu' ? <section className="animal-mode-grid" aria-label="Animal activities">
      {Object.entries(ACTIVITY_INFO).map(([id, info]) => <button key={id} type="button" className={`animal-mode-card animal-${id}-card`} onClick={() => chooseMode(id)}>
        <span className="animal-mode-art" aria-hidden="true">{id === 'feed' ? '🐰🥕' : id === 'homes' ? '🐵🌴' : '🐧🎵'}</span><span>{info.number}</span><strong>{info.title}</strong><small>{info.copy}</small><b>Let’s play ↗</b>
      </button>)}
      <p className="animal-grownup">Play together: name the animals, foods and homes as you go.</p>
    </section> : mode === 'feed' ? <section className="animal-play" aria-label="Feed the animal">
      <div className="animal-hero"><span>{current.emoji}</span><strong>{current.name}</strong><p>What does {current.name} want to eat?</p></div>
      <p className="animal-help">The right food will disappear after your animal eats it.</p>
      <div className="animal-choice-row">{ANIMALS.filter((animal) => !fedFoods.includes(animal.food)).map((animal) => <button key={animal.id} type="button" aria-label={`Offer ${animal.foodName}`} onClick={() => selectFood(animal.food)}><span>{animal.food}</span><b>{animal.foodName}</b></button>)}</div>
      {feedingFinished && <button className="animal-again" type="button" onClick={() => chooseMode('feed')}>Play again</button>}
    </section> : mode === 'homes' ? <section className="animal-play" aria-label="Match animals to homes">
      <p className="animal-help">First choose an animal, then choose its home. The correct home will disappear.</p><div className="animal-choice-row">{ANIMALS.filter((animal) => !done.includes(animal.id)).map((animal) => <button key={animal.id} type="button" className={selected === animal.id ? 'is-selected' : ''} onClick={() => { setSelected(animal.id); setMessage('Now find its home.'); }}><span>{animal.emoji}</span><b>{animal.name}</b></button>)}</div>
      <div className="animal-choice-row animal-homes">{ANIMALS.filter((animal) => !homeMatches.includes(animal.home)).map((animal) => <button key={animal.id} type="button" aria-label={`${animal.homeName} home`} onClick={() => selectHome(animal.home)}><span>{animal.home}</span><b>{animal.homeName}</b></button>)}</div>
      {homesFinished && <button className="animal-again" type="button" onClick={() => chooseMode('homes')}>Play again</button>}
    </section> : <section className="animal-play" aria-label="Hear the animal sound">
      <button className="animal-listen" type="button" onClick={() => playSound()}><span aria-hidden="true">🔊</span> Hear it again</button><p className="animal-help">Which animal made that sound? The right animal will disappear, then you will hear a new sound.</p>
      <div className="animal-choice-row">{ANIMALS.filter((animal) => !soundMatches.includes(animal.id)).map((animal) => <button key={animal.id} type="button" onClick={() => chooseSound(animal)}><span>{animal.emoji}</span><b>{animal.name}</b></button>)}</div>
      {soundMatches.length === ANIMALS.length && <button className="animal-again" type="button" onClick={() => chooseMode('sounds')}>Play again</button>}
    </section>}
    {mode !== 'menu' && <p className="animal-feedback" role="status" aria-live="polite">{message || 'Choose and explore.'}</p>}
  </main>;
}
