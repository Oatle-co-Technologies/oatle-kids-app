import './AgeSelection.css';

const worlds = [
  { id: 'little', ages: 'Ages 2–3', title: 'Little Explorers', description: 'Play, build and discover', image: '/adventure-homes/builder.webp' },
  { id: 'big', ages: 'Ages 4–7', title: 'Big Explorers', description: 'Read, write, count and create', image: '/adventure-homes/reading.webp' },
];

export default function AgeSelection({ onSelect }) {
  return <main className="age-galaxy-home" aria-labelledby="age-home-title">
    <header className="age-home-header">
      <img className="age-home-brand" src="/oatle-kids-wordmark.webp" loading="eager" fetchPriority="high" alt="Oatle Kids" />
      <p className="age-home-eyebrow">LET’S EXPLORE</p>
      <h1 id="age-home-title">Choose your <em>Adventure</em></h1>
      <p>Pick your explorer’s age group to begin.</p>
    </header>
    <div className="age-home-worlds" role="group" aria-label="Choose a child age group">
      <div className="age-home-orbit" aria-hidden="true" />
      {worlds.map(world => <button key={world.id} className={`age-home-world age-home-${world.id}`} type="button"
        onClick={() => onSelect(world.id)} aria-label={`${world.ages}. ${world.title}. ${world.description}.`}>
        <img src={world.image} alt="" className="age-home-art" draggable="false" />
        <span className="age-home-label"><strong>{world.ages}</strong><span>{world.title}</span></span>
        <span className="age-home-description">{world.description}</span>
        <span className="age-home-enter" aria-hidden="true">Let’s go <span>→</span></span>
      </button>)}
    </div>
    <p className="age-home-note">We’ll remember your choice. Switch age groups anytime in Settings.</p>
  </main>;
}
