import { useEffect, useRef, useState } from 'react';
import { FeedingAnimal } from './FeedingArtwork';
import AnimalHomeArtwork from './AnimalHomeArtwork';
import { feedingChoices } from './feedingChoices';
import './AnimalHomesScene.css';

export default function AnimalHomesScene({ animal, matched, onHome }) {
  const [selected, setSelected] = useState(false);
  const [drag, setDrag] = useState(null);
  const [visit, setVisit] = useState(null);
  const pointer = useRef(null);
  const suppressClick = useRef(false);
  const animalRef = useRef(null);
  const homes = useRef({});
  const choices = feedingChoices(animal.id);
  useEffect(() => {
    if (!visit || visit.correct) return undefined;
    const timer = window.setTimeout(() => setVisit(null), 1250);
    return () => window.clearTimeout(timer);
  }, [visit]);
  function tryHome(home) {
    if (visit || matched) return;
    const from = animalRef.current?.getBoundingClientRect();
    const to = homes.current[home.id]?.getBoundingClientRect();
    if (!from || !to) return;
    setSelected(false);
    setVisit({ id: home.id, correct: home.id === animal.id,
      x: to.left + to.width/2 - from.left - from.width/2,
      y: to.top + to.height*.67 - from.top - from.height*.6 });
    onHome(home.home);
  }
  function start(event) {
    if (visit || matched) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    suppressClick.current=false;
    pointer.current={id:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};
  }
  function move(event) {
    const current=pointer.current;
    if (!current || current.id!==event.pointerId) return;
    current.moved ||= Math.hypot(event.clientX-current.startX,event.clientY-current.startY)>8;
    if (current.moved) { event.preventDefault();setDrag({x:event.clientX,y:event.clientY}); }
  }
  function finish(event) {
    const current=pointer.current;
    if (!current || current.id!==event.pointerId) return;
    pointer.current=null;setDrag(null);
    if (!current.moved) return;
    suppressClick.current=true;
    const home=choices.find(choice=>{
      const rect=homes.current[choice.id]?.getBoundingClientRect();
      return rect && event.clientX>=rect.left-14 && event.clientX<=rect.right+14 && event.clientY>=rect.top-20 && event.clientY<=rect.bottom+20;
    });
    if (home) tryHome(home);
  }
  function cancel() {pointer.current=null;setDrag(null);}
  return <section className="animal-homes-meadow" aria-label="Find the animal’s home">
    <p className="homes-scene-instruction">{matched ? 'Home sweet home!' : `Where does the ${animal.name.toLowerCase()} live?`}</p>
    <div className="homes-scenery" role="group" aria-label="Animal homes">{choices.map(home=><button key={home.id} type="button" className={`homes-scenery-home ${visit?.id===home.id ? 'is-visiting' : ''}`}
      ref={node=>{homes.current[home.id]=node;}} aria-label={`Take ${animal.name} to the ${home.homeName}`} disabled={Boolean(visit)||matched}
      onClick={()=>{if(selected)tryHome(home);}}>
      <AnimalHomeArtwork id={home.id} />
      {matched && home.id===animal.id && <span className="homes-arrived-animal" aria-hidden="true"><FeedingAnimal id={animal.id} happy /></span>}
      <span className="homes-place-name">{home.homeName}</span>
    </button>)}</div>
    <button ref={animalRef} type="button" className={`homes-waiting-animal ${drag?'is-lifted':''} ${visit ? visit.correct?'is-entering':'is-exploring' : ''}`}
      style={visit?{'--home-x':`${visit.x}px`,'--home-y':`${visit.y}px`}:undefined}
      disabled={Boolean(visit)||matched} aria-label={`Pick up ${animal.name}`} aria-pressed={selected}
      onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
      onDragStart={event=>event.preventDefault()} onClick={()=>{if(suppressClick.current){suppressClick.current=false;return;}setSelected(true);}}>
      <FeedingAnimal id={animal.id} happy={matched} />
    </button>
    <p className="homes-scene-hint">{matched ? 'Your animal is cosy at home.' : visit ? 'Let’s have a look…' : selected ? 'Now tap a home.' : 'Drag the animal to a home. Or tap the animal, then a home.'}</p>
    {drag && <div className="homes-animal-ghost" aria-hidden="true" style={{left:drag.x,top:drag.y}}><FeedingAnimal id={animal.id} /></div>}
  </section>;
}
