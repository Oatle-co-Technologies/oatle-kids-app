begin;

-- Existing subscriptions and promo grants retain their expiry and price.
alter table public.subscriptions add column if not exists plan_id text not null default 'single' check (plan_id in ('single','family'));
alter table public.entitlements add column if not exists plan_id text not null default 'single' check (plan_id in ('single','family'));

-- Derive limits from verified grants, never from browser input or promo metadata.
create or replace function public.enforce_entitlement_plan() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.plan_id := 'single';
  if new.access_type = 'subscription' and exists (
    select 1 from public.subscriptions s where s.id = new.subscription_id and s.user_id = new.user_id
      and s.provider = 'payfast' and s.plan_id = 'family' and s.amount_cents = 20000
      and s.currency = 'ZAR' and s.frequency = 'monthly' and s.status in ('active','cancelled') and s.current_period_end > now()
  ) then new.plan_id := 'family'; end if;
  return new;
end $$;
create trigger enforce_household_plan before insert or update on public.entitlements
for each row execute function public.enforce_entitlement_plan();
update public.entitlements set plan_id = 'single' where plan_id <> 'single';

create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (length(btrim(nickname)) between 1 and 30),
  created_at timestamptz not null default clock_timestamp(),
  unique(user_id,id)
);
create index child_profiles_owner on public.child_profiles(user_id,created_at,id);
create table public.household_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key uuid not null,
  label text not null check(length(label) between 1 and 60),
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(user_id,device_key), unique(user_id,id)
);
create table public.household_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  session_id uuid not null,
  play_key uuid not null,
  child_id uuid not null,
  expires_at timestamptz not null,
  primary key(user_id,device_id),
  foreign key(user_id,device_id) references public.household_devices(user_id,id) on delete cascade,
  foreign key(user_id,child_id) references public.child_profiles(user_id,id) on delete cascade
);
create index household_sessions_expiry on public.household_sessions(user_id,expires_at);
create table public.child_progress (
  user_id uuid not null,
  child_id uuid primary key,
  revision bigint not null default 0,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
  updated_at timestamptz not null default now(),
  foreign key(user_id,child_id) references public.child_profiles(user_id,id) on delete cascade
);
alter table public.child_profiles enable row level security;
alter table public.household_devices enable row level security;
alter table public.household_sessions enable row level security;
alter table public.child_progress enable row level security;
-- No direct client table policies: all mutations go through serialized, owner-checked routines.
revoke all on public.child_profiles, public.household_devices, public.household_sessions, public.child_progress from anon, authenticated;

create or replace function public.household_limits() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_access public.entitlements%rowtype;
begin
  if v_user is null then raise exception 'Sign in required'; end if;
  select * into v_access from public.entitlements where user_id = v_user and status = 'active'
    and (expires_at is null or expires_at > now());
  if not found then raise exception 'Active access required'; end if;
  return jsonb_build_object('plan_id',v_access.plan_id,'profiles',case when v_access.plan_id='family' then 3 else 1 end,
    'devices',2,'playing',case when v_access.plan_id='family' then 2 else 1 end,'promo',v_access.access_type='promo');
end $$;

create or replace function public.household_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_limits jsonb; v_user uuid := auth.uid(); v_profiles jsonb; v_devices jsonb;
begin
  v_limits := public.household_limits();
  select coalesce(jsonb_agg(to_jsonb(p) - 'user_id' order by p.created_at,p.id),'[]') into v_profiles
    from public.child_profiles p where user_id=v_user;
  select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'label',d.label,'last_seen_at',d.last_seen_at) order by d.registered_at),'[]') into v_devices
    from public.household_devices d where user_id=v_user and revoked_at is null;
  return jsonb_build_object('limits',v_limits,'profiles',v_profiles,'devices',v_devices);
end $$;

create or replace function public.create_child_profile(p_nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_limits jsonb; v_user uuid := auth.uid(); v_profile public.child_profiles%rowtype;
begin
  v_limits := public.household_limits();
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  v_limits := public.household_limits();
  if p_nickname is null or length(btrim(p_nickname)) not between 1 and 30 then return jsonb_build_object('outcome','invalid_name'); end if;
  if (select count(*) from public.child_profiles where user_id=v_user) >= (v_limits->>'profiles')::int then
    return jsonb_build_object('outcome','profile_limit'); end if;
  insert into public.child_profiles(user_id,nickname) values(v_user,btrim(p_nickname)) returning * into v_profile;
  insert into public.child_progress(user_id,child_id) values(v_user,v_profile.id);
  return jsonb_build_object('outcome','created','profile',to_jsonb(v_profile)-'user_id');
end $$;

create or replace function public.register_household_device(p_device_key uuid,p_label text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_limits jsonb; v_user uuid:=auth.uid(); v_device public.household_devices%rowtype;
begin
  v_limits:=public.household_limits();
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  v_limits := public.household_limits();
  if p_device_key is null then return jsonb_build_object('outcome','invalid_device'); end if;
  select * into v_device from public.household_devices where user_id=v_user and device_key=p_device_key for update;
  if found and v_device.revoked_at is null then
    update public.household_devices set last_seen_at=now() where id=v_device.id;
    return jsonb_build_object('outcome','registered','device_id',v_device.id);
  end if;
  if (select count(*) from public.household_devices where user_id=v_user and revoked_at is null) >= (v_limits->>'devices')::int then
    return jsonb_build_object('outcome','device_limit'); end if;
  insert into public.household_devices(user_id,device_key,label) values(v_user,p_device_key,left(coalesce(nullif(btrim(p_label),''),'Learning device'),60))
    on conflict(user_id,device_key) do update set revoked_at=null,last_seen_at=now(),label=excluded.label returning * into v_device;
  return jsonb_build_object('outcome','registered','device_id',v_device.id);
end $$;

-- Soft revocation is reversible by registering again when a slot is available.
create or replace function public.remove_household_device(p_device_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_limits jsonb;
begin
  perform public.household_limits();
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  v_limits := public.household_limits();
  update public.household_devices set revoked_at=now() where id=p_device_id and user_id=v_user;
  delete from public.household_sessions where device_id=p_device_id and user_id=v_user;
  return jsonb_build_object('outcome','removed');
end $$;

-- One renewable lease per registered browser; one profile cannot play in two places.
-- Tokens from a signed-out/revoked auth session cannot open a lease.
create or replace function public.start_child_session(p_device_key uuid,p_child_id uuid,p_play_key uuid,p_heartbeat boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_session uuid; v_device uuid; v_limits jsonb; v_existing public.household_sessions%rowtype; v_progress public.child_progress%rowtype;
begin
  v_limits:=public.household_limits();
  v_session:=(auth.jwt()->>'session_id')::uuid;
  if v_session is null or not exists(select 1 from auth.sessions where id=v_session and user_id=v_user) or p_play_key is null then
    return jsonb_build_object('outcome','sign_in_required'); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  v_limits := public.household_limits();
  select id into v_device from public.household_devices where user_id=v_user and device_key=p_device_key and revoked_at is null;
  if v_device is null then return jsonb_build_object('outcome','device_required'); end if;
  if not exists(select 1 from (select id from public.child_profiles where user_id=v_user order by created_at,id limit (v_limits->>'profiles')::int) p where id=p_child_id) then
    return jsonb_build_object('outcome','profile_limit'); end if;
  delete from public.household_sessions where user_id=v_user and expires_at<=now();
  -- Remove leases invalidated by logging out on another device.
  delete from public.household_sessions h where h.user_id=v_user and not exists(select 1 from auth.sessions a where a.id=h.session_id and a.user_id=v_user);
  select * into v_existing from public.household_sessions where user_id=v_user and device_id=v_device;
  if found and (v_existing.play_key<>p_play_key or v_existing.child_id<>p_child_id) then return jsonb_build_object('outcome','device_busy'); end if;
  if exists(select 1 from public.household_sessions where user_id=v_user and child_id=p_child_id and device_id<>v_device) then
    return jsonb_build_object('outcome','child_busy'); end if;
  if not exists(select 1 from public.household_sessions where user_id=v_user and device_id=v_device)
    and (select count(*) from public.household_sessions where user_id=v_user) >= (v_limits->>'playing')::int then
    return jsonb_build_object('outcome','play_limit'); end if;
  -- Downgrades keep existing profiles/progress, but never preserve extra active leases.
  if (select count(*) from public.household_sessions where user_id=v_user) > (v_limits->>'playing')::int then
    return jsonb_build_object('outcome','play_limit'); end if;
  insert into public.household_sessions(user_id,device_id,session_id,play_key,child_id,expires_at)
    values(v_user,v_device,v_session,p_play_key,p_child_id,now()+interval '90 seconds')
    on conflict(user_id,device_id) do update set expires_at=excluded.expires_at,session_id=excluded.session_id;
  update public.household_devices set last_seen_at=now() where id=v_device;
  select * into v_progress from public.child_progress where child_id=p_child_id and user_id=v_user;
  if p_heartbeat then return jsonb_build_object('outcome','started','revision',v_progress.revision,'lease_seconds',90); end if;
  return jsonb_build_object('outcome','started','revision',v_progress.revision,'data',v_progress.data,'lease_seconds',90);
end $$;

create or replace function public.end_child_session(p_play_key uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.household_sessions where user_id=auth.uid() and play_key=p_play_key and session_id=(auth.jwt()->>'session_id')::uuid;
  return jsonb_build_object('outcome','ended');
end $$;

create or replace function public.save_child_progress(p_child_id uuid,p_play_key uuid,p_revision bigint,p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=auth.uid(); v_limits jsonb; v_progress public.child_progress%rowtype;
begin
  v_limits:=public.household_limits();
  perform pg_advisory_xact_lock(hashtextextended(v_user::text,0));
  v_limits := public.household_limits();
  if not exists(select 1 from public.household_sessions s join public.household_devices d on d.id=s.device_id
    join auth.sessions a on a.id=s.session_id and a.user_id=s.user_id
    where s.user_id=v_user and s.child_id=p_child_id and s.play_key=p_play_key and s.session_id=(auth.jwt()->>'session_id')::uuid
      and s.expires_at>now() and d.revoked_at is null) then return jsonb_build_object('outcome','session_required'); end if;
  if not exists(select 1 from (select id from public.child_profiles where user_id=v_user order by created_at,id limit (v_limits->>'profiles')::int) p where p.id=p_child_id) then return jsonb_build_object('outcome','profile_limit'); end if;
  if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>2000000 then return jsonb_build_object('outcome','invalid_progress'); end if;
  select * into v_progress from public.child_progress where child_id=p_child_id and user_id=v_user for update;
  if not found or p_revision is null or v_progress.revision<>p_revision then return jsonb_build_object('outcome','conflict'); end if;
  update public.child_progress set data=p_data,revision=revision+1,updated_at=now() where child_id=p_child_id returning * into v_progress;
  return jsonb_build_object('outcome','saved','revision',v_progress.revision);
end $$;

-- Service-only checkout reservation serializes double clicks and rejects a second recurring subscription.
create or replace function public.prepare_plan_checkout(p_user_id uuid,p_plan_id text,p_payment_id text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v_pending public.subscriptions%rowtype; v_amount integer;
begin
  if p_user_id is null or p_plan_id is null or p_plan_id not in ('single','family') then return jsonb_build_object('outcome','invalid_plan'); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
  if exists(select 1 from public.subscriptions where user_id=p_user_id and status='active' and provider='payfast') then
    return jsonb_build_object('outcome','existing_subscription'); end if;
  select * into v_pending from public.subscriptions where user_id=p_user_id and status='pending' and provider='payfast' order by created_at desc limit 1;
  if found then
    if v_pending.plan_id<>p_plan_id then return jsonb_build_object('outcome','pending_subscription'); end if;
    return jsonb_build_object('outcome','ready','payment_id',v_pending.provider_payment_id,'plan_id',v_pending.plan_id,'amount_cents',v_pending.amount_cents);
  end if;
  v_amount:=case when p_plan_id='family' then 20000 else 12000 end;
  insert into public.subscriptions(user_id,provider,provider_payment_id,status,amount_cents,currency,frequency,plan_id)
    values(p_user_id,'payfast',p_payment_id,'pending',v_amount,'ZAR','monthly',p_plan_id);
  return jsonb_build_object('outcome','ready','payment_id',p_payment_id,'plan_id',p_plan_id,'amount_cents',v_amount);
end $$;

revoke all on function public.enforce_entitlement_plan() from public, anon, authenticated;
revoke all on function public.household_limits(),public.household_overview(),public.create_child_profile(text),public.register_household_device(uuid,text),public.remove_household_device(uuid),public.start_child_session(uuid,uuid,uuid,boolean),public.end_child_session(uuid),public.save_child_progress(uuid,uuid,bigint,jsonb) from public, anon;
grant execute on function public.household_limits(),public.household_overview(),public.create_child_profile(text),public.register_household_device(uuid,text),public.remove_household_device(uuid),public.start_child_session(uuid,uuid,uuid,boolean),public.end_child_session(uuid),public.save_child_progress(uuid,uuid,bigint,jsonb) to authenticated;
revoke all on function public.prepare_plan_checkout(uuid,text,text) from public, anon, authenticated;
grant execute on function public.prepare_plan_checkout(uuid,text,text) to service_role;
commit;
