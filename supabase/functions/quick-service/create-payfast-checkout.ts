import { createSupabaseContext } from 'npm:@supabase/server@^1';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors';
import { makeCheckout } from './checkout.mjs';

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
    let body;
    try { body = await req.json(); } catch { return json({ error: 'Please choose a subscription plan.' }, 400); }
    const planId = body?.plan_id ?? 'single';
    if (!['single', 'family'].includes(planId)) return json({ error: 'Unknown subscription plan.' }, 400);
    const paymentId = crypto.randomUUID();
    try {
      const { data: reservation, error } = await ctx.supabaseAdmin.rpc('prepare_plan_checkout', {
        p_user_id: userId, p_plan_id: planId, p_payment_id: paymentId,
      });
      if (error) return json({ error: 'Could not start your subscription. Please try again.' }, 500);
      if (reservation?.outcome === 'existing_subscription') return json({ error: 'You already have a recurring subscription. Contact support to change plans without duplicate billing.' }, 409);
      if (reservation?.outcome === 'pending_subscription') return json({ error: 'A checkout for another plan is already open. Finish that checkout or contact support to change the plan safely.' }, 409);
      if (reservation?.outcome !== 'ready') return json({ error: 'Could not reserve this plan.' }, 400);
      const checkout = makeCheckout({ merchantId, merchantKey, passphrase, appUrl, supabaseUrl, userId, email,
        paymentId: reservation.payment_id, planId: reservation.plan_id });
      return json(checkout);
    } catch {
      return json({ error: 'Subscription checkout is not configured correctly.' }, 503);
    }
  },
};
