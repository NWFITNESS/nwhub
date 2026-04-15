-- ─────────────────────────────────────────────────────────────────────────────
-- Kids session reminder cron
--
-- Fires every Sunday at 08:00 UTC. Calls the NWHub API endpoint which
-- finds all paid bookings for today's session date and sends a reminder
-- email to each parent with their children's specific times.
--
-- 08:00 UTC = 08:00 GMT / 09:00 BST — either way the parent gets a
-- morning-of reminder before the first session starts at 10:15.
-- ─────────────────────────────────────────────────────────────────────────────

select cron.schedule(
  'kids-session-reminder',
  '0 8 * * 0',
  $$
  select net.http_post(
    url     := 'https://nwhub.vercel.app/api/kids-reminders',
    headers := '{"Content-Type": "application/json", "x-cron-secret": "nw-cron-2026"}'::jsonb,
    body    := '{}'::jsonb
  )
  $$
);
