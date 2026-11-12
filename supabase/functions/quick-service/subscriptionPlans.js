export const SUBSCRIPTION_PLANS = Object.freeze({
  single: Object.freeze({ id: 'single', name: 'Single Child', amount: '120.00', price: 120, profiles: 1, devices: 2, playing: 1 }),
  family: Object.freeze({ id: 'family', name: 'Family', amount: '200.00', price: 200, profiles: 2, devices: 2, playing: 2 }),
});
export function subscriptionPlan(id) {
  const plan = Object.hasOwn(SUBSCRIPTION_PLANS, id) && SUBSCRIPTION_PLANS[id];
  if (!plan) throw new Error('Please choose Single Child or Family.');
  return plan;
}
