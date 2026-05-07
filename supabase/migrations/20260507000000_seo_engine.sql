-- ─────────────────────────────────────────────────────────────────────────────
-- SEO Engine — schema for programmatic SEO monitoring
-- ─────────────────────────────────────────────────────────────────────────────

-- Templates: one row per programmatic template (Kids × Town, etc.)
create table if not exists seo_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  url_pattern text not null,
  status text not null default 'draft'
    check (status in ('draft','live','paused')),
  variables jsonb not null default '[]'::jsonb,
  master_prompt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pages: one row per generated URL on the public site
create table if not exists seo_pages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references seo_templates(id) on delete cascade,
  url_path text unique not null,
  title text not null,
  variables jsonb not null,
  data_row jsonb not null,
  brief_id uuid,
  version int not null default 1,
  status text not null default 'draft'
    check (status in ('draft','live','deindexed')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists seo_pages_template_idx on seo_pages(template_id);
create index if not exists seo_pages_status_idx on seo_pages(status);

-- Briefs: prompt + Claude output history per page
create table if not exists seo_briefs (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references seo_pages(id) on delete cascade,
  version int not null,
  prompt_used text not null,
  data_snapshot jsonb not null,
  generated_content text not null,
  model text not null,
  generated_at timestamptz default now(),
  unique(page_id, version)
);

-- GSC daily snapshots — one row per page per day
create table if not exists seo_gsc_daily (
  id bigserial primary key,
  page_id uuid references seo_pages(id) on delete cascade,
  date date not null,
  impressions int not null default 0,
  clicks int not null default 0,
  ctr numeric(6,4) not null default 0,
  position numeric(5,2),
  unique(page_id, date)
);

create index if not exists seo_gsc_daily_page_date on seo_gsc_daily(page_id, date desc);

-- GSC top queries per page — refreshed weekly
create table if not exists seo_gsc_queries (
  id bigserial primary key,
  page_id uuid references seo_pages(id) on delete cascade,
  query text not null,
  impressions int not null,
  clicks int not null,
  position numeric(5,2),
  week_start date not null,
  unique(page_id, query, week_start)
);

create index if not exists seo_gsc_queries_page_week on seo_gsc_queries(page_id, week_start desc);

-- GA4 daily — sessions, conversions per page
create table if not exists seo_ga4_daily (
  id bigserial primary key,
  page_id uuid references seo_pages(id) on delete cascade,
  date date not null,
  sessions int not null default 0,
  engaged_sessions int not null default 0,
  conversions int not null default 0,
  unique(page_id, date)
);

create index if not exists seo_ga4_daily_page_date on seo_ga4_daily(page_id, date desc);

-- Stripe attributions — one row per checkout session attributed to a page
create table if not exists seo_stripe_conversions (
  id bigserial primary key,
  page_id uuid references seo_pages(id) on delete cascade,
  stripe_session_id text unique not null,
  amount_pence int not null,
  product text,
  created_at timestamptz not null
);

create index if not exists seo_stripe_conv_page_idx on seo_stripe_conversions(page_id);

-- Health snapshots — single latest row per page (upsert pattern)
create table if not exists seo_health (
  page_id uuid primary key references seo_pages(id) on delete cascade,
  is_indexed boolean,
  last_crawled_at timestamptz,
  http_status int,
  schema_valid boolean,
  schema_types text[],
  inbound_links int default 0,
  outbound_links int default 0,
  lcp_ms int,
  cls numeric(4,3),
  inp_ms int,
  uniqueness_score numeric(4,3),
  uniqueness_overlap_with text,
  checked_at timestamptz default now()
);

-- Pipeline runs
create table if not exists seo_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references seo_templates(id),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','awaiting_approval')),
  current_step text,
  steps jsonb not null default '[]'::jsonb,
  cells_planned int default 0,
  cells_passed int default 0,
  cells_generated int default 0,
  started_at timestamptz default now(),
  finished_at timestamptz
);

-- IndexPlease push log
create table if not exists seo_indexplease_pushes (
  id bigserial primary key,
  page_id uuid references seo_pages(id) on delete cascade,
  pushed_at timestamptz default now(),
  status text,
  response jsonb
);

-- Sync log — records every worker run
create table if not exists seo_sync_log (
  id bigserial primary key,
  worker text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_written int default 0,
  error text
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- All SEO tables use the admin client (service role) which bypasses RLS.
-- Enable RLS for safety but no restrictive policies needed — matches the
-- existing NWHub pattern where all dashboard queries go through createAdminClient().

alter table seo_templates enable row level security;
alter table seo_pages enable row level security;
alter table seo_briefs enable row level security;
alter table seo_gsc_daily enable row level security;
alter table seo_gsc_queries enable row level security;
alter table seo_ga4_daily enable row level security;
alter table seo_stripe_conversions enable row level security;
alter table seo_health enable row level security;
alter table seo_pipeline_runs enable row level security;
alter table seo_indexplease_pushes enable row level security;
alter table seo_sync_log enable row level security;
