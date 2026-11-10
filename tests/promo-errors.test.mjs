import test from 'node:test';
import assert from 'node:assert/strict';
import {promoErrorMessage} from '../src/lib/promoErrors.js';
test('reads the actual rejection from Supabase HTTP errors without consuming the response',async()=>{
 const context=Response.json({error:'This promo code is assigned to another account.'},{status:400});
 const message=await promoErrorMessage({message:'Edge Function returned a non-2xx status code',context});
 assert.match(message,/email your invitation was sent to/);assert.match(message,/verified/);
 assert.equal(context.bodyUsed,false);
});
test('known rejection outcomes give actionable guidance',async()=>{
 for(const outcome of ['invalid_code','inactive','wrong_account','not_started','expired','limit_reached','already_redeemed','payment_discount','active_access','invalid_duration']) {
  const message=await promoErrorMessage(null,{outcome});
  assert.ok(message.length>25);assert.doesNotMatch(message,/Edge Function|non-2xx/);
 }
});
test('unknown and malformed server errors never expose internal details',async()=>{
 for(const error of [{message:'SQL secret'}, {context:new Response('<html>Internal server stack trace</html>',{status:500})}]) {
  assert.match(await promoErrorMessage(error,{error:'SQL secret'}),/try again shortly/);
 }
});
test('expired sessions and connection failures explain the next step',async()=>{
 assert.match(await promoErrorMessage({context:Response.json({}, {status:401})}),/sign in again/);
 assert.match(await promoErrorMessage({code:'session_expired'}),/sign in again/);
 assert.match(await promoErrorMessage({name:'FunctionsFetchError'}),/internet connection/);
});
