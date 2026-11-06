import { useCallback, useRef, useState } from 'react';

const SAMPLES = 800;

export default function StarTrailTrace({ pattern, onComplete, onReach }) {
  const [points, setPoints] = useState([]);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const progressRef = useRef(0);
  const pointer = useRef(null);
  const reached = useRef(-1);
  const completed = useRef(false);
  const board = useRef(null);
  const measure = useCallback(path => {
    if (!path) return;
    const length = path.getTotalLength();
    setPoints(Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const point = path.getPointAtLength(length * i / SAMPLES);
      return { x: point.x, y: point.y };
    }));
  }, []);
  const closed = /z\s*$/i.test(pattern.path);
  const checkpoints = pattern.stars.map((_, i) => Math.round(i * SAMPLES / (closed ? pattern.stars.length : pattern.stars.length - 1)));

  function advance(next) {
    if (completed.current) return;
    progressRef.current = next;
    setProgress(next);
    setStarted(true);
    const star = checkpoints.findLastIndex(checkpoint => checkpoint <= next);
    if (star > reached.current) { reached.current = star; onReach?.(star); }
    if (next === SAMPLES) { completed.current = true; onComplete(); }
  }

  function trace(clientX, clientY) {
    if (!points.length || completed.current) return;
    const rect = board.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = progressRef.current;
    let distance = Infinity;
    let travelled = 0;
    // Only examine the next short section: jumping to the end cannot finish.
    for (let i = progressRef.current; i <= SAMPLES; i++) {
      if (i > progressRef.current) travelled += Math.hypot((points[i].x - points[i - 1].x) * rect.width / 100, (points[i].y - points[i - 1].y) * rect.height / 100);
      if (travelled > 32) break;
      const gap = Math.hypot(points[i].x * rect.width / 100 - x, points[i].y * rect.height / 100 - y);
      if (gap < distance) { distance = gap; best = i; }
    }
    if (distance <= 26) advance(best);
  }

  function down(event) {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0) || completed.current || pointer.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    trace(event.clientX, event.clientY);
  }
  function move(event) {
    const previous = pointer.current;
    if (!previous || previous.id !== event.pointerId) return;
    const count = Math.max(1, Math.ceil(Math.hypot(event.clientX - previous.x, event.clientY - previous.y) / 6));
    for (let i = 1; i <= count; i++) trace(previous.x + (event.clientX - previous.x) * i / count, previous.y + (event.clientY - previous.y) * i / count);
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }
  function release(event) {
    if (pointer.current?.id !== event.pointerId) return;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const point = points[progress];
  const nextStar = checkpoints.findIndex(checkpoint => checkpoint > progress);
  return <section ref={board} className="star-trail-space star-trace-space" aria-label={`${pattern.title} tracing trail`}
    onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { pointer.current = null; }}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path ref={measure} className="trail-trace-guide" d={pattern.path} />
      <path className="trail-trace-lit" d={pattern.path} pathLength="1" style={{ strokeDasharray: `${progress / SAMPLES} 1`, opacity: started ? 1 : 0 }} />
    </svg>
    {points.length > 0 && checkpoints.map((checkpoint, i) => <button key={i} type="button"
      className={`trail-star ${started && progress >= checkpoint ? 'visited' : ''} ${(!started && i === 0) || (started && (i === nextStar || (closed && nextStar === -1 && i === 0))) ? 'current' : ''}`}
      style={{ '--star-x': `${points[checkpoint].x}%`, '--star-y': `${points[checkpoint].y}%` }}
      aria-label={closed && nextStar === -1 && i === 0 ? 'Finish the circle' : `Trace to star ${i + 1}`} aria-disabled={progress === SAMPLES}
      onClick={event => {
        // Keyboard and assistive activation retain an alternative to finger tracing.
        if (event.detail !== 0) return;
        if (closed && nextStar === -1 && i === 0) advance(SAMPLES);
        else if ((!started && i === 0) || i === nextStar) advance(checkpoint);
      }}>★</button>)}
    {point && <span className="trail-rocket trail-trace-rocket" style={{ '--star-x': `${point.x}%`, '--star-y': `${point.y}%` }} aria-hidden="true">🚀</span>}
    <span className="trail-trace-status" role="status" aria-live="polite">{progress === SAMPLES ? 'Star trail complete!' : ' '}</span>
  </section>;
}
