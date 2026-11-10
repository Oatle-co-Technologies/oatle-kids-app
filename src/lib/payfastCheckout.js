import { subscriptionPlan } from './subscriptionPlans.js';
const LIVE_URL = 'https://www.payfast.co.za/eng/process';
export function validatePayfastCheckout(data, expectedPlan = 'single') {
  if (data?.checkout_url !== LIVE_URL || !data.fields || typeof data.fields !== 'object' || Array.isArray(data.fields)) throw new Error('Checkout returned an invalid payment destination.');
  const fields = data.fields;
  const plan = subscriptionPlan(expectedPlan);
  if (fields.amount !== plan.amount || fields.recurring_amount !== plan.amount || (fields.custom_str2 && fields.custom_str2 !== plan.id) || fields.subscription_type !== '1' || fields.frequency !== '3' || fields.cycles !== '0' || !/^[a-f0-9]{32}$/i.test(fields.signature || '') || !fields.m_payment_id) throw new Error(`Checkout details do not match the ${plan.name} monthly plan.`);
  for (const [key, value] of Object.entries(fields)) {
    if (!/^[a-z][a-z0-9_]*$/.test(key) || typeof value !== 'string' || ['passphrase','access_token','service_role_key'].includes(key)) throw new Error('Checkout returned invalid payment fields.');
  }
  return { url: LIVE_URL, fields };
}
export function submitPayfastCheckout(data, expectedPlan = 'single') {
  const { url, fields } = validatePayfastCheckout(data, expectedPlan);
  const form = document.createElement('form');
  form.method = 'POST'; form.action = url; form.hidden = true;
  // Preserve the server's signed field order. Do not sort or reconstruct fields.
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value; form.append(input);
  }
  // A blocked form navigation does not throw from form.submit(). Observe CSP
  // failures explicitly, and recover if the browser never leaves this page.
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('securitypolicyviolation', onPolicyViolation);
      window.removeEventListener('pagehide', onPageHide);
      form.remove();
    };
    const fail = (message) => { cleanup(); reject(new Error(message)); };
    const onPolicyViolation = (event) => {
      if (event.effectiveDirective === 'form-action' && event.disposition === 'enforce') {
        fail('Your browser blocked the secure payment page. Please contact info@oatle-technologies.co.za.');
      }
    };
    const onPageHide = () => { cleanup(); resolve(); };
    const timer = setTimeout(() => fail('The secure payment page did not open. Please try again.'), 15000);
    document.addEventListener('securitypolicyviolation', onPolicyViolation);
    window.addEventListener('pagehide', onPageHide, { once: true });
    document.body.append(form);
    try { form.submit(); } catch (error) { cleanup(); reject(error); }
  });
}
