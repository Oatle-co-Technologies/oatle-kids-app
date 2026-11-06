import { createSupabaseContext } from 'npm:@supabase/server@^1';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors';
import { makeCheckout, PRICE_CENTS } from './checkout.mjs';

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } });
}
export default {
  fetch: async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: 'user' });
    if (authError) return json({ error: 'Please log in to subscribe.' }, authError.status);
    if (Deno.env.get('PAYFAST_CHECKOUT_ENABLED') !== 'true') return json({ error: 'Subscriptions are not available yet.' }, 503);
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID');
    const merchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY');
    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE');
    const appUrl = Deno.env.get('APP_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!merchantId || !merchantKey || !passphrase || !appUrl || !supabaseUrl) return json({ error: 'Subscription checkout is not configured.' }, 503);
    const userId = ctx.userClaims?.id || ctx.userClaims?.sub;
    const email = ctx.userClaims?.email;
    if (!userId || !email) return json({ error: 'Authenticated user information is missing.' }, 401);
    const paymentId = crypto.randomUUID();
    try {
      const checkout = makeCheckout({ merchantId, merchantKey, passphrase, appUrl, supabaseUrl, userId, email, paymentId });
      const { error } = await ctx.supabaseAdmin.from('subscriptions').insert({
        user_id: userId, provider: 'payfast', provider_payment_id: paymentId,
        status: 'pending', amount_cents: PRICE_CENTS, currency: 'ZAR', frequency: 'monthly',
      });
      if (error) return json({ error: 'Could not start your subscription. Please try again.' }, 500);
      return json(checkout);
    } catch {
      return json({ error: 'Subscription checkout is not configured correctly.' }, 503);
    }
  },
};
