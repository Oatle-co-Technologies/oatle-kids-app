import { createClient } from 'npm:@supabase/supabase-js@2';
import { confirmationMessage, sendConfirmation } from '../_shared/subscription-confirmation.mjs';

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('SUBSCRIPTION_EMAIL_WORKER_SECRET');
  if (!secret || req.headers.get('X-Email-Worker-Secret') !== secret) return new Response('Unauthorized', { status: 401 });
  if (Deno.env.get('SUBSCRIPTION_EMAIL_ENABLED') !== 'true') return Response.json({ disabled: true });

  const key = Deno.env.get('BREVO_API_KEY');
  const from = 'noreply@oatlekids.co.za';
  if (!key) return new Response('Missing email configuration', { status: 503 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    // Bound each invocation so a provider outage cannot exhaust the worker.
    for (let processed = 0; processed < 5; processed++) {
      const { data, error } = await db.rpc('claim_subscription_confirmation');
      if (error) throw error;
      const job = data?.[0];
      if (!job) return Response.json({ processed });

      const update = async (values: Record<string, unknown>) => {
        const { data, error } = await db.from('subscription_confirmation_outbox')
          .update(values).eq('subscription_id', job.subscription_id).eq('attempts', job.attempts)
          .eq('status', 'sending').select('subscription_id').single();
        if (error || !data) throw new Error('Could not update claimed confirmation');
      };

      let outcome;
      try {
        const { data: { user }, error } = await db.auth.admin.getUserById(job.user_id);
        if (error) throw error;
        if (!user?.email || !user.email_confirmed_at || (job.recipient && job.recipient !== user.email)) {
          outcome = { status: 'review' };
        } else {
          if (!job.recipient) await update({ recipient: user.email });
          outcome = await sendConfirmation(fetch, key, confirmationMessage(job, from, user.email));
        }
      } catch {
        outcome = { status: 'pending' };
      }
      await update({
        ...outcome,
        locked_until: null,
        ...(outcome.status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
        ...(outcome.status === 'pending' ? { available_at: new Date(Date.now() + 60000).toISOString() } : {}),
      });
    }
    return Response.json({ processed: 5 });
  } catch {
    return new Response('Confirmation worker unavailable', { status: 503 });
  }
});
