-- System changelog — tracks all changes made to NWHub and the website
create table if not exists changelog_entries (
  id uuid primary key default gen_random_uuid(),
  project text not null check (project in ('nwhub', 'website')),
  title text not null,
  description text,
  reason text,
  category text not null default 'feature',
  level text not null default 'info' check (level in ('info', 'improvement', 'fix', 'breaking')),
  files_changed int default 0,
  commit_hash text,
  created_at timestamptz not null default now()
);

create index changelog_entries_project on changelog_entries(project, created_at desc);
create index changelog_entries_created on changelog_entries(created_at desc);
