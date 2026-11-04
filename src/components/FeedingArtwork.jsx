export function FeedingAnimal({ id, happy }) {
  const colour = { dog: '#d69553', cat: '#efa958', cow: '#fff7e8', sheep: '#fff7e8', elephant: '#a3b6ce' }[id];
  return <svg viewBox="0 0 300 300" aria-hidden="true" focusable="false">
    <ellipse cx="150" cy="274" rx="100" ry="12" fill="#244b3533" />
    {id === 'dog' && <path className="feeding-tail" d="M210 235 Q270 185 250 157" fill="none" stroke="#aa6937" strokeWidth="25" strokeLinecap="round" />}
    {id === 'cat' && <path className="feeding-tail" d="M206 243 Q278 239 259 195 Q242 175 238 201" fill="none" stroke={colour} strokeWidth="20" strokeLinecap="round" />}
    <ellipse cx="150" cy="214" rx="69" ry="64" fill={colour} />
    {id === 'cow' && <ellipse cx="182" cy="210" rx="25" ry="32" fill="#5b5360" />}
    <ellipse cx="150" cy="226" rx="37" ry="43" fill="#ffffff55" />
    <ellipse cx="104" cy="264" rx="29" ry="17" fill={colour} /><ellipse cx="196" cy="264" rx="29" ry="17" fill={colour} />
    <g className={happy ? 'feeding-face is-munching' : 'feeding-face'}>
      {id === 'dog' && <><ellipse cx="82" cy="115" rx="29" ry="60" fill="#8c5634" transform="rotate(20 82 115)" /><ellipse cx="218" cy="115" rx="29" ry="60" fill="#8c5634" transform="rotate(-20 218 115)" /></>}
      {id === 'cat' && <><path d="M83 102 87 35 135 80M165 80 213 35 217 102" fill={colour} stroke={colour} strokeWidth="12" strokeLinejoin="round" /><path d="m96 77 1-20 20 22m66 0 20-22 1 20" stroke="#f3a4a0" strokeWidth="13" strokeLinejoin="round" /></>}
      {id === 'elephant' && <><ellipse cx="76" cy="125" rx="48" ry="65" fill={colour} /><ellipse cx="224" cy="125" rx="48" ry="65" fill={colour} /><ellipse cx="74" cy="126" rx="29" ry="44" fill="#d7adc0" /><ellipse cx="226" cy="126" rx="29" ry="44" fill="#d7adc0" /></>}
      {(id === 'cow' || id === 'sheep') && <><ellipse cx="76" cy="113" rx="33" ry="20" fill={colour} transform="rotate(25 76 113)" /><ellipse cx="224" cy="113" rx="33" ry="20" fill={colour} transform="rotate(-25 224 113)" /></>}
      {id === 'cow' && <><path d="M108 78 Q86 48 108 43M192 78 Q214 48 192 43" stroke="#e5c084" strokeWidth="14" strokeLinecap="round" fill="none" /></>}
      <ellipse cx="150" cy="126" rx="74" ry="69" fill={colour} />
      {id === 'cow' && <ellipse cx="119" cy="100" rx="24" ry="30" fill="#5b5360" />}
      {id === 'sheep' && <><ellipse cx="150" cy="140" rx="48" ry="54" fill="#877b80" />{[95,120,150,180,205].map((x,i)=><circle key={x} cx={x} cy={83-(i===2?12:0)} r="23" fill="#fff8ed" />)}</>}
      {happy ? <path d="M111 125q10-13 20 0m38 0q10-13 20 0" stroke="#303447" strokeWidth="6" strokeLinecap="round" fill="none" /> : <><ellipse cx="122" cy="124" rx="8" ry="11" fill="#303447" /><ellipse cx="178" cy="124" rx="8" ry="11" fill="#303447" /><circle cx="125" cy="120" r="3" fill="white" /><circle cx="181" cy="120" r="3" fill="white" /></>}
      {id === 'elephant' ? <path d="M150 144v42q0 30 25 22" fill="none" stroke={colour} strokeWidth="29" strokeLinecap="round" /> : <><ellipse cx="150" cy="157" rx={id==='cow'?44:31} ry="24" fill={id==='cow'?'#f1b2ad':'#ffe5c5'} /><path d="m143 149 7 6 7-6Z" fill="#503c40" /><path d={happy?'M136 163q14 22 28 0':'M138 163q12 10 24 0'} fill={happy?'#b5636a':'none'} stroke="#503c40" strokeWidth="3" strokeLinecap="round" /></>}
      {id === 'cat' && <path d="m99 153-25-5m25 15-27 3m129-13 25-5m-25 15 27 3" stroke="#9a674d" strokeWidth="3" strokeLinecap="round" />}
    </g>
  </svg>;
}

export function FeedingFood({ id }) {
  return <svg viewBox="0 0 120 100" aria-hidden="true" focusable="false">
    {id === 'dog' ? <path d="M32 32C12 9 0 41 22 50 0 63 17 91 34 68h52c17 23 34-5 12-18 22-9 10-41-10-18Z" fill="#fff2cf" stroke="#d5ac70" strokeWidth="4" strokeLinejoin="round" />
      : id === 'cat' ? <><path d="m30 50-22-24v48Z" fill="#43b9d6" /><ellipse cx="68" cy="50" rx="40" ry="26" fill="#71d9e7" /><path d="m57 27 14-14 10 16m-24 46 14 12 10-16" fill="#30a9cb" /><circle cx="91" cy="44" r="5" fill="#203e5a" /><path d="M56 33q-13 17 0 34" stroke="#36adc9" strokeWidth="4" fill="none" /></>
      : id === 'cow' ? <><path d="M31 85Q7 47 38 38l24 40q25-45 40-34-5 39-45 43Z" fill="#56a659" /><ellipse cx="61" cy="46" rx="22" ry="38" fill="#ffd34e" stroke="#e5ad28" strokeWidth="3" />{[27,40,53,66].map(y=><path key={y} d={`M44 ${y}h34`} stroke="#e8ad22" strokeWidth="3" />)}<path d="M60 12v64" stroke="#ffe9a4" strokeWidth="4" /></>
      : <><path d="M30 85Q54 52 89 17" stroke="#418f49" strokeWidth="7" fill="none" strokeLinecap="round" />{(id==='sheep'?[[40,65],[58,45],[77,26]]:[[38,67],[59,47],[79,27]]).map(([x,y])=><g key={x}><ellipse cx={x-10} cy={y-9} rx="11" ry={id==='sheep'?22:17} fill="#74bb50" transform={`rotate(-40 ${x-10} ${y-9})`} /><ellipse cx={x+12} cy={y+5} rx="11" ry="19" fill="#439e54" transform={`rotate(55 ${x+12} ${y+5})`} /></g>)}</>}
  </svg>;
}
