import { useRef } from 'react';
import { STUDIO_NOTES, INSTRUMENT_NAMES } from './musicStudioData';
const colours = ['#ef7a85', '#f3a45e', '#edce63', '#8dc59b', '#74c9c5', '#83b7ed', '#b49de3', '#e8a9cc'];
export function StudioArt({
  kind
}) {
  return <svg viewBox="0 0 300 220" aria-hidden="true" focusable="false">
 {kind === 'drum' || kind === 'bongos' ? <>{(kind === 'bongos' ? [{
        x: 25,
        y: 70,
        w: 115,
        h: 115
      }, {
        x: 161,
        y: 85,
        w: 110,
        h: 95
      }] : [{
        x: 52,
        y: 55,
        w: 196,
        h: 138
      }]).map((d, i) => <g key={i}><path d={`M${d.x} ${d.y}v${d.h - 22}q${d.w / 2} 50 ${d.w} 0V${d.y}`} fill={i ? '#eab565' : '#d87567'} stroke="#783f49" strokeWidth="5" /><path d={`M${d.x + 12} ${d.y + 25}l20 ${d.h - 35} 25 -70 25 70 20 -80`} fill="none" stroke="#ffe9bd" strokeWidth="5" /><ellipse cx={d.x + d.w / 2} cy={d.y} rx={d.w / 2} ry="30" fill="#fff0cd" stroke="#a35d4d" strokeWidth="8" /><ellipse cx={d.x + d.w / 2} cy={d.y} rx={d.w / 2 - 12} ry="20" fill="none" stroke="#e5c790" strokeWidth="2" /></g>)}</> : kind === 'bell' ? <><path d="M136 55V25q14-20 28 0v30" fill="none" stroke="#946846" strokeWidth="14" /><path d="M150 45q-48 0-48 57 0 34-27 55v12h150v-12q-27-21-27-55 0-57-48-57" fill="#f3c55c" stroke="#a56e3e" strokeWidth="5" /><path d="M120 86q0-20 13-23" fill="none" stroke="#ffe8a1" strokeWidth="12" strokeLinecap="round" /><ellipse cx="150" cy="169" rx="75" ry="13" fill="#d99c40" /><circle cx="150" cy="185" r="14" fill="#965d41" /></> : kind === 'violin' ? <><path d="M140 85q-50-40-53 3-1 22 22 31-37 18-31 50 10 53 72 37 62 16 72-37 6-32-31-50 23-9 22-31-3-43-53-3" fill="#d58a4f" stroke="#794a3b" strokeWidth="5" /><path d="M140 92V22h20v70" fill="#805a48" /><path d="M137 20q-12-23 11-15 24-8 15 15" fill="#b77849" /><path d="M135 199h30l-7-45h-16Z" fill="#493e43" /><path d="M144 25v153m4-153v153m4-153v153m4-153v153" stroke="#fff1c8" strokeWidth="1.8" /><path d="M125 123q-18-12-11 13t-8 14m69-27q18-12 11 13t8 14" fill="none" stroke="#794a3b" strokeWidth="4" /><path d="m235 20-30 182" stroke="#8c6246" strokeWidth="6" /><path d="m241 20-30 182" stroke="#fff0ce" strokeWidth="3" /></> : <><rect x="12" y="55" width="276" height="140" rx="18" fill={kind === 'piano' ? '#333454' : '#bd8c60'} />{colours.map((c, i) => <rect key={c} x={22 + i * 32} y={kind === 'piano' ? 85 : 70 + i * 5} width="29" height={kind === 'piano' ? 97 : 110 - i * 8} rx="5" fill={kind === 'piano' ? '#fff4df' : c} />)}{kind === 'piano' && [0, 1, 3, 4, 5].map(i => <rect key={i} x={44 + i * 32} y="85" width="17" height="58" rx="3" fill="#191b30" />)}</>}
 </svg>;
}
export default function StudioInstrument({
  kind,
  disabled,
  lit,
  onPlay
}) {
  const host = useRef(null),
    pointers = useRef(new Map());
  const keyed = ['piano', 'xylophone', 'violin'].includes(kind);
  function hit(pitch) {
    onPlay(kind, pitch, `${kind}-${pitch}`);
  }
  function down(e, pitch) {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    pointers.current.set(e.pointerId, pitch);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    hit(pitch);
  }
  function move(e) {
    if (!pointers.current.has(e.pointerId) || disabled) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-music-studio-pitch]');
    if (!target || !host.current?.contains(target)) return;
    const pitch = Number(target.dataset.musicStudioPitch);
    if (pitch !== pointers.current.get(e.pointerId)) {
      pointers.current.set(e.pointerId, pitch);
      hit(pitch);
    }
  }
  return <div ref={host} className={`music-studio-instrument music-studio-${kind}`} onPointerMove={move} onPointerUp={e => pointers.current.delete(e.pointerId)} onPointerCancel={e => pointers.current.delete(e.pointerId)} onLostPointerCapture={e => pointers.current.delete(e.pointerId)}>
 {keyed ? <>{kind === 'violin' ? <div className="music-studio-violin-art"><StudioArt kind={kind} /><p>Tap a note to hear its violin sound</p></div> : <div className="music-studio-maker" aria-hidden="true">OATLE <span>♪</span></div>}<div className="music-studio-keys" role="group" aria-label={INSTRUMENT_NAMES[kind]}>{STUDIO_NOTES.map((note, i) => <button type="button" key={note.pitch} disabled={disabled} data-music-studio-pitch={note.pitch} onPointerDown={e => down(e, note.pitch)} onClick={e => {
          if (e.detail === 0 && !disabled) hit(note.pitch);
        }} className={`music-studio-natural ${lit === `${kind}-${note.pitch}` ? 'is-lit' : ''}`} style={{
          '--note-colour': colours[i],
          '--note-order': i
        }} aria-label={`Play ${kind} ${note.name}`}><span>{i === 7 ? 'C↑' : note.name}</span></button>)}{kind === 'piano' && [0, 1, 3, 4, 5].map(i => <button type="button" key={i} disabled={disabled} data-music-studio-pitch={STUDIO_NOTES[i].pitch + 1} onPointerDown={e => down(e, STUDIO_NOTES[i].pitch + 1)} onClick={e => {
          if (e.detail === 0 && !disabled) hit(STUDIO_NOTES[i].pitch + 1);
        }} className={`music-studio-sharp ${lit === `${kind}-${STUDIO_NOTES[i].pitch + 1}` ? 'is-lit' : ''}`} style={{
          left: `${(i + 1) / 8 * 100}%`
        }} aria-label={`Play piano ${STUDIO_NOTES[i].name} sharp`} />)}</div></> : kind === 'bongos' ? <div className="music-studio-bongo-pair">{[0, 5].map((pitch, i) => <button type="button" key={pitch} disabled={disabled} data-music-studio-pitch={pitch} onPointerDown={e => down(e, pitch)} onClick={e => {
        if (e.detail === 0 && !disabled) hit(pitch);
      }} className={lit === `${kind}-${pitch}` ? 'is-lit' : ''} aria-label={`Play ${i ? 'high' : 'low'} bongo`}><StudioArt kind="drum" /><span>{i ? 'High' : 'Low'}</span></button>)}</div> : <button type="button" disabled={disabled} data-music-studio-pitch={0} onPointerDown={e => down(e, 0)} onClick={e => {
      if (e.detail === 0 && !disabled) hit(0);
    }} className={`music-studio-single ${lit === `${kind}-0` ? 'is-lit' : ''}`} aria-label={`Play ${kind}`}><StudioArt kind={kind} /><span>{kind === 'bell' ? 'Tap to ring' : 'Tap to drum'}</span></button>}
 </div>;
}
