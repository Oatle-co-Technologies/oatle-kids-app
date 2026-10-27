import { createSupabaseContext } from "npm:@supabase/server@^1";
import { corsHeaders } from "npm:@supabase/supabase-js@^2/cors";
const messages: Record<string, string> = {
  invalid_code: "Invalid promo code.",
  inactive: "This promo code is no longer active.",
  wrong_account: "This promo code is assigned to another account.",
  not_started: "This promo code is not active yet.",
  expired: "This promo code has expired.",
  limit_reached: "This promo code has reached its redemption limit.",
  already_redeemed: "You have already redeemed this promo code.",
  payment_discount: "This promo code is a payment discount and cannot be used for free access.",
  active_access: "Your account already has active access.",
  invalid_duration: "This promo code does not have a valid access duration.",
};
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status, headers: { ...corsHeaders, "Cache-Control": "no-store" },
  });
}
export default {
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
    const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: "user" });
    if (authError) return jsonResponse({ error: "Please sign in to redeem a promo code." }, authError.status);
    const userId = ctx.userClaims?.id;
    if (!userId) return jsonResponse({ error: "Authenticated user information is missing." }, 401);
    let body: unknown;
    try { body = await req.json(); }
    catch { return jsonResponse({ error: "Invalid request body." }, 400); }
    const code = body && typeof body === "object" && !Array.isArray(body)
      ? (body as { code?: unknown }).code : undefined;
    if (typeof code !== "string" || !code.trim() || code.trim().length > 256) {
      return jsonResponse({ error: "Please enter a valid promo code." }, 400);
    }
    try {
      const { data, error } = await ctx.supabaseAdmin.rpc("redeem_free_promo_atomic", {
        p_user_id: userId, p_code: code.trim().toUpperCase(),
      });
      if (error || !data?.outcome) throw new Error("redemption_failed");
      if (data.outcome !== "redeemed") {
        const message = messages[data.outcome];
        if (!message) throw new Error("unexpected_outcome");
        return jsonResponse({ error: message }, 400);
      }
      return jsonResponse({
        success: true,
        message: data.expires_at
          ? "Promo code redeemed successfully. Your access has been granted."
          : "Promo code redeemed successfully. You now have lifetime access.",
        expires_at: data.expires_at,
      });
    } catch {
      console.warn("promo_redemption_failed");
      return jsonResponse({ error: "Could not redeem promo code. Please try again." }, 500);
    }
  },
};
