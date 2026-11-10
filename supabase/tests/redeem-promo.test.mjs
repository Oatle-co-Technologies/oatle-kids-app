import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { randomUUID } from 'node:crypto';

registerHooks({resolve(specifier, context, next) {
  if (specifier === 'npm:@supabase/server@^1') return {url:'data:text/javascript,export const createSupabaseContext=(...args)=>globalThis.promoTestAuth(...args);',shortCircuit:true};
  if (specifier === 'npm:@supabase/supabase-js@^2/cors') return {url:'data:text/javascript,export const corsHeaders={"Access-Control-Allow-Origin":"*"};',shortCircuit:true};
  return next(specifier,context);
}});
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const handler = (await import('../functions/redeem-promo/redeem-promo.ts')).default.fetch;
const users = Array.from({length:80},()=>randomUUID());
let rpcCalls = 0;
const rpc = async (name, args) => {
  rpcCalls++;
  assert.equal(name,'redeem_free_promo_atomic');
  try {
    const {rows} = await db.query('select public.redeem_free_promo_atomic($1,$2) as result',[args.p_user_id,args.p_code]);
    return {data:rows[0].result,error:null};
  } catch { return {data:null,error:{message:'test database failure'}}; }
};
globalThis.promoTestAuth = async () => ({data:{userClaims:{id:users[0]},supabaseAdmin:{rpc}},error:null});
const redeem = async (user,code) => (await rpc('redeem_free_promo_atomic',{p_user_id:user,p_code:code})).data;
const scalar = async (sql,args=[]) => Object.values((await db.query(sql,args)).rows[0])[0];
const promo = async (code,extra={}) => {
  const data={code,discount_type:'free_access',duration_days:30,...extra};
  const keys=Object.keys(data);
  await db.query(`insert into public.promo_codes (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(data));
};

before(async()=>{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create table public.subscriptions(id uuid primary key);
    create table public.promo_codes(
      id uuid primary key default gen_random_uuid(),code text not null unique,description text,
      discount_type text not null check(discount_type in ('percentage','fixed','free_months','free_access')),
      discount_value numeric(10,2) not null default 0,duration_months integer,duration_days integer,
      max_redemptions integer,redemptions_count integer not null default 0,starts_at timestamptz,
      expires_at timestamptz,active boolean not null default true,created_at timestamptz not null default now(),
      lifetime boolean not null default false,assigned_user_id uuid references auth.users(id),
      check((discount_type='free_months' and duration_months>0 and duration_days is null and not lifetime)
        or (discount_type='free_access' and ((duration_days>0 and not lifetime) or lifetime))
        or discount_type in ('percentage','fixed')));
    create table public.promo_redemptions(
      id uuid primary key default gen_random_uuid(),promo_code_id uuid not null references public.promo_codes(id),
      user_id uuid not null references auth.users(id),redeemed_at timestamptz not null default now(),
      created_entitlement_until timestamptz,unique(promo_code_id,user_id));
    create table public.entitlements(
      user_id uuid primary key references auth.users(id),access_type text not null check(access_type in ('subscription','promo','manual')),
      status text not null default 'active' check(status in ('active','expired','cancelled')),expires_at timestamptz,
      subscription_id uuid references public.subscriptions(id),promo_redemption_id uuid references public.promo_redemptions(id),
      updated_at timestamptz not null default now());
    alter table public.promo_codes enable row level security;
    alter table public.promo_redemptions enable row level security;
    alter table public.entitlements enable row level security;
    grant usage on schema public to service_role;
    grant select,insert,update on all tables in schema public to service_role;`);
  for(const user of users) await db.query('insert into auth.users(id) values($1)',[user]);
  await db.exec(await readFile(new URL('../migrations/202610270001_atomic_promo_redemption.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../migrations/202611100004_promo_invitation_permissions.sql',import.meta.url),'utf8'));
  await db.exec('grant usage on schema auth to service_role;');
});
after(async()=>{await db.close();delete globalThis.promoTestAuth;});

test('parallel attempts cannot exceed one remaining place',async()=>{
  await promo('LAST-PLACE',{max_redemptions:1});
  const results=await Promise.all(users.slice(1,41).map(user=>redeem(user,'LAST-PLACE')));
  assert.equal(results.filter(x=>x.outcome==='redeemed').length,1);
  assert.equal(results.filter(x=>x.outcome==='limit_reached').length,39);
  assert.equal(await scalar("select redemptions_count from promo_codes where code='LAST-PLACE'"),1);
  assert.equal(await scalar("select count(*)::int from promo_redemptions r join promo_codes p on p.id=r.promo_code_id where p.code='LAST-PLACE'"),1);
});
test('duplicate clicks consume one place and create one redemption',async()=>{
  await promo('DOUBLE-CLICK');
  const results=await Promise.all(Array.from({length:20},()=>redeem(users[50],'DOUBLE-CLICK')));
  assert.equal(results.filter(x=>x.outcome==='redeemed').length,1);
  assert.equal(results.filter(x=>x.outcome==='already_redeemed').length,19);
});
test('different promos cannot overwrite an active entitlement for the same user',async()=>{
  await promo('ACCOUNT-A');await promo('ACCOUNT-B');
  const results=await Promise.all(['ACCOUNT-A','ACCOUNT-B'].map(code=>redeem(users[51],code)));
  assert.deepEqual(results.map(x=>x.outcome).sort(),['active_access','redeemed']);
  assert.equal(await scalar('select count(*)::int from promo_redemptions where user_id=$1',[users[51]]),1);
});
test('entitlement write failure rolls back both redemption and counter',async()=>{
  await promo('ROLLBACK');
  await db.exec(`create function public.test_fail_access() returns trigger language plpgsql as $$begin raise exception 'forced failure'; end$$;
    create trigger test_fail before insert or update on entitlements for each row execute function public.test_fail_access();`);
  assert.equal(await redeem(users[52],'ROLLBACK'),null);
  assert.equal(await scalar("select redemptions_count from promo_codes where code='ROLLBACK'"),0);
  assert.equal(await scalar('select count(*)::int from promo_redemptions where user_id=$1',[users[52]]),0);
  await db.exec('drop trigger test_fail on entitlements; drop function public.test_fail_access();');
  assert.equal((await redeem(users[52],'ROLLBACK')).outcome,'redeemed');
});
test('historical undercounts cannot bypass the limit',async()=>{
  await promo('OLD-COUNT',{max_redemptions:1,redemptions_count:0});
  await db.query("insert into promo_redemptions(promo_code_id,user_id) select id,$1 from promo_codes where code='OLD-COUNT'",[users[53]]);
  assert.equal((await redeem(users[54],'OLD-COUNT')).outcome,'limit_reached');
});
test('paid discounts, personal assignment, dates and inactive codes are checked server-side',async()=>{
  await promo('PAID',{discount_type:'percentage',discount_value:100,duration_days:null});
  await promo('PERSONAL',{assigned_user_id:users[55]});
  await promo('EXPIRED',{expires_at:'2000-01-01'});await promo('FUTURE',{starts_at:'2100-01-01'});
  await promo('INACTIVE',{active:false});
  for(const [code,outcome] of [['PAID','payment_discount'],['PERSONAL','wrong_account'],['EXPIRED','expired'],['FUTURE','not_started'],['INACTIVE','inactive'],['MISSING','invalid_code']]) {
    assert.equal((await redeem(users[56],code)).outcome,outcome);
  }
  assert.equal(await scalar('select count(*)::int from promo_redemptions where user_id=$1',[users[56]]),0);
});
test('existing lifetime or paid access is preserved and no reward is consumed',async()=>{
  await promo('PRESERVE');
  await db.query("insert into entitlements(user_id,access_type,expires_at) values($1,'manual',null),($2,'subscription',now()+interval '1 year')",[users[57],users[58]]);
  for(const user of users.slice(57,59)) assert.equal((await redeem(user,'PRESERVE')).outcome,'active_access');
  assert.equal(await scalar("select redemptions_count from promo_codes where code='PRESERVE'"),0);
});
test('month rewards and lifetime rewards retain their durations',async()=>{
  await promo('MONTHS',{discount_type:'free_months',duration_days:null,duration_months:3});
  await promo('LIFETIME',{duration_days:null,lifetime:true});
  const months=await redeem(users[59],' months ');
  assert.equal(months.outcome,'redeemed');
  const days=(new Date(months.expires_at)-Date.now())/86400000;assert.ok(days>88&&days<93);
  assert.equal((await redeem(users[60],'LIFETIME')).expires_at,null);
});
test('only the server role can execute the redemption function',async()=>{
  for(const role of ['anon','authenticated']) assert.equal(await scalar("select has_function_privilege($1,'public.redeem_free_promo_atomic(uuid,text)','execute')",[role]),false);
  assert.equal(await scalar("select has_function_privilege('service_role','public.redeem_free_promo_atomic(uuid,text)','execute')"),true);
  await promo('SERVER-ONLY');await db.exec('set role service_role');
  assert.equal((await redeem(users[61],'SERVER-ONLY')).outcome,'redeemed');await db.exec('reset role');
});
test('endpoint rejects malformed codes and uses the verified identity',async()=>{
  const request=body=>new Request('https://example.test/promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  for(const body of [null,[],{code:2},{code:''},{code:'x'.repeat(257)}]) {
    const beforeCalls=rpcCalls;assert.equal((await handler(request(body))).status,400);assert.equal(rpcCalls,beforeCalls);
  }
  await promo('IDENTITY');
  const response=await handler(request({code:'IDENTITY',user_id:users[62]}));
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(await scalar('select count(*)::int from entitlements where user_id=$1',[users[0]]),1);
  assert.equal(await scalar('select count(*)::int from entitlements where user_id=$1',[users[62]]),0);
});


test('email-linked invitation works as service role without exposing the account table',async()=>{
  const invited=users[63];
  await db.query("update auth.users set email='invited@example.invalid', email_confirmed_at=now() where id=$1",[invited]);
  await promo('NAME-BASED-INVITATION',{discount_type:'free_months',duration_days:null,duration_months:3,max_redemptions:1,assigned_email:' INVITED@EXAMPLE.INVALID '});
  assert.equal(await scalar("select has_table_privilege('service_role','auth.users','SELECT')"),false);
  for(const role of ['anon','authenticated']) assert.equal(await scalar("select has_function_privilege($1,'public.promo_invitation_email_matches(uuid,text)','execute')",[role]),false);
  await db.exec('set role service_role');
  try {
    const result=await redeem(invited,' name-based-invitation ');
    assert.equal(result.outcome,'redeemed');
    const days=(new Date(result.expires_at)-Date.now())/86400000;assert.ok(days>88&&days<93);
    assert.equal((await redeem(invited,'NAME-BASED-INVITATION')).outcome,'already_redeemed');
  } finally {await db.exec('reset role');}
  assert.equal(await scalar("select redemptions_count from promo_codes where code='NAME-BASED-INVITATION'"),1);
  await assert.rejects(db.exec('set role authenticated; select public.promo_invitation_email_matches(null,null);'));
  await db.exec('reset role');
});
test('wrong and unverified email accounts cannot consume an invitation',async()=>{
  await db.query("update auth.users set email='unverified@example.invalid',email_confirmed_at=null where id=$1",[users[64]]);
  await db.query("update auth.users set email='other@example.invalid',email_confirmed_at=now() where id=$1",[users[65]]);
  await promo('VERIFIED-ONLY',{assigned_email:'unverified@example.invalid',max_redemptions:1});
  await db.exec('set role service_role');
  try {
    for(const user of [users[64],users[65]]) assert.equal((await redeem(user,'VERIFIED-ONLY')).outcome,'wrong_account');
  } finally {await db.exec('reset role');}
  assert.equal(await scalar("select redemptions_count from promo_codes where code='VERIFIED-ONLY'"),0);
  assert.equal(await scalar('select count(*)::int from promo_redemptions where user_id=any($1::uuid[])',[users.slice(64,66)]),0);
});
test('permission migration is safe to reapply and keeps legacy rewards working',async()=>{
  const migration=await readFile(new URL('../migrations/202611100004_promo_invitation_permissions.sql',import.meta.url),'utf8');
  const before=await scalar('select count(*)::int from promo_redemptions');
  await db.exec(migration);
  assert.equal(await scalar('select count(*)::int from promo_redemptions'),before);
  assert.equal(await scalar("select has_table_privilege('service_role','auth.users','SELECT')"),false);
  await promo('OLD-SEVEN-DAY',{duration_days:7});
  await db.exec('set role service_role');
  try {assert.equal((await redeem(users[66],'OLD-SEVEN-DAY')).outcome,'redeemed');}
  finally {await db.exec('reset role');}
});

test('historical private-testing upgrade blocks shared codes and preserves assigned invitations',async()=>{
  // This historical migration is applied to its original predecessor, not the newer live policy.
  await db.exec(await readFile(new URL('../migrations/202610270001_atomic_promo_redemption.sql',import.meta.url),'utf8'));
  const migration=await readFile(new URL('../migrations/202610270002_private_promo_invites.sql',import.meta.url),'utf8');
  await db.exec(migration);
  await db.exec(migration); // Safe to reapply without changing permissions or data.
  const invited=randomUUID(),other=randomUUID();
  for(const user of [invited,other]) await db.query('insert into auth.users(id) values($1)',[user]);
  const existingGrants=await scalar('select count(*)::int from entitlements');
  await promo('PRIVATE-INVITE');
  assert.equal((await redeem(invited,'PRIVATE-INVITE')).outcome,'wrong_account');
  assert.equal(await scalar('select count(*)::int from entitlements'),existingGrants);
  assert.equal(await scalar("select redemptions_count from promo_codes where code='PRIVATE-INVITE'"),0);
  await db.query("update promo_codes set assigned_user_id=$1 where code='PRIVATE-INVITE'",[invited]);
  assert.equal((await redeem(other,'PRIVATE-INVITE')).outcome,'wrong_account');
  assert.equal((await redeem(invited,'PRIVATE-INVITE')).outcome,'redeemed');
  assert.equal((await redeem(invited,'PRIVATE-INVITE')).outcome,'already_redeemed');
  assert.equal(await scalar('select count(*)::int from entitlements'),existingGrants+1);
  for(const role of ['anon','authenticated']) assert.equal(await scalar("select has_function_privilege($1,'public.redeem_free_promo_atomic(uuid,text)','execute')",[role]),false);
});
