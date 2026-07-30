-- ─────────────────────────────────────────────────────────────────────────────
-- Screens Phase 2 — per-slide transition duration.
--
-- Phase 1/2 hardcoded the transition length at 700ms in the player. This adds a
-- per-slide control (the admin's speed slider). 0 = instant (same as a `cut`),
-- capped at 5s. Additive; nothing existing is touched.
-- ─────────────────────────────────────────────────────────────────────────────

alter table screen_slides
  add column if not exists transition_ms integer not null default 700
  check (transition_ms between 0 and 5000);
