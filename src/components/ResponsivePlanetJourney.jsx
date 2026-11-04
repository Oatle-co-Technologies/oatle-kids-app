import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import SpaceJourney from './SpaceJourney';
import OrbitMissionArtwork from './OrbitMissionArtwork';
import { isOrbitViewport, planetOrbitLayout, planetOrbitRoute, planetOrbitClosingPath } from './planetOrbitLayout.js';
import './ResponsivePlanetJourney.css';

function subscribeViewport(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}
const viewportSnapshot = () => `${window.innerWidth}:${window.innerHeight}`;

export default function ResponsivePlanetJourney({ adventureId, centerTitle, centerImage, centerEmblem = '✦', ...props }) {
  const [vw, vh] = useSyncExternalStore(subscribeViewport, viewportSnapshot, () => '1024:768').split(':').map(Number);
  const orbit = isOrbitViewport(vw);
  const host = useRef(null);
  const [metrics, setMetrics] = useState({width:0,height:0,navHeight:0});
  useEffect(() => {
    const navigation = document.querySelector('.bottom-nav');
    const element = host.current;
    const observer = new ResizeObserver(entries => {
      setMetrics(old => {
        const next = {...old};
        for (const entry of entries) {
          if (entry.target === element && entry.contentRect.width > 0) {
            next.width = entry.contentRect.width;
            next.height = entry.contentRect.height;
          }
          if (entry.target === navigation) next.navHeight = entry.target.getBoundingClientRect().height;
        }
        return next.width === old.width && next.height === old.height && next.navHeight === old.navHeight ? old : next;
      });
    });
    observer.observe(element);
    if (navigation) observer.observe(navigation);
    return () => observer.disconnect();
  }, []);
  const geometry = orbit ? planetOrbitLayout(props.items.length, metrics.width || vw - 24, vw, vh, metrics.navHeight, metrics.height) : null;
  const variables = geometry ? {
    '--orbit-board-width': `${geometry.width}px`, '--orbit-touch': `${geometry.touch}px`,
    '--orbit-planet': `${geometry.planet}px`, '--orbit-title-font': `${geometry.titleFont}px`,
    '--orbit-center-size': `${geometry.centerSize}px`,
  } : undefined;
  const center = geometry && <>
    <div className="planet-orbit-center" style={{top:geometry.centerY}} aria-hidden="true">
      {centerImage ? <img src={centerImage} alt="" draggable="false" /> : <span>{centerEmblem}</span>}
      <strong>{centerTitle}</strong>
    </div>
    {geometry.points.length > 1 && geometry.points.map((point, index) => {
      const angle = point.angle + Math.PI / geometry.points.length;
      return <span key={index} className="planet-orbit-sparkle" aria-hidden="true" style={{
        left: `${(point.cx + Math.cos(angle) * point.rx) / 720 * 100}%`,
        top: point.cy + Math.sin(angle) * point.ry,
      }}>✦</span>;
    })}
  </>;
  return <div className={`responsive-planet-host ${geometry?.landscape ? 'orbit-landscape' : ''}`} ref={host} style={variables}>
    <SpaceJourney {...props} {...(geometry ? {
      className: `${props.className || ''} planet-orbit`, positions: geometry.points, stageHeight: geometry.height,
      pathBuilder: planetOrbitRoute, closingPath: planetOrbitClosingPath(geometry.points),
      autoScrollCurrent: false, rocketLift: 0, compactLabels: true, numberedStops: true,
      showMissionStatus: true, centerContent: center,
      renderPlanet: (item, index) => <OrbitMissionArtwork adventureId={adventureId} item={item} index={index} />,
    } : {})} />
  </div>;
}
