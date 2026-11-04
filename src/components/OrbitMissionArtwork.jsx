import { useId } from 'react';
import { missionIllustration, missionIconPath } from './missionIllustrations';

const TRAILS = [
  'M 15 75 L 85 25',
  'M 12 75 L 30 28 L 48 75 L 66 28 L 88 65',
  'M 18 80 C 5 10 85 5 85 70',
  'M 50 15 A 35 35 0 1 1 49.9 15',
  'M 50 50 C 70 35 80 70 50 75 C 10 80 5 15 55 12 C 85 10 95 40 88 70',
];

function TraceIllustration({ index }) {
  const id = useId();
  return <svg className="orbit-trace-illustration" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id={id} x2="1" y2="1"><stop stopColor="#fff2ac" /><stop offset=".45" stopColor="#ffc149" /><stop offset="1" stopColor="#bf6b13" /></linearGradient></defs>
    <path d={TRAILS[index % TRAILS.length]} fill="none" stroke="#7c3f75" strokeWidth="10" strokeLinecap="round" transform="translate(1 3)" />
    <path d={TRAILS[index % TRAILS.length]} fill="none" stroke={`url(#${id})`} strokeWidth="8" strokeLinecap="round" />
  </svg>;
}

export default function OrbitMissionArtwork({ adventureId, item, index }) {
  const icons = missionIllustration(adventureId, item, index);
  return <>
    <span className="orbit-planet-surface" aria-hidden="true">
      <img className="orbit-planet-texture" src={item.image} alt="" draggable="false" />
      {adventureId === 'trail' && <TraceIllustration index={index} />}
      <span className={`orbit-mission-illustration ${icons.length > 1 ? 'has-companion' : ''}`}>
        {icons.map((key, iconIndex) => <img key={`${key}-${iconIndex}`} className={iconIndex ? 'orbit-icon-companion' : 'orbit-icon-main'} src={missionIconPath(key)} alt="" draggable="false" />)}
      </span>
    </span>
    {item.locked ? <img className="orbit-mission-lock" src={missionIconPath('lock')} alt="" aria-hidden="true" draggable="false" /> : item.complete && <span className="orbit-completion-tick" aria-hidden="true">✓</span>}
  </>;
}
