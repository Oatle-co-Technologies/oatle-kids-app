import test from 'node:test';
import assert from 'node:assert/strict';
import { learningStorage,selectProgressCache,clearProgressCacheSelection,progressSnapshot,replaceProgressCache,legacyProgressSnapshot } from '../src/lib/profileStorage.js';
import {childProgressSync} from '../src/lib/childProgressSync.js';
function memory(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
test('child caches and account caches cannot overwrite each other or include auth tokens',()=>{
 globalThis.localStorage=memory();localStorage.setItem('atli-space-progress','legacy');localStorage.setItem('sb-auth-token','secret');
 assert.deepEqual(legacyProgressSnapshot(),{'atli-space-progress':'legacy'});
 selectProgressCache('parent','childA');learningStorage.setItem('atli-space-progress','A');
 selectProgressCache('parent','childB');assert.equal(learningStorage.getItem('atli-space-progress'),null);learningStorage.setItem('atli-space-progress','B');
 selectProgressCache('other-parent','childA');assert.equal(learningStorage.getItem('atli-space-progress'),null);
 selectProgressCache('parent','childA');assert.equal(learningStorage.getItem('atli-space-progress'),'A');
 replaceProgressCache({'atli-space-progress':'restored','sb-auth-token':'malicious'});assert.deepEqual(progressSnapshot(),{'atli-space-progress':'restored'});assert.equal(localStorage.getItem('sb-auth-token'),'secret');clearProgressCacheSelection();
});
test('cloud sync uses revisions, keeps pending edits over refresh, and rejects stale hydration',async()=>{
 globalThis.localStorage=memory();let remote={data:{},revision:0};let fail=false;
 const client={rpc:async(_name,args)=>{if(fail)return {error:Error('offline')};assert.equal(args.p_revision,remote.revision);remote={data:args.p_data,revision:remote.revision+1};return {data:{outcome:'saved',revision:remote.revision}}}};
 let sync=childProgressSync(client,'u','c','p');sync.hydrate(remote);learningStorage.setItem('atli-space-progress','one');await sync.flush();assert.equal(remote.data['atli-space-progress'],'one');
 fail=true;learningStorage.setItem('atli-space-progress','two');await assert.rejects(sync.flush());sync.stop();
 sync=childProgressSync(client,'u','c','p');sync.hydrate(remote);assert.equal(learningStorage.getItem('atli-space-progress'),'two');fail=false;await sync.flush();sync.stop();
 sync=childProgressSync(client,'u','c','p');sync.hydrate(remote);learningStorage.setItem('atli-space-progress','pending');sync.stop();
 sync=childProgressSync(client,'u','c','p');assert.throws(()=>sync.hydrate({revision:remote.revision+1,data:{'atli-space-progress':'newer'}}),/progress_conflict/);
 sync.hydrate({revision:remote.revision+1,data:{'atli-space-progress':'newer'}},{useLatest:true});assert.equal(learningStorage.getItem('atli-space-progress'),'newer');assert(localStorage.getItem('oatle-progress-meta:u:c:backup').includes('pending'));sync.stop();
});

test('a stopped sync cannot clear a new child selection or mark its own pending save clean', async () => {
 globalThis.localStorage = memory();
 let finish;
 const client = { rpc: () => new Promise(resolve => { finish = resolve; }) };
 const first = childProgressSync(client, 'parent', 'first', 'play');
 first.hydrate({ revision: 0, data: {} });
 learningStorage.setItem('atli-space-progress', 'first draft');
 const saving = first.flush();
 first.stop();
 const second = childProgressSync(client, 'parent', 'second', 'play');
 second.hydrate({ revision: 0, data: { 'atli-space-progress': 'second draft' } });
 first.stop();
 finish({ data: { outcome: 'saved', revision: 1 } });
 await saving;
 assert.equal(learningStorage.getItem('atli-space-progress'), 'second draft');
 assert.deepEqual(JSON.parse(localStorage.getItem('oatle-progress-meta:parent:first')), { revision: 0, dirty: true });
 second.stop();
});

test('retrying first-time legacy import preserves newer local edits before the first cloud save', async () => {
 globalThis.localStorage = memory();
 const remote = { revision: 0, data: {} };
 const importData = { 'atli-space-progress': 'legacy' };
 const client = { rpc: async () => ({ error: new Error('offline') }) };
 const first = childProgressSync(client, 'parent', 'child', 'play');
 first.hydrate(remote, { importData });
 assert.equal(learningStorage.getItem('atli-space-progress'), 'legacy');
 learningStorage.setItem('atli-space-progress', 'newer progress');
 await assert.rejects(first.flush());
 first.stop();
 const retry = childProgressSync(client, 'parent', 'child', 'play');
 retry.hydrate(remote, { importData });
 assert.equal(learningStorage.getItem('atli-space-progress'), 'newer progress');
 retry.stop();
});
