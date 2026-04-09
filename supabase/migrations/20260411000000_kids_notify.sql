-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — notify list
--
-- Email capture used by /kids-teens when there's no active block. Parents
-- enter their email to be notified when the next block opens. Separate from
-- email_subscribers because this is a one-shot transactional list (we email
-- once when a new block goes live, then it's done).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists kids_notify (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  notified_at timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists kids_notify_email_unique
  on kids_notify(lower(email));

alter table kids_notify enable row level security;

drop policy if exists "Public can subscribe to kids notify" on kids_notify;
create policy "Public can subscribe to kids notify"
  on kids_notify for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated users can manage kids notify" on kids_notify;
create policy "Authenticated users can manage kids notify"
  on kids_notify for all
  to authenticated
  using (true) with check (true);
