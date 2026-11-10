BEGIN;

-- Existing invitations stay Single Child. Only explicitly designated invitations grant Family.
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS plan_id text NOT NULL DEFAULT 'single'
  CHECK (plan_id IN ('single','family'));

CREATE OR REPLACE FUNCTION public.enforce_entitlement_plan() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.plan_id := 'single';
  IF NEW.access_type = 'subscription' AND EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.id = NEW.subscription_id AND s.user_id = NEW.user_id
      AND s.provider = 'payfast' AND s.plan_id = 'family' AND s.amount_cents = 20000
      AND s.currency = 'ZAR' AND s.frequency = 'monthly' AND s.status IN ('active','cancelled') AND s.current_period_end > now()
  ) THEN
    NEW.plan_id := 'family';
  ELSIF NEW.access_type = 'promo' AND EXISTS (
    SELECT 1 FROM public.promo_redemptions r
    JOIN public.promo_codes c ON c.id = r.promo_code_id
    WHERE r.id = NEW.promo_redemption_id AND r.user_id = NEW.user_id
      AND r.created_entitlement_until IS NOT DISTINCT FROM NEW.expires_at
      AND c.plan_id = 'family' AND c.discount_type IN ('free_access','free_months')
  ) THEN
    NEW.plan_id := 'family';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_entitlement_plan() FROM PUBLIC, anon, authenticated;

COMMIT;
