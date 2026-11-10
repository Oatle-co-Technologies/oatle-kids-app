import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { canShareMedia, shareMedia, downloadMedia } from './mediaExport.js';
import './MediaSaveDialog.css';
export default function MediaSaveDialog({ file, onClose }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { if (file) dialog.current?.showModal(); }, [file]);
  if (!file) return null;
  const picture = file.type.startsWith('image/');
  const shareable = canShareMedia(file);
  async function share() {
    setBusy(true); setMessage('');
    try {
      const result = await shareMedia(file);
      if (result === 'shared') onClose();
    } catch { setMessage('The save options could not open. Please try again, or use Download file.'); }
    finally { setBusy(false); }
  }
  return createPortal(<dialog ref={dialog} className="media-save-dialog" aria-labelledby="media-save-title" onCancel={onClose}>
    <h2 id="media-save-title">{picture ? 'Your picture is ready' : 'Your music is ready'}</h2>
    <p>{picture ? 'Open your phone’s save options and choose Save Image or Save to Photos/Gallery, if offered.' : 'Open your phone’s save options to choose an app or a location for your music.'}</p>
    {!shareable && <p>This browser does not offer file sharing. Download the file, then move it to {picture ? 'Pictures or Photos' : 'Music'} using your phone’s file manager.</p>}
    <p className="media-save-note">Your phone controls the destinations available. Download file uses your browser’s download folder.</p>
    {shareable && <button type="button" className="media-save-primary" disabled={busy} onClick={share}>{busy ? 'Opening…' : picture ? 'Save or share picture' : 'Save or share audio'}</button>}
    <button type="button" disabled={busy} onClick={() => { downloadMedia(file); onClose(); }}>Download file{shareable ? ' instead' : ''}</button>
    <button type="button" disabled={busy} onClick={onClose}>Cancel</button>
    <p role="status">{message}</p>
  </dialog>, document.body);
}
