import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import EmailPreferences from './EmailPreferences';
import WelcomeScreen from './WelcomeScreen';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { hasActiveEntitlement } from '../lib/accessPolicy';
import { legacyProgressSnapshot } from '../lib/profileStorage';
import { childProgressSync } from '../lib/childProgressSync';
import { acquirePlayWindow } from '../lib/playWindow';
import './ParentAccount.css';

const messages = {
  device_limit: 'Two devices are already registered. Remove an old device below before adding this one.',
  device_busy: 'This device is reconnecting to its previous play session. Please try again shortly.',
  device_open_here: 'Oatle Kids is open in another tab or window on this device. Close it to continue here.',
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
  const [authConnectionIssue, setAuthConnectionIssue] = useState(false);
  const [household, setHousehold] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [settingsChild, setSettingsChild] = useState(null);
  const [resumeChild, setResumeChild] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('Progress saved');
  const [nickname, setNickname] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('Family learning device');
  const [importOld, setImportOld] = useState(true);
  const [conflictChild, setConflictChild] = useState(null);
  const retryAuth = useRef(null);
  const sync = useRef(null);
  const activeRef = useRef(null);
  const playKey = useRef(null);
  const releasePlayWindow = useRef(null);
  const leaseEnd = useRef(0);
  const heartbeat = useRef(null);
  const endingPlay = useRef(false);
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
      if (turn !== generation.current) return;
      if (!hasActiveEntitlement(data, currentUser.id)) { setHousehold(null); return; }
      const overview = await rpc('household_overview');
      if (turn !== generation.current) return;
      setHousehold(overview);
      const selectionKey = `oatle-selected-child:${currentUser.id}`;
      const remembered = localStorage.getItem(selectionKey) || sessionStorage.getItem(selectionKey);
      const eligible = overview.profiles.slice(0, overview.limits.profiles);
      const child = eligible.find(profile => profile.id === remembered) || eligible[0];
      if (child) await chooseChild(child, currentUser, { automatic: true });
    } catch (error) { if (turn === generation.current) { setMessage(error.message); setHousehold({ unavailable: true }); } }
    finally { if (turn === generation.current) setReady(true); }
  }
  const loadForEffect = useEffectEvent(currentUser => { void loadAccount(currentUser); });
  function cancelAccountLoads() { generation.current++; }
  useEffect(() => {
    let live = true, identity, checking = false;
    const receive = currentUser => {
      if (!live || identity === (currentUser?.id || null)) return;
      identity = currentUser?.id || null;
      setAuthConnectionIssue(false);
      sync.current?.stop(); sync.current = null; activeRef.current = null; setActiveChild(null);
      releasePlayWindow.current?.(); releasePlayWindow.current = null;
      heartbeat.current = null; endingPlay.current = false;
      setResumeChild(null);
      playKey.current = null; setBusy(false); setMessage(''); setConflictChild(null); setSettingsChild(null);
      setUser(currentUser); loadForEffect(currentUser);
    };
    const retrySession = async () => {
      if (!live || identity !== undefined || checking) return;
      checking = true;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!live || identity !== undefined) return;
        if (isAuthRetryableFetchError(error)) setAuthConnectionIssue(true);
        else receive(data.session?.user || null);
      } catch {
        if (live && identity === undefined) setAuthConnectionIssue(true);
      } finally { checking = false; }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' && !session) void retrySession();
      else receive(session?.user || null);
    });
    window.addEventListener('online', retrySession);
    retryAuth.current = retrySession;
    return () => {
      live = false; cancelAccountLoads(); subscription.unsubscribe(); sync.current?.stop();
      releasePlayWindow.current?.(); releasePlayWindow.current = null;
      window.removeEventListener('online', retrySession);
      retryAuth.current = null;
    };
  }, []); // A token refresh must not remount or overwrite a child's active activity.
  useEffect(() => {
    const reload = () => { if (user && !activeRef.current) loadForEffect(user); };
    window.addEventListener('oatle-access-changed', reload);
    return () => window.removeEventListener('oatle-access-changed', reload);
  }, [user]);

  async function chooseChild(child, currentUser = user, { importing = false, useLatest = false, startInSettings = false, automatic = false } = {}) {
    setBusy(true);
    if (!automatic) setMessage('');
    setConflictChild(null);
    const turn = generation.current;
    let sessionOpened = false;
    let channel, key, releaseWindow;
    try {
      const deviceKey = storedId(localStorage, 'oatle-device-key');
      const tabKey = `oatle-play-key:${currentUser.id}`;
      const devicePlayKey = `oatle-device-play-key:${currentUser.id}:${deviceKey}`;
      releaseWindow = await acquirePlayWindow(navigator.locks, devicePlayKey);
      if (turn !== generation.current) return;
      if (releaseWindow === null) throw new Error('device_open_here');
      if (releaseWindow) {
        const existingTabKey = sessionStorage.getItem(tabKey);
        if (existingTabKey && !localStorage.getItem(devicePlayKey)) localStorage.setItem(devicePlayKey, existingTabKey);
        key = storedId(localStorage, devicePlayKey);
      } else {
        key = storedId(sessionStorage, tabKey);
      }
      const registered = await rpc('register_household_device', { p_device_key: deviceKey, p_label: deviceLabel });
      if (turn !== generation.current) return;
      if (registered.outcome !== 'registered') throw new Error(registered.outcome);
      const endpoint = releaseWindow ? 'resume_child_session' : 'start_child_session';
      const session = await rpc(endpoint, { p_device_key: deviceKey, p_child_id: child.id, p_play_key: key });
      if (turn !== generation.current) return;
      if (session.outcome !== 'started') throw new Error(session.outcome);
      sessionOpened = true;
      playKey.current = key;
      channel = childProgressSync(supabase, currentUser.id, child.id, key, setSyncMessage);
      sync.current = channel;
      const owner = localStorage.getItem('oatle-legacy-progress-owner');
      const oldData = importing && (!owner || owner === currentUser.id) ? legacyProgressSnapshot() : null;
      const importData = oldData && Object.keys(oldData).length ? oldData : undefined;
      channel.hydrate(session, { importData, useLatest });
      if (importData) localStorage.setItem('oatle-legacy-progress-owner', currentUser.id);
      leaseEnd.current = Date.now() + session.lease_seconds * 1000;
      await channel.flush();
      if (turn !== generation.current) return;
      localStorage.setItem(`oatle-selected-child:${currentUser.id}`, child.id);
      releasePlayWindow.current = releaseWindow;
      releaseWindow = undefined;
      setResumeChild(null); setMessage('');
      activeRef.current = child;
      setActiveChild({ ...child, startInSettings });
      setSettingsChild(null);
    } catch (error) {
      if (turn !== generation.current) return;
      channel?.stop(); sync.current = null;
      if (sessionOpened) await rpc('end_child_session', { p_play_key: key }).catch(() => {});
      if (turn !== generation.current) return;
      const waitingForDevice = error.message === 'device_busy' || error.message === 'device_open_here';
      setResumeChild(automatic && waitingForDevice ? child : null);
      if (error.message === 'progress_conflict') setConflictChild(child);
      setMessage(messages[error.message] || error.message);
    } finally {
      releaseWindow?.();
      if (turn === generation.current) setBusy(false);
    }
  }
  const retryPlay = useEffectEvent(() => {
    void chooseChild(resumeChild, user, { automatic: true });
  });
  useEffect(() => {
    if (!resumeChild || busy) return;
    const timer = setTimeout(() => retryPlay(), 4000);
    return () => clearTimeout(timer);
  }, [resumeChild, busy]);

  useEffect(() => {
    if (!activeChild || !user) return;
    let live = true, renewing = false;
    const pause = (text, retry = false) => {
      if (!live) return;
      sync.current?.stop(); sync.current = null;
      releasePlayWindow.current?.(); releasePlayWindow.current = null;
      activeRef.current = null; setActiveChild(null); setMessage(text);
      if (retry) setResumeChild(activeChild);
    };
    const renew = async () => {
      if (!live || renewing || endingPlay.current) return;
      renewing = true;
      try {
        await sync.current?.flush();
        if (!live || endingPlay.current) return;
        const request = rpc('start_child_session', { p_device_key: localStorage.getItem('oatle-device-key'), p_child_id: activeChild.id, p_play_key: playKey.current, p_heartbeat: true });
        heartbeat.current = request;
        const session = await request.finally(() => {
          if (heartbeat.current === request) heartbeat.current = null;
        });
        if (!live || endingPlay.current) return;
        if (session.outcome !== 'started') { pause(messages[session.outcome] || 'Your play session ended. Please choose a child again.'); return; }
        if (session.revision !== sync.current?.revision) { pause(messages.progress_conflict); return; }
        leaseEnd.current = Date.now() + session.lease_seconds * 1000;
      } catch {
        if (!endingPlay.current && Date.now() >= leaseEnd.current) pause('Reconnecting to your play session. Your progress is saved on this device.', true);
      } finally { renewing = false; }
    };
    const checkExpiry = setInterval(() => {
      if (!endingPlay.current && Date.now() >= leaseEnd.current) pause('Reconnecting to your play session. Your progress is saved on this device.', true);
    }, 1000);
    const timer = setInterval(() => { void renew(); }, 30000);
    const onOnline = () => { void renew(); };
    window.addEventListener('online', onOnline);
    return () => { live = false; clearInterval(timer); clearInterval(checkExpiry); window.removeEventListener('online', onOnline); };
  }, [activeChild, user]);

  async function showParent() {
    if (endingPlay.current) return;
    endingPlay.current = true;
    const turn = generation.current;
    const channel = sync.current;
    const key = playKey.current;
    setBusy(true);
    try {
      await heartbeat.current?.catch(() => {});
      if (turn !== generation.current) return;
      await channel?.flush();
      if (turn !== generation.current) return;
      await rpc('end_child_session', { p_play_key: key });
      if (turn !== generation.current) return;
      channel?.stop(); sync.current = null; activeRef.current = null;
      releasePlayWindow.current?.(); releasePlayWindow.current = null;
      sessionStorage.removeItem(`oatle-selected-child:${user.id}`);
      setSettingsChild(activeChild);
      setActiveChild(null);
      const overview = await rpc('household_overview');
      if (turn === generation.current) { setHousehold(overview); setMessage(''); }
    } catch {
      if (turn === generation.current) setMessage('Your progress is still waiting to sync. Reconnect before changing children.');
    } finally {
      if (turn === generation.current) {
        endingPlay.current = false;
        setBusy(false);
      }
    }
  }
  async function beforeSignOut() {
    await sync.current?.flush().catch(() => {});
    if (playKey.current) await rpc('end_child_session', { p_play_key: playKey.current }).catch(() => {});
    sessionStorage.removeItem(`oatle-selected-child:${user.id}`);
  }
  async function createChild(event) {
    const turn = generation.current;
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = await rpc('create_child_profile', { p_nickname: nickname.trim() });
      if (turn !== generation.current) return;
      if (result.outcome !== 'created') throw new Error(messages[result.outcome] || 'Please enter a nickname.');
      const firstChild = household.profiles.length === 0;
      const overview = await rpc('household_overview');
      if (turn !== generation.current) return;
      setHousehold(overview); setNickname('');
      await chooseChild(result.profile, user, { importing: firstChild && importOld });
    } catch (error) { if (turn === generation.current) setMessage(error.message); }
    finally { if (turn === generation.current) setBusy(false); }
  }
  if (authConnectionIssue) return <main className="parent-account"><div className="parent-card">
    <h1>Reconnect to restore your session</h1>
    <button onClick={() => retryAuth.current?.()}>Retry connection</button>
  </div></main>;
  if (!ready) return <WelcomeScreen />;
  if (!user || !household) return <AppComponent sessionUser={user} onAccessChanged={() => window.dispatchEvent(new Event('oatle-access-changed'))} />;
  if (resumeChild) return <main className="parent-account"><div className="parent-card">
    <img src="/oatle-kids-wordmark.webp" alt="Oatle Kids" width="190" />
    <h1>Resuming {resumeChild.nickname}’s activities</h1>
    <p role="status">{message} The app will retry automatically.</p>
    <button className="parent-secondary" type="button" disabled={busy} onClick={() => {
      setResumeChild(null);
      setMessage('');
    }}>Manage child profiles</button>
  </div></main>;
  if (activeChild) return <><AppComponent key={activeChild.id} sessionUser={user} onParentAccount={showParent} onBeforeSignOut={beforeSignOut} profileNickname={activeChild.nickname} startInSettings={activeChild.startInSettings} /><span className="parent-sync-status" role="status">{message || syncMessage}</span></>;
  const limits = household.limits;
  let canImport = false;
  try { canImport = !household.profiles?.length && (!localStorage.getItem('oatle-legacy-progress-owner') || localStorage.getItem('oatle-legacy-progress-owner') === user.id) && Object.keys(legacyProgressSnapshot()).length > 0; } catch { /* Optional import. */ }
  return <main className="parent-account"><div className="parent-card">
    {settingsChild && <div className="parent-back">
      <button className="parent-secondary" type="button" disabled={busy} onClick={() => chooseChild(settingsChild, user, { startInSettings: true })}>
        <span aria-hidden="true">← </span>Back to Settings
      </button>
    </div>}
    <img src="/oatle-kids-wordmark.webp" alt="Oatle Kids" width="190" />
    <h1>{household.profiles?.length === 0 ? 'Set up your child’s profile' : 'Child profiles'}</h1>
    {limits && <p>{limits.plan_id === 'family' ? 'Family · R200/month' : limits.promo ? 'Promo · Single Child access' : 'Single Child · R120/month'}<br />{limits.profiles === 1 ? '1 child profile · 1 child playing at a time' : 'Up to 3 child profiles · 2 children playing at once'} · 2 registered devices</p>}
    <p className="parent-message" role="status">{message}</p>
    {conflictChild && <button disabled={busy} onClick={() => chooseChild(conflictChild, user, { useLatest: true })}>Keep local backup and load latest progress</button>}
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
