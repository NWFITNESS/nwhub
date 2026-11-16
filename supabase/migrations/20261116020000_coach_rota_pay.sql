-- ============================================================================
-- Coach Rota — pay model
-- Wages are by DAY TYPE, not per coach: weekday rate vs weekend rate, with
-- an "unpaid" flag per class type (e.g. CF Kids is unpaid).
-- ============================================================================

-- Per-class "is this paid?" flag
alter table rota_class_types add column if not exists paid boolean not null default true;
update rota_class_types set paid = false where name = 'CF Kids';

-- Single-row settings holding the two hourly rates
create table if not exists rota_settings (
  id boolean primary key default true,
  weekday_rate numeric(6,2) not null default 13,
  weekend_rate numeric(6,2) not null default 20,
  updated_at timestamptz not null default now(),
  constraint rota_settings_singleton check (id)
);

alter table rota_settings enable row level security;
drop policy if exists "rota_settings_select" on rota_settings;
drop policy if exists "rota_settings_write" on rota_settings;
create policy "rota_settings_select" on rota_settings for select to authenticated using (true);
create policy "rota_settings_write" on rota_settings for all to authenticated
  using (is_rota_admin()) with check (is_rota_admin());

insert into rota_settings (id) values (true) on conflict (id) do nothing;
