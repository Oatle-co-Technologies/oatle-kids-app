import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
const COLOURS = ['#ef6a62','#f3a34b','#f6cd50','#86bf67','#58b7ae','#69a7d7','#a781cd'];
const NOTES = [0,2,4,5,7,9,11];
export function InstrumentArt({ kind }) {
  if (['drum','bongos','bell'].includes(kind)) return <img src={`/music-garden/${kind === 'drum' ? 'drum-body-v2' : kind}.webp`} alt="" aria-hidden="true" draggable="false" />;
  return <svg viewBox="0 0 240 200" aria-hidden="true" focusable="false">
    <><path d="M20 80h200v88H20Z" fill={kind==='piano'?'#db6358':'#d1a062'} /><path d="M29 79V42q0-20 30-20h122q30 0 30 20v37" fill="#ef7f6b" /><path d="M29 175v16m182-16v16" stroke="#ad5848" strokeWidth="12" strokeLinecap="round" />{COLOURS.map((c,i)=><rect key={c} x={30+i*26} y="91" width="23" height="65" rx="4" fill={kind==='piano'?'#fff1d5':c} />)}</>
  </svg>;
}
export default function GardenInstrument({ kind, disabled, lit, onPlay }) {
  const host = useRef(null);
  const [tool, setTool] = useState(null);
  const activePointer = useRef(null);
  const hovering = useRef(false);
  const hideTimer = useRef(null);
  const sequence = useRef(0);
  const usesTool = kind === 'drum' || kind === 'xylophone';
  function showTool(x, y, strike = false) {
    if (!usesTool || disabled) return;
    window.clearTimeout(hideTimer.current);
    if (strike) sequence.current++;
    setTool(current => ({ x, y, strike: strike || Boolean(current?.strike), sequence: sequence.current }));
  }
  function hideSoon() {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!hovering.current && !activePointer.current) setTool(null);
    }, 360);
  }
  function hit(pitch = 0, key = kind, point) {
    const button = host.current?.querySelector(`[data-music-pitch="${pitch}"]`) || host.current;
    const rect = button?.getBoundingClientRect();
    if (rect) showTool(point?.x ?? rect.left + rect.width / 2, point?.y ?? rect.top + rect.height * (kind === 'drum' ? .2 : .5), true);
    if (kind === 'bell') shakeBell(host.current);
    onPlay(kind, pitch, key);
    hideSoon();
  }
  function down(event, pitch = 0, key = kind) {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    activePointer.current = { id: event.pointerId, pitch };
    if (usesTool) event.currentTarget.setPointerCapture?.(event.pointerId);
    hit(pitch, key, { x: event.clientX, y: event.clientY });
  }
  function move(event) {
    if (disabled || (kind === 'drum' && !activePointer.current)) return;
    showTool(event.clientX, event.clientY);
    const pointer = activePointer.current;
    if (kind !== 'xylophone' || !pointer || pointer.id !== event.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-music-pitch]');
    if (!target || !host.current?.contains(target)) return;
    const pitch = Number(target.dataset.musicPitch);
    if (pitch !== pointer.pitch) {
      pointer.pitch = pitch;
      hit(pitch, `${kind}-${pitch}`, { x: event.clientX, y: event.clientY });
    }
  }
  function release(event) {
    if (activePointer.current?.id === event.pointerId) activePointer.current = null;
    const rect = host.current?.getBoundingClientRect();
    hovering.current = kind !== 'drum' && event.pointerType === 'mouse' && Boolean(rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
    if (kind === 'drum') { hideSoon(); return; }
    if (event.pointerType === 'mouse' && !hovering.current) setTool(null);
    else hideSoon();
  }
  const pointerProps = {
    onPointerMove: move,
    onPointerEnter: event => { if (kind !== 'drum' && event.pointerType === 'mouse') { hovering.current = true; showTool(event.clientX, event.clientY); } },
    onPointerLeave: () => { hovering.current = false; if (!activePointer.current) setTool(null); },
    onPointerUp: release,
    onLostPointerCapture: release,
    onPointerCancel: event => { activePointer.current = null; hovering.current = false; release(event); setTool(null); },
  };
  useEffect(() => () => { window.clearTimeout(hideTimer.current); }, []);
  useEffect(() => {
    if (!lit || (lit !== kind && !lit.startsWith(`${kind}-`))) return undefined;
    if (kind === 'bell') { shakeBell(host.current); return undefined; }
    if (!usesTool) return undefined;
    const frame = requestAnimationFrame(() => {
      if (activePointer.current || hovering.current) return;
      const pitch = Number(lit.split('-')[1] || 0);
      const element = host.current?.querySelector(`[data-music-pitch="${pitch}"]`) || host.current;
      const rect = element?.getBoundingClientRect();
      if (!rect) return;
      sequence.current++;
      setTool({ x: rect.left + rect.width / 2, y: rect.top + rect.height * (kind === 'drum' ? .2 : .5), strike: true, sequence: sequence.current });
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setTool(null), 360);
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, lit, usesTool]);
  const cursor = tool && usesTool ? createPortal(<div className="music-tool-layer" aria-hidden="true"><div className={`music-strike-tool tool-${kind}`} style={{ left: tool.x, top: tool.y }} aria-hidden="true">
    <svg key={tool.sequence} className={tool.strike ? 'is-hitting' : ''} viewBox="0 0 120 130">
      <g className="strike-stick-one"><path d="M20 23 78 115" stroke="#946035" strokeWidth="11" strokeLinecap="round" /><path d="M18 20 75 110" stroke="#e1b16c" strokeWidth="6" strokeLinecap="round" />{kind === 'xylophone' ? <circle cx="18" cy="18" r="14" fill="#e9695c" stroke="#b84542" strokeWidth="3" /> : <><ellipse cx="18" cy="18" rx="10" ry="16" fill="#f0c47a" stroke="#ad7542" strokeWidth="3" /><path d="m62 90 10 15" stroke="#cf544a" strokeWidth="7" /></>}</g>
      <g className="strike-stick-two"><path d="M47 14 106 106" stroke="#946035" strokeWidth="10" strokeLinecap="round" /><path d="M47 14 104 102" stroke="#e1b16c" strokeWidth="6" strokeLinecap="round" />{kind === 'xylophone' ? <circle cx="45" cy="10" r="13" fill="#f1bd52" stroke="#c88f38" strokeWidth="3" /> : <ellipse cx="45" cy="10" rx="9" ry="15" fill="#f0c47a" stroke="#ad7542" strokeWidth="3" />}</g>
    </svg>
  </div></div>, document.body) : null;
  if (kind === 'piano' || kind === 'xylophone') return <>
    <div ref={host} className={`garden-key-instrument garden-${kind} ${usesTool && !disabled && (kind !== 'drum' || tool) ? 'has-strike-cursor' : ''}`} role="group" aria-label={kind === 'piano' ? 'Piano' : 'Xylophone'} {...pointerProps}>
      <div className="garden-instrument-body" aria-hidden="true">{kind === 'piano' ? '✿' : ''}</div>
      <div className="garden-keyboard">{NOTES.map((pitch, i) => <button key={pitch} type="button" data-music-pitch={pitch} className={`garden-note ${lit === `${kind}-${pitch}` ? 'is-struck' : ''}`} style={{ '--bar-colour': COLOURS[i], '--bar-order': i }}
        disabled={disabled} aria-label={`Play ${kind} ${['C', 'D', 'E', 'F', 'G', 'A', 'B'][i]}`} onPointerDown={event => down(event, pitch, `${kind}-${pitch}`)}
        onClick={event => { if (event.detail === 0) hit(pitch, `${kind}-${pitch}`); }} />)}
        {kind === 'piano' && [0, 1, 3, 4, 5].map(i => <button type="button" data-music-pitch={NOTES[i] + 1} key={i} className={`garden-black-note ${lit === `piano-${NOTES[i] + 1}` ? 'is-struck' : ''}`} style={{ left: `${(i + 1) / 7 * 100}%` }} disabled={disabled}
          aria-label={`Play piano ${['C sharp', 'D sharp', '', 'F sharp', 'G sharp', 'A sharp'][i]}`} onPointerDown={event => down(event, NOTES[i] + 1, `piano-${NOTES[i] + 1}`)} onClick={event => { if (event.detail === 0) hit(NOTES[i] + 1, `piano-${NOTES[i] + 1}`); }} />)}
      </div>
    </div>{cursor}
  </>;
  return <><button ref={host} type="button" className={`garden-loose-instrument garden-${kind} ${usesTool && !disabled && (kind !== 'drum' || tool) ? 'has-strike-cursor' : ''} ${lit === kind ? 'is-struck' : ''}`} disabled={disabled} aria-label={`Play ${kind}`}
    {...pointerProps} onPointerDown={event => down(event)} onClick={event => { if (event.detail === 0) hit(); }}><InstrumentArt kind={kind} /></button>{cursor}</>;
}
function shakeBell(button) {
  const image = button?.querySelector('img');
  if (!image || !image.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  image.getAnimations().forEach(animation => animation.cancel());
  image.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-19deg)' }, { transform: 'rotate(17deg)' }, { transform: 'rotate(-12deg)' }, { transform: 'rotate(9deg)' }, { transform: 'rotate(0deg)' }], { duration: 550, easing: 'ease-in-out' });
}
