import { expect, test } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const user = {
  id: 'a1234567-1234-4123-8123-123456789012',
  email: 'parent@example.invalid',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
};
const tokenKey = 'sb-127-auth-token';
const session = {
  user,
  access_token: 'test-access',
  refresh_token: 'test-refresh',
  token_type: 'bearer',
  expires_in: 3600,
};
const children = [{ id: 'first', nickname: 'Explorer' }, { id: 'second', nickname: 'Navigator' }];

function household(plan = 'family') {
  const profiles = plan === 'family' ? children : children.slice(0, 1);
  const cloud = new Map(profiles.map(child => [child.id, { revision: 0, data: { 'oatle-age-group': 'big' } }]));
  const devices = new Set();
  const leases = new Map();
  const state = { cloud, devices, leases, refreshes: 0, saveUnavailable: false };
  state.install = async (context, { access = true, seed = true } = {}) => {
    if (seed) await context.addInitScript(({ session, tokenKey }) => {
      if (!localStorage.getItem(tokenKey) && !localStorage.getItem('test-seeded')) {
        localStorage.setItem('test-seeded', 'yes');
        localStorage.setItem(tokenKey, JSON.stringify({ ...session, expires_at: Math.floor(Date.now() / 1000) + 3600 }));
      }
    }, { session, tokenKey });
    await context.route('**/test-supabase/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const endpoint = url.pathname.split('/').at(-1);
      const body = request.postDataJSON() || {};
      let data = {};
      let status = 200;
      if (endpoint === 'token' && url.searchParams.get('grant_type') === 'refresh_token') {
        state.refreshes++;
        if (state.refreshRejected) {
          status = 400;
          data = { code: 'refresh_token_not_found', msg: 'Invalid refresh token' };
        } else {
          data = { ...session, access_token: 'refreshed-access', refresh_token: 'rotated-refresh' };
        }
      } else if (endpoint === 'token' && url.searchParams.get('grant_type') === 'password') {
        data = session;
      } else if (endpoint === 'entitlements') {
        data = access ? { user_id: user.id, status: 'active', expires_at: null } : null;
      } else if (endpoint === 'household_overview') {
        data = { limits: { plan_id: plan, profiles: plan === 'family' ? 3 : 1 }, profiles, devices: [] };
      } else if (endpoint === 'register_household_device') {
        devices.add(body.p_device_key);
        data = { outcome: 'registered' };
      } else if (endpoint === 'start_child_session' || endpoint === 'resume_child_session') {
        await state.beforeStart?.(body);
        const current = leases.get(body.p_device_key);
        const canResume = endpoint === 'resume_child_session' && current?.childId === body.p_child_id;
        if (state.enforceDeviceLease && current && !canResume && (current.playKey !== body.p_play_key || current.childId !== body.p_child_id)) {
          data = { outcome: 'device_busy' };
        } else {
          leases.set(body.p_device_key, { playKey: body.p_play_key, childId: body.p_child_id });
          data = { outcome: 'started', ...cloud.get(body.p_child_id), lease_seconds: 90 };
        }
      } else if (endpoint === 'save_child_progress') {
        const { revision } = cloud.get(body.p_child_id);
        if (state.saveUnavailable) {
          status = 503;
          data = { message: 'Connection unavailable' };
        } else if (revision !== body.p_revision) {
          data = { outcome: 'conflict' };
        } else {
          cloud.set(body.p_child_id, { revision: revision + 1, data: body.p_data });
          data = { outcome: 'saved', revision: revision + 1 };
        }
      } else if (endpoint === 'end_child_session') {
        for (const [device, lease] of leases) if (lease.playKey === body.p_play_key) leases.delete(device);
        data = { outcome: 'ended' };
      }
      await route.fulfill({ status, json: data });
    });
    await context.route(/https?:\/\/(?!127\.0\.0\.1:4178)/, route => route.abort());
  };
  return state;
}

test('a returning parent sees the welcome screen from first paint through child session restore', async ({ context, page }) => {
  const server = household('single');
  await server.install(context);
  let loadApp;
  const appModule = new Promise(resolve => { loadApp = resolve; });
  let finishRestore;
  const childSession = new Promise(resolve => { finishRestore = resolve; });
  let restoreStarted;
  const restoring = new Promise(resolve => { restoreStarted = resolve; });
  server.beforeStart = () => {
    restoreStarted();
    return childSession;
  };

  await page.route('**/src/main.jsx', async route => {
    await appModule;
    await route.continue();
  });
  await page.addInitScript(() => {
    window.loginScreenAppeared = false;
    new MutationObserver(() => {
      if (document.querySelector('.login-card input[type="password"]')) window.loginScreenAppeared = true;
    }).observe(document, { childList: true, subtree: true });
  });

  try {
    await page.goto('/app.html?auth=login', { waitUntil: 'commit' });
    const welcome = page.getByRole('heading', { name: 'Welcome to Oatle Kids' });
    await expect(welcome).toBeVisible();
    await expect(page.getByText('Your multiverse is loading…')).toBeVisible();
    loadApp();

    await restoring;
    await expect(welcome).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveCount(0);
    finishRestore();

    await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
    await expect(welcome).toHaveCount(0);
    expect(await page.evaluate(() => window.loginScreenAppeared)).toBe(false);
  } finally {
    loadApp();
    finishRestore();
  }
});

test('a reopened window reuses its device lease while an already open window keeps exclusive play', async ({ context, page }) => {
  const server = household('single');
  server.enforceDeviceLease = true;
  await server.install(context);
  await page.goto('/app.html');
  await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
  const [deviceKey, originalLease] = [...server.leases][0];

  const reopened = await context.newPage();
  await reopened.goto('/app.html');
  await expect(reopened.getByText(/Oatle Kids is open in another tab or window/)).toBeVisible();
  await expect(reopened.getByRole('heading', { name: 'Child profiles' })).toHaveCount(0);
  await page.close();

  await expect(reopened.getByRole('button', { name: /Reading Adventure/ })).toBeVisible({ timeout: 10000 });
  expect(server.leases.get(deviceKey)).toEqual(originalLease);
  expect(server.devices.size).toBe(1);
});

test('a signed-in parent reclaims an older same-device lease on the first attempt', async ({ context, page }) => {
  const server = household('single');
  server.enforceDeviceLease = true;
  await server.install(context);
  await context.addInitScript(() => localStorage.setItem('oatle-device-key', 'existing-device'));
  server.leases.set('existing-device', { playKey: 'closed-window-key', childId: 'first' });
  let startAttempts = 0;
  server.beforeStart = () => { startAttempts++; };

  await page.goto('/app.html');
  await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toHaveCount(0);
  expect(startAttempts).toBe(1);
  expect(server.leases.get('existing-device').playKey).not.toBe('closed-window-key');
});

test('a parent without an entitlement bypasses the login link after signing in, refreshing and restarting the browser', async ({ browser, baseURL }) => {
  const server = household();
  const browserType = browser.browserType();
  const profile = await mkdtemp(join(tmpdir(), 'oatle-playwright-'));
  let context;
  try {
    context = await browserType.launchPersistentContext(profile, { baseURL, serviceWorkers: 'block' });
    await server.install(context, { access: false, seed: false });
    const page = context.pages()[0] || await context.newPage();
    await page.goto('/app.html?auth=login');
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('testing123');
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Return to login' })).toBeVisible();
    await page.goto('/app.html?auth=login');
    await expect(page.getByRole('button', { name: 'Return to login' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Return to login' })).toBeVisible();
    await context.close();

    context = await browserType.launchPersistentContext(profile, { baseURL, serviceWorkers: 'block' });
    await server.install(context, { access: false, seed: false });
    const reopened = context.pages()[0] || await context.newPage();
    await reopened.goto('/app.html?auth=signup');
    await expect(reopened.getByRole('button', { name: 'Return to login' })).toBeVisible();
    await reopened.getByRole('button', { name: 'Return to login' }).click();
    await expect(reopened.getByLabel('Password', { exact: true })).toBeVisible();
    expect(await reopened.evaluate(key => localStorage.getItem(key), tokenKey)).toBeNull();
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('Single Child restores the active profile on refresh and refreshes an expired auth token on reopen', async ({ context, page }) => {
  const server = household('single');
  await server.install(context);
  await page.goto('/app.html?auth=login');
  await expect(page.getByRole('button', { name: 'Settings for Explorer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toHaveCount(0);
  const reading = page.getByRole('button', { name: /Reading Adventure/ });
  await expect(reading).toBeVisible();
  await page.reload();
  await expect(reading).toBeVisible();
  await page.evaluate(async () => {
    const { supabase } = await import('/src/lib/supabase.js');
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  });
  await expect(reading).toBeVisible();
  await page.evaluate(key => {
    const stored = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...stored, expires_at: 1 }));
  }, tokenKey);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/app.html?auth=login');
  await expect(reopened.getByRole('button', { name: 'Settings for Explorer' })).toBeVisible();
  expect(server.refreshes).toBe(2);
  expect(await reopened.evaluate(key => JSON.parse(localStorage.getItem(key)).refresh_token, tokenKey)).toBe('rotated-refresh');
  await expect(reopened.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
});

test('a session invalidated by Supabase returns to login', async ({ context, page }) => {
  const server = household('single');
  await server.install(context, { seed: false });
  await context.addInitScript(({ session, tokenKey }) => {
    if (!localStorage.getItem('test-seeded')) {
      localStorage.setItem('test-seeded', 'yes');
      localStorage.setItem(tokenKey, JSON.stringify({ ...session, expires_at: 1 }));
    }
  }, { session, tokenKey });
  server.refreshRejected = true;
  await page.goto('/app.html?auth=login');
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), tokenKey)).toBeNull();
});

test('Family retains pending activity data across reload, separates siblings, and restores cloud data on a second registered device', async ({ browser, context, page }) => {
  const server = household();
  server.enforceDeviceLease = true;
  await server.install(context);
  await page.goto('/app.html');
  await expect(page.getByRole('button', { name: 'Settings for Explorer' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
  const saved = {
    'atli-space-progress': JSON.stringify({ unlocked: 3, activePlanet: 2, question: 2, missions: { 2: 2 }, startedMissions: {} }),
    'atli-writing-progress': JSON.stringify({ version: 2, unlocked: 3, missions: { 3: 2 }, startedMissions: { 3: true }, completedMissions: { 1: true, 2: true } }),
    'oatle-maths-progress': JSON.stringify({ unlocked: 3, activeMission: 2, question: 2, missions: { 2: 2 } }),
    'oatle-colouring-big': JSON.stringify({ pageIndex: 1, book: { 'big-space': { past: [{}], colours: { background: '#fca5a5' }, future: [] } } }),
    'oatle-music-tune-v1': JSON.stringify([1, 2]),
  };
  server.saveUnavailable = true;
  await page.evaluate(async data => {
    const { learningStorage } = await import('/src/lib/profileStorage.js');
    for (const [key, value] of Object.entries(data)) learningStorage.setItem(key, value);
  }, saved);
  await expect(page.getByText('Saved on this device. Waiting to sync.')).toBeVisible();
  server.saveUnavailable = false;
  await page.reload();
  await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
  expect(server.cloud.get('first').data).toMatchObject(saved);
  let startHeartbeat;
  const heartbeatStarted = new Promise(resolve => { startHeartbeat = resolve; });
  let finishHeartbeat;
  const heartbeatResponse = new Promise(resolve => { finishHeartbeat = resolve; });
  server.beforeStart = body => {
    if (!body.p_heartbeat) return;
    startHeartbeat();
    return heartbeatResponse;
  };
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await heartbeatStarted;
  try {
    await page.getByRole('button', { name: 'Settings for Explorer' }).click();
    await page.getByRole('button', { name: 'Manage child profiles, plan and devices' }).click();
  } finally {
    finishHeartbeat();
  }
  await expect(page.getByRole('heading', { name: 'Child profiles' })).toBeVisible();
  await expect(page.getByText(/Family · R200/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings for Explorer' })).toBeVisible();
  await page.getByRole('button', { name: 'Manage child profiles, plan and devices' }).click();
  await page.getByRole('button', { name: 'Navigator' }).click();
  const navigatorSettings = page.getByRole('button', { name: 'Settings for Navigator' });
  await expect(navigatorSettings).toBeVisible();
  await expect(navigatorSettings.locator('.child-avatar')).toHaveText('N');
  await expect(page.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
  expect(await page.evaluate(async () => {
    const { learningStorage } = await import('/src/lib/profileStorage.js');
    return learningStorage.getItem('oatle-colouring-big');
  })).toBeNull();
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/app.html?auth=login');
  await expect(reopened.getByRole('button', { name: 'Settings for Navigator' })).toBeVisible();

  const secondDevice = await browser.newContext({ serviceWorkers: 'block' });
  try {
    await server.install(secondDevice);
    const secondPage = await secondDevice.newPage();
    await secondPage.goto(new URL('/app.html', reopened.url()).href);
    await expect(secondPage.getByRole('button', { name: 'Settings for Explorer' })).toBeVisible();
    await expect(secondPage.getByRole('button', { name: /Reading Adventure/ })).toBeVisible();
    expect(server.devices.size).toBe(2);
    expect(await secondPage.evaluate(async keys => {
      const { learningStorage } = await import('/src/lib/profileStorage.js');
      return Object.fromEntries(keys.map(key => [key, learningStorage.getItem(key)]));
    }, Object.keys(saved))).toEqual(saved);
    await secondPage.getByRole('button', { name: /Writing and Arts/i }).click();
    await secondPage.getByRole('button', { name: /Coloring Book/i }).click();
    await expect(secondPage.getByRole('heading', { name: 'Space adventure' })).toBeVisible();
    await expect(secondPage.getByRole('button', { name: 'Colour background' })).toHaveAttribute('fill', '#fca5a5');
  } finally {
    await secondDevice.close();
  }
});
