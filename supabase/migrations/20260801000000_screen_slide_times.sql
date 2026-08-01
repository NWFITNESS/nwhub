-- ─────────────────────────────────────────────────────────────────────────────
-- Screens — per-slide time-of-day window.
--
-- Extends slide scheduling (date range + days_of_week) with an optional
-- start/end clock time, e.g. show a slide only 06:00–10:00. Stored as 'HH:MM'
-- text (nullable = no bound). Filtering happens server-side in Europe/London.
-- Additive; nothing existing is touched.
-- ─────────────────────────────────────────────────────────────────────────────

alter table screen_slides
  add column if not exists start_time text,
  add column if not exists end_time text;
