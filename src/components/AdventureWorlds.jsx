import { useSyncExternalStore } from 'react';
import SpaceJourney from './SpaceJourney';
import AdventureIntro from './AdventureIntro';
import { BIG_KIDS_HOMES } from './bigKidsHomes';
import { adventureHomeLayout } from './galaxyHomeLayout';
import './AdventureWorlds.css';

const query = '(max-width: 640px)';
function subscribeViewport(callback) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const compactViewport = () => window.matchMedia(query).matches;


export default function AdventureWorlds({ onAdventure, soundOn }) {
  const compact = useSyncExternalStore(subscribeViewport, compactViewport, () => true);
  const { points, height } = adventureHomeLayout(compact);
  return <>
    <AdventureIntro items={BIG_KIDS_HOMES} soundOn={soundOn} />
    <div className="galaxy-environment">
      <div className="galaxy-orbit" aria-hidden="true" />
      <SpaceJourney className="galaxy-journey" positions={points} stageHeight={height} autoScrollCurrent={compact}
        storageKey="oatle-big-adventure-destination" label="Big Kids floating adventure homes"
        items={BIG_KIDS_HOMES.map(item => ({ ...item, onSelect: () => onAdventure(item.id) }))} />
    </div>
  </>;
}
