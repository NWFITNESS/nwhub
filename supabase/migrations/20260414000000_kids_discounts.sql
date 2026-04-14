-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — Discount codes
--
-- Stores reusable discount codes (percentage or fixed amount) that can be
-- applied at checkout. Also supports auto-apply discounts like the sibling
-- discount (10% off when booking 2+ children).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists kids_discounts (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,
  description   text not null default '',
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  value         integer not null default 0,          -- percentage (0–100) or pence for fixed
  is_active     boolean not null default true,
  valid_from    timestamptz,
  valid_until   timestamptz,
  max_uses      integer,                             -- null = unlimited
  times_used    integer not null default 0,
  min_children  integer not null default 1,          -- e.g. 2 for sibling discount
  auto_apply    boolean not null default false,       -- true = applied automatically, not via code input
  created_at    timestamptz not null default now()
);

-- Code lookups are case-insensitive — store uppercase, query with upper()
create unique index if not exists kids_discounts_code_uniq on kids_discounts (upper(code));

-- ─────────────────────────────────────────────────────────────────────────────
-- Track which discount was applied to each block booking
-- ─────────────────────────────────────────────────────────────────────────────

alter table kids_block_bookings
  add column if not exists discount_code text,
  add column if not exists discount_amount_pence integer not null default 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed the sibling discount (10% off for 2+ children)
-- ─────────────────────────────────────────────────────────────────────────────

insert into kids_discounts (code, description, discount_type, value, is_active, min_children, auto_apply)
values ('SIBLING10', 'Sibling discount — 10% off when booking 2 or more children', 'percentage', 10, true, 2, true)
on conflict do nothing;
