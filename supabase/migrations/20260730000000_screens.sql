-- ─────────────────────────────────────────────────────────────────────────────
-- Screens — digital signage module (reception TV)
--
-- Two tables:
--   screens        — one row per physical display. `screen_slides` is the WORKING
--                    copy Mat edits; `published_manifest` is the LIVE copy the TV
--                    actually plays. Any slide mutation flips
--                    has_unpublished_changes; "Push to screen" serialises the
--                    working copy into published_manifest and clears the flag.
--   screen_slides  — the editable playlist.
--
-- The display route reads ONLY published_manifest, via the service role keyed on
-- the token. The anon key must never read these tables directly, so there is no
-- anon RLS policy here — only an authenticated-staff policy (matching the kids
-- tables). Additive migration; nothing existing is touched.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists screens (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  slug                     text not null unique,
  token                    text not null unique,
  is_active                boolean not null default true,
  published_manifest       jsonb,
  published_at             timestamptz,
  has_unpublished_changes  boolean not null default false,
  last_seen_at             timestamptz,
  created_at               timestamptz not null default now()
);

create table if not exists screen_slides (
  id                uuid primary key default gen_random_uuid(),
  screen_id         uuid not null references screens(id) on delete cascade,
  position          integer not null,
  name              text not null,
  kind              text not null check (kind in ('image','video','embed')),
  media_id          uuid references media(id) on delete set null,
  embed_url         text,
  duration_seconds  integer not null default 10 check (duration_seconds between 3 and 300),
  transition        text not null default 'fade' check (transition in ('fade','cut','slide')),
  is_live           boolean not null default true,
  starts_on         date,
  ends_on           date,
  days_of_week      smallint[] not null default '{0,1,2,3,4,5,6}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists screen_slides_screen_position_idx on screen_slides (screen_id, position);

-- Keep updated_at fresh on any UPDATE to a slide.
create or replace function screens_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists screen_slides_updated_at on screen_slides;
create trigger screen_slides_updated_at
  before update on screen_slides
  for each row execute function screens_touch_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Authenticated staff get full access. The display route uses the service role
-- (which bypasses RLS) keyed on the token — deliberately NO anon policy, so the
-- anon key cannot read tokens or manifests.

alter table screens enable row level security;
alter table screen_slides enable row level security;

drop policy if exists "Authenticated users can manage screens" on screens;
create policy "Authenticated users can manage screens"
  on screens
  to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage screen slides" on screen_slides;
create policy "Authenticated users can manage screen slides"
  on screen_slides
  to authenticated
  using (true) with check (true);

-- ─── Seed the single Reception screen ────────────────────────────────────────
-- Token is 32 hex chars from a CSPRNG (gen_random_bytes). Slug is stable;
-- ON CONFLICT keeps this migration idempotent without regenerating the token.
insert into screens (name, slug, token)
values ('Reception', 'reception', encode(gen_random_bytes(16), 'hex'))
on conflict (slug) do nothing;
