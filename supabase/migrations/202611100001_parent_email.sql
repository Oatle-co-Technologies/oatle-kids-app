-- No historical user is opted in. Signup metadata is read only on INSERT.
create table public.email_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 opted_in boolean not null default false,
 version text not null default '2026-11-10',
 source text not null default 'signup',
 updated_at timestamptz not null default now()
);
create table public.email_consent_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 opted_in boolean not null, source text not null, version text not null,
 created_at timestamptz not null default now()
);
create table public.assessment_reports (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 subject text not null check(subject in ('reading','maths')),
 scores jsonb not null, created_at timestamptz not null default now()
);
create table public.parent_email_outbox (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('report','reminder')),
 report_id uuid unique references public.assessment_reports(id) on delete cascade,
 campaign text, status text not null default 'pending' check(status in ('pending','sending','sent','suppressed','review')),
 attempts integer not null default 0, first_attempt_at timestamptz,
 locked_until timestamptz, available_at timestamptz not null default now(),
 provider_id text, sent_at timestamptz, created_at timestamptz not null default now(),
 unique(user_id,campaign), check((kind='report') = (report_id is not null))
);
create table public.email_unsubscribe_tokens (
 token_hash text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.email_preferences enable row level security;
alter table public.email_consent_events enable row level security;
alter table public.assessment_reports enable row level security;
alter table public.parent_email_outbox enable row level security;
alter table public.email_unsubscribe_tokens enable row level security;
revoke all on public.email_preferences, public.email_consent_events, public.assessment_reports, public.parent_email_outbox, public.email_unsubscribe_tokens from anon, authenticated;
grant select on public.email_preferences, public.assessment_reports to authenticated;
create policy own_preferences on public.email_preferences for select to authenticated using(user_id=auth.uid());
create policy own_reports on public.assessment_reports for select to authenticated using(user_id=auth.uid());

create function public.capture_email_consent() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_opt boolean := coalesce(new.raw_user_meta_data->'email_marketing_opt_in' = 'true'::jsonb, false);
begin
 insert into public.email_preferences(user_id,opted_in) values(new.id,v_opt);
 insert into public.email_consent_events(user_id,opted_in,source,version) values(new.id,v_opt,'signup','2026-11-10');
 return new;
end $$;
create trigger capture_email_consent after insert on auth.users for each row execute function public.capture_email_consent();
insert into public.email_preferences(user_id) select id from auth.users on conflict do nothing;

create function public.set_email_marketing(p_opted_in boolean) returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or p_opted_in is null then raise exception 'Authentication and choice required'; end if;
 insert into public.email_preferences(user_id,opted_in,source) values(auth.uid(),p_opted_in,'preferences')
 on conflict(user_id) do update set opted_in=excluded.opted_in, source='preferences', updated_at=now();
 insert into public.email_consent_events(user_id,opted_in,source,version) values(auth.uid(),p_opted_in,'preferences','2026-11-10');
 if not p_opted_in then update public.parent_email_outbox set status='suppressed' where user_id=auth.uid() and kind='reminder' and status='pending'; end if;
end $$;
revoke all on function public.set_email_marketing(boolean) from public,anon;
grant execute on function public.set_email_marketing(boolean) to authenticated;

-- Atomic report + queue insertion; retrying the same attempt cannot queue twice.
create function public.enqueue_assessment(p_id uuid,p_subject text,p_scores jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_existing public.assessment_reports%rowtype; v_skill text; v_total int; v_count int; v_skills text[];
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 v_skills := case p_subject when 'reading' then array['capital','lowercase','matching','word-order','reading','missing','sentences']
 when 'maths' then array['number-recognition','shapes','counting','colour-recognition','colour-mixing','matching-and-sorting','addition','subtraction','multiplication','division'] else null end;
 v_total := case p_subject when 'reading' then 4 else 2 end;
 if v_skills is null or jsonb_typeof(p_scores) <> 'object' or p_scores is null then raise exception 'Invalid report'; end if;
 select count(*) into v_count from jsonb_object_keys(p_scores);
 if v_count <> cardinality(v_skills) then raise exception 'Invalid skill coverage'; end if;
 foreach v_skill in array v_skills loop
  if jsonb_typeof(p_scores->v_skill->'correct') is distinct from 'number'
   or (p_scores->v_skill->>'correct') !~ '^[0-9]+$'
   or (p_scores->v_skill->>'correct')::numeric not between 0 and v_total
   or p_scores->v_skill->'total' is distinct from to_jsonb(v_total) then raise exception 'Invalid skill score'; end if;
 end loop;
 insert into public.assessment_reports(id,user_id,subject,scores) values(p_id,auth.uid(),p_subject,p_scores) on conflict do nothing;
 select * into v_existing from public.assessment_reports where id=p_id;
 if v_existing.user_id <> auth.uid() or v_existing.subject <> p_subject or v_existing.scores <> p_scores then raise exception 'Attempt conflict'; end if;
 insert into public.parent_email_outbox(user_id,kind,report_id) values(auth.uid(),'report',p_id) on conflict(report_id) do nothing;
 return p_id;
end $$;
revoke all on function public.enqueue_assessment(uuid,text,jsonb) from public,anon;
grant execute on function public.enqueue_assessment(uuid,text,jsonb) to authenticated;

create function public.unsubscribe_email(p_hash text) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
 select user_id into v_user from public.email_unsubscribe_tokens where token_hash=p_hash;
 if v_user is null then return false; end if;
 update public.email_preferences set opted_in=false,source='unsubscribe',updated_at=now() where user_id=v_user;
 insert into public.email_consent_events(user_id,opted_in,source,version) values(v_user,false,'unsubscribe','2026-11-10');
 update public.parent_email_outbox set status='suppressed' where user_id=v_user and kind='reminder' and status='pending';
 return true;
end $$;
revoke all on function public.unsubscribe_email(text) from public,anon,authenticated;
grant execute on function public.unsubscribe_email(text) to service_role;

-- Only service-role workers can enqueue marketing or lease a batch.
create function public.enqueue_subscription_reminders() returns void language sql security definer set search_path = '' as $$
 insert into public.parent_email_outbox(user_id,kind,campaign)
 select u.id,'reminder','subscription-registration-v1' from auth.users u
 join public.email_preferences p on p.user_id=u.id and p.opted_in
 where u.email_confirmed_at is not null and u.created_at < now()-interval '2 days'
 and not exists(select 1 from public.subscriptions s where s.user_id=u.id and (s.status in ('active','trialing','past_due') or s.current_period_end > now()))
 and not exists(select 1 from public.entitlements e where e.user_id=u.id and e.status='active' and (e.expires_at is null or e.expires_at > now()))
 on conflict(user_id,campaign) do nothing;
$$;
create function public.claim_parent_emails() returns setof public.parent_email_outbox language plpgsql security definer set search_path = '' as $$
begin
 -- Resend idempotency lasts 24h. Never auto-retry ambiguous delivery beyond 23h.
 update public.parent_email_outbox set status='review' where status in ('pending','sending') and first_attempt_at < now()-interval '23 hours';
 return query with batch as (
  select id from public.parent_email_outbox where (status='pending' and available_at<=now()) or (status='sending' and locked_until<now())
  order by created_at limit 20 for update skip locked
 ) update public.parent_email_outbox o set status='sending',locked_until=now()+interval '5 minutes',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now())
 from batch where o.id=batch.id returning o.*;
end $$;
revoke all on function public.enqueue_subscription_reminders(), public.claim_parent_emails(), public.capture_email_consent() from public,anon,authenticated;
grant execute on function public.enqueue_subscription_reminders(), public.claim_parent_emails() to service_role;
-- Payload is private to the worker and frozen before any provider call.
alter table public.parent_email_outbox add column payload jsonb;
grant all on public.email_preferences, public.email_consent_events, public.assessment_reports, public.parent_email_outbox, public.email_unsubscribe_tokens to service_role;
grant usage,select on sequence public.email_consent_events_id_seq to service_role;
