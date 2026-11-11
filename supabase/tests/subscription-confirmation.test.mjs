import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { confirmationMessage, sendConfirmation } from '../functions/_shared/subscription-confirmation.mjs';

const subscription = '28fbdb87-61ea-4342-983f-10d68d12d02d';
const parent = 'b9490107-3d58-4b31-95d5-2a7a4c7c5332';

test('verified first activation queues one confirmation, and duplicate payments and renewals leave it alone', async () => {
  const db = new PGlite();
  try {
    for (const file of [
      './household-fixture.sql',
      '../migrations/202610270001_atomic_promo_redemption.sql',
      '../migrations/20261105180000_live_payfast_itn.sql',
      '../migrations/20261110090000_household_plans.sql',
      '../migrations/202611120001_subscription_confirmation.sql',
    ]) await db.exec(await readFile(new URL(file, import.meta.url), 'utf8'));

    await db.query('insert into auth.users values ($1)', [parent]);
    await db.query(`insert into subscriptions
      (id,user_id,provider,provider_payment_id,status,amount_cents,currency,frequency,plan_id)
      values ($1,$2,'payfast','checkout','pending',20000,'ZAR','monthly','family')`, [subscription, parent]);
    const pay = (reference, amount) => db.query(
      "select apply_payfast_itn('checkout', $1, 'token', 'COMPLETE', $2, $3) as result",
      [reference, amount, parent],
    );
    const queued = () => db.query('select * from subscription_confirmation_outbox');
    await pay('1001', 100);
    assert.equal((await queued()).rows.length, 0);
    await pay('1001', 20000);
    const [first] = (await queued()).rows;
    assert.equal(first.plan_id, 'family');
    assert.equal(first.amount_cents, 20000);
    await pay('1001', 20000);
    await pay('1002', 20000);
    assert.deepEqual((await queued()).rows, [first]);
    const claimed = await db.query('select * from claim_subscription_confirmation()');
    assert.equal(claimed.rows[0].subscription_id, subscription);
    assert.equal((await db.query('select * from claim_subscription_confirmation()')).rows.length, 0);
  } finally {
    await db.close();
  }
});

test('Brevo receives a transactional activation email with a stable delivery key', async () => {
  const job = { subscription_id: subscription, plan_id: 'family', amount_cents: 20000, period_end: '2026-12-11T22:30:00Z' };
  const message = confirmationMessage(job, 'no-reply@example.com', 'parent@example.com');
  assert.match(message.textContent, /Family · R200\.00 per month/);
  assert.match(message.textContent, /12 December 2026/);
  assert.equal(message.headers.idempotencyKey, subscription);
  const sent = await sendConfirmation(async (url, request) => {
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(request.headers['api-key'], 'test-key');
    assert.deepEqual(JSON.parse(request.body), message);
    return Response.json({ messageId: 'sent-id' }, { status: 201 });
  }, 'test-key', message);
  assert.deepEqual(sent, { status: 'sent', provider_id: 'sent-id' });
  const duplicate = await sendConfirmation(
    async () => Response.json({ code: 'duplicate_parameter', message: 'Idempotency key already used' }, { status: 400 }),
    'test-key', message,
  );
  assert.equal(duplicate.status, 'sent');
});
