-- ============================================================================
-- Coach Rota: per-coach unpaid flag + change history
-- ============================================================================

-- Per-coach unpaid flag — hours still count, pay = £0 (e.g. owner/volunteers).
alter table rota_coaches add column if not exists unpaid boolean not null default false;
update rota_coaches set unpaid = true
where id in (
  '8007771c-1d8c-4578-a893-b0209bb75fc2',  -- Mathew Tomkinson
  '9424cd12-ccc1-4b62-8f3c-4a48895ac3d3',  -- Joe Bold
  'b0c8e4a2-41ba-48dc-b16c-1ed02d3c78f9'   -- Dom Dublin
);

-- Rota change history (who reassigned what, and when).
create table if not exists rota_audit (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  date date,
  action text not null,                    -- claim | release | reassign
  actor text not null,
  actor_kind text not null default 'coach',
  from_coach text,
  to_coach text,
  detail text,                             -- e.g. "WOD 16:15"
  created_at timestamptz not null default now()
);
create index if not exists idx_rota_audit_created on rota_audit (created_at desc);
alter table rota_audit enable row level security;  -- read via service-role API only

-- Trigger: log a coach reassigning a session directly from the app (browser/RLS).
-- Service-role routes (swaps, admin edits) have no auth.uid(); they log
-- themselves, so skip them here to avoid double entries.
create or replace function rota_sessions_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a_name text; a_kind text; f_name text; t_name text; cls text; act text;
begin
  if uid is null then return new; end if;
  if OLD.coach_id is not distinct from NEW.coach_id then return new; end if;

  select name into a_name from rota_coaches where user_id = uid limit 1;
  if a_name is not null then a_kind := 'coach';
  else
    select display_name into a_name from staff_profiles where user_id = uid limit 1;
    a_kind := 'admin';
  end if;

  select name into f_name from rota_coaches where id = OLD.coach_id;
  select name into t_name from rota_coaches where id = NEW.coach_id;
  select name into cls from rota_class_types where id = NEW.class_type_id;

  act := case when NEW.coach_id is null then 'release'
              when OLD.coach_id is null then 'claim'
              else 'reassign' end;

  insert into rota_audit (session_id, date, action, actor, actor_kind, from_coach, to_coach, detail)
  values (NEW.id, NEW.date, act, coalesce(a_name, 'A coach'), a_kind, f_name, t_name,
          coalesce(cls, 'Session') || ' ' || to_char(NEW.start_time, 'HH24:MI'));
  return new;
end $$;

revoke all on function rota_sessions_audit() from public, anon;

drop trigger if exists rota_sessions_audit_trg on rota_sessions;
create trigger rota_sessions_audit_trg after update on rota_sessions
for each row execute function rota_sessions_audit();
