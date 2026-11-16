-- ============================================================================
-- Coach Rota
-- Colour-coded class scheduling, coach self-claim, and hours tracking for wages.
--
-- Tables:
--   rota_class_types     — colour-coded class types (WOD, Hyrox, Team Training…)
--   rota_coaches         — coach records + login (linked to auth.users on login)
--   rota_template_slots  — the standard weekly timetable (set once)
--   rota_sessions        — the actual rota per date (coach_id null = needs filled)
--
-- Conventions:
--   day_of_week: 0 = Monday … 6 = Sunday
--   colour:      hex string like '#3b82f6'
--   A session is "filled" when coach_id is not null and status = 'active'.
--   A session "needs filled" when coach_id is null and status = 'active'.
--
-- NOTE: tables are created BEFORE the helper functions, because the SQL function
-- bodies are validated at creation time and reference rota_coaches.
-- ============================================================================

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists rota_class_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#3b82f6',
  sort_order int not null default 0,
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists rota_coaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  hourly_rate numeric(6,2) not null default 0,
  color text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(email)
);

create table if not exists rota_template_slots (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),  -- 0=Mon … 6=Sun
  start_time time not null,
  end_time time not null,
  class_type_id uuid references rota_class_types(id) on delete cascade,
  notes text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists rota_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  class_type_id uuid references rota_class_types(id) on delete restrict,
  coach_id uuid references rota_coaches(id) on delete set null,   -- null = needs filled
  status text not null default 'active' check (status in ('active', 'cancelled')),
  locked boolean not null default false,   -- admin lock: coach can't claim/unclaim
  notes text,
  source text not null default 'manual' check (source in ('manual', 'template')),
  template_slot_id uuid references rota_template_slots(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Helper functions ────────────────────────────────────────────────────────

-- Is the current user an NWHub owner/admin?
create or replace function is_rota_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from staff_profiles sp
    where sp.user_id = auth.uid() and sp.role in ('owner', 'admin')
  );
$$;

-- The rota_coaches.id for the current auth user (or null)
create or replace function my_coach_id()
returns uuid language sql security definer stable set search_path = public as $$
  select id from rota_coaches where user_id = auth.uid() and active limit 1;
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table rota_class_types enable row level security;
-- Everyone signed in can read class types (needed to render the rota)
create policy "rota_class_types_select" on rota_class_types for select to authenticated using (true);
-- Admins or active coaches can add class types (e.g. a coach adds Team Training)
create policy "rota_class_types_insert" on rota_class_types for insert to authenticated
  with check (is_rota_admin() or my_coach_id() is not null);
-- Only admins can edit/remove existing class types (avoids recolouring WOD etc.)
create policy "rota_class_types_update" on rota_class_types for update to authenticated using (is_rota_admin());
create policy "rota_class_types_delete" on rota_class_types for delete to authenticated using (is_rota_admin());

alter table rota_coaches enable row level security;
-- Everyone signed in can read coaches (to display names on the rota)
create policy "rota_coaches_select" on rota_coaches for select to authenticated using (true);
-- Only admins manage coaches (incl. hourly_rate — coaches can't change their pay)
create policy "rota_coaches_insert" on rota_coaches for insert to authenticated with check (is_rota_admin());
create policy "rota_coaches_update" on rota_coaches for update to authenticated using (is_rota_admin());
create policy "rota_coaches_delete" on rota_coaches for delete to authenticated using (is_rota_admin());

alter table rota_template_slots enable row level security;
create policy "rota_template_slots_select" on rota_template_slots for select to authenticated using (true);
create policy "rota_template_slots_write" on rota_template_slots for all to authenticated
  using (is_rota_admin()) with check (is_rota_admin());

alter table rota_sessions enable row level security;
-- Everyone signed in can read the whole rota
create policy "rota_sessions_select" on rota_sessions for select to authenticated using (true);
-- Insert: admins anywhere; a coach may add a session assigned to themselves
create policy "rota_sessions_insert" on rota_sessions for insert to authenticated
  with check (is_rota_admin() or (coach_id is not null and coach_id = my_coach_id()));
-- Update: admins anything; a coach may claim an open unlocked session or release
-- one they hold — only ever setting coach_id to null or themselves.
create policy "rota_sessions_update" on rota_sessions for update to authenticated
  using (is_rota_admin() or (not locked and status = 'active' and (coach_id is null or coach_id = my_coach_id())))
  with check (is_rota_admin() or (not locked and status = 'active' and (coach_id is null or coach_id = my_coach_id())));
-- Delete: admins anything; coaches may remove a session they own
create policy "rota_sessions_delete" on rota_sessions for delete to authenticated
  using (is_rota_admin() or coach_id = my_coach_id());

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_rota_coaches_user_id on rota_coaches(user_id);
create index if not exists idx_rota_coaches_email on rota_coaches(email);
create index if not exists idx_rota_template_slots_dow on rota_template_slots(day_of_week);
create index if not exists idx_rota_sessions_date on rota_sessions(date);
create index if not exists idx_rota_sessions_coach on rota_sessions(coach_id);
create index if not exists idx_rota_sessions_class on rota_sessions(class_type_id);
-- Prevent duplicate template-generated rows for the same slot/date
create unique index if not exists idx_rota_sessions_template_unique
  on rota_sessions(date, template_slot_id) where template_slot_id is not null;

-- ── keep updated_at fresh ───────────────────────────────────────────────────

create or replace function rota_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_rota_sessions_updated_at on rota_sessions;
create trigger trg_rota_sessions_updated_at before update on rota_sessions
  for each row execute function rota_touch_updated_at();

-- ── Seed a starter set of colour-coded class types ──────────────────────────

insert into rota_class_types (name, color, sort_order) values
  ('WOD',            '#3b82f6', 10),   -- blue
  ('Hyrox',          '#22c55e', 20),   -- green
  ('Weightlifting',  '#a855f7', 30),   -- purple
  ('Gymnastics',     '#f59e0b', 40),   -- amber
  ('Open Gym',       '#64748b', 50),   -- slate
  ('Team Training',  '#ec4899', 60),   -- pink
  ('Personal / PT',  '#14b8a6', 70)    -- teal
on conflict do nothing;
