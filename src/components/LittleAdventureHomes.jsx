import { useSyncExternalStore } from 'react';
import SpaceJourney from './SpaceJourney';
import LocalBackButton from './LocalBackButton';
import './AdventureWorlds.css';
import './LittleAdventureHomes.css';
import { littleHomeLayout } from './littleHomeLayout';

const query = '(max-width: 640px)';
function subscribe(callback) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const compactSnapshot = () => window.matchMedia(query).matches;
export default function LittleAdventureHomes({ items, onBack, backLabel }) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, () => true);
  const { points, height } = littleHomeLayout(items.length, compact);
  return <main className="page adventure-hub expedition-hub big-kids-galaxy little-home-galaxy">
    <header className="little-home-toolbar">
      <img src="/oatle-kids-wordmark.webp" loading="eager" fetchPriority="high" alt="Oatle Kids" />
      <LocalBackButton label={backLabel} onClick={onBack} />
    </header>
    <p className="eyebrow">LITTLE EXPLORERS · AGES 2–3</p>
    <h1>Choose an <em>Adventure</em></h1>
    <p className="page-intro">Tap a little world. Let’s play and discover!</p>
    <div className="galaxy-environment">
      <div className="galaxy-orbit" aria-hidden="true" />
      <SpaceJourney className="galaxy-journey little-home-journey" positions={points} stageHeight={height}
        autoScrollCurrent={false} storageKey="oatle-little-adventure-destination"
        label="Little Explorers adventure destinations" items={items.map(item => ({ ...item, image: item.image || `/little-adventure-homes/${item.id}.webp` }))} />
    </div>
  </main>;
}
