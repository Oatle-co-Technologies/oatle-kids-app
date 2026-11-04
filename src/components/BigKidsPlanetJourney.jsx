import { useSyncExternalStore } from 'react';
import LocalBackButton from './LocalBackButton';
import SpaceJourney from './SpaceJourney';
import { currentDestination } from './spaceJourneyLogic';
import { planetJourneyLayout, planetJourneyProgress } from './planetJourneyLayout';
import './BigKidsPlanetJourney.css';

const query = '(max-width: 640px)';
function subscribe(callback) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const compactSnapshot = () => window.matchMedia(query).matches;

export default function BigKidsPlanetJourney({ title, description, label, items, currentId, onBack, extraActivity }) {
  const compact = useSyncExternalStore(subscribe, compactSnapshot, () => true);
  const { points, height } = planetJourneyLayout(items.length, compact);
  const { completed, total } = planetJourneyProgress(items);
  const currentIndex = currentDestination(items, currentId);
  const current = items[currentIndex];
  return (
    <main className="big-kids-planet-map">
      <LocalBackButton className="planet-map-back" label="Adventures" onClick={onBack} />
      <header className="planet-journey-header">
        <img src="/oatle-kids-wordmark.webp" alt="Oatle Kids" />
        <p className="eyebrow">YOUR GALAXY JOURNEY</p>
        <h1>{title}</h1>
        <p className="planet-journey-description">{description}</p>
        <div className="planet-journey-progress">
          <p><strong>{completed} of {total}</strong> planets completed</p>
          <progress aria-label={`${title} completion`} value={completed} max={Math.max(1, total)} />
          <small>Your rocket is at {current?.title || 'the first available planet'}.</small>
        </div>
        {extraActivity && <button className="planet-free-activity" type="button" onClick={extraActivity.onSelect}>{extraActivity.title} <span>· {extraActivity.description}</span> →</button>}
      </header>
      <SpaceJourney className="big-planet-journey" label={label} items={items} currentId={currentId}
        positions={points} stageHeight={height} autoScrollCurrent={currentIndex >= (compact ? 2 : 3)} showMissionStatus rocketLift={0} />
    </main>
  );
}
