BEGIN;

-- Email-linked invitations must not grant the service role general access to auth.users.
-- This helper returns only a match result and is callable only by trusted server code.
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS assigned_email text;
CREATE OR REPLACE FUNCTION public.promo_invitation_email_matches(
  p_user_id uuid, p_assigned_email text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $email_check$
  SELECT EXISTS (
    SELECT 1 FROM auth.users AS u
    WHERE u.id = p_user_id
      AND u.email_confirmed_at IS NOT NULL
      AND lower(btrim(u.email)) = lower(btrim(p_assigned_email))
  );
$email_check$;
REVOKE ALL ON FUNCTION public.promo_invitation_email_matches(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promo_invitation_email_matches(uuid,text) TO service_role;

-- Preserve the live invitation policy, locking, limits, expiry and atomic access grant.
CREATE OR REPLACE FUNCTION public.redeem_free_promo_atomic(p_user_id uuid, p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_promo public.promo_codes%ROWTYPE;
  v_access public.entitlements%ROWTYPE;
  v_used bigint;
  v_redemption uuid;
  v_now timestamptz;
  v_expiry timestamptz;
BEGIN
  IF p_user_id IS NULL OR p_code IS NULL
     OR length(btrim(p_code)) NOT BETWEEN 1 AND 256 THEN
    RETURN jsonb_build_object('outcome', 'invalid_code');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_user_id::text, 0)
  );

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(btrim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('outcome', 'invalid_code');
  END IF;

  v_now := clock_timestamp();

  IF NOT v_promo.active THEN
    RETURN jsonb_build_object('outcome', 'inactive');
  END IF;

  -- Restrict to a user only when one is assigned.
  IF v_promo.assigned_user_id IS NOT NULL
     AND v_promo.assigned_user_id <> p_user_id THEN
    RETURN jsonb_build_object('outcome', 'wrong_account');
  END IF;

  -- Optional email restriction for invited influencers.
  -- The account must exist and its email must be verified.
  IF v_promo.assigned_email IS NOT NULL THEN
    IF NOT public.promo_invitation_email_matches(
      p_user_id, v_promo.assigned_email
    ) THEN
      RETURN jsonb_build_object('outcome', 'wrong_account');
    END IF;
  END IF;

  IF v_promo.starts_at IS NOT NULL
     AND v_promo.starts_at > v_now THEN
    RETURN jsonb_build_object('outcome', 'not_started');
  END IF;

  IF v_promo.expires_at IS NOT NULL
     AND v_promo.expires_at <= v_now THEN
    RETURN jsonb_build_object('outcome', 'expired');
  END IF;

  IF v_promo.discount_type NOT IN
     ('free_months', 'free_access') THEN
    RETURN jsonb_build_object('outcome', 'payment_discount');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.promo_redemptions
    WHERE promo_code_id = v_promo.id
      AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('outcome', 'already_redeemed');
  END IF;

  SELECT greatest(
    v_promo.redemptions_count::bigint,
    count(*)
  )
  INTO v_used
  FROM public.promo_redemptions
  WHERE promo_code_id = v_promo.id;

  IF v_promo.max_redemptions IS NOT NULL
     AND v_used >= v_promo.max_redemptions THEN
    RETURN jsonb_build_object('outcome', 'limit_reached');
  END IF;

  SELECT * INTO v_access
  FROM public.entitlements
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF FOUND AND v_access.status = 'active'
     AND (
       v_access.expires_at IS NULL
       OR v_access.expires_at > v_now
     ) THEN
    RETURN jsonb_build_object('outcome', 'active_access');
  END IF;

  IF v_promo.lifetime THEN
    v_expiry := NULL;
  ELSIF v_promo.duration_days > 0 THEN
    v_expiry := v_now +
      make_interval(days => v_promo.duration_days);
  ELSIF v_promo.duration_months > 0 THEN
    v_expiry := v_now +
      make_interval(months => v_promo.duration_months);
  ELSE
    RETURN jsonb_build_object('outcome', 'invalid_duration');
  END IF;

  INSERT INTO public.promo_redemptions (
    promo_code_id,
    user_id,
    created_entitlement_until
  )
  VALUES (
    v_promo.id,
    p_user_id,
    v_expiry
  )
  RETURNING id INTO v_redemption;

  UPDATE public.promo_codes
  SET redemptions_count = v_used + 1
  WHERE id = v_promo.id;

  INSERT INTO public.entitlements (
    user_id,
    access_type,
    status,
    expires_at,
    subscription_id,
    promo_redemption_id,
    updated_at
  )
  VALUES (
    p_user_id,
    'promo',
    'active',
    v_expiry,
    NULL,
    v_redemption,
    v_now
  )
  ON CONFLICT (user_id) DO UPDATE SET
    access_type = excluded.access_type,
    status = excluded.status,
    expires_at = excluded.expires_at,
    subscription_id = NULL,
    promo_redemption_id = excluded.promo_redemption_id,
    updated_at = excluded.updated_at;

  RETURN jsonb_build_object(
    'outcome', 'redeemed',
    'expires_at', v_expiry
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.redeem_free_promo_atomic(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_free_promo_atomic(uuid,text) TO service_role;
COMMIT;
