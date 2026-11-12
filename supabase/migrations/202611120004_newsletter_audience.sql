create function public.newsletter_audience(p_after text default '')
returns table (email text)
language sql stable security definer set search_path = '' as $$
  select distinct lower(btrim(u.email)) as email
  from auth.users u
  join public.email_preferences p on p.user_id = u.id
  where p.opted_in and u.email_confirmed_at is not null
    and lower(btrim(u.email)) > p_after
  order by email
  limit 500;
$$;

revoke all on function public.newsletter_audience(text) from public, anon, authenticated;
grant execute on function public.newsletter_audience(text) to service_role;
