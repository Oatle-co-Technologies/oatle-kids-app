import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { makeReadingBreakBalloons } from './readingBreakLogic';
import './ReadingBalloonBreak.css';

export default function ReadingBalloonBreak({ onComplete, onPop, className = '', label = 'Reading mini break', resumeLabel = 'Lovely! Let’s keep reading.' }) {
  const [balloons] = useState(makeReadingBreakBalloons);
  const [popped, setPopped] = useState([]);
  const poppedIds = useRef(new Set());
  const buttons = useRef([]);
  const finished = popped.length === balloons.length;

  useEffect(() => {
    const previousFocus = document.activeElement;
    buttons.current[0]?.focus({ preventScroll: true });
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!finished) return undefined;
    const timer = window.setTimeout(onComplete, 650);
    return () => window.clearTimeout(timer);
  }, [finished, onComplete]);

  function pop(balloon) {
    if (poppedIds.current.has(balloon.id)) return;
    poppedIds.current.add(balloon.id);
    setPopped([...poppedIds.current]);
    onPop?.();
    if (document.activeElement === buttons.current[balloon.id]) {
      const next = balloons.find(item => !poppedIds.current.has(item.id));
      if (next) buttons.current[next.id]?.focus({ preventScroll: true });
    }
  }

  return createPortal(<section className={`reading-mini-break ${className}`} aria-label={label}>
    <div className="reading-mini-break-prompt" role="status">
      <h2>{finished ? resumeLabel : 'Pop the balloons for a mini break!'}</h2>
      <p>{finished ? 'Back to your activity…' : 'A little fun, then back to your activity.'}</p>
    </div>
    <div className="reading-mini-break-field">
      {balloons.map(balloon => {
        // The middle cell stays open; compact landscape uses four columns.
        const cell = balloon.slot < 4 ? balloon.slot : balloon.slot + 1;
        const edges = ['-110vw', '110vw', '0px', '0px'];
        const verticalEdges = ['0px', '0px', '-110vh', '110vh'];
        return <div key={balloon.id} className="reading-mini-break-slot" style={{
          '--column': cell % 3, '--row': Math.floor(cell / 3),
          '--compact-column': balloon.slot % 4, '--compact-row': Math.floor(balloon.slot / 4),
          '--arrival-x': edges[balloon.edge], '--arrival-y': verticalEdges[balloon.edge],
          '--arrival-delay': `${balloon.delay}s`,
          '--travel-duration': `${9 + balloon.id * .8}s`,
          '--balloon-colour': balloon.colour,
        }}>
          <button ref={element => { buttons.current[balloon.id] = element; }} type="button"
            className={`reading-mini-break-balloon ${popped.includes(balloon.id) ? 'is-popped' : ''}`}
            disabled={popped.includes(balloon.id)} aria-label={`Pop the ${balloon.label} balloon`}
            onClick={() => pop(balloon)}>
            <span className="reading-mini-break-balloon-shape" aria-hidden="true" />
            <span className="reading-mini-break-string" aria-hidden="true" />
          </button>
        </div>;
      })}
    </div>
  </section>, document.body);
}
