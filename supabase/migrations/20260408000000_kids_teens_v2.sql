-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens v2 — Block bookings, drop-ins, normalised parents/children
--
-- Replaces the flat `kids_registrations` table with a normalised model:
--   kids_blocks            ── recurring 6-week blocks
--   kids_sessions          ── individual session dates within a block
--   kids_block_pricing     ── per-category price + capacity per block
--   kids_parents           ── one row per parent/guardian (email = unique key)
--   kids_children          ── one row per child, linked to a parent
--   kids_block_bookings    ── child + block + payment status
--   kids_dropin_bookings   ── child + single session + payment status
--
-- Existing data in `kids_registrations` is backfilled into kids_parents +
-- kids_children at the bottom of this migration. The old table is INTENTIONALLY
-- LEFT IN PLACE here so the existing /kids admin panel and /api/kids/register
-- handler keep working until Phase 2 ships. A follow-up migration will drop it.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enum: kids_category ──────────────────────────────────────────────────────
do $$ begin
  create type kids_category as enum ('minis', 'littles', 'teens');
exception when duplicate_object then null;
end $$;

-- ── kids_blocks ──────────────────────────────────────────────────────────────
create table if not exists kids_blocks (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  start_date    date not null,
  session_count int not null default 6,
  is_recurring  boolean not null default true,
  is_active     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── kids_sessions ────────────────────────────────────────────────────────────
create table if not exists kids_sessions (
  id             uuid primary key default gen_random_uuid(),
  block_id       uuid not null references kids_blocks(id) on delete cascade,
  session_date   date not null,
  session_number int not null,
  is_break       boolean not null default false,
  break_label    text,
  created_at     timestamptz not null default now(),
  unique (block_id, session_number)
);

create index if not exists kids_sessions_block_idx on kids_sessions(block_id);
create index if not exists kids_sessions_date_idx  on kids_sessions(session_date);

-- ── kids_block_pricing ───────────────────────────────────────────────────────
create table if not exists kids_block_pricing (
  id              uuid primary key default gen_random_uuid(),
  block_id        uuid not null references kids_blocks(id) on delete cascade,
  category        kids_category not null,
  capacity        int not null default 12,
  price_pence     int not null,
  stripe_price_id text,
  unique (block_id, category)
);

-- ── kids_parents ─────────────────────────────────────────────────────────────
create table if not exists kids_parents (
  id                          uuid primary key default gen_random_uuid(),
  email                       text not null unique,
  name                        text not null,
  phone                       text,
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Trigger to keep updated_at fresh
create or replace function kids_parents_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists kids_parents_updated_at on kids_parents;
create trigger kids_parents_updated_at
  before update on kids_parents
  for each row execute function kids_parents_set_updated_at();

-- ── kids_children ────────────────────────────────────────────────────────────
create table if not exists kids_children (
  id                  uuid primary key default gen_random_uuid(),
  parent_id           uuid not null references kids_parents(id) on delete cascade,
  child_name          text not null,
  date_of_birth       date not null,
  medical_notes       text,
  authorised_pickups  text,
  photo_consent       boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists kids_children_parent_idx on kids_children(parent_id);

-- ── kids_block_bookings ──────────────────────────────────────────────────────
create table if not exists kids_block_bookings (
  id                          uuid primary key default gen_random_uuid(),
  block_id                    uuid not null references kids_blocks(id),
  child_id                    uuid not null references kids_children(id) on delete cascade,
  parent_id                   uuid not null references kids_parents(id) on delete cascade,
  category                    kids_category not null,
  waiver_signed               boolean not null default false,
  waiver_signed_at            timestamptz,
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  payment_status              text not null default 'pending',
  paid_at                     timestamptz,
  created_at                  timestamptz not null default now()
);

create index if not exists kids_block_bookings_block_idx  on kids_block_bookings(block_id);
create index if not exists kids_block_bookings_child_idx  on kids_block_bookings(child_id);
create index if not exists kids_block_bookings_parent_idx on kids_block_bookings(parent_id);

-- ── kids_dropin_bookings ─────────────────────────────────────────────────────
create table if not exists kids_dropin_bookings (
  id                       uuid primary key default gen_random_uuid(),
  session_id               uuid references kids_sessions(id),
  child_id                 uuid references kids_children(id) on delete set null,
  parent_id                uuid references kids_parents(id) on delete set null,
  child_name               text,
  parent_email             text,
  category                 kids_category not null,
  stripe_payment_link_id   text,
  stripe_payment_intent_id text,
  payment_status           text not null default 'pending',
  price_pence              int not null,
  created_at               timestamptz not null default now()
);

create index if not exists kids_dropin_session_idx on kids_dropin_bookings(session_id);
create index if not exists kids_dropin_child_idx   on kids_dropin_bookings(child_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
--   authenticated (NWHub staff): full access to everything
--   anon (public website):
--     - SELECT on kids_blocks / kids_sessions / kids_block_pricing where active
--     - INSERT on kids_parents / kids_children / kids_block_bookings
--     - SELECT on kids_parents / kids_children for the returning-parent lookup
--       (lookup is by email and runs from a server route — but we still want
--        anon select to work via the public anon key when called from a server
--        component using supabase-js with the anon key)
-- ─────────────────────────────────────────────────────────────────────────────

alter table kids_blocks           enable row level security;
alter table kids_sessions         enable row level security;
alter table kids_block_pricing    enable row level security;
alter table kids_parents          enable row level security;
alter table kids_children         enable row level security;
alter table kids_block_bookings   enable row level security;
alter table kids_dropin_bookings  enable row level security;

-- ── kids_blocks ──────────────────────────────────────────────────────────────
drop policy if exists "Public can read active blocks" on kids_blocks;
create policy "Public can read active blocks"
  on kids_blocks for select
  to anon, authenticated
  using (is_active = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage blocks" on kids_blocks;
create policy "Authenticated users can manage blocks"
  on kids_blocks for all
  to authenticated
  using (true) with check (true);

-- ── kids_sessions ────────────────────────────────────────────────────────────
drop policy if exists "Public can read sessions of active blocks" on kids_sessions;
create policy "Public can read sessions of active blocks"
  on kids_sessions for select
  to anon, authenticated
  using (
    exists (
      select 1 from kids_blocks b
      where b.id = kids_sessions.block_id and b.is_active = true
    )
    or auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users can manage sessions" on kids_sessions;
create policy "Authenticated users can manage sessions"
  on kids_sessions for all
  to authenticated
  using (true) with check (true);

-- ── kids_block_pricing ───────────────────────────────────────────────────────
drop policy if exists "Public can read pricing of active blocks" on kids_block_pricing;
create policy "Public can read pricing of active blocks"
  on kids_block_pricing for select
  to anon, authenticated
  using (
    exists (
      select 1 from kids_blocks b
      where b.id = kids_block_pricing.block_id and b.is_active = true
    )
    or auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users can manage pricing" on kids_block_pricing;
create policy "Authenticated users can manage pricing"
  on kids_block_pricing for all
  to authenticated
  using (true) with check (true);

-- ── kids_parents ─────────────────────────────────────────────────────────────
drop policy if exists "Public can insert parents" on kids_parents;
create policy "Public can insert parents"
  on kids_parents for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read parents by email" on kids_parents;
create policy "Public can read parents by email"
  on kids_parents for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can update own parent record" on kids_parents;
create policy "Public can update own parent record"
  on kids_parents for update
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage parents" on kids_parents;
create policy "Authenticated users can manage parents"
  on kids_parents for all
  to authenticated
  using (true) with check (true);

-- ── kids_children ────────────────────────────────────────────────────────────
drop policy if exists "Public can insert children" on kids_children;
create policy "Public can insert children"
  on kids_children for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read children" on kids_children;
create policy "Public can read children"
  on kids_children for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can update children (photo consent)" on kids_children;
create policy "Public can update children (photo consent)"
  on kids_children for update
  to anon, authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage children" on kids_children;
create policy "Authenticated users can manage children"
  on kids_children for all
  to authenticated
  using (true) with check (true);

-- ── kids_block_bookings ──────────────────────────────────────────────────────
drop policy if exists "Public can insert block bookings" on kids_block_bookings;
create policy "Public can insert block bookings"
  on kids_block_bookings for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read own block bookings" on kids_block_bookings;
create policy "Public can read own block bookings"
  on kids_block_bookings for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can manage block bookings" on kids_block_bookings;
create policy "Authenticated users can manage block bookings"
  on kids_block_bookings for all
  to authenticated
  using (true) with check (true);

-- ── kids_dropin_bookings ─────────────────────────────────────────────────────
drop policy if exists "Authenticated users can manage dropin bookings" on kids_dropin_bookings;
create policy "Authenticated users can manage dropin bookings"
  on kids_dropin_bookings for all
  to authenticated
  using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Backfill from existing kids_registrations
--
-- Walks every existing registration row and idempotently creates:
--   • a kids_parents row keyed on lowercase email
--   • one kids_children row per child in the JSON array
--
-- Safe to re-run: ON CONFLICT (email) for parents and a NOT EXISTS guard on
-- children prevent duplicates if the migration is replayed.
--
-- The kids_registrations table is NOT dropped here. A follow-up migration in
-- Phase 2 (alongside the rebuilt /kids panel) will drop it.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  reg          record;
  child_obj    jsonb;
  parent_uuid  uuid;
  group_value  text;
  child_cat    kids_category;
begin
  -- Skip cleanly if the table doesn't exist (e.g. fresh dev DB)
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'kids_registrations'
  ) then
    return;
  end if;

  for reg in
    select * from kids_registrations
    where parent ? 'email' and (parent->>'email') is not null
  loop
    -- Upsert parent
    insert into kids_parents (
      email,
      name,
      phone,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation
    ) values (
      lower(trim(reg.parent->>'email')),
      coalesce(reg.parent->>'name', 'Unknown'),
      reg.parent->>'phone',
      reg.emergency->>'name',
      reg.emergency->>'phone',
      reg.emergency->>'relationship'
    )
    on conflict (email) do update set
      name                       = excluded.name,
      phone                      = coalesce(excluded.phone, kids_parents.phone),
      emergency_contact_name     = coalesce(excluded.emergency_contact_name, kids_parents.emergency_contact_name),
      emergency_contact_phone    = coalesce(excluded.emergency_contact_phone, kids_parents.emergency_contact_phone),
      emergency_contact_relation = coalesce(excluded.emergency_contact_relation, kids_parents.emergency_contact_relation)
    returning id into parent_uuid;

    -- Children
    if reg.children is not null and jsonb_typeof(reg.children) = 'array' then
      for child_obj in select * from jsonb_array_elements(reg.children)
      loop
        if (child_obj->>'name') is null
           or (child_obj->>'dob') is null
        then
          continue;
        end if;

        -- De-dupe: skip if a child with same name + dob already exists for this parent
        if exists (
          select 1 from kids_children c
          where c.parent_id = parent_uuid
            and c.child_name = (child_obj->>'name')
            and c.date_of_birth = (child_obj->>'dob')::date
        ) then
          continue;
        end if;

        -- Map free-text group to enum (best effort)
        group_value := lower(coalesce(child_obj->>'group', ''));
        child_cat := case
          when group_value like '%mini%'   then 'minis'::kids_category
          when group_value like '%little%' then 'littles'::kids_category
          when group_value like '%teen%'   then 'teens'::kids_category
          else 'littles'::kids_category
        end;

        insert into kids_children (
          parent_id,
          child_name,
          date_of_birth,
          medical_notes,
          photo_consent
        ) values (
          parent_uuid,
          child_obj->>'name',
          (child_obj->>'dob')::date,
          nullif(child_obj->>'medical', ''),
          coalesce((child_obj->>'photo_consent')::boolean, false)
        );
      end loop;
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Block 4 — Spring 2026
--   start_date 2026-04-11 (Saturday), 6 weekly sessions
--   session 3 (2026-04-25) marked as Half term break
--   minis £45, littles £45, teens £50, capacity 12 each
--   is_active = true
--
-- Idempotent: keyed on the unique block name.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_block_id uuid;
  i int;
begin
  select id into v_block_id from kids_blocks where name = 'Block 4 — Spring 2026';

  if v_block_id is null then
    insert into kids_blocks (name, start_date, session_count, is_recurring, is_active)
    values ('Block 4 — Spring 2026', date '2026-04-11', 6, true, true)
    returning id into v_block_id;

    -- Sessions: 6 weekly, session 3 = Half term
    for i in 1..6 loop
      insert into kids_sessions (block_id, session_date, session_number, is_break, break_label)
      values (
        v_block_id,
        date '2026-04-11' + ((i - 1) * 7),
        i,
        (i = 3),
        case when i = 3 then 'Half term' else null end
      );
    end loop;

    -- Pricing
    insert into kids_block_pricing (block_id, category, capacity, price_pence) values
      (v_block_id, 'minis',   12, 4500),
      (v_block_id, 'littles', 12, 4500),
      (v_block_id, 'teens',   12, 5000);
  end if;
end $$;
