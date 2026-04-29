-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — Session Attendance Register
--
-- Tracks per-child, per-session attendance for block bookings, drop-ins and
-- trials. One row per child per session per booking. Supports present/absent/
-- late statuses with audit trail (marked_at, marked_by).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists kids_session_attendance (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references kids_sessions(id) on delete cascade,
  child_id     uuid not null references kids_children(id) on delete cascade,
  booking_type text not null check (booking_type in ('block', 'dropin', 'trial')),
  booking_id   uuid not null,
  status       text not null default 'absent' check (status in ('present', 'absent', 'late')),
  marked_at    timestamptz,
  marked_by    text,
  created_at   timestamptz not null default now(),
  unique (session_id, child_id, booking_type, booking_id)
);

create index if not exists kids_attendance_session_idx on kids_session_attendance(session_id);
create index if not exists kids_attendance_child_idx   on kids_session_attendance(child_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table kids_session_attendance enable row level security;

drop policy if exists "Authenticated users can manage attendance" on kids_session_attendance;
create policy "Authenticated users can manage attendance"
  on kids_session_attendance for all
  to authenticated
  using (true) with check (true);
