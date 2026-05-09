-- ─────────────────────────────────────────────────────────────────────────────
-- Inbox Rules engine + Invoice Vault local storage
-- ─────────────────────────────────────────────────────────────────────────────

-- ── inbox_rules ─────────────────────────────────────────────────────────────
-- Rules that run after AI classification and can override specific fields.
-- Priority determines order (lower = runs first). First match wins.

create table if not exists inbox_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default true,
  priority int not null default 100,
  conditions jsonb not null,
  action jsonb not null,
  match_type text not null default 'all'
    check (match_type in ('all', 'any')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inbox_rules_enabled_priority
  on inbox_rules (enabled, priority) where enabled = true;

alter table inbox_rules enable row level security;

-- ── invoice_vault ───────────────────────────────────────────────────────────
-- Local storage for invoices from any source (Xero, email extraction, manual).
-- Email-sourced invoices store the PDF in Supabase Storage and attempt to
-- match against Xero bills.

create table if not exists invoice_vault (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'xero'
    check (source in ('xero', 'email', 'manual')),
  source_email_id uuid references email_classifications(id) on delete set null,
  supplier text,
  invoice_number text,
  amount numeric(10,2),
  currency text default 'GBP',
  invoice_date date,
  due_date date,
  pdf_storage_path text,
  xero_match_status text not null default 'unmatched'
    check (xero_match_status in ('matched', 'unmatched', 'pending_review')),
  xero_invoice_id text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoice_vault_match_status on invoice_vault (xero_match_status);
create index if not exists idx_invoice_vault_source on invoice_vault (source);
create index if not exists idx_invoice_vault_email on invoice_vault (source_email_id);

alter table invoice_vault enable row level security;

-- ── invoice-pdfs storage bucket ─────────────────────────────────────────────
-- Private bucket for extracted invoice PDFs from emails.

insert into storage.buckets (id, name, public)
values ('invoice-pdfs', 'invoice-pdfs', false)
on conflict do nothing;

-- ── Seed rules ──────────────────────────────────────────────────────────────

insert into inbox_rules (name, conditions, action, match_type, priority) values
  ('GoCardless failed payments',
   '[{"field":"from","op":"contains","value":"gocardless"},{"field":"subject","op":"contains","value":"failed"}]'::jsonb,
   '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}'::jsonb,
   'all', 10),
  ('HMRC always priority',
   '[{"field":"from_domain","op":"contains","value":"hmrc.gov.uk"}]'::jsonb,
   '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}'::jsonb,
   'all', 20),
  ('Auto-extract invoice PDFs',
   '[{"field":"subject","op":"contains","value":"invoice"},{"field":"has_attachment","op":"equals","value":true}]'::jsonb,
   '{"extract_invoice":true}'::jsonb,
   'all', 30)
on conflict do nothing;
