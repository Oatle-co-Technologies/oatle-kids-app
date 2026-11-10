import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreScopedDeviceState } from '../src/lib/restoreScopedDeviceState.js';
test('recovers namespaced progress and device identity without overwriting current data or importing auth/legacy state',()=>{
 const storage={getItem(k){return this[k]??null},setItem(k,v){this[k]=v}};
 storage['oatle-account-state-unlinked']=JSON.stringify({'oatle-profile:parent-a:child-a:atli-space-progress':'saved','oatle-profile:parent-b:child-b:atli-space-progress':'other parent','oatle-progress-meta:parent-a:child-a':'pending','oatle-device-key':'original-device','oatle-child-profile':'unlinked child','sb-auth-token':'never import'});
 storage['oatle-profile:parent-b:child-b:atli-space-progress']='newer';
 restoreScopedDeviceState(storage);restoreScopedDeviceState(storage);
 assert.equal(storage['oatle-profile:parent-a:child-a:atli-space-progress'],'saved');assert.equal(storage['oatle-profile:parent-b:child-b:atli-space-progress'],'newer');
 assert.equal(storage['oatle-device-key'],'original-device');assert.equal(storage.getItem('oatle-child-profile'),null);assert.equal(storage.getItem('sb-auth-token'),null);
});
