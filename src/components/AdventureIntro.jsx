import { useEffect } from 'react';
import { speak, stopSpeech } from '../utils/speech';

const invitation = 'Pick a world and let’s explore!';

export default function AdventureIntro({ items, soundOn }) {
  const titles = items.map(item => item.title).join('. ');
  const narration = `Choose an adventure. ${titles}. ${invitation}`;

  useEffect(() => {
    if (!soundOn) return;
    const timer = window.setTimeout(() => speak(narration), 240);
    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [narration, soundOn]);

  return <>
    <h1>Choose an <em>Adventure</em></h1>
    <p className="page-intro">{invitation}</p>
  </>;
}
