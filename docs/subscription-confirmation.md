Oatle Kids sends one subscription confirmation after Payfast confirms the first payment and activates a monthly Single Child or Family plan. The email includes the plan, monthly amount, expected renewal date, app link and support address. It goes to the verified parent account email. The database queues the confirmation in the same transaction as activation, then the worker submits it to Brevo independently of the payment response.

Apply `202611120001_subscription_confirmation.sql` and deploy the `subscription-email` Supabase Edge Function. Configure these server-side secrets on the Oatle Kids project:

- `BREVO_API_KEY` is the existing Brevo transactional API key authorized for Oatle Kids.
- `SUBSCRIPTION_EMAIL_WORKER_SECRET` is a dedicated random secret shared with the scheduled job.
- `SUBSCRIPTION_EMAIL_ENABLED=true` enables delivery.

The worker sends from `noreply@oatlekids.co.za`. Verify that this sender is active in the Brevo account associated with the API key.

With Supabase Cron and the `pg_net` extension enabled, store the project URL and matching worker secret in Vault under `subscription_email_project_url` and `subscription_email_worker_secret`. Install this job once:

```sql
select cron.schedule('oatle-subscription-confirmation', '* * * * *', $$
  select net.http_post(
    url := rtrim((select decrypted_secret from vault.decrypted_secrets
                  where name = 'subscription_email_project_url'), '/') || '/functions/v1/subscription-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Email-Worker-Secret', (select decrypted_secret from vault.decrypted_secrets
                               where name = 'subscription_email_worker_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 90000
  );
$$);
```

Check `subscription_confirmation_outbox` for delivery status and Brevo Transactional Logs for acceptance or delivery. Review jobs marked `review` before manually retrying, since Brevo may have accepted an earlier request. The worker reuses a subscription-specific idempotency key and stops automatic retries after 12 minutes. The migration queues future first activations only.
