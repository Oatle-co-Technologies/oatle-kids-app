export default function AnimalHomeArtwork({ id }) {
  return <svg viewBox="0 0 240 220" aria-hidden="true" focusable="false">
    <ellipse cx="120" cy="197" rx="111" ry="17" fill="#487e4933" />
    {id === 'dog' ? <>
      <path d="M34 104 120 34l86 70v91H34Z" fill="#e5af72" /><path d="m23 107 97-82 97 82" fill="none" stroke="#b95749" strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M85 195v-54a35 35 0 0 1 70 0v54" fill="#573e36" /><path d="M48 124h27m90 0h27M48 151h24m96 0h24" stroke="#c98d55" strokeWidth="5" strokeLinecap="round" />
      <path d="M106 77c-9-9-15 4-5 8-10 6-2 17 5 8h28c7 9 15-2 5-8 10-4 4-17-5-8Z" fill="#fff0ce" />
    </> : id === 'cat' ? <>
      <path d="M63 160V87q57-93 114 0v73" fill="none" stroke="#bd8650" strokeWidth="12" /><ellipse cx="120" cy="158" rx="94" ry="39" fill="#805038" />
      <ellipse cx="120" cy="155" rx="79" ry="29" fill="#ddabc7" /><path d="M25 154h190l-20 39q-75 31-150 0Z" fill="#d99d5c" />
      <path d="M38 169h164M44 184h152M61 164v35m30-35v42m30-42v44m30-44v42m30-42v35" stroke="#b67d43" strokeWidth="4" /><path d="M103 145q17-17 34 0" stroke="#f7d6e8" strokeWidth="7" fill="none" />
    </> : id === 'cow' ? <>
      <path d="M7 184Q64 106 123 159q43-29 110 25v19H7Z" fill="#79b85c" /><path d="M19 138V84h26v54M32 85q-42-9-17-41 15-22 36-10 44 11 15 45Z" fill="#4f9b58" />
      <path d="M137 172v-63l38-33 39 33v63" fill="#ce6d4d" /><path d="m132 110 43-39 44 39" stroke="#f0ca8e" strokeWidth="8" strokeLinejoin="round" fill="none" /><path d="M160 171v-39h30v39" fill="#684b37" />
      <path d="M27 171h187m-187 18h187M40 154v48m40-48v48m40-48v48" stroke="#f4ddb0" strokeWidth="7" strokeLinecap="round" />
    </> : id === 'sheep' ? <>
      <path d="M3 178 61 57l59 121Z" fill="#90b796" /><path d="m41 98 20-41 20 41-20-9Z" fill="#e8f4db" />
      <path d="m81 179 68-142 77 142" fill="#72a58d" /><path d="m127 83 22-46 25 46-23-11Z" fill="#eef4df" /><path d="M4 184q52-72 112-21 56-51 120 21v20H4Z" fill="#82ba63" />
      <path d="M46 187q31-35 66-14 26-20 58-6" stroke="#d5dc91" strokeWidth="10" fill="none" strokeLinecap="round" />
    </> : id === 'horse' ? <>
      <path d="M29 92 120 28l91 64v105H29Z" fill="#dba46f" /><path d="m19 94 101-74 101 74" fill="none" stroke="#91624e" strokeWidth="15" strokeLinejoin="round" />
      <path d="M88 196v-91h64v91" fill="#684938" /><path d="M36 150h168M36 178h168" stroke="#f4d9aa" strokeWidth="7" /><path d="M49 123v73m142-73v73" stroke="#f4d9aa" strokeWidth="7" />
      <path d="M104 74V57q16-20 32 0v17q-16 20-32 0" fill="none" stroke="#fff1c7" strokeWidth="6" />
    </> : id === 'pig' ? <>
      <ellipse cx="120" cy="184" rx="104" ry="23" fill="#a77b65" /><path d="M39 169V94l68-49 68 49v75" fill="#e1b281" /><path d="m30 97 77-57 77 57" fill="none" stroke="#b77c58" strokeWidth="12" strokeLinejoin="round" /><path d="M77 169v-49q30-20 60 0v49" fill="#725342" />
      <path d="M25 172h190m-190 20h190M36 155v48m150-48v48m25-48v48" stroke="#ead0a5" strokeWidth="7" strokeLinecap="round" />
    </> : id === 'duck' ? <>
      <path d="M6 179q42-57 104-22 59-48 124 22v24H6Z" fill="#80b666" /><ellipse cx="120" cy="165" rx="99" ry="34" fill="#69c9d8" /><path d="M48 164q29 13 51 0m25 15q29 13 51 0m-31-28q22 10 43 0" stroke="#c0edf0" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M35 152V93m13 66v-54m159 47V89" stroke="#649d55" strokeWidth="5" /><path d="M35 95V75m13 30V85m159 4V69" stroke="#a57f4e" strokeWidth="9" strokeLinecap="round" />
    </> : id === 'chicken' ? <>
      <path d="M58 159v37m126-37v37" stroke="#966640" strokeWidth="10" /><path d="M37 92 120 35l83 57v72H37Z" fill="#e4b876" /><path d="m26 95 94-68 94 68" fill="none" stroke="#be7554" strokeWidth="14" strokeLinejoin="round" />
      <path d="M101 164v-53h43v53" fill="#71523b" /><path d="m104 164-23 36h56l7-36" fill="#c29464" stroke="#a37550" strokeWidth="3" /><path d="M93 180h46m-52 12h49" stroke="#f3d6a0" strokeWidth="5" />
      <path d="M57 112h27v27H57Z" fill="#88becb" stroke="#fff0cb" strokeWidth="5" /><ellipse cx="177" cy="152" rx="16" ry="6" fill="#b78a4e" /><ellipse cx="177" cy="144" rx="8" ry="11" fill="#fff3d6" />
    </> : <>
      <path d="M3 181q104-34 234 0v23H3Z" fill="#d3bd68" /><path d="m143 178 6-83 15 2 6 81" fill="#96633e" />
      <path d="M158 126 111 86m47 28 45-39" stroke="#96633e" strokeWidth="9" fill="none" /><path d="M57 80q-11-22 19-30 6-21 35-13 18-21 41-8 25-16 43 7 41-3 40 24 15 25-19 30H77Z" fill="#6c9e56" />
      <path d="m31 181 5-24m0 25 13-20m154 20 4-28m0 28 12-20" stroke="#a18c45" strokeWidth="5" strokeLinecap="round" />
    </>}
    <path d="m18 202 3-7m8 7 2-5m181 5 3-8" stroke="#559858" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
