do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; end$$;
do $$begin if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; end$$;
do $$begin if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end$$;
create schema auth;
create table auth.users(id uuid primary key);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id));
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create table public.subscriptions(
 id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),provider text not null,
 provider_payment_id text,provider_token text,status text not null,amount_cents integer not null,currency text not null,
 frequency text not null,current_period_end timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.promo_codes(id uuid primary key default gen_random_uuid(),code text not null unique,discount_type text not null,
 active boolean not null default true,assigned_user_id uuid,starts_at timestamptz,expires_at timestamptz,lifetime boolean not null default false,
 max_redemptions integer,redemptions_count integer not null default 0,duration_days integer,duration_months integer);
create table public.promo_redemptions(id uuid primary key default gen_random_uuid(),promo_code_id uuid,user_id uuid,created_entitlement_until timestamptz,unique(promo_code_id,user_id));
create table public.entitlements(user_id uuid primary key references auth.users(id),access_type text not null,status text not null,expires_at timestamptz,
 subscription_id uuid references public.subscriptions(id),promo_redemption_id uuid,updated_at timestamptz not null default now());
create table public.payfast_itn_receipts(id uuid primary key default gen_random_uuid(),event_key text unique,subscription_id uuid references public.subscriptions(id),
 pf_payment_id text,payment_status text,amount_cents integer);
grant usage on schema public to service_role;
grant select,insert,update on all tables in schema public to service_role;
