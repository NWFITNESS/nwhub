-- Lightweight page view tracking for the public website
create table if not exists page_views (
  id          uuid primary key default gen_random_uuid(),
  path        text not null,
  referrer    text,
  user_agent  text,
  country     text,
  created_at  timestamptz not null default now()
);

-- Index for efficient monthly aggregation queries
create index if not exists idx_page_views_created_at on page_views (created_at desc);

-- Allow inserts from anon (public site tracking) but no reads
alter table page_views enable row level security;

create policy "Anyone can insert page views"
  on page_views for insert
  to anon, authenticated
  with check (true);

create policy "Only authenticated users can read page views"
  on page_views for select
  to authenticated
  using (true);
