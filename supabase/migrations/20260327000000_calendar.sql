-- Calendar: trials + calendar_events tables

create table if not exists trials (
  id          uuid primary key default gen_random_uuid(),
  member_name text not null,
  start_date  date not null,
  end_date    date not null,
  source      text not null default 'wodboard',
  created_at  timestamptz not null default now()
);

create table if not exists calendar_events (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  type       text not null check (type in ('gmail','enquiry','renewal','class')),
  label      text not null,
  meta       text,
  source_id  text,
  created_at timestamptz not null default now()
);

alter table trials enable row level security;
alter table calendar_events enable row level security;

create policy "Authenticated users can manage trials"
  on trials for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage calendar_events"
  on calendar_events for all using (auth.role() = 'authenticated');
