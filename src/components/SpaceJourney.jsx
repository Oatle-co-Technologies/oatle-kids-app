import { useEffect, useRef, useState } from 'react';
import { currentDestination, journeyPoints, JOURNEY_WIDTH, JOURNEY_STEP, routeBetween } from './spaceJourneyLogic';
import './SpaceJourney.css';

export default function SpaceJourney({ items, currentId, label = 'Adventure journey', storageKey, playful = false, positions, stageHeight, className = '', autoScrollCurrent = true, showMissionStatus = false, rocketLift = 55, pathBuilder = routeBetween, compactLabels = false, numberedStops = false, centerContent, closingPath }) {
  const [remembered] = useState(() => {
    try { return storageKey ? sessionStorage.getItem(storageKey) : null; } catch { return null; }
  });
  const current = currentDestination(items, remembered ?? currentId);
  const [flying, setFlying] = useState(null);
  const lock = useRef(false);
  const stage = useRef(null);
  const ship = useRef(null);
  const flightPath = useRef(null);
  const cancel = useRef(null);
  const points = positions || journeyPoints(items.length);
  const height = stageHeight ?? (140 + Math.max(1, items.length) * JOURNEY_STEP);

  useEffect(() => () => cancel.current?.(), []);
  useEffect(() => {
    if (autoScrollCurrent && current > 1) stage.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [current, autoScrollCurrent]);

  const choose = (item, index) => {
    if (item.locked || lock.current) return;
    const remember = () => { try { if (storageKey) sessionStorage.setItem(storageKey, String(item.id)); } catch { /* Storage is optional. */ } };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const light = navigator.connection?.saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    if (index === current || reduced || light || !ship.current?.animate || !flightPath.current?.getPointAtLength) {
      remember(); item.onSelect(); return;
    }
    lock.current = true;
    setFlying(item.id);
    let settled = false;
    let animation;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      animation?.cancel();
      cancel.current = null;
      lock.current = false;
      setFlying(null);
      remember();
      item.onSelect();
    };
    const timer = window.setTimeout(finish, 850);
    cancel.current = () => { settled = true; clearTimeout(timer); animation?.cancel(); lock.current = false; };
    try {
      flightPath.current.setAttribute('d', pathBuilder(points, current, index));
      const length = flightPath.current.getTotalLength();
      const scale = stage.current.clientWidth / JOURNEY_WIDTH;
      const origin = points[current];
      const frames = Array.from({ length: 33 }, (_, step) => {
        const distance = length * step / 32;
        const point = flightPath.current.getPointAtLength(distance);
        const before = flightPath.current.getPointAtLength(Math.max(0, distance - 2));
        const after = flightPath.current.getPointAtLength(Math.min(length, distance + 2));
        // The source logo rocket points northeast (about -45 degrees).
        const angle = Math.atan2(after.y - before.y, (after.x - before.x) * scale) * 180 / Math.PI + 45;
        return { transform: `translate(calc(-50% + ${(point.x - origin.x) * scale}px), calc(-50% + ${point.y - origin.y}px)) rotate(${angle}deg)` };
      });
      animation = ship.current.animate(frames, { duration: 620, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      animation.finished.then(finish).catch(finish);
    } catch { finish(); }
  };

  return (
    <section className={`space-journey ${playful ? 'space-journey-playful' : ''} ${className}`}  aria-label={label}>
      <div className="journey-key"><span>✦ Your next stop</span><span>✓ Explored</span><span>🔒 Up ahead</span></div>
      <div ref={stage} className="journey-stage" style={{ height }}>
        {centerContent}
        <svg className="journey-routes" viewBox={`0 0 ${JOURNEY_WIDTH} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {points.slice(1).map((_, index) => <path key={items[index + 1].id} d={pathBuilder(points, index, index + 1)} className={items[index + 1].locked ? 'journey-route-locked' : 'journey-route-open'} />)}
          {closingPath && <path d={closingPath} className="journey-route-orbit" />}
          <path ref={flightPath} fill="none" stroke="none" />
        </svg>
        <ol className="journey-destinations">
          {items.map((item, index) => <li key={item.id} className={`journey-stop ${item.locked ? 'is-locked' : ''} ${item.complete ? 'is-complete' : ''} ${index === current ? 'is-current' : ''} ${flying === item.id ? 'is-arriving' : ''}`} style={{ left: `${points[index].x / JOURNEY_WIDTH * 100}%`, top: points[index].y, '--destination-color': item.color || '#8de1ec', '--orbit-label-x': points[index].orbit ? `${points[index].labelX}px` : undefined, '--orbit-label-y': points[index].orbit ? `${points[index].labelY}px` : undefined, '--orbit-label-own-width': points[index].orbit ? `${points[index].labelRect.width}px` : undefined }}>
            <button type="button" disabled={item.locked || flying !== null} onClick={() => choose(item, index)} aria-current={index === current ? 'step' : undefined} aria-label={`${item.title}. ${showMissionStatus ? `${item.subtitle}. ` : ''}${item.locked ? 'Locked. Complete the previous mission.' : item.complete ? 'Completed. Explore again.' : index === current ? 'Current destination.' : 'Explore.'}`}>
              {item.group && <span className="journey-group">{item.group}</span>}
              <span className="journey-planet">{item.art || <img src={item.image} alt="" loading="lazy" draggable="false" />}{item.badge && <span className="journey-world-badge">{item.badge}</span>}</span>
              <span className="journey-stamp">{numberedStops ? index + 1 : item.locked ? '🔒' : item.complete ? '✓' : index === current ? '✦' : String(index + 1).padStart(2, '0')}</span>
              {compactLabels ? <span className="journey-label-plate"><strong>{item.title}</strong><small>{item.subtitle}</small></span> : <><strong>{item.title}</strong><small>{item.locked && !showMissionStatus ? 'Finish the stop before me' : item.subtitle}</small></>}
              {showMissionStatus && <span className="journey-mission-status">{compactLabels ? (item.free ? 'Free drawing' : item.locked ? 'Locked' : index === current ? 'You are here' : item.complete ? 'Completed' : 'Ready') : item.locked ? 'Locked · complete the previous planet' : index === current ? (item.complete ? 'Completed · rocket here' : 'Current planet · ready to explore') : item.complete ? 'Completed · explore again' : 'Ready to explore'}</span>}
            </button>
          </li>)}
        </ol>
        {items.length > 0 && <div ref={ship} className={`journey-ship ${flying !== null ? 'is-flying' : ''}`} style={{ left: `${points[current].x / JOURNEY_WIDTH * 100}%`, top: points[current].y - rocketLift }} aria-hidden="true"><img src="/rocket/oatle-rocket.png" alt="" /><span className="journey-thruster" /></div>}
      </div>
      <p className="journey-flight-status" role="status" aria-live="polite">{flying !== null ? `Flying to ${items.find(item => item.id === flying)?.title}…` : 'Choose a destination. Your rocket is ready.'}</p>
    </section>
  );
}
