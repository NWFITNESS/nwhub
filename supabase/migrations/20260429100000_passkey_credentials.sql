-- ─────────────────────────────────────────────────────────────────────────────
-- Passkey / WebAuthn credentials
--
-- Stores registered passkey credentials per user. Each user can have multiple
-- passkeys (e.g. iPhone, MacBook, YubiKey). The credential_id and public_key
-- come from the WebAuthn registration ceremony.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists passkey_credentials (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  credential_id   text not null unique,
  public_key      text not null,
  counter         bigint not null default 0,
  device_type     text,             -- 'singleDevice' or 'multiDevice'
  backed_up       boolean default false,
  transports      text[],           -- e.g. {'internal', 'hybrid'}
  label           text default '',  -- user-given name, e.g. 'iPhone', 'MacBook'
  created_at      timestamptz not null default now(),
  last_used_at    timestamptz
);

create index if not exists passkey_creds_user_idx on passkey_credentials(user_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table passkey_credentials enable row level security;

-- Users can only read/manage their own passkeys
drop policy if exists "Users manage own passkeys" on passkey_credentials;
create policy "Users manage own passkeys"
  on passkey_credentials for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
