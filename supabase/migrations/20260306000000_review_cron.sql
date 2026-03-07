-- ─────────────────────────────────────────────────────────────────────────────
-- Review automation cron jobs
--
-- Prerequisites:
--   1. pg_cron extension must be enabled (Supabase dashboard → Database → Extensions)
--   2. pg_net extension must be enabled (same location)
--   3. Both edge functions must be deployed:
--        supabase functions deploy review-run
--        supabase functions deploy review-check
--   4. Replace <PROJECT_REF> with your Supabase project reference ID
--      (found in: Project Settings → General → Reference ID)
--   5. Replace <ANON_KEY> with your Supabase anon/public key
--      (found in: Project Settings → API → Project API keys → anon public)
--
-- Apply this migration:
--   supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable extensions (safe to run if already enabled)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─── review-run: send messages to eligible contacts ────────────────────────
-- Runs at 08:00 UTC daily
select cron.schedule(
  'review-run-daily',
  '0 8 * * *',
  $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/review-run',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <ANON_KEY>'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ─── review-check: poll Google for new reviews ─────────────────────────────
-- Runs at 09:00 UTC daily (one hour after sends, giving time for responses)
select cron.schedule(
  'review-check-daily',
  '0 9 * * *',
  $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/review-check',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <ANON_KEY>'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- To verify scheduled jobs:
-- select * from cron.job;

-- To remove a job if needed:
-- select cron.unschedule('review-run-daily');
-- select cron.unschedule('review-check-daily');
