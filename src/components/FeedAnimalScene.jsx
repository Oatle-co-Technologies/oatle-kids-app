import { useRef, useState } from 'react';
import { FeedingAnimal, FeedingFood } from './FeedingArtwork';
import { feedingChoices } from './feedingChoices';
import './FeedAnimalScene.css';

export default function FeedAnimalScene({ animal, fed, onFood }) {
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(null);
  const dragging = useRef(null);
  const suppressClick = useRef(false);
  const target = useRef(null);
  const choices = feedingChoices(animal.id);
  function start(food, event) {
    if (fed) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    suppressClick.current = false;
    dragging.current = { food, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false };
  }
  function move(event) {
    const current = dragging.current;
    if (!current || current.pointer !== event.pointerId) return;
    const moved = current.moved || Math.hypot(event.clientX-current.startX, event.clientY-current.startY) > 8;
    dragging.current = { ...current, moved, x: event.clientX, y: event.clientY };
    if (moved) { event.preventDefault(); setDrag(dragging.current); }
  }
  function finish(event) {
    const current = dragging.current;
    if (!current || current.pointer !== event.pointerId) return;
    dragging.current = null; setDrag(null);
    if (!current.moved) return;
    suppressClick.current = true;
    const box = target.current?.getBoundingClientRect();
    if (box && event.clientX >= box.left-24 && event.clientX <= box.right+24 && event.clientY >= box.top-24 && event.clientY <= box.bottom+24) {
      setSelected(null); onFood(current.food.food);
    }
  }
  function cancel() { dragging.current = null; setDrag(null); }
  return <section className={`feeding-meadow ${fed ? 'has-eaten' : ''}`} aria-label="Feed the animal">
    <div className="feeding-cloud feeding-cloud-one" aria-hidden="true" /><div className="feeding-cloud feeding-cloud-two" aria-hidden="true" />
    <p className="feeding-instruction">{fed ? `Yum! Thank you!` : `Feed the ${animal.name.toLowerCase()}.`}</p>
    <button className={`feeding-animal-target ${drag ? 'is-ready' : ''}`} ref={target} type="button"
      aria-label={`Feed ${animal.name}`} disabled={fed} onClick={() => { if (selected) { onFood(selected.food); setSelected(null); } }}>
      <FeedingAnimal id={animal.id} happy={fed} />
      <span className="feeding-bowl" aria-hidden="true">{fed && <span className="feeding-eaten-food"><FeedingFood id={animal.id} /></span>}</span>
      {fed && <span className="feeding-hearts" aria-hidden="true">♥ ✦ ♥</span>}
    </button>
    <div className="feeding-basket" role="group" aria-label="Food basket">
      <div className="feeding-basket-handle" aria-hidden="true" />
      <div className="feeding-foods">{choices.map(food => <button key={food.id} type="button" className={`feeding-food ${drag?.food.id === food.id ? 'is-lifted' : ''}`}
        disabled={fed} aria-label={`Pick up ${food.foodName}`} aria-pressed={selected?.id===food.id}
        onPointerDown={event => start(food,event)} onPointerMove={move} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={cancel}
        onDragStart={event => event.preventDefault()} onClick={() => { if (suppressClick.current) { suppressClick.current=false; return; } setSelected(food); }}>
        <FeedingFood id={food.id} />
      </button>)}</div>
      <div className="feeding-basket-front" aria-hidden="true" />
    </div>
    <p className="feeding-hint">{fed ? 'A happy, full tummy!' : selected ? 'Now tap the animal.' : 'Drag food to the animal. Or tap food, then the animal.'}</p>
    {drag && <div className="feeding-food-ghost" style={{left:drag.x,top:drag.y}} aria-hidden="true"><FeedingFood id={drag.food.id} /></div>}
  </section>;
}
