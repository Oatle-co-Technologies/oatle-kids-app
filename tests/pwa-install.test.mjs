import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadEntry(path, supportsServiceWorker = true) {
  const window = new EventTarget();
  const registrations = [];
  const messages = [];
  const registration = {
    scope: 'https://www.oatlekids.co.za/',
    active: { postMessage: message => messages.push(message) },
    update: async () => {},
  };
  const navigator = supportsServiceWorker ? {
    serviceWorker: {
      register: async (...args) => { registrations.push(args); return registration; },
      ready: Promise.resolve(registration),
      addEventListener: () => {},
    },
  } : {};
  // Dependencies concern subscriptions and chat; the entry's install lifecycle
  // runs unchanged against browser events and a service worker test double.
  const source = (await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '');
  vm.runInNewContext(source, {
    window, navigator, console,
    document: { querySelectorAll: () => [] },
  });
  const installEvent = new Event('beforeinstallprompt', { cancelable: true });
  window.dispatchEvent(installEvent);
  assert.equal(installEvent.defaultPrevented, false, 'native install promotion must remain available');
  window.dispatchEvent(new Event('load'));
  await new Promise(resolve => setImmediate(resolve));
  return { registrations, messages };
}

for (const entry of ['../src/pwa.js', '../src/landing.js']) {
  test(`${entry}: native installation remains available and registers the root worker`, async () => {
    const { registrations, messages } = await loadEntry(entry);
    assert.equal(registrations.length, 1);
    assert.equal(registrations[0][0], '/service-worker.js');
    assert.equal(registrations[0][1].updateViaCache, 'none');
    assert.equal(messages.length, entry.endsWith('/pwa.js') ? 1 : 0,
      'only the learning app should request optional offline assets');
  });

  test(`${entry}: browsers without service workers retain the normal page`, async () => {
    const { registrations } = await loadEntry(entry, false);
    assert.equal(registrations.length, 0);
  });
}
