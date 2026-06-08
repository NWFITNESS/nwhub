-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — custom block session times
--
-- Adds an explicit start/end time to a block. Normal blocks use the fixed
-- per-category times (Minis/Littles/Teens), but a limited-edition drop (e.g. an
-- extra summer teens session on a weeknight) needs its own time. Stored as
-- "HH:MM" 24h text — kept as text (not the `time` type) so it maps 1:1 to the
-- admin <input type="time"> value with no parsing/timezone concerns.
--
-- Additive and nullable — existing blocks keep null and fall back to the fixed
-- category times, so nothing changes for them.
-- ─────────────────────────────────────────────────────────────────────────────

alter table kids_blocks add column if not exists start_time text;
alter table kids_blocks add column if not exists end_time   text;
