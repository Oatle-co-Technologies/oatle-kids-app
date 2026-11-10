import test from 'node:test';
import assert from 'node:assert/strict';
import { skills, validateReport, reportText, eligibleForReminder } from '../supabase/functions/_shared/report.mjs';
import { sendEmail } from '../supabase/functions/_shared/delivery.mjs';
import { prepareAccountStorage } from '../src/lib/accountStorage.js';
export const scoresFor = subject => Object.fromEntries(skills[subject].map(([id],i)=>[id,{correct:i%3,total:subject==='reading'?4:2}]));
test('each report has exact skill-by-skill scores, percentages and home guidance',()=>{
 for(const subject of ['reading','maths']) {
  const scores=scoresFor(subject), text=reportText(subject,scores);
  for(const [id,name,tip] of skills[subject]) {
   assert.ok(text.includes(`${name}: ${scores[id].correct}/${scores[id].total}`));
   assert.ok(text.includes(tip));
  }
  assert.ok(text.includes('not a diagnosis')); assert.ok(text.includes('separate from optional marketing'));
 }
});
test('rejects missing, extra, inflated, fractional and wrong-total skill scores',()=>{
 for(const subject of ['reading','maths']) {
  const id=skills[subject][0][0];
  for(const change of [s=>delete s[id],s=>s.extra={},s=>s[id].correct=99,s=>s[id].correct=0.5,s=>s[id].total=0]) {
   const s=scoresFor(subject);change(s);assert.throws(()=>validateReport(subject,s));
  }
 }
 assert.throws(()=>validateReport('writing',{}));
});
test('reminders exclude opted-out, unconfirmed, active, trial, delinquent and still-entitled accounts',()=>{
 const u={email_confirmed_at:'2026-01-01'},p={opted_in:true},now=Date.parse('2026-11-10');
 assert.equal(eligibleForReminder(u,p,[],[],now),true);
 assert.equal(eligibleForReminder(u,{opted_in:false},[],[],now),false);
 assert.equal(eligibleForReminder({},p,[],[],now),false);
 for(const status of ['active','trialing','past_due']) assert.equal(eligibleForReminder(u,p,[{status}],[],now),false);
 assert.equal(eligibleForReminder(u,p,[{status:'cancelled',current_period_end:'2026-12-01'}],[],now),false);
 assert.equal(eligibleForReminder(u,p,[],[{status:'active',expires_at:null}],now),false);
 assert.equal(eligibleForReminder(u,p,[{status:'cancelled',current_period_end:'2026-01-01'}],[{status:'expired'}],now),true);
});
test('provider retry uses stable idempotency key and byte-identical payload; no real email',async()=>{
 const calls=[],payload={from:'test@example.invalid',to:['parent@example.invalid'],subject:'Report',text:'Test'};
 const fake=async(url,options)=>{calls.push({url,...options});return Response.json({id:'mock-message'});};
 await sendEmail(fake,'fake','attempt-1',payload);await sendEmail(fake,'fake','attempt-1',payload);
 assert.equal(calls[0].headers['Idempotency-Key'],'oatle/attempt-1');assert.equal(calls[0].body,calls[1].body);
 await assert.rejects(()=>sendEmail(async()=>new Response('',{status:429}),'fake','id',payload));
});
function storage(entries) {return Object.assign({...entries},{getItem(k){return this[k]??null;},setItem(k,v){this[k]=v;},removeItem(k){delete this[k];}});}
test('account changes remove device child state and report queue before linking a new parent',()=>{
 const s=storage({'oatle-storage-owner':'parent-a','oatle-child-profile':'private','atli-space-assessment-results':'private','oatle-report-queue-parent-a':'private','sb-auth-token':'preserved'});
 assert.equal(prepareAccountStorage(s,'parent-a'),false);
 assert.equal(prepareAccountStorage(s,'parent-b'),true);
 assert.equal(s.getItem('oatle-child-profile'),null);assert.equal(s.getItem('oatle-report-queue-parent-a'),null);
 assert.equal(s.getItem('sb-auth-token'),'preserved');assert.equal(prepareAccountStorage(s,'parent-b'),false);
 prepareAccountStorage(s,'parent-a');assert.equal(s.getItem('oatle-report-queue-parent-a'),'private');assert.equal(s.getItem('oatle-child-profile'),'private');
 prepareAccountStorage(s,null);assert.equal(prepareAccountStorage(s,null),false);
});
