import { createPortal } from 'react-dom';
import './WritingBackButton.css';

// Escape the paper/canvas stacking contexts so Back remains visible and tappable.
export default function WritingBackButton({ onBack }) {
  return <>
    <span className="writing-back-space" aria-hidden="true" />
    {createPortal(<button type="button" className="writing-activity-back" aria-label="Back to Writing map" onClick={onBack}>
      <span aria-hidden="true">←</span> Back
    </button>, document.body)}
  </>;
}
