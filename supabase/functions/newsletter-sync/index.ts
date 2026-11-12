import { createClient } from 'npm:@supabase/supabase-js@2';
import { reconcileNewsletter } from '../_shared/newsletter-sync.mjs';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('NEWSLETTER_SYNC_SECRET');
  if (!secret || req.headers.get('X-Newsletter-Sync-Secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = Deno.env.get('BREVO_NEWSLETTER_API_KEY');
  if (!apiKey) return new Response('Missing newsletter configuration', { status: 503 });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  try {
    const audience = new Set<string>();
    let after = '';
    while (true) {
      const { data, error } = await db.rpc('newsletter_audience', { p_after: after });
      if (error || !data) throw new Error('Could not read newsletter consent');
      if (!data.length) break;
      for (const row of data) audience.add(row.email);
      after = data.at(-1).email;
    }
    const dryRun = Deno.env.get('BREVO_NEWSLETTER_SYNC_ENABLED') !== 'true';
    return Response.json(await reconcileNewsletter({ apiKey, audience, dryRun }));
  } catch {
    return Response.json({ error: 'Newsletter sync failed' }, { status: 502 });
  }
});
