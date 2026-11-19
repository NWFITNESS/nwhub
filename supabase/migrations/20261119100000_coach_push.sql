-- ============================================================================
-- Coach push notifications
-- Web Push subscriptions per coach + a per-session "reminded" flag so the
-- 1-hour reminder cron sends each nudge only once.
-- ============================================================================

create table if not exists coach_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references rota_coaches(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_coach_push_coach on coach_push_subscriptions (coach_id);

-- Accessed only via the service-role API routes (subscribe / cron), same as the
-- other admin tables — RLS on with no policy = no direct anon/authenticated access.
alter table coach_push_subscriptions enable row level security;

-- Set when the coach has been reminded about a session, to avoid duplicate pushes.
alter table rota_sessions add column if not exists reminded_at timestamptz;
