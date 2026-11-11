"""Run against an empty, disposable local PostgreSQL database only."""
import concurrent.futures,json,os,subprocess,uuid,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DSN=os.environ.get('HOUSEHOLD_TEST_DATABASE','postgresql://localhost:55439/postgres')
def sql(query,ok=True):
 p=subprocess.run(['psql',DSN,'-XAtq','-v','ON_ERROR_STOP=1','-c',query],capture_output=True,text=True)
 if ok and p.returncode:raise AssertionError(p.stderr)
 return p.stdout.strip() if ok else p

def ident():return str(uuid.uuid4())
def call(user,session,fn,args=''):
 out=sql(f"begin; select set_config('request.jwt.claim.sub','{user}',true); select set_config('request.jwt.claims','{{\"session_id\":\"{session}\"}}',true); set local role authenticated; select public.{fn}({args}); commit;")
 return json.loads(out.splitlines()[-1])
def account(plan='single',kind='promo'):
 u,s=ident(),ident();sql(f"insert into auth.users values('{u}');insert into auth.sessions values('{s}','{u}');")
 if kind=='subscription':
  sub=ident();amount=20000 if plan=='family' else 12000
  sql(f"insert into subscriptions(id,user_id,provider,provider_payment_id,status,amount_cents,currency,frequency,plan_id) values('{sub}','{u}','payfast','{sub}','active',{amount},'ZAR','monthly','{plan}');update subscriptions set current_period_end=now()+interval '1 month' where id='{sub}';insert into entitlements(user_id,access_type,status,subscription_id,plan_id) values('{u}','subscription','active','{sub}','{plan}')")
 else:sql(f"insert into entitlements(user_id,access_type,status,plan_id) values('{u}','promo','active','{plan}')")
 return u,s
def child(u,s,name='Explorer'):return call(u,s,'create_child_profile',"'"+name+"'")
def device(u,s):
 key=ident();result=call(u,s,'register_household_device',f"'{key}','Test tablet'");return key,result
def start(u,s,key,c,play=None):
 play=play or ident();return play,call(u,s,'start_child_session',f"'{key}','{c}','{play}'")

class HouseholdTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  for file in ['supabase/tests/household-fixture.sql','supabase/migrations/202610270001_atomic_promo_redemption.sql','supabase/migrations/20261105180000_live_payfast_itn.sql','supabase/migrations/20261110090000_household_plans.sql','supabase/migrations/20261111200000_resume_same_device_session.sql']:
   sql((ROOT/file).read_text())
 def test_promo_is_single_even_when_family_is_requested(self):
  u,s=account('family');limits=call(u,s,'household_limits');self.assertEqual((limits['profiles'],limits['playing'],limits['devices']),(1,1,2))
  self.assertEqual(child(u,s)['outcome'],'created');self.assertEqual(child(u,s,'Sibling')['outcome'],'profile_limit')
  sql(f"update entitlements set plan_id='family' where user_id='{u}'");self.assertEqual(call(u,s,'household_limits')['plan_id'],'single')
 def test_new_promo_redemption_cannot_inherit_previous_family_plan(self):
  u,s=account('family','subscription');sql(f"update entitlements set status='expired' where user_id='{u}';insert into promo_codes(code,discount_type,duration_days) values(upper('{u}'),'free_access',30)")
  self.assertEqual(json.loads(sql(f"select redeem_free_promo_atomic('{u}','{u}')"))['outcome'],'redeemed');self.assertEqual(call(u,s,'household_limits')['plan_id'],'single')
 def test_family_profile_and_device_caps(self):
  u,s=account('family','subscription');self.assertEqual(call(u,s,'household_limits')['plan_id'],'family')
  for _ in range(3):self.assertEqual(child(u,s)['outcome'],'created')
  self.assertEqual(child(u,s)['outcome'],'profile_limit')
  self.assertEqual(device(u,s)[1]['outcome'],'registered');self.assertEqual(device(u,s)[1]['outcome'],'registered');self.assertEqual(device(u,s)[1]['outcome'],'device_limit')
 def test_single_session_and_registered_device_removal(self):
  u,s=account();c=child(u,s)['profile']['id'];k,d=device(u,s);k2,d2=device(u,s);play,r=start(u,s,k,c);self.assertEqual(r['outcome'],'started')
  self.assertEqual(start(u,s,k2,c)[1]['outcome'],'child_busy');self.assertEqual(start(u,s,k,c)[1]['outcome'],'device_busy')
  self.assertEqual(start(u,s,k,c,play)[1]['outcome'],'started')
  call(u,s,'remove_household_device',f"'{d['device_id']}'")
  self.assertEqual(start(u,s,k,c,play)[1]['outcome'],'device_required');self.assertEqual(start(u,s,k2,c)[1]['outcome'],'started')
 def test_same_device_resume_reclaims_only_the_same_auth_session_and_child(self):
  u,s=account('family','subscription')
  other_session=ident()
  sql(f"insert into auth.sessions values('{other_session}','{u}')")
  a=child(u,s,'A')['profile']['id'];b=child(u,s,'B')['profile']['id']
  key,_=device(u,s);other_device,_=device(u,s)
  old,_=start(u,s,key,a);new=ident()
  payload=json.dumps({'atli-space-progress':'saved'})
  saved=call(u,s,'save_child_progress',f"'{a}','{old}',0,'{payload}'")
  self.assertEqual(saved['outcome'],'saved')
  self.assertEqual(call(u,other_session,'resume_child_session',f"'{key}','{a}','{new}'")['outcome'],'device_busy')
  self.assertEqual(call(u,s,'resume_child_session',f"'{key}','{b}','{new}'")['outcome'],'device_busy')
  self.assertEqual(call(u,s,'resume_child_session',f"'{other_device}','{a}','{new}'")['outcome'],'child_busy')
  resumed=call(u,s,'resume_child_session',f"'{key}','{a}','{new}'")
  self.assertEqual((resumed['outcome'],resumed['revision'],resumed['data']),('started',1,{'atli-space-progress':'saved'}))
  self.assertEqual(call(u,s,'save_child_progress',f"'{a}','{old}',1,'{{}}'")['outcome'],'session_required')
  self.assertEqual(call(u,s,'start_child_session',f"'{key}','{a}','{old}',true")['outcome'],'device_busy')
  call(u,s,'end_child_session',f"'{old}'")
  self.assertEqual(call(u,s,'save_child_progress',f"'{a}','{new}',1,'{{}}'")['outcome'],'saved')
 def test_family_two_children_play_and_progress_stays_separate(self):
  u,s=account('family','subscription');a=child(u,s,'A')['profile']['id'];b=child(u,s,'B')['profile']['id'];k,_=device(u,s);k2,_=device(u,s)
  play,r=start(u,s,k,a);self.assertEqual(r['outcome'],'started');self.assertEqual(start(u,s,k2,b)[1]['outcome'],'started')
  saved=call(u,s,'save_child_progress',f"'{a}','{play}',0,'{{\"atli-space-progress\":\"A\"}}'");self.assertEqual(saved['revision'],1)
  self.assertEqual(start(u,s,k,a,play)[1]['data'],{'atli-space-progress':'A'})
  self.assertEqual(call(u,s,'save_child_progress',f"'{a}','{play}',0,'{{}}'")['outcome'],'conflict')
  self.assertEqual(sql(f"select data from child_progress where child_id='{b}'"),'{}')
 def test_account_and_auth_session_isolation(self):
  u,s=account();v,t=account();c=child(u,s)['profile']['id'];k,_=device(v,t)
  self.assertEqual(start(v,t,k,c)[1]['outcome'],'profile_limit')
  self.assertEqual(start(v,ident(),k,c)[1]['outcome'],'sign_in_required')
  p=sql(f"begin;set local role authenticated;select * from child_progress;rollback;",False);self.assertNotEqual(p.returncode,0)
 def test_expiry_and_downgrade_preserve_saved_profiles(self):
  u,s=account('family','subscription');a=child(u,s)['profile']['id'];b=child(u,s)['profile']['id'];k,_=device(u,s);play,_=start(u,s,k,b)
  sql(f"update entitlements set access_type='promo',subscription_id=null where user_id='{u}'")
  self.assertEqual(start(u,s,k,b,play)[1]['outcome'],'profile_limit');self.assertEqual(len(call(u,s,'household_overview')['profiles']),2)
  sql(f"update entitlements set expires_at=now()-interval '1 second' where user_id='{u}'")
  with self.assertRaises(AssertionError):call(u,s,'household_overview')
 def test_checkout_prices_duplicate_clicks_and_existing_subscription(self):
  u=ident();sql(f"insert into auth.users values('{u}')")
  first=json.loads(sql(f"select prepare_plan_checkout('{u}','family','pay-a')"));self.assertEqual(first['amount_cents'],20000)
  again=json.loads(sql(f"select prepare_plan_checkout('{u}','family','pay-b')"));self.assertEqual(again['payment_id'],'pay-a')
  self.assertEqual(json.loads(sql(f"select prepare_plan_checkout('{u}','single','pay-c')"))['outcome'],'pending_subscription')
  sql(f"update subscriptions set status='active' where user_id='{u}'")
  self.assertEqual(json.loads(sql(f"select prepare_plan_checkout('{u}','family','pay-d')"))['outcome'],'existing_subscription')
 def test_payment_activation_and_wrong_amounts(self):
  u=ident();sql(f"insert into auth.users values('{u}');select prepare_plan_checkout('{u}','family','{u}')")
  bad=json.loads(sql(f"select apply_payfast_itn('{u}','1','token-{u}','COMPLETE',12000,'{u}')"));self.assertEqual(bad['outcome'],'amount_or_plan_mismatch')
  good=json.loads(sql(f"select apply_payfast_itn('{u}','2','token-{u}','COMPLETE',20000,'{u}')"));self.assertEqual(good['outcome'],'processed')
  self.assertEqual(sql(f"select plan_id from entitlements where user_id='{u}'"),'family')
  self.assertEqual(json.loads(sql(f"select apply_payfast_itn('{u}','2','token-{u}','COMPLETE',20000,'{u}')"))['outcome'],'duplicate')
 def test_concurrent_creations_do_not_exceed_single_profile(self):
  u,s=account()
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:r=list(pool.map(lambda _:child(u,s),range(8)))
  self.assertEqual(sum(x['outcome']=='created' for x in r),1)
 def test_concurrent_device_registrations_are_capped_at_two(self):
  u,s=account('family','subscription')
  with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:r=list(pool.map(lambda _:device(u,s)[1],range(8)))
  self.assertEqual(sum(x['outcome']=='registered' for x in r),2)

if __name__=='__main__':unittest.main(verbosity=2)
