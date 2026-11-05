import { withSupabase } from "npm:@supabase/server@^1";
import { createHash, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate";
const MAX_BODY_BYTES = 32768;

export function phpUrlencode(value: string) {
  return encodeURIComponent(value).replace(/[!'()*~]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%20/g, "+");
}

export function moneyToCents(value: string | undefined): number | null {
  if (!value || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return cents <= 2147483647 ? cents : null;
}

export function parseNotification(raw: string) {
  const entries = [...new URLSearchParams(raw).entries()];
  if (!entries.length || entries.length > 100 || entries.at(-1)?.[0] !== "signature") throw new Error("invalid_fields");
  const names = new Set<string>();
  for (const [name, value] of entries) {
    if (!/^[a-z0-9_]+$/.test(name) || names.has(name) || value.length > 4096) throw new Error("invalid_fields");
    names.add(name);
  }
  const data = Object.fromEntries(entries);
  if (!/^[a-f0-9]{32}$/i.test(data.signature)) throw new Error("invalid_signature");
  const parameterString = entries.slice(0, -1).map(([key, value]) => `${key}=${phpUrlencode(value)}`).join("&");
  return { data, parameterString };
}

type Dependencies = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  log: (reason: string) => void;
};
type Context = { supabaseAdmin: { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: { outcome?: string } | null; error: unknown }> } };

export function createPayfastHandler(deps: Dependencies) {
  return async (req: Request, ctx: Context): Promise<Response> => {
    const respond = (status: number, message: string) => new Response(message, {
      status, headers: { "Cache-Control": "no-store", ...(status === 503 ? { "Retry-After": "60" } : {}) },
    });
    // Log fixed reason codes only: never payloads, signatures, tokens, or errors.
    const reject = (status: number, reason: string) => { deps.log(reason); return respond(status, status === 503 ? "Please retry" : "Notification rejected"); };
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } });
    if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(req.headers.get("content-type") || "")) return reject(415, "unsupported_content_type");
    // Live payment activation is explicitly enabled after merchant setup.
    if (deps.env("PAYFAST_LIVE_ACTIVATION_ENABLED") !== "true") return reject(503, "subscriptions_paused");
    const merchantId = deps.env("PAYFAST_MERCHANT_ID");
    const passphrase = deps.env("PAYFAST_PASSPHRASE");
    if (!merchantId || !passphrase) return reject(503, "missing_configuration");
    if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) return reject(413, "body_too_large");

    let raw: string;
    try { raw = await req.text(); } catch { return reject(400, "invalid_body"); }
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reject(413, "body_too_large");
    let notification: ReturnType<typeof parseNotification>;
    try { notification = parseNotification(raw); } catch { return reject(400, "invalid_fields"); }
    const { data, parameterString } = notification;
    const expected = createHash("md5").update(`${parameterString}&passphrase=${phpUrlencode(passphrase)}`).digest();
    if (!timingSafeEqual(expected, Buffer.from(data.signature, "hex"))) return reject(403, "signature_mismatch");
    if (data.merchant_id !== merchantId) return reject(403, "merchant_mismatch");
    if (!["COMPLETE", "CANCELLED"].includes(data.payment_status)) return reject(400, "unsupported_status");
    if ((!data.m_payment_id && !data.token) || (data.m_payment_id?.length || 0) > 200 || (data.token?.length || 0) > 200) return reject(400, "missing_payment_reference");
    const amountCents = moneyToCents(data.amount_gross);
    if (data.payment_status === "COMPLETE" && (!/^[0-9]{1,40}$/.test(data.pf_payment_id || "") || amountCents === null || amountCents <= 0)) return reject(400, "invalid_payment");

    // Independently confirm the notification with the live PayFast service.
    try {
      const validation = await deps.fetch(VALIDATE_URL, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: parameterString, signal: AbortSignal.timeout(15000),
      });
      if (!validation.ok) return reject(503, "validation_unavailable");
      if ((await validation.text()).trim() !== "VALID") return reject(403, "provider_rejected");
    } catch { return reject(503, "validation_unavailable"); }

    try {
      const { data: result, error } = await ctx.supabaseAdmin.rpc("apply_payfast_itn", {
        p_payment_reference: data.m_payment_id || null, p_pf_payment_id: data.pf_payment_id || null,
        p_token: data.token || null, p_status: data.payment_status, p_amount_cents: amountCents,
        p_user_id: data.custom_str1 || null,
      });
      if (error || !result?.outcome) return reject(503, "database_unavailable");
      if (["processed", "duplicate"].includes(result.outcome)) return respond(200, "OK");
      if (["legacy_review_required", "unknown_subscription"].includes(result.outcome)) return reject(503, result.outcome);
      return reject(400, "payment_record_mismatch");
    } catch { return reject(503, "database_unavailable"); }
  };
}

export default {
  fetch: withSupabase({ auth: "none" }, createPayfastHandler({
    env: name => Deno.env.get(name), fetch: (...args) => fetch(...args),
    log: reason => console.warn("payfast_itn", reason),
  })),
};
