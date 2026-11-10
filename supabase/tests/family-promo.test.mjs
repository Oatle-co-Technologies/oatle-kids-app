import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('Family invitations grant household limits securely while old promos remain Single Child',async()=>{
 const db=new PGlite();
 try {
  await db.exec(await read('./household-fixture.sql'));
  await db.exec('alter table auth.users add column email text,add column email_confirmed_at timestamptz;');
  await db.exec(await read('../migrations/202611100004_promo_invitation_permissions.sql'));
  await db.exec(await read('../migrations/20261110090000_household_plans.sql'));
  const migration=await read('../migrations/20261110190000_family_promo_invitations.sql');
  await db.exec(migration);await db.exec(migration);
  const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
  const owner=randomUUID(),other=randomUUID(),legacy=randomUUID();
  for(const [id,email] of [[owner,'mother@example.invalid'],[other,'other@example.invalid'],[legacy,'legacy@example.invalid']]) await db.query('insert into auth.users values($1,$2,now())',[id,email]);
  await db.exec("insert into promo_codes(code,discount_type,duration_months,max_redemptions,assigned_email,plan_id) values('MOTHER-FAMILY','free_months',3,1,'mother@example.invalid','family'); insert into promo_codes(code,discount_type,duration_days) values('OLD-SINGLE','free_access',7);");
  await db.exec('set role service_role');
  assert.equal((await scalar('select redeem_free_promo_atomic($1,$2)',[other,'MOTHER-FAMILY'])).outcome,'wrong_account');
  assert.equal((await scalar('select redeem_free_promo_atomic($1,$2)',[owner,'MOTHER-FAMILY'])).outcome,'redeemed');
  assert.equal((await scalar('select redeem_free_promo_atomic($1,$2)',[owner,'MOTHER-FAMILY'])).outcome,'already_redeemed');
  assert.equal((await scalar('select redeem_free_promo_atomic($1,$2)',[legacy,'OLD-SINGLE'])).outcome,'redeemed');
  await db.exec('reset role');
  assert.equal(await scalar('select plan_id from entitlements where user_id=$1',[owner]),'family');
  assert.equal(await scalar('select plan_id from entitlements where user_id=$1',[legacy]),'single');
  await db.query("update entitlements set plan_id='family' where user_id=$1",[legacy]);
  assert.equal(await scalar('select plan_id from entitlements where user_id=$1',[legacy]),'single');
  const originalExpiry=await scalar('select expires_at::text from entitlements where user_id=$1',[legacy]);
  // A redemption belonging to someone else cannot be used to inflate this account's plan.
  await db.query("update entitlements set plan_id='family',promo_redemption_id=(select promo_redemption_id from entitlements where user_id=$1),expires_at=(select expires_at from entitlements where user_id=$1) where user_id=$2",[owner,legacy]);
  assert.equal(await scalar('select plan_id from entitlements where user_id=$1',[legacy]),'single');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);
  await db.exec('set role authenticated');
  assert.deepEqual(await scalar('select household_limits()'),{plan_id:'family',profiles:3,devices:2,playing:2,promo:true});
  for(const name of ['One','Two','Three']) assert.equal((await scalar('select create_child_profile($1)',[name])).outcome,'created');
  assert.equal((await scalar("select create_child_profile('Four')")).outcome,'profile_limit');
  await assert.rejects(db.query("update promo_codes set plan_id='family' where code='OLD-SINGLE'"));
  await db.exec('reset role');
  // Upgrading a redeemed invitation preserves the original expiry and grants Family on refresh.
  await db.exec("update promo_codes set plan_id='family' where code='OLD-SINGLE';");
  await db.query("update entitlements set promo_redemption_id=(select id from promo_redemptions where user_id=$1),expires_at=(select created_entitlement_until from promo_redemptions where user_id=$1) where user_id=$1",[legacy]);
  assert.equal(await scalar('select plan_id from entitlements where user_id=$1',[legacy]),'family');
  assert.equal(await scalar("select redemptions_count from promo_codes where code='MOTHER-FAMILY'"),1);
  assert.equal(await scalar('select expires_at::text from entitlements where user_id=$1',[legacy]),originalExpiry);
 } finally {await db.close();}
});
