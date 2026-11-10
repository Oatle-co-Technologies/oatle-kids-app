const fallback = "We couldn't apply your promo code right now. Please try again shortly. If it keeps happening, contact Oatle Kids support.";
const messages = {
  invalid_code: "We couldn't find that promo code. Check the spelling and try again.",
  inactive: 'This promo code is no longer available. Please contact Oatle Kids support if you received an invitation.',
  wrong_account: 'This code is linked to a specific email address. Sign in with the email your invitation was sent to and make sure that email is verified, then try again.',
  not_started: 'This promo code is not available yet. Check the start date on your invitation.',
  expired: 'This promo code has expired. Please contact Oatle Kids support if you need help.',
  limit_reached: 'This promo code has already been used up. Check that you entered the code from your invitation.',
  already_redeemed: 'You have already used this promo code. Refresh the page to check your access.',
  payment_discount: 'This code applies to a payment rather than free access. Please contact Oatle Kids support for help using it.',
  active_access: 'Your account already has access. Refresh the page to continue your adventure.',
  invalid_duration: 'We need to check this promo code before it can be used. Please contact Oatle Kids support.',
};
// Older deployments return only these fixed messages, without an outcome code.
const legacy = {
  'Invalid promo code.': 'invalid_code',
  'Please enter a valid promo code.': 'invalid_code',
  'This promo code is no longer active.': 'inactive',
  'This promo code is assigned to another account.': 'wrong_account',
  'This promo code is not active yet.': 'not_started',
  'This promo code has expired.': 'expired',
  'This promo code has reached its redemption limit.': 'limit_reached',
  'You have already redeemed this promo code.': 'already_redeemed',
  'This promo code is a payment discount and cannot be used for free access.': 'payment_discount',
  'Your account already has active access.': 'active_access',
  'This promo code does not have a valid access duration.': 'invalid_duration',
};
export async function promoErrorMessage(error, data) {
  let body = data;
  const response = error?.context;
  if (response && typeof response.clone === 'function') {
    try { body = await response.clone().json(); } catch { /* Use a safe fallback for non-JSON replies. */ }
  }
  if (error?.code === 'session_expired' || response?.status === 401 || response?.status === 403) {
    return 'Please sign in again, then enter your promo code.';
  }
  const outcome = body?.outcome || legacy[body?.error];
  if (Object.hasOwn(messages, outcome)) return messages[outcome];
  if (error?.name === 'FunctionsFetchError' || error?.name === 'FunctionsRelayError' || error instanceof TypeError) {
    return "We couldn't connect to apply your code. Check your internet connection and try again.";
  }
  return fallback;
}
