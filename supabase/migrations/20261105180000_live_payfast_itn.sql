-- Live PayFast notifications are isolated from the sandbox receipt namespace.
create or replace function public.apply_payfast_itn(p_payment_reference text, p_pf_payment_id text, p_token text, p_status text, p_amount_cents integer, p_user_id text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $function$

declare
  v_sub public.subscriptions%rowtype;
  v_receipt public.payfast_itn_receipts%rowtype;
  v_key text;
  v_end timestamptz;
begin
  if p_status not in ('COMPLETE', 'CANCELLED') or p_status is null then
    return jsonb_build_object('outcome', 'rejected');
  end if;
  begin
    select * into strict v_sub from public.subscriptions
    where provider = 'payfast' and (
      (nullif(p_payment_reference, '') is not null and provider_payment_id = p_payment_reference)
      or (nullif(p_payment_reference, '') is null and nullif(p_token, '') is not null and provider_token = p_token)
    ) for update;
  exception when no_data_found or too_many_rows then
    return jsonb_build_object('outcome', 'unknown_subscription');
  end;
  if (nullif(p_user_id, '') is not null and p_user_id <> v_sub.user_id::text)
     or (v_sub.provider_token is not null and nullif(p_token, '') is not null and v_sub.provider_token <> p_token) then
    return jsonb_build_object('outcome', 'rejected');
  end if;
  if p_status = 'COMPLETE' and (
    nullif(p_pf_payment_id, '') is null or p_amount_cents is null
    or p_amount_cents <= 0 or p_amount_cents <> v_sub.amount_cents
    or v_sub.currency <> 'ZAR' or v_sub.frequency <> 'monthly'
  ) then
    return jsonb_build_object('outcome', 'amount_or_plan_mismatch');
  end if;
  v_key := case when p_status = 'COMPLETE' then 'live:complete:' || p_pf_payment_id
                else 'live:cancel:' || v_sub.id::text end;
  select * into v_receipt from public.payfast_itn_receipts where event_key = v_key;
  if found then
    return jsonb_build_object('outcome', case when v_receipt.subscription_id = v_sub.id then 'duplicate' else 'rejected' end);
  end if;
  -- Preserve old access until payment history can be reconciled.
  if p_status = 'COMPLETE' and v_sub.current_period_end is not null
     and not exists (select 1 from public.payfast_itn_receipts where subscription_id = v_sub.id and payment_status = 'COMPLETE') then
    return jsonb_build_object('outcome', 'legacy_review_required');
  end if;
  insert into public.payfast_itn_receipts(event_key, subscription_id, pf_payment_id, payment_status, amount_cents)
  values (v_key, v_sub.id, nullif(p_pf_payment_id, ''), p_status, p_amount_cents)
  on conflict do nothing returning * into v_receipt;
  if not found then
    select * into v_receipt from public.payfast_itn_receipts where event_key = v_key;
    return jsonb_build_object('outcome', case when v_receipt.subscription_id = v_sub.id then 'duplicate' else 'rejected' end);
  end if;
  if p_status = 'CANCELLED' then
    update public.subscriptions set status = 'cancelled', updated_at = now() where id = v_sub.id;
    return jsonb_build_object('outcome', 'processed');
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_sub.user_id::text, 0));
  v_end := greatest(coalesce(v_sub.current_period_end, now()), now()) + interval '1 month';
  update public.subscriptions set
    status = case when status = 'cancelled' then 'cancelled' else 'active' end,
    provider_token = coalesce(nullif(p_token, ''), provider_token),
    current_period_end = v_end, updated_at = now()
  where id = v_sub.id;
  insert into public.entitlements as existing
    (user_id, access_type, status, expires_at, subscription_id, promo_redemption_id, updated_at)
  values (v_sub.user_id, 'subscription', 'active', v_end, v_sub.id, null, now())
  on conflict (user_id) do update set
    access_type = excluded.access_type, status = excluded.status, expires_at = excluded.expires_at,
    subscription_id = excluded.subscription_id, promo_redemption_id = null, updated_at = now()
  where existing.status <> 'active'
     or (existing.expires_at is not null and existing.expires_at < excluded.expires_at);
  return jsonb_build_object('outcome', 'processed');
end;

$function$;
revoke all on function public.apply_payfast_itn(text,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.apply_payfast_itn(text,text,text,text,integer,text) to service_role;
