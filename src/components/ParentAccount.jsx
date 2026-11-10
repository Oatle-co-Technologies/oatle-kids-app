import EmailPreferences from './EmailPreferences';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { hasActiveEntitlement } from '../lib/accessPolicy';
import { legacyProgressSnapshot } from '../lib/profileStorage';
import { childProgressSync } from '../lib/childProgressSync';
import './ParentAccount.css';

const messages = {
  device_limit: 'Two devices are already registered. Remove an old device below before adding this one.',
  device_busy: 'This device already has a play session open. Close the other activity, then wait up to 90 seconds and try again.',
  child_busy: 'This child is playing on another device. Finish there first, then try again.',
  play_limit: 'Your plan’s play limit has been reached. Finish on the other device before starting here.',
  profile_limit: 'Your plan does not include another child profile. Your existing profiles and progress are safe.',
  device_required: 'This device was removed. Register it again to continue.',
  progress_conflict: 'A newer version of this child’s progress was saved elsewhere. Your local copy has been kept. Load the latest saved progress to continue.',
  session_required: 'Your play session ended. Choose the child again to continue.',
  sign_in_required: 'Please sign in again to continue.',
};
function storedId(store, key) {
  let id = store.getItem(key);
  if (!id) { id = crypto.randomUUID(); store.setItem(key, id); }
  return id;
}
function HouseholdAccount({ AppComponent }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [household, setHousehold] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('Progress saved');
  const [nickname, setNickname] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('Family learning device');
  const [importOld, setImportOld] = useState(true);
  const [conflictChild, setConflictChild] = useState(null);
  const sync = useRef(null);
  const activeRef = useRef(null);
  const playKey = useRef(null);
  const leaseEnd = useRef(0);
  const generation = useRef(0);

  async function rpc(name, args = {}) {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw new Error('Could not connect to your parent account. Please check your connection and retry.');
    return data;
  }
  async function loadAccount(currentUser) {
    const turn = ++generation.current;
    setReady(false);
    try {
      if (!currentUser) { setHousehold(null); return; }
      const { data, error } = await supabase.from('entitlements').select('user_id,status,expires_at').eq('user_id', currentUser.id).maybeSingle();
      if (error) throw new Error('Could not check your access. Please retry.');
      if (!hasActiveEntitlement(data, currentUser.id)) { setHousehold(null); return; }
      const overview = await rpc('household_overview');
      if (turn !== generation.current) return;
      setHousehold(overview);
      const remembered = sessionStorage.getItem(`oatle-selected-child:${currentUser.id}`);
      const child = overview.profiles.slice(0, overview.limits.profiles).find(p => p.id === remembered);
      if (child) await chooseChild(child, currentUser, false, false);
    } catch (error) { if (turn === generation.current) { setMessage(error.message); setHousehold({ unavailable: true }); } }
    finally { if (turn === generation.current) setReady(true); }
  }
  const loadForEffect = useEffectEvent(currentUser => { void loadAccount(currentUser); });
  function cancelAccountLoads() { generation.current++; }
  useEffect(() => {
    let live = true, identity;
    const receive = currentUser => {
      if (!live || identity === (currentUser?.id || null)) return;
      identity = currentUser?.id || null;
      sync.current?.stop(); sync.current = null; activeRef.current = null; setActiveChild(null);
      setUser(currentUser); loadForEffect(currentUser);
    };
    void supabase.auth.getSession().then(({ data }) => receive(data.session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => receive(session?.user || null));
    return () => { live = false; cancelAccountLoads(); subscription.unsubscribe(); sync.current?.stop(); };
  }, []); // A token refresh must not remount or overwrite a child's active activity.
  useEffect(() => {
    const reload = () => { if (user && !activeRef.current) loadForEffect(user); };
    window.addEventListener('oatle-access-changed', reload);
    return () => window.removeEventListener('oatle-access-changed', reload);
  }, [user]);

  async function chooseChild(child, currentUser = user, importing = false, useLatest = false) {
    setBusy(true); setMessage(''); setConflictChild(null);
    let sessionOpened = false;
    try {
      const deviceKey = storedId(localStorage, 'oatle-device-key');
      playKey.current = storedId(sessionStorage, `oatle-play-key:${currentUser.id}`);
      const registered = await rpc('register_household_device', { p_device_key: deviceKey, p_label: deviceLabel });
      if (registered.outcome !== 'registered') throw new Error(registered.outcome);
      const session = await rpc('start_child_session', { p_device_key: deviceKey, p_child_id: child.id, p_play_key: playKey.current });
      if (session.outcome !== 'started') throw new Error(session.outcome);
      sessionOpened = true;
      const channel = childProgressSync(supabase, currentUser.id, child.id, playKey.current, setSyncMessage);
      sync.current = channel;
      const owner = localStorage.getItem('oatle-legacy-progress-owner');
      const oldData = importing && (!owner || owner === currentUser.id) ? legacyProgressSnapshot() : null;
      const importData = oldData && Object.keys(oldData).length ? oldData : undefined;
      channel.hydrate(session, { importData, useLatest });
      if (importData) localStorage.setItem('oatle-legacy-progress-owner', currentUser.id);
      leaseEnd.current = Date.now() + session.lease_seconds * 1000;
      await channel.flush();
      sessionStorage.setItem(`oatle-selected-child:${currentUser.id}`, child.id);
      activeRef.current = child; setActiveChild(child);
    } catch (error) {
      sync.current?.stop(); sync.current = null;
      if (sessionOpened) await rpc('end_child_session', { p_play_key: playKey.current }).catch(() => {});
      if (error.message === 'progress_conflict') setConflictChild(child);
      setMessage(messages[error.message] || error.message);
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (!activeChild || !user) return;
    let live = true, renewing = false;
    const pause = text => {
      if (!live) return;
      sync.current?.stop(); sync.current = null;
      activeRef.current = null; setActiveChild(null); setMessage(text);
    };
    const renew = async () => {
      if (!live || renewing) return;
      renewing = true;
      try {
        await sync.current?.flush();
        const session = await rpc('start_child_session', { p_device_key: localStorage.getItem('oatle-device-key'), p_child_id: activeChild.id, p_play_key: playKey.current, p_heartbeat: true });
        if (!live) return;
        if (session.outcome !== 'started') { pause(messages[session.outcome] || 'Your play session ended. Please choose a child again.'); return; }
        if (session.revision !== sync.current?.revision) { pause(messages.progress_conflict); return; }
        leaseEnd.current = Date.now() + session.lease_seconds * 1000;
      } catch {
        if (Date.now() >= leaseEnd.current) pause('Reconnect to check your play session. Your progress is saved on this device.');
      } finally { renewing = false; }
    };
    const checkExpiry = setInterval(() => {
      if (Date.now() >= leaseEnd.current) pause('Reconnect to check your play session. Your progress is saved on this device.');
    }, 1000);
    const timer = setInterval(() => { void renew(); }, 30000);
    const onOnline = () => { void renew(); };
    window.addEventListener('online', onOnline);
    return () => { live = false; clearInterval(timer); clearInterval(checkExpiry); window.removeEventListener('online', onOnline); };
  }, [activeChild, user]);

  async function showParent() {
    setBusy(true);
    try {
      await sync.current?.flush();
      await rpc('end_child_session', { p_play_key: playKey.current });
      sync.current?.stop(); sync.current = null; activeRef.current = null;
      sessionStorage.removeItem(`oatle-selected-child:${user.id}`);
      setActiveChild(null); setHousehold(await rpc('household_overview')); setMessage('');
    } catch { setMessage('Your progress is still waiting to sync. Reconnect before changing children.'); }
    finally { setBusy(false); }
  }
  async function beforeSignOut() {
    await sync.current?.flush();
    if (playKey.current) await rpc('end_child_session', { p_play_key: playKey.current });
    sessionStorage.removeItem(`oatle-selected-child:${user.id}`);
  }
  async function createChild(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = await rpc('create_child_profile', { p_nickname: nickname.trim() });
      if (result.outcome !== 'created') throw new Error(messages[result.outcome] || 'Please enter a nickname.');
      const firstChild = household.profiles.length === 0;
      setHousehold(await rpc('household_overview')); setNickname('');
      await chooseChild(result.profile, user, firstChild && importOld);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  if (!ready) return <main className="parent-account"><h1>Getting your family ready…</h1></main>;
  if (!user || !household) return <AppComponent onAccessChanged={() => window.dispatchEvent(new Event('oatle-access-changed'))} />;
  if (activeChild) return <><AppComponent key={activeChild.id} onParentAccount={showParent} onBeforeSignOut={beforeSignOut} profileNickname={activeChild.nickname} /><span className="parent-sync-status" role="status">{message || syncMessage}</span></>;
  const limits = household.limits;
  let canImport = false;
  try { canImport = !household.profiles?.length && (!localStorage.getItem('oatle-legacy-progress-owner') || localStorage.getItem('oatle-legacy-progress-owner') === user.id) && Object.keys(legacyProgressSnapshot()).length > 0; } catch { /* Optional import. */ }
  return <main className="parent-account"><div className="parent-card">
    <img src="/oatle-kids-wordmark.webp" alt="Oatle Kids" width="190" />
    <h1>Who’s ready to explore?</h1>
    {limits && <p>{limits.plan_id === 'family' ? 'Family · R200/month' : limits.promo ? 'Promo · Single Child access' : 'Single Child · R120/month'}<br />{limits.profiles === 1 ? '1 child profile · 1 child playing at a time' : 'Up to 3 child profiles · 2 children playing at once'} · 2 registered devices</p>}
    <p className="parent-message" role="status">{message}</p>
    {conflictChild && <button disabled={busy} onClick={() => chooseChild(conflictChild, user, false, true)}>Keep local backup and load latest progress</button>}
    {household.unavailable ? <button onClick={() => loadAccount(user)}>Retry connection</button> : <>
      <EmailPreferences />
      <div className="parent-children">{household.profiles.map((child, index) => <button key={child.id} disabled={busy || index >= limits.profiles} onClick={() => chooseChild(child)}><span aria-hidden="true">★</span>{child.nickname}{index >= limits.profiles && <small>Saved · Family plan needed</small>}</button>)}</div>
      {household.profiles.length < limits.profiles && <form onSubmit={createChild}>
        <label>Child’s nickname<input value={nickname} onChange={e => setNickname(e.target.value)} maxLength={30} required autoComplete="off" /></label>
        {canImport && <label className="parent-check"><input type="checkbox" checked={importOld} onChange={e => setImportOld(e.target.checked)} />Keep this device’s existing progress for this child</label>}
        <button disabled={busy || !nickname.trim()}>{busy ? 'Getting ready…' : 'Add child and play'}</button>
      </form>}
      <details><summary>Manage your two devices</summary><p>A browser or installed app counts as a device. Removing one ends its play session. Its saved progress stays safe.</p>
        {household.devices.map(device => <div className="parent-device" key={device.id}><span>{device.label}</span><button disabled={busy} onClick={async () => { setBusy(true); try { await rpc('remove_household_device', {p_device_id:device.id}); setHousehold(await rpc('household_overview')); setMessage('Device removed. You can now use another device.'); } catch(error) {setMessage(error.message);} finally {setBusy(false);} }}>Remove device</button></div>)}
        <label>Name this device<input maxLength={60} value={deviceLabel} onChange={e => setDeviceLabel(e.target.value)} /></label>
      </details>
      <p>For a plan change, <a href="mailto:info@oatle-technologies.co.za">contact us</a> so we can avoid duplicate subscriptions. Promo codes include Single Child access only.</p>
    </>}
    <button className="parent-secondary" disabled={busy} onClick={async () => { await supabase.auth.signOut({ scope: 'local' }); }}>Log out of this device</button>
  </div></main>;
}

// Password recovery remains reachable before the child/profile gate.
export default function ParentAccount({ AppComponent }) {
  const [recovery, setRecovery] = useState(() => new URLSearchParams(location.search).get('reset') === '1' || new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery');
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => subscription.unsubscribe();
  }, []);
  return recovery ? <AppComponent onRecoveryDone={() => setRecovery(false)} /> : <HouseholdAccount AppComponent={AppComponent} />;
}
