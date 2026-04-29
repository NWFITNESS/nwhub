-- ─────────────────────────────────────────────────────────────────────────────
-- GDPR — Audit log + data retention support
-- ─────────────────────────────────────────────────────────────────────────────

-- Audit log: tracks sensitive actions (data access, export, deletion, edits)
create table if not exists audit_log (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,            -- 'data_export', 'data_delete', 'booking_edit', 'contact_view', 'login', etc.
  actor       text,                     -- admin email or 'system'
  target_email text,                    -- the person whose data was accessed/modified
  details     jsonb default '{}',       -- additional context
  ip_address  text,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_action_idx on audit_log(action);
create index if not exists audit_log_target_idx on audit_log(target_email);
create index if not exists audit_log_created_idx on audit_log(created_at desc);

alter table audit_log enable row level security;

drop policy if exists "Authenticated users can manage audit log" on audit_log;
create policy "Authenticated users can manage audit log"
  on audit_log for all
  to authenticated
  using (true) with check (true);

-- Add privacy_consent + consented_at to contact_enquiries if not present
alter table contact_enquiries
  add column if not exists privacy_consent boolean default false,
  add column if not exists consented_at timestamptz;
