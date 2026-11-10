import { FaceEyes, FaceBrows, FaceMouth } from './FaceFeatures';
import { FEELING_FEATURES } from './faceBuilderData';

const SKIN = ['#b8754f', '#edbd96', '#895039', '#d69a6c'];
const SHIRTS = ['#a495e0', '#edaa77', '#75c8bb', '#e79bb6'];

// Large rounded heads, soft cheeks, short necks and small T-shirts make these
// children rather than adult portraits. All expressions share the same parts.
export function FeelingsFace({ feeling = 'calm', features, variant = 0, decorative = false }) {
  const index = ((variant % 4) + 4) % 4;
  const skin = SKIN[index];
  const parts = features || FEELING_FEATURES[feeling] || FEELING_FEATURES.calm;
  const hair = index === 1 ? '#6d4631' : '#30262b';
  return <svg width="180" height="210" viewBox="0 0 180 210" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : features ? 'Child with your chosen expression' : `Child showing a ${feeling} expression`}>
    {(index === 0 || index === 2) && <g fill={hair}><circle cx="29" cy="52" r="23" /><circle cx="151" cy="52" r="23" /></g>}
    <path d="M37 210v-20q0-28 53-28t53 28v20" fill={SHIRTS[index]} />
    <path d="M80 148v20q10 12 20 0v-20" fill={skin} />
    <path d="M73 166q17 16 34 0" fill="none" stroke="#ffffffaa" strokeWidth="5" strokeLinecap="round" />
    <path d="m88 191 3-6 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5Z" fill="#fff3b9" opacity=".85" />
    <ellipse cx="26" cy="103" rx="10" ry="14" fill={skin} /><ellipse cx="154" cy="103" rx="10" ry="14" fill={skin} />
    <ellipse cx="90" cy="96" rx="65" ry="65" fill={skin} />
    <path d={index === 1 ? 'M25 88Q12 35 69 29Q82 7 104 28Q168 25 155 89L137 60Q101 74 65 50L44 84Z' : 'M25 86Q14 23 88 24Q165 17 155 87L136 63Q97 76 55 54L43 85Z'} fill={hair} />
    {index === 3 && <g fill={hair}>{[36, 54, 73, 93, 113, 132, 148].map((x, i) => <circle key={x} cx={x} cy={42 - Math.sin(i / 6 * Math.PI) * 10} r="16" />)}</g>}
    {index === 0 && <g fill="#83d9c7"><path d="m25 57-13-10v20Zm2 0 13-10v20Z" /><path d="m153 57-13-10v20Zm2 0 13-10v20Z" /></g>}
    {index === 2 && <g stroke="#f4d47b" strokeWidth="5" strokeLinecap="round"><path d="m43 62 9 8m78-8 9-8" /></g>}
    <ellipse cx="48" cy="116" rx="11" ry="7" fill="#e9958b" opacity=".45" /><ellipse cx="132" cy="116" rx="11" ry="7" fill="#e9958b" opacity=".45" />
    <path d="M87 107q3 6 7 0" fill="none" stroke="#875742" strokeWidth="2.5" strokeLinecap="round" opacity=".65" />
    <FaceEyes kind={parts.eyes} /><FaceBrows kind={parts.brows} /><FaceMouth kind={parts.mouth} />
  </svg>;
}
