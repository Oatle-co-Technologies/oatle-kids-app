import { subscriptionPlan } from '../quick-service/subscriptionPlans.js';

const support = 'info@oatle-technologies.co.za';
const appUrl = 'https://www.oatlekids.co.za/app.html';

export function confirmationMessage(job, from, recipient) {
  const plan = subscriptionPlan(job.plan_id);
  const amount = (job.amount_cents / 100).toFixed(2);
  const renewal = new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'long', timeZone: 'Africa/Johannesburg',
  }).format(new Date(job.period_end));
  const paragraphs = [
    'Your Oatle Kids subscription is active.',
    `${plan.name} · R${amount} per month`,
    `Your next renewal is expected around ${renewal}. Payfast handles your monthly payment.`,
    'You can sign in with this email address and start exploring.',
  ];
  return {
    sender: { email: from, name: 'Oatle Kids' },
    to: [{ email: recipient }],
    replyTo: { email: support, name: 'Oatle Kids Support' },
    subject: 'Your Oatle Kids subscription is active',
    textContent: [...paragraphs, `Open Oatle Kids: ${appUrl}`, `Need help? Email ${support}.`].join('\n\n'),
    htmlContent: `<!doctype html><html lang="en"><body>${paragraphs.map(text => `<p>${text}</p>`).join('')}<p><a href="${appUrl}">Open Oatle Kids</a></p><p>Need help? Email <a href="mailto:${support}">${support}</a>.</p></body></html>`,
    headers: { idempotencyKey: job.subscription_id },
    tags: ['subscription-confirmation'],
  };
}

export async function sendConfirmation(fetcher, key, message) {
  const response = await fetcher('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => null);
  if (response.ok && typeof result?.messageId === 'string') return { status: 'sent', provider_id: result.messageId };
  if (result?.code === 'duplicate_parameter' && /idempotency/i.test(result.message ?? '')) return { status: 'sent' };
  if (response.status === 429 || response.status >= 500 || response.ok) return { status: 'pending' };
  return { status: 'review' };
}
