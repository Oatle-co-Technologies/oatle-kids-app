import { useSyncExternalStore } from 'react';
import LocalBackButton from './LocalBackButton';
import ResponsivePlanetJourney from './ResponsivePlanetJourney';
import { currentDestination } from './spaceJourneyLogic';
import { planetJourneyLayout, planetJourneyProgress, planetJourneyRoute } from './planetJourneyLayout';
import { BIG_KIDS_HOMES } from './bigKidsHomes';
import './BigKidsPlanetJourney.css';

const queries = ['(max-width: 640px)', '(max-width: 1023px)'];
function subscribe(callback) {
  const media = queries.map(query => window.matchMedia(query));
  media.forEach(item => item.addEventListener('change', callback));
  return () => media.forEach(item => item.removeEventListener('change', callback));
}
const viewportSnapshot = () => window.matchMedia(queries[0]).matches ? 'phone' : window.matchMedia(queries[1]).matches ? 'tablet' : 'wide';

export default function BigKidsPlanetJourney({ title, description, label, items, currentId, onBack, childName, onProfile, emblem = '✏️' }) {
  const mode = useSyncExternalStore(subscribe, viewportSnapshot, () => 'phone');
  const { points, height } = planetJourneyLayout(items.length, mode);
  const { completed, total } = planetJourneyProgress(items);
  const currentIndex = currentDestination(items, currentId);
  const journeyName = title.replace(/ Adventure$/, '');
  return (
    <main className={`big-kids-planet-map planet-board-${mode}`}>
      <header className="planet-map-toolbar">
        <div className="planet-map-brand-back"><img src="/oatle-kids-wordmark.webp" alt="Oatle Kids" /><LocalBackButton label="Adventures" onClick={onBack} /></div>
        <div className="planet-map-banner"><span className="planet-banner-emblem" aria-hidden="true">{emblem}</span><h1>{title}</h1><p>Your {journeyName} Journey</p></div>
        {childName && <button className="planet-map-profile" aria-label={`${childName} — Settings`} type="button" onClick={onProfile} disabled={!onProfile}><span aria-hidden="true">{childName.charAt(0).toUpperCase()}</span>{childName}<span aria-hidden="true">⌄</span></button>}
      </header>
      <p className="planet-map-guidance">{description}</p>
      <ResponsivePlanetJourney centerTitle={title} centerImage={BIG_KIDS_HOMES.find(home => home.title === title)?.image} centerEmblem={emblem} className="big-planet-journey" label={label} items={items} currentId={currentId}
        positions={points} stageHeight={height} autoScrollCurrent={mode !== 'wide' && currentIndex >= (mode === 'phone' ? 2 : 3)}
        pathBuilder={planetJourneyRoute} showMissionStatus compactLabels numberedStops rocketLift={0} />
      <section className="planet-journey-progress" aria-label={`${journeyName} journey progress`}>
        <strong>Your Progress</strong>
        <div className="planet-progress-orbs" aria-hidden="true">{items.filter(item => !item.free).map(item => <span key={item.id} className={item.complete ? 'is-complete' : ''} />)}</div>
        <b>{completed} of {total}</b>
        <progress aria-label={`${title} completion`} value={completed} max={Math.max(1, total)} />
      </section>
    </main>
  );
}
