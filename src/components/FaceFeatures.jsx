export function FaceEyes({ kind = 'bright' }) {
  if (kind === 'soft') return <g fill="none" stroke="#382c35" strokeWidth="4" strokeLinecap="round"><path d="M56 94q11 11 23 0M101 94q11 11 23 0" /></g>;
  return <g>
    {[67, 113].map(x => <g key={x}>
      {kind === 'wide' && <ellipse cx={x} cy="91" rx="12" ry="15" fill="#fffaf1" />}
      <ellipse cx={x} cy={kind === 'downcast' ? 96 : 92} rx={kind === 'narrow' ? 6 : 7} ry={kind === 'wide' ? 9 : kind === 'narrow' ? 4 : 8} fill="#382c35" />
      <circle cx={x - 2} cy={kind === 'downcast' ? 93 : 89} r="2" fill="#fff" />
      {kind === 'downcast' && <path d={`M${x - 11} 86q11 6 22 0`} stroke="#704b40" strokeWidth="3" fill="none" strokeLinecap="round" />}
    </g>)}
  </g>;
}

export function FaceBrows({ kind = 'relaxed' }) {
  const shapes = {
    relaxed: 'M56 75q11-5 23 0M101 75q11-5 23 0',
    raised: 'M55 65q12-13 25 0M100 65q12-13 25 0',
    worried: 'M55 78q12-3 24-13M101 65q12 10 24 13',
    frowning: 'M55 70l24 12M101 82l24-12',
  };
  return <path d={shapes[kind] || shapes.relaxed} fill="none" stroke="#49332f" strokeWidth="5" strokeLinecap="round" />;
}

export function FaceMouth({ kind = 'gentle' }) {
  if (kind === 'smile') return <path d="M66 121q24 39 48 0Z" fill="#fff9ee" stroke="#68424a" strokeWidth="3" strokeLinejoin="round" />;
  if (kind === 'open') return <ellipse cx="90" cy="130" rx="11" ry="16" fill="#67414a" stroke="#68424a" strokeWidth="3" />;
  const shapes = { frown: 'M71 134q19-24 38 0', gentle: 'M73 125q17 16 34 0', worry: 'M70 132q10-13 20-6t20 0' };
  return <path d={shapes[kind] || shapes.gentle} fill="none" stroke="#68424a" strokeWidth="4" strokeLinecap="round" />;
}

export function FacePartPreview({ part, value }) {
  const frame = part === 'eyes' ? '45 74 90 38' : part === 'brows' ? '43 48 94 44' : '53 110 74 46';
  return <svg viewBox={frame} aria-hidden="true">{part === 'eyes' ? <FaceEyes kind={value} /> : part === 'brows' ? <FaceBrows kind={value} /> : <FaceMouth kind={value} />}</svg>;
}
