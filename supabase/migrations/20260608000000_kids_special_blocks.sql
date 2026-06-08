-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — "limited edition" special blocks
--
-- Adds support for a special, limited-run block (e.g. an extra weekly summer
-- teens session) that runs ALONGSIDE the normal active block rather than
-- replacing it. The public site renders these as a distinct "limited edition"
-- card with a booking-closes countdown.
--
-- Additive only — no data is touched. Existing blocks default to is_special=false
-- so nothing about the current behaviour changes.
--
--   is_special  ── true = render as a limited-edition drop, separate from the
--                  normal active block. One normal + one special block can both
--                  be is_active=true at the same time (the app scopes "only one
--                  active" per kind).
--   closes_at   ── optional booking deadline. The public card shows a live
--                  "closes in X" countdown and hides the CTA once passed.
--   tagline     ── optional short badge label, e.g. "Summer · Ltd". Falls back
--                  to a sensible default in the UI when null.
-- ─────────────────────────────────────────────────────────────────────────────

alter table kids_blocks add column if not exists is_special boolean not null default false;
alter table kids_blocks add column if not exists closes_at  timestamptz;
alter table kids_blocks add column if not exists tagline    text;

-- Fast lookup for the public site's two queries (active normal / active special)
create index if not exists kids_blocks_special_active_idx on kids_blocks(is_special, is_active);
