import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReadingBalloonBreak from './ReadingBalloonBreak';
import { missionBreakDue } from './missionBreakLogic';
import { speak, stopSpeech } from '../utils/speech';
import './MissionBalloonBreak.css';

export default function MissionBalloonBreak({ step, total, soundOn, resumePrompt }) {
  const [finished, setFinished] = useState(false);
  const anchor = useRef(null);
  const due = missionBreakDue(step, total, finished);
  useEffect(() => {
    if (!due) return undefined;
    const page = anchor.current.parentElement;
    const children = [...page.children].filter(element => element !== anchor.current && !element.matches('.local-back-button,.writing-back-space'));
    const previous = children.map(element => element.inert);
    children.forEach(element => { element.inert = true; });
    page.classList.add('mission-break-paused');
    stopSpeech();
    // A mission may already have scheduled its next spoken instruction.
    const timer = window.setTimeout(stopSpeech, 500);
    return () => {
      window.clearTimeout(timer);
      children.forEach((element, i) => { element.inert = previous[i]; });
      page.classList.remove('mission-break-paused');
    };
  }, [due]);
  return <><span ref={anchor} hidden />{due && <>
    {createPortal(<div className="mission-break-touch-shield" aria-hidden="true" />, document.body)}
    <ReadingBalloonBreak className="mission-balloon-break" label="Mission balloon break" resumeLabel="Lovely! Let’s keep going."
      onComplete={() => { setFinished(true); if (soundOn && resumePrompt) speak(resumePrompt); }} />
  </>}</>;
}
