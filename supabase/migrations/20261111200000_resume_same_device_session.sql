-- Recover a lease left by an older window without changing profile or plan limits.
-- The app uses this endpoint only while holding its exclusive browser lock.
create or replace function public.resume_child_session(
  p_device_key uuid, p_child_id uuid, p_play_key uuid
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_result jsonb;
  v_previous public.household_sessions%rowtype;
begin
  -- The normal start checks authentication and holds the account's transaction lock.
  v_result := public.start_child_session(p_device_key, p_child_id, p_play_key);
  if v_result->>'outcome' is distinct from 'device_busy' then
    return v_result;
  end if;

  select s.* into v_previous
  from public.household_sessions s
  join public.household_devices d on d.id = s.device_id
  where s.user_id = auth.uid()
    and s.session_id = (auth.jwt()->>'session_id')::uuid
    and s.child_id = p_child_id
    and d.device_key = p_device_key
    and d.revoked_at is null
  for update of s;
  if not found then return v_result; end if;

  -- Recheck the existing lease through the normal plan and device rules before
  -- rotating its key. Late saves and heartbeats from the old window are rejected.
  v_result := public.start_child_session(p_device_key, p_child_id, v_previous.play_key);
  if v_result->>'outcome' = 'started' then
    update public.household_sessions
    set play_key = p_play_key
    where user_id = v_previous.user_id and device_id = v_previous.device_id;
  end if;
  return v_result;
end $$;

revoke all on function public.resume_child_session(uuid, uuid, uuid) from public, anon;
grant execute on function public.resume_child_session(uuid, uuid, uuid) to authenticated;
