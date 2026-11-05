import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
const source = (await readFile(new URL('../supabase/functions/payfast-itn/index.ts',import.meta.url),'utf8')).replace(/^import \{ withSupabase \}.*\n/m,'').split('\nexport default')[0];
const {createPayfastHandler,phpUrlencode} = await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
function notification(overrides={}) {
  const data={merchant_id:'merchant-live',m_payment_id:'payment-1',pf_payment_id:'123456',payment_status:'COMPLETE',amount_gross:'120.00',custom_str1:'user-1',...overrides};
  const parameters=Object.entries(data).map(([key,value])=>`${key}=${phpUrlencode(value)}`).join('&');
  return parameters+'&signature='+createHash('md5').update(parameters+'&passphrase=test-secret').digest('hex');
}
const request=body=>new Request('https://example.supabase.co/functions/v1/payfast-itn',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
function setup({enabled=true,validation='VALID',outcome='processed'}={}) {
  const calls=[];
  const handler=createPayfastHandler({env:key=>({PAYFAST_LIVE_ACTIVATION_ENABLED:enabled?'true':'false',PAYFAST_MERCHANT_ID:'merchant-live',PAYFAST_PASSPHRASE:'test-secret'})[key],fetch:async(url)=>{calls.push(url);return new Response(validation);},log:()=>{}});
  const ctx={supabaseAdmin:{rpc:async(name,args)=>{calls.push({name,args});return {data:{outcome},error:null};}}};
  return {calls,run:body=>handler(request(body),ctx)};
}
test('verified live notifications use the live provider and atomic live routine',async()=>{const x=setup();assert.equal((await x.run(notification())).status,200);assert.equal(x.calls[0],'https://www.payfast.co.za/eng/query/validate');assert.equal(x.calls[1].name,'apply_payfast_itn');assert.equal(x.calls[1].args.p_amount_cents,12000);});
test('activation gate and forged signatures never call provider or database',async()=>{for(const [options,body,status] of [[{enabled:false},notification(),503],[{},notification().replace('120.00','99.00'),403]]){const x=setup(options);assert.equal((await x.run(body)).status,status);assert.equal(x.calls.length,0);}});
test('provider rejection and database mismatch do not activate; duplicate retry is acknowledged',async()=>{for(const [options,status] of [[{validation:'INVALID'},403],[{outcome:'amount_or_plan_mismatch'},400],[{outcome:'duplicate'},200]]){const x=setup(options);assert.equal((await x.run(notification())).status,status);}});
