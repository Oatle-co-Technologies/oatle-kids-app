const launchAt = Date.parse('2026-11-16T00:00:00+02:00');

export function subscriptionStatus(now = Date.now()) {
  return Number(now) >= launchAt
    ? 'Subscriptions are open.'
    : 'Subscriptions open on 16 November.';
}
