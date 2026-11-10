import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){
 if(specifier==='npm:@supabase/server@^1')return {url:'data:text/javascript,export const createSupabaseContext=(...args)=>globalThis.planAuth(...args)',shortCircuit:true};
 if(specifier==='npm:@supabase/supabase-js@^2/cors')return {url:'data:text/javascript,export const corsHeaders={"Access-Control-Allow-Origin":"*"}',shortCircuit:true};
 return next(specifier,context);
}});
const handler=(await import('../supabase/functions/quick-service/create-payfast-checkout.ts')).default.fetch;
const config={PAYFAST_CHECKOUT_ENABLED:'true',PAYFAST_MERCHANT_ID:'test-merchant',PAYFAST_MERCHANT_KEY:'test-key',PAYFAST_PASSPHRASE:'test-only',APP_URL:'https://www.oatlekids.co.za',SUPABASE_URL:'https://test.supabase.co'};
globalThis.Deno={env:{get:key=>config[key]}};
let outcome='ready',calls=[];
globalThis.planAuth=async()=>({data:{userClaims:{id:'test-user',email:'parent@example.invalid'},supabaseAdmin:{rpc:async(name,args)=>{calls.push({name,args});return {data:{outcome,payment_id:'server-reference',plan_id:args.p_plan_id,amount_cents:args.p_plan_id==='family'?20000:12000}}}}}});
const request=body=>new Request('https://test.invalid',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
test('server selects R200 and server payment reference even when the browser supplies a cheaper amount',async()=>{
 calls=[];const response=await handler(request({plan_id:'family',amount_cents:1,payment_id:'browser-reference'}));assert.equal(response.status,200);const data=await response.json();assert.equal(data.fields.amount,'200.00');assert.equal(data.fields.recurring_amount,'200.00');assert.equal(data.fields.m_payment_id,'server-reference');assert.equal(calls[0].name,'prepare_plan_checkout');assert.equal(calls[0].args.p_plan_id,'family');
});
test('unknown plans and an existing recurring subscription cannot create a second checkout',async()=>{
 calls=[];assert.equal((await handler(request({plan_id:'unlimited'}))).status,400);assert.equal(calls.length,0);outcome='existing_subscription';assert.equal((await handler(request({plan_id:'family'}))).status,409);outcome='ready';
});
