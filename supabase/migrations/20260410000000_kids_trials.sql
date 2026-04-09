-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — trials
--
-- Free one-off trial sessions. A parent (new or returning) gives us info,
-- picks a session, signs the waiver, and gets a confirmation email. No
-- payment, no Stripe — separate from kids_block_bookings/kids_dropin_bookings.
--
-- Workflow:
--   confirmed (default on insert) → attended | no_show | cancelled
--
-- Created from two places:
--   - Public website /kids-teens/trial form
--   - NWHub /kids admin (when Mat gets a DM and wants to add it manually)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists kids_trials (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid not null references kids_parents(id) on delete cascade,
  child_id      uuid not null references kids_children(id) on delete cascade,
  session_id    uuid references kids_sessions(id) on delete set null,
  category      kids_category not null,
  status        text not null default 'confirmed',
  notes         text,
  source        text not null default 'web',  -- 'web' | 'admin'
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz default now(),
  attended_at   timestamptz
);

create index if not exists kids_trials_parent_idx  on kids_trials(parent_id);
create index if not exists kids_trials_child_idx   on kids_trials(child_id);
create index if not exists kids_trials_session_idx on kids_trials(session_id);
create index if not exists kids_trials_status_idx  on kids_trials(status);

alter table kids_trials enable row level security;

-- Public can insert (the trial form is unauthenticated)
drop policy if exists "Public can insert trials" on kids_trials;
create policy "Public can insert trials"
  on kids_trials for insert
  to anon, authenticated
  with check (true);

-- Authenticated NWHub staff have full management access
drop policy if exists "Authenticated users can manage trials" on kids_trials;
create policy "Authenticated users can manage trials"
  on kids_trials for all
  to authenticated
  using (true) with check (true);
