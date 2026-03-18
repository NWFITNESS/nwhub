-- Replace the old review-run/review-check edge function crons with the
-- new /api/reviews/automation endpoint (runs daily at 10am UTC).
-- Requires pg_cron and pg_net extensions to be enabled.

-- Remove old crons if they exist
select cron.unschedule('daily-review-run')   where exists (select 1 from cron.job where jobname = 'daily-review-run');
select cron.unschedule('daily-review-check') where exists (select 1 from cron.job where jobname = 'daily-review-check');

-- New automation cron — 10:00 UTC daily
select cron.schedule(
  'daily-review-automation',
  '0 10 * * *',
  $$
  select net.http_post(
    url     := 'https://nwhub.vercel.app/api/reviews/automation',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "nw-cron-2026"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);

-- Check Google reviews 1 hour later — 11:00 UTC daily
select cron.schedule(
  'daily-review-check',
  '0 11 * * *',
  $$
  select net.http_post(
    url     := 'https://nwhub.vercel.app/api/reviews/check',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);
