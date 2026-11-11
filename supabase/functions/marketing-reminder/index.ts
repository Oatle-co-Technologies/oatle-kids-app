import { createClient } from 'npm:@supabase/supabase-js@2';
import { hashToken } from '../_shared/delivery.mjs';
import { eligibleForReminder } from '../_shared/report.mjs';
import { sendConfirmation } from '../_shared/subscription-confirmation.mjs';

const origin = 'https://www.oatlekids.co.za';
const sender = { email: 'noreply@oatlekids.co.za', name: 'Oatle Kids' };

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('MARKETING_WORKER_SECRET');
  if (!secret || req.headers.get('X-Email-Worker-Secret') !== secret) return new Response('Unauthorized', { status: 401 });
  if (Deno.env.get('BREVO_MARKETING_REMINDERS_ENABLED') !== 'true') return Response.json({ disabled: true });
  const apiKey = Deno.env.get('BREVO_API_KEY');
  if (!apiKey) return new Response('Missing email configuration', { status: 503 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  function check<T>(result: { data: T; error: unknown }) {
    if (result.error) throw new Error('Database operation failed');
    return result.data;
  }

  try {
    check(await db.rpc('enqueue_subscription_reminders'));
    for (let processed = 0; processed < 5; processed++) {
      const job = check(await db.rpc('claim_marketing_reminder'))?.[0];
      if (!job) return Response.json({ processed });
      const update = async (values: Record<string, unknown>) => {
        check(await db.from('parent_email_outbox').update(values)
          .eq('id', job.id).eq('attempts', job.attempts).eq('status', 'sending').select('id').single());
      };
      let outcome;
      try {
        const { user } = check(await db.auth.admin.getUserById(job.user_id));
        const [preferences, subscriptions, entitlements] = await Promise.all([
          db.from('email_preferences').select('opted_in').eq('user_id', job.user_id).maybeSingle(),
          db.from('subscriptions').select('status,current_period_end').eq('user_id', job.user_id),
          db.from('entitlements').select('status,expires_at').eq('user_id', job.user_id),
        ]);
        if (!user?.email || !eligibleForReminder(user, check(preferences), check(subscriptions), check(entitlements))) {
          await update({ status: 'suppressed', locked_until: null });
          continue;
        }
        let payload = job.payload;
        if (!payload) {
          const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
          check(await db.from('email_unsubscribe_tokens').insert({ token_hash: await hashToken(token), user_id: job.user_id }));
          const link = `${origin}/unsubscribe.html#${token}`;
          const intro = 'When you’re ready for your next Oatle Kids adventure, you can explore subscription options in your parent account.';
          payload = {
            sender, to: [{ email: user.email }],
            replyTo: { email: 'info@oatle-technologies.co.za', name: 'Oatle Kids Support' },
            subject: 'Ready for your next Oatle Kids adventure?',
            textContent: `${intro}\n\nOpen Oatle Kids: ${origin}/app.html\n\nYou opted in to Oatle Kids updates. Unsubscribe: ${link}`,
            htmlContent: `<p>${intro}</p><p><a href="${origin}/app.html">Open Oatle Kids</a></p><p>You opted in to Oatle Kids updates. <a href="${link}">Unsubscribe</a>.</p>`,
            headers: { idempotencyKey: job.id },
            tags: ['subscription-reminder'],
          };
          await update({ payload });
        }
        outcome = payload.to[0]?.email === user.email
          ? await sendConfirmation(fetch, apiKey, payload)
          : { status: 'review' };
      } catch {
        outcome = { status: 'pending' };
      }
      await update({
        ...outcome, locked_until: null,
        ...(outcome.status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
        ...(outcome.status === 'pending' ? { available_at: new Date(Date.now() + 60000).toISOString() } : {}),
      });
    }
    return Response.json({ processed: 5 });
  } catch {
    return new Response('Marketing reminder worker unavailable', { status: 503 });
  }
});
