create table public.subscription_confirmation_outbox (
  subscription_id uuid primary key references public.subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  amount_cents integer not null,
  period_end timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'review')),
  available_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  locked_until timestamptz,
  attempts integer not null default 0,
  recipient text,
  provider_id text,
  sent_at timestamptz
);
alter table public.subscription_confirmation_outbox enable row level security;
revoke all on public.subscription_confirmation_outbox from public, anon, authenticated;
grant select, update on public.subscription_confirmation_outbox to service_role;

create function public.queue_subscription_confirmation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- The verified ITN records the live receipt before activating the subscription.
  if exists (
    select 1 from public.payfast_itn_receipts r
    where r.subscription_id = new.id and r.event_key like 'live:complete:%'
  ) then
    insert into public.subscription_confirmation_outbox
      (subscription_id, user_id, plan_id, amount_cents, period_end)
    values (new.id, new.user_id, new.plan_id, new.amount_cents, new.current_period_end)
    on conflict (subscription_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.queue_subscription_confirmation() from public, anon, authenticated;
create trigger queue_subscription_confirmation
after update of status, current_period_end on public.subscriptions
for each row when (
  old.status = 'pending' and old.current_period_end is null
  and new.status = 'active' and new.current_period_end is not null
  and new.provider = 'payfast' and new.frequency = 'monthly' and new.currency = 'ZAR'
  and new.plan_id in ('single', 'family') and new.amount_cents > 0
) execute function public.queue_subscription_confirmation();

create function public.claim_subscription_confirmation()
returns setof public.subscription_confirmation_outbox
language plpgsql security definer set search_path = '' as $$
begin
  -- Stop automatic retries before Brevo's deduplication window can expire.
  update public.subscription_confirmation_outbox
  set status = 'review', locked_until = null
  where status in ('pending', 'sending')
    and first_attempt_at <= now() - interval '12 minutes'
    and (locked_until is null or locked_until <= now());

  return query
    with next_email as (
      select subscription_id from public.subscription_confirmation_outbox
      where (first_attempt_at is null or first_attempt_at > now() - interval '12 minutes')
        and ((status = 'pending' and available_at <= now())
          or (status = 'sending' and locked_until <= now()))
      order by available_at
      limit 1 for update skip locked
    )
    update public.subscription_confirmation_outbox o
    set status = 'sending', locked_until = now() + interval '2 minutes',
        attempts = o.attempts + 1, first_attempt_at = coalesce(o.first_attempt_at, now())
    from next_email n where o.subscription_id = n.subscription_id
    returning o.*;
end;
$$;
revoke all on function public.claim_subscription_confirmation() from public, anon, authenticated;
grant execute on function public.claim_subscription_confirmation() to service_role;
