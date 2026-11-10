import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { selectProgressCache, clearProgressCacheSelection, progressSnapshot } from '../src/lib/profileStorage.js';
registerHooks({resolve(specifier,context,next){
 if(specifier==='./supabase')return {url:'data:text/javascript,export const supabase={};',shortCircuit:true};
 return next(specifier,context);
}});
const {attemptId,queueReport}=await import('../src/lib/parentEmail.js');
test('siblings retain separate assessment IDs and reports in the parent queue',()=>{
 const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
 globalThis.window={dispatchEvent(){}};
 selectProgressCache('parent','child-a');const a=attemptId('reading',true);queueReport('parent','reading',{test:'A'});queueReport('parent','reading',{test:'A'});
 assert.equal(progressSnapshot()['oatle-report-attempt-reading'],a);
 selectProgressCache('parent','child-b');const b=attemptId('reading',true);queueReport('parent','reading',{test:'B'});assert.notEqual(a,b);
 selectProgressCache('parent','child-a');assert.equal(attemptId('reading'),a);
 const queue=JSON.parse(localStorage.getItem('oatle-report-queue-parent'));assert.equal(queue.length,2);assert.deepEqual(queue.map(r=>r.attempt_id),[a,b]);
 clearProgressCacheSelection();delete globalThis.window;delete globalThis.localStorage;
});
