create function public.claim_marketing_reminder()
returns setof public.parent_email_outbox
language plpgsql security definer set search_path = '' as $$
begin
  update public.parent_email_outbox set status='review', locked_until=null
  where kind='reminder' and status in ('pending','sending')
    and first_attempt_at <= now()-interval '12 minutes'
    and (locked_until is null or locked_until <= now());

  return query with next_email as (
    select id from public.parent_email_outbox
    where kind='reminder'
      and (first_attempt_at is null or first_attempt_at > now()-interval '12 minutes')
      and ((status='pending' and available_at <= now())
        or (status='sending' and locked_until <= now()))
    order by created_at limit 1 for update skip locked
  )
  update public.parent_email_outbox o
  set status='sending', locked_until=now()+interval '2 minutes',
      attempts=o.attempts+1, first_attempt_at=coalesce(o.first_attempt_at,now())
  from next_email n where o.id=n.id returning o.*;
end;
$$;
revoke all on function public.claim_marketing_reminder() from public, anon, authenticated;
grant execute on function public.claim_marketing_reminder() to service_role;
