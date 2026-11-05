import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeCheckout, encodeValue, PRICE_CENTS } from '../supabase/functions/payfast-checkout/checkout.mjs';
import { validatePayfastCheckout } from '../src/lib/payfastCheckout.js';
const options = {merchantId:'example',merchantKey:'public-form-key',passphrase:'test-only-secret',appUrl:'https://www.oatlekids.co.za',supabaseUrl:'https://example.supabase.co',userId:'user-1',email:'parent@example.com',paymentId:'payment-1'};
test('live checkout uses R120 initially and monthly, returning to the app', () => {
  const data=makeCheckout(options); assert.equal(PRICE_CENTS,12000);
  assert.equal(data.fields.amount,'120.00'); assert.equal(data.fields.recurring_amount,'120.00');
  assert.equal(data.fields.frequency,'3'); assert.equal(data.fields.cycles,'0');
  assert.equal(data.fields.return_url,'https://www.oatlekids.co.za/app.html?payment=success');
  assert.equal(data.fields.cancel_url,'https://www.oatlekids.co.za/app.html?payment=cancelled');
  assert.equal(data.fields.custom_str1,'user-1'); assert.equal(data.fields.passphrase,undefined);
  assert.equal(validatePayfastCheckout(data).url,'https://www.payfast.co.za/eng/process');
});
test('signature matches the exact response field order and PHP-style encoding', () => {
  const {fields}=makeCheckout(options);
  const encoded=Object.entries(fields).filter(([key])=>key!=='signature').map(([key,value])=>`${key}=${encodeValue(value)}`).join('&')+'&passphrase='+encodeValue(options.passphrase);
  assert.equal(fields.signature,createHash('md5').update(encoded).digest('hex'));
  assert.equal(encodeValue(" A B!'()*~ "),'A+B%21%27%28%29%2A%7E');
});
test('rejects sandbox, changed amounts, unexpected credentials, and non-owned return domains', () => {
  const data=makeCheckout(options);
  assert.throws(()=>validatePayfastCheckout({...data,checkout_url:'https://sandbox.payfast.co.za/eng/process'}));
  assert.throws(()=>validatePayfastCheckout({...data,fields:{...data.fields,amount:'99.00'}}));
  assert.throws(()=>validatePayfastCheckout({...data,fields:{...data.fields,passphrase:'leaked'}}));
  assert.throws(()=>makeCheckout({...options,appUrl:'https://other.example'}));
});
