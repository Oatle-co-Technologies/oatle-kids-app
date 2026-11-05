const LIVE_URL = 'https://www.payfast.co.za/eng/process';
export function validatePayfastCheckout(data) {
  if (data?.checkout_url !== LIVE_URL || !data.fields || typeof data.fields !== 'object' || Array.isArray(data.fields)) throw new Error('Checkout returned an invalid payment destination.');
  const fields = data.fields;
  if (fields.amount !== '120.00' || fields.recurring_amount !== '120.00' || fields.subscription_type !== '1' || fields.frequency !== '3' || fields.cycles !== '0' || !/^[a-f0-9]{32}$/i.test(fields.signature || '') || !fields.m_payment_id) throw new Error('Checkout details do not match the R120 monthly plan.');
  for (const [key, value] of Object.entries(fields)) {
    if (!/^[a-z][a-z0-9_]*$/.test(key) || typeof value !== 'string' || ['passphrase','access_token','service_role_key'].includes(key)) throw new Error('Checkout returned invalid payment fields.');
  }
  return { url: LIVE_URL, fields };
}
export function submitPayfastCheckout(data) {
  const { url, fields } = validatePayfastCheckout(data);
  const form = document.createElement('form');
  form.method = 'POST'; form.action = url; form.hidden = true;
  // Preserve the server's signed field order. Do not sort or reconstruct fields.
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = name; input.value = value; form.append(input);
  }
  document.body.append(form);
  form.submit();
  form.remove();
}
