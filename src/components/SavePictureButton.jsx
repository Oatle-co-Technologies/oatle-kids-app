import { useEffect, useRef, useState } from 'react';
import { saveDrawing } from './saveDrawing';
import './SavePictureButton.css';
import MediaSaveDialog from './MediaSaveDialog';

export default function SavePictureButton({ canvasRef, filename }) {
  const [preparedFile, setPreparedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 7000);
    return () => window.clearTimeout(timer);
  }, [message]);
  async function save() {
    if (pending.current) return;
    pending.current = true; setSaving(true); setMessage('');
    try {
      const file = await saveDrawing(canvasRef.current, filename);
      if (mounted.current) setPreparedFile(file);
      if (mounted.current) setMessage('Your picture is ready. Choose how to save it.');
    } catch {
      if (mounted.current) setMessage('Your picture could not be saved. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return <div className="drawing-save-control">
    <MediaSaveDialog file={preparedFile} onClose={() => setPreparedFile(null)} />
    <button type="button" className="drawing-save-button" disabled={saving} onClick={save}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span>{saving ? 'Saving…' : 'Save picture'}</span>
    </button>
    {message && <p className="drawing-save-message" role="status">{message}</p>}
  </div>;
}
