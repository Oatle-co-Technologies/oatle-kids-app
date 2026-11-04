const COLOURS = ['#ef6a62','#f3a34b','#f6cd50','#86bf67','#58b7ae','#69a7d7','#a781cd'];
const NOTES = [0,2,4,5,7,9,11];
export function InstrumentArt({ kind }) {
  if (['drum','bongos','bell'].includes(kind)) return <img src={`/music-garden/${kind}.webp`} alt="" aria-hidden="true" draggable="false" />;
  return <svg viewBox="0 0 240 200" aria-hidden="true" focusable="false">
    {kind === 'drum' ? <><path d="m55 76 17 98q48 25 96 0l17-98" fill="#df6258" stroke="#a34c42" strokeWidth="4" /><path d="m60 89 24 72 24-71 24 72 24-72 18 63" fill="none" stroke="#ffcf73" strokeWidth="6" /><ellipse cx="120" cy="77" rx="66" ry="30" fill="#f9df9f" stroke="#c88c49" strokeWidth="7" /><ellipse cx="120" cy="72" rx="57" ry="23" fill="#ffefc7" /><path d="m31 26 48 33m129-35-46 35" stroke="#c99050" strokeWidth="9" strokeLinecap="round" /></>
    : kind==='bongos' ? <>{[[62,103,'#d79649'],[166,91,'#c46a47']].map(([x,y,c])=><g key={x}><path d={`M${x-40} ${y}l8 70q32 22 64 0l8-70`} fill={c} stroke="#86563c" strokeWidth="4" /><path d={`M${x-27} ${y+20}v47m54-47v47`} stroke="#654839" strokeWidth="7" strokeLinecap="round" /><ellipse cx={x} cy={y} rx="44" ry="24" fill="#ffeac0" stroke="#a87543" strokeWidth="6" /></g>)}</>
    : kind==='bell' ? <><path d="M120 42V23q0-16 15-11" stroke="#ac803e" strokeWidth="10" fill="none" strokeLinecap="round" /><path d="M120 39q-44 0-47 59l-17 39q-4 14 12 15h104q16-1 12-15l-17-39q-3-59-47-59" fill="#f8ca55" stroke="#be853a" strokeWidth="5" /><path d="M98 60q-15 13-16 40" stroke="#fff3b5" strokeWidth="10" strokeLinecap="round" fill="none" /><path d="M99 158q21 31 42 0" fill="#c78546" /></>
    : <><path d="M20 80h200v88H20Z" fill={kind==='piano'?'#db6358':'#d1a062'} /><path d="M29 79V42q0-20 30-20h122q30 0 30 20v37" fill="#ef7f6b" /><path d="M29 175v16m182-16v16" stroke="#ad5848" strokeWidth="12" strokeLinecap="round" />{COLOURS.map((c,i)=><rect key={c} x={30+i*26} y="91" width="23" height="65" rx="4" fill={kind==='piano'?'#fff1d5':c} />)}</>}
  </svg>;
}
export default function GardenInstrument({ kind, disabled, lit, onPlay }) {
  if (kind==='piano' || kind==='xylophone') return <div className={`garden-key-instrument garden-${kind}`} role="group" aria-label={kind==='piano'?'Piano':'Xylophone'}>
    <div className="garden-instrument-body" aria-hidden="true">{kind==='piano'?'✿':''}</div>
    <div className="garden-keyboard">{NOTES.map((pitch,i)=><button key={pitch} type="button" className={`garden-note ${lit===`${kind}-${pitch}`?'is-struck':''}`} style={{'--bar-colour':COLOURS[i],'--bar-order':i}}
      disabled={disabled} aria-label={`Play ${kind} ${['C','D','E','F','G','A','B'][i]}`} onPointerDown={event=>{if(event.button===0){event.preventDefault();onPlay(kind,pitch,`${kind}-${pitch}`);}}}
      onClick={event=>{if(event.detail===0)onPlay(kind,pitch,`${kind}-${pitch}`);}} />)}
      {kind==='piano' && [0,1,3,4,5].map((i)=><button type="button" key={i} className={`garden-black-note ${lit===`piano-${NOTES[i]+1}`?'is-struck':''}`} style={{left:`${(i+1)/7*100}%`}} disabled={disabled}
        aria-label={`Play piano ${['C sharp','D sharp','','F sharp','G sharp','A sharp'][i]}`} onPointerDown={event=>{if(event.button===0){event.preventDefault();onPlay('piano',NOTES[i]+1,`piano-${NOTES[i]+1}`);}}} onClick={event=>{if(event.detail===0)onPlay('piano',NOTES[i]+1,`piano-${NOTES[i]+1}`);}} />)}
    </div>
    {kind==='xylophone' && <div className="garden-mallets" aria-hidden="true"><i /><i /></div>}
  </div>;
  return <button type="button" className={`garden-loose-instrument garden-${kind} ${lit===kind?'is-struck':''}`} disabled={disabled} aria-label={`Play ${kind}`}
    onPointerDown={event=>{if(event.button===0){event.preventDefault();onPlay(kind);}}} onClick={event=>{if(event.detail===0)onPlay(kind);}}><InstrumentArt kind={kind} /></button>;
}
