import { useSyncExternalStore } from 'react';
import SpaceJourney from './SpaceJourney';
import { cosmicPlanetLayout } from './cosmicPlanetLayout.js';
import { routeBetween } from './spaceJourneyLogic.js';
import './AdventureWorlds.css';
import './ResponsivePlanetJourney.css';

const query = '(max-width: 640px)';
function subscribe(callback) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const snapshot = () => window.matchMedia(query).matches;

export default function ResponsivePlanetJourney(props) {
  const compact = useSyncExternalStore(subscribe, snapshot, () => true);
  const { points, height } = cosmicPlanetLayout(props.items.length, compact);
  return <div className="responsive-planet-host cosmic-planet-host">
    <div className="galaxy-orbit" aria-hidden="true" />
    <SpaceJourney {...props} className={`${props.className || ''} galaxy-journey cosmic-planet-journey`}
      positions={points} stageHeight={height} pathBuilder={routeBetween}
      autoScrollCurrent={false} rocketLift={55} compactLabels={false} numberedStops={false}
      showMissionStatus conciseStatus renderPlanet={undefined} centerContent={undefined} closingPath={undefined} />
  </div>;
}
