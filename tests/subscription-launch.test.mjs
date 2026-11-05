import test from 'node:test';
import assert from 'node:assert/strict';
import { subscriptionStatus } from '../src/subscriptionLaunch.js';
test('announces the launch until South African midnight on 16 November', () => {
  assert.equal(subscriptionStatus(Date.parse('2026-11-15T21:59:59Z')), 'Subscriptions open on 16 November.');
});
test('uses evergreen open wording from launch onward', () => {
  for (const date of ['2026-11-15T22:00:00Z','2026-11-16T10:00:00Z','2027-06-01T00:00:00Z']) assert.equal(subscriptionStatus(Date.parse(date)), 'Subscriptions are open.');
});
