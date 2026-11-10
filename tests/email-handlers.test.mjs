import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){
 if(specifier==='npm:@supabase/supabase-js@2') return {url:'data:text/javascript,export const createClient=(...args)=>globalThis.emailTestClient(...args)',shortCircuit:true};
 return next(specifier,context);
}});
let handler,env={};
globalThis.Deno={env:{get:k=>env[k]},serve:f=>{handler=f;}};
await import('../supabase/functions/parent-email/index.ts');const reportHandler=handler;
await import('../supabase/functions/email-worker/index.ts');const workerHandler=handler;
await import('../supabase/functions/email-unsubscribe/index.ts');const unsubscribeHandler=handler;
const scores=Object.fromEntries(['capital','lowercase','matching','word-order','reading','missing','sentences'].map(id=>[id,{correct:2,total:4}]));
test('report endpoint verifies account; accepts only bounded complete reports and calls atomic RPC',async()=>{
 let calls=[];
 globalThis.emailTestClient=()=>({auth:{getUser:async()=>({data:{user:{id:'parent-1',email_confirmed_at:'2026-01-01'}}})},rpc:async(...args)=>{calls.push(args);return {error:null};}});
 const body={owner_id:'parent-1',attempt_id:'a1234567-1234-4123-8123-123456789012',subject:'reading',scores};
 const request=b=>new Request('https://example.invalid',{method:'POST',body:JSON.stringify(b),headers:{Authorization:'Bearer fake'}});
 assert.equal((await reportHandler(request(body))).status,200);assert.equal(calls[0][0],'enqueue_assessment');
 assert.equal((await reportHandler(request({...body,owner_id:'another-parent'}))).status,401);
 assert.equal((await reportHandler(request({...body,scores:{}}))).status,400);assert.equal(calls.length,1);
 globalThis.emailTestClient=()=>({auth:{getUser:async()=>({data:{user:null},error:{}})}});
 assert.equal((await reportHandler(request(body))).status,401);
});
test('worker kill switch makes zero database/provider calls, and rejects unauthorized callers',async()=>{
 env={EMAIL_WORKER_SECRET:'test-worker'};
 globalThis.emailTestClient=()=>{throw new Error('Unexpected database call');};
 assert.equal((await workerHandler(new Request('https://example.invalid',{method:'POST'}))).status,401);
 const response=await workerHandler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer gateway-jwt','X-Email-Worker-Secret':'test-worker'}}));
 assert.deepEqual(await response.json(),{disabled:true});
});
test('unsubscribe GET is scanner-safe; POST hashes token and changes only marketing preference',async()=>{
 let calls=[];
 globalThis.emailTestClient=()=>({rpc:async(...args)=>{calls.push(args);return {data:true,error:null};}});
 const url='https://example.invalid?token='+'a'.repeat(64);
 assert.equal((await unsubscribeHandler(new Request(url))).status,200);assert.equal(calls.length,0);
 assert.equal((await unsubscribeHandler(new Request(url,{method:'POST'}))).status,200);
 assert.equal(calls[0][0],'unsubscribe_email');assert.notEqual(calls[0][1].p_hash,'a'.repeat(64));
 assert.equal((await unsubscribeHandler(new Request('https://example.invalid?token=bad',{method:'POST'}))).status,400);
});
test('worker sends educational report despite marketing opt-out and suppresses ineligible reminder',async()=>{
 env={EMAIL_WORKER_SECRET:'test-worker',EMAIL_DELIVERY_ENABLED:'true',EMAIL_FROM:'test@example.invalid',EMAIL_TOKEN_SECRET:'test-token-secret',RESEND_API_KEY:'fake-key',SUPABASE_URL:'https://example.invalid'};
 const updates=[],requests=[];
 const jobs=[{id:'report-job',user_id:'parent-1',kind:'report',report_id:'report-1',attempts:1},{id:'reminder-job',user_id:'parent-1',kind:'reminder',attempts:1}];
 const result=(data)=>({data,error:null});
 globalThis.emailTestClient=()=>({
  auth:{admin:{getUserById:async()=>result({user:{id:'parent-1',email:'parent@example.invalid',email_confirmed_at:'2026-01-01'}})}},
  rpc:async()=>result(jobs),
  from(table){
   let operation='select',values;
   const query={select(){return query;},eq(){return query;},single(){return query;},maybeSingle(){return query;},update(v){operation='update';values=v;return query;},
    then(resolve){if(operation==='update'){updates.push({table,...values});return Promise.resolve(result(null)).then(resolve);}
     const data=table==='assessment_reports'?{subject:'reading',scores}:table==='email_preferences'?{opted_in:false}:[];
     return Promise.resolve(result(data)).then(resolve);
    }};return query;
  }
 });
 const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{requests.push({url,...options});return Response.json({id:'fake-provider-id'});};
 try {
  const response=await workerHandler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer gateway-jwt','X-Email-Worker-Secret':'test-worker'}}));
  assert.equal(response.status,200);assert.equal(requests.length,1);
  assert.ok(JSON.parse(requests[0].body).text.includes('Capital letters: 2/4'));
  assert.ok(updates.some(u=>u.status==='sent'));assert.ok(updates.some(u=>u.status==='suppressed'));
 } finally {globalThis.fetch=oldFetch;}
});
