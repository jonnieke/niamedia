-- Schedule daily retainer auto-billing at 7:00 AM EAT (04:00 UTC)
select cron.schedule(
  'bill-retainers-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url    := (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_URL') || '/functions/v1/bill-retainers',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body   := '{}'::jsonb
  );
  $$
);
