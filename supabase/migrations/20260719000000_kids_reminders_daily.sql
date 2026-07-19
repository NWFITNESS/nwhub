-- ─────────────────────────────────────────────────────────────────────────────
-- Kids session reminder cron — run DAILY, not just Sundays
--
-- The original job (20260415000000_kids_session_reminders_cron.sql) fired only
-- on Sundays ('0 8 * * 0'), which assumed every kids session is on a Sunday.
-- Limited-edition drops run on other weekdays (e.g. the summer "Teens Strong"
-- drop on Thursdays), so those sessions never got a reminder.
--
-- The /api/kids-reminders route already filters to sessions where
-- session_date = today, so it is safe to run every day — on days with no
-- session it simply sends nothing ("No sessions today"). Reschedule to run
-- daily at 08:00 UTC so every session day is covered.
-- ─────────────────────────────────────────────────────────────────────────────

-- Re-scheduling with the same job name replaces the existing schedule.
select cron.schedule(
  'kids-session-reminder',
  '0 8 * * *',
  $$
  select net.http_post(
    url     := 'https://nwhub.vercel.app/api/kids-reminders',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "nw-cron-2026"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);
