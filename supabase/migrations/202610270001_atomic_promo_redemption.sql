begin;

-- One service-only transaction: reserve capacity, record redemption and grant access.
create or replace function public.redeem_free_promo_atomic(p_user_id uuid, p_code text)
returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_promo public.promo_codes%rowtype;
  v_access public.entitlements%rowtype;
  v_used bigint;
  v_redemption uuid;
  v_now timestamptz;
  v_expiry timestamptz;
begin
  if p_user_id is null or p_code is null or length(btrim(p_code)) not between 1 and 256 then
    return jsonb_build_object('outcome', 'invalid_code');
  end if;

  -- Shared with payment activation; also serializes different promos for one user.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select * into v_promo from public.promo_codes
    where code = upper(btrim(p_code)) for update;
  if not found then return jsonb_build_object('outcome', 'invalid_code'); end if;
  v_now := clock_timestamp();

  if not v_promo.active then return jsonb_build_object('outcome', 'inactive'); end if;
  if v_promo.assigned_user_id is not null and v_promo.assigned_user_id <> p_user_id then
    return jsonb_build_object('outcome', 'wrong_account');
  end if;
  if v_promo.starts_at is not null and v_promo.starts_at > v_now then
    return jsonb_build_object('outcome', 'not_started');
  end if;
  if v_promo.expires_at is not null and v_promo.expires_at <= v_now then
    return jsonb_build_object('outcome', 'expired');
  end if;
  -- Paid discounts never create free access, including 100% percentage codes.
  if v_promo.discount_type not in ('free_months', 'free_access') then
    return jsonb_build_object('outcome', 'payment_discount');
  end if;
  if exists (select 1 from public.promo_redemptions
             where promo_code_id = v_promo.id and user_id = p_user_id) then
    return jsonb_build_object('outcome', 'already_redeemed');
  end if;

  -- Honor historical reservations, but never trust an undercount from old races.
  select greatest(v_promo.redemptions_count::bigint, count(*)) into v_used
    from public.promo_redemptions where promo_code_id = v_promo.id;
  if v_promo.max_redemptions is not null and v_used >= v_promo.max_redemptions then
    return jsonb_build_object('outcome', 'limit_reached');
  end if;

  select * into v_access from public.entitlements where user_id = p_user_id for update;
  if found and v_access.status = 'active'
     and (v_access.expires_at is null or v_access.expires_at > v_now) then
    return jsonb_build_object('outcome', 'active_access');
  end if;
  if v_promo.lifetime then
    v_expiry := null;
  elsif v_promo.duration_days > 0 then
    v_expiry := v_now + make_interval(days => v_promo.duration_days);
  elsif v_promo.duration_months > 0 then
    v_expiry := v_now + make_interval(months => v_promo.duration_months);
  else
    return jsonb_build_object('outcome', 'invalid_duration');
  end if;

  insert into public.promo_redemptions(promo_code_id, user_id, created_entitlement_until)
    values (v_promo.id, p_user_id, v_expiry) returning id into v_redemption;
  update public.promo_codes set redemptions_count = v_used + 1 where id = v_promo.id;
  insert into public.entitlements
    (user_id, access_type, status, expires_at, subscription_id, promo_redemption_id, updated_at)
    values (p_user_id, 'promo', 'active', v_expiry, null, v_redemption, v_now)
    on conflict (user_id) do update set
      access_type = excluded.access_type, status = excluded.status,
      expires_at = excluded.expires_at, subscription_id = null,
      promo_redemption_id = excluded.promo_redemption_id, updated_at = excluded.updated_at;
  -- Any write failure aborts the whole statement, including the capacity increment.
  return jsonb_build_object('outcome', 'redeemed', 'expires_at', v_expiry);
end;
$$;
revoke all on function public.redeem_free_promo_atomic(uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_free_promo_atomic(uuid, text) to service_role;

commit;
