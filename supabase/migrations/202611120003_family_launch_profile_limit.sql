create or replace function public.household_limits() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_access public.entitlements%rowtype;
  v_profiles int := 1;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  select * into v_access from public.entitlements
    where user_id = v_user and status = 'active'
      and (expires_at is null or expires_at > now());
  if not found then raise exception 'Active access required'; end if;

  if v_access.plan_id = 'family' then
    -- Keep existing third profiles playable. Family promo invitations retain their limits.
    v_profiles := case when v_access.access_type = 'promo' or exists (
      select 1 from public.child_profiles where user_id = v_user offset 2
    ) then 3 else 2 end;
  end if;

  return jsonb_build_object(
    'plan_id', v_access.plan_id, 'profiles', v_profiles, 'devices', 2,
    'playing', case when v_access.plan_id = 'family' then 2 else 1 end,
    'promo', v_access.access_type = 'promo'
  );
end $$;
