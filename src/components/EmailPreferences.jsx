import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export default function EmailPreferences() {
 const [value,setValue] = useState(false), [ready,setReady] = useState(false), [message,setMessage] = useState('Loading email preferences…');
 useEffect(() => { let active = true; supabase.from('email_preferences').select('opted_in').maybeSingle().then(({data,error}) => {
  if (!active) return;
  if (error) { setMessage('Email preferences are unavailable. Please try again later.'); return; }
  setValue(data?.opted_in === true); setReady(true); setMessage('Educational assessment reports are separate from marketing.');
 }); return () => { active = false; }; }, []);
 return <section aria-label="Email preferences"><h2>Email preferences</h2><label><input type="checkbox" checked={value} disabled={!ready} onChange={e => setValue(e.target.checked)} /> Send me optional Oatle Kids news, offers and subscription reminders by email.</label><p>{message}</p><button type="button" disabled={!ready} onClick={async () => {
  setReady(false);
  const {error} = await supabase.rpc('set_email_marketing', {p_opted_in:value});
  setMessage(error ? 'Could not save. Please try again.' : 'Email preferences saved.'); setReady(true);
 }}>Save email preferences</button></section>;
}
