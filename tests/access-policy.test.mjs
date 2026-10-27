import test from 'node:test';
import assert from 'node:assert/strict';
import { hasActiveEntitlement } from '../src/lib/accessPolicy.js';

const now = Date.parse('2026-10-27T12:00:00Z');
const active = {user_id:'approved',status:'active',expires_at:'2026-10-28T12:00:00Z'};

test('authentication alone never grants product access', () => {
  assert.equal(hasActiveEntitlement(null,'approved',now),false);
  assert.equal(hasActiveEntitlement(active,null,now),false);
});
test('a prior account grant cannot unlock a different account', () => {
  assert.equal(hasActiveEntitlement(active,'unapproved',now),false);
  assert.equal(hasActiveEntitlement(active,'approved',now),true);
});
test('revoked and expired grants are denied at the expiry boundary', () => {
  assert.equal(hasActiveEntitlement({...active,status:'revoked'},'approved',now),false);
  assert.equal(hasActiveEntitlement({...active,expires_at:new Date(now).toISOString()},'approved',now),false);
  assert.equal(hasActiveEntitlement({...active,expires_at:new Date(now-1).toISOString()},'approved',now),false);
});
test('explicit lifetime grants work, malformed or missing expiries fail closed', () => {
  assert.equal(hasActiveEntitlement({...active,expires_at:null},'approved',now),true);
  for (const expires_at of [undefined,'','invalid']) {
    assert.equal(hasActiveEntitlement({...active,expires_at},'approved',now),false);
  }
});
