import { createHash } from 'node:crypto';

export const PRICE_CENTS = 12000;
export const PAYFAST_URL = 'https://www.payfast.co.za/eng/process';
export const FIELD_ORDER = [
  'merchant_id','merchant_key','return_url','cancel_url','notify_url','notify_method',
  'name_first','name_last','email_address','cell_number','m_payment_id','amount',
  'item_name','item_description','custom_int1','custom_int2','custom_int3','custom_int4','custom_int5',
  'custom_str1','custom_str2','custom_str3','custom_str4','custom_str5',
  'email_confirmation','confirmation_address','currency','payment_method',
  'subscription_type','billing_date','recurring_amount','frequency','cycles',
  'subscription_notify_email','subscription_notify_webhook','subscription_notify_buyer',
];
export function encodeValue(value) {
  return encodeURIComponent(String(value).trim()).replace(/[!'()*~]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%20/g, '+');
}
export function signedFields(data, passphrase) {
  const fields = Object.fromEntries(FIELD_ORDER.filter(key => data[key] !== undefined && data[key] !== '').map(key => [key, String(data[key])]));
  const parameters = Object.entries(fields).map(([key, value]) => `${key}=${encodeValue(value)}`);
  parameters.push(`passphrase=${encodeValue(passphrase)}`);
  return { ...fields, signature: createHash('md5').update(parameters.join('&')).digest('hex') };
}
export function makeCheckout({ merchantId, merchantKey, passphrase, appUrl, supabaseUrl, userId, email, paymentId }) {
  const origin = new URL(appUrl);
  if (origin.protocol !== 'https:' || !['www.oatlekids.co.za','oatlekids.co.za'].includes(origin.hostname)) throw new Error('APP_URL must use the Oatle Kids HTTPS domain.');
  const notifyOrigin = new URL(supabaseUrl);
  if (notifyOrigin.protocol !== 'https:') throw new Error('SUPABASE_URL must use HTTPS.');
  return { checkout_url: PAYFAST_URL, fields: signedFields({
    merchant_id: merchantId, merchant_key: merchantKey,
    return_url: `${origin.origin}/app.html?payment=success`,
    cancel_url: `${origin.origin}/app.html?payment=cancelled`,
    notify_url: `${notifyOrigin.origin}/functions/v1/payfast-itn`,
    email_address: email, m_payment_id: paymentId, amount: '120.00',
    item_name: 'Oatle Kids Monthly Subscription', item_description: 'Oatle Kids — Space Learning Adventures',
    custom_str1: userId, subscription_type: '1', recurring_amount: '120.00', frequency: '3', cycles: '0',
  }, passphrase) };
}
