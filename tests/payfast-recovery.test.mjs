import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { submitPayfastCheckout } from '../src/lib/payfastCheckout.js';
import { makeCheckout } from '../supabase/functions/quick-service/checkout.mjs';
const data = makeCheckout({merchantId:'example',merchantKey:'example',passphrase:'test',appUrl:'https://www.oatlekids.co.za',supabaseUrl:'https://example.supabase.co',userId:'test',email:'parent@example.com',paymentId:'test'});
test('allows the observed PayFast redirect without a wildcard', () => {
 const config=JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
 const policy=config.headers[0].headers.find(h=>h.key==='Content-Security-Policy').value;
 const directive=policy.split(';').find(s=>s.trim().startsWith('form-action'));
 assert(directive.includes(' https://payment.payfast.io'));
 assert(!directive.includes('*'));
});
test('checkout rejects enforced CSP blocks and cleans up, and resolves on navigation', async () => {
 const previousDocument=globalThis.document, previousWindow=globalThis.window;
 const document=new EventTarget(), window=new EventTarget();
 let removed=0;
 document.createElement=()=>({append(){},remove(){removed++},submit(){}});
 document.body={append(){}};
 globalThis.document=document; globalThis.window=window;
 try {
  const pending=submitPayfastCheckout(data);
  const event=new Event('securitypolicyviolation');
  Object.assign(event,{effectiveDirective:'form-action',disposition:'enforce'});
  document.dispatchEvent(event);
  await assert.rejects(pending,/browser blocked/);
  assert.equal(removed,1);
  const next=submitPayfastCheckout(data);
  window.dispatchEvent(new Event('pagehide'));
  await next;
  assert.equal(removed,2);
 } finally { globalThis.document=previousDocument; globalThis.window=previousWindow; }
});
