begin;

-- Private testing: only a code assigned to this exact account may grant access.
-- Existing grants and promo records stay intact. Public code campaigns require
-- an explicit policy change when launch access is reopened.
do $private_testing$
declare
  definition text;
  previous_check text := 'if v_promo.assigned_user_id is not null and v_promo.assigned_user_id <> p_user_id then';
  private_check text := 'if v_promo.assigned_user_id is distinct from p_user_id then';
begin
  definition := pg_get_functiondef('public.redeem_free_promo_atomic(uuid,text)'::regprocedure);
  if position(private_check in definition) > 0 then
    return;
  end if;
  if position(previous_check in definition) = 0 then
    raise exception 'Promo policy differs from expected migration; no changes applied';
  end if;
  execute replace(definition, previous_check, private_check);
end
$private_testing$;

commit;
