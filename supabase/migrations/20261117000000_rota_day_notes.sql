-- ============================================================================
-- Coach Rota — day notes
-- A free-text note pinned to a date (e.g. "Closed for maintenance 2-4pm"),
-- visible to all coaches on the month + week views. One note per date.
-- ============================================================================

create table if not exists rota_day_notes (
  date date primary key,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table rota_day_notes enable row level security;

create policy "rota_day_notes_select" on rota_day_notes for select to authenticated using (true);
create policy "rota_day_notes_write" on rota_day_notes for all to authenticated
  using (is_rota_admin()) with check (is_rota_admin());
