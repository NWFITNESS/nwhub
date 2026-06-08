-- ─────────────────────────────────────────────────────────────────────────────
-- Kids & Teens — block description ("what's involved")
--
-- Free-text blurb shown on the public limited-edition drop card so parents can
-- see what the session involves (focus, what to bring, who it's for, etc).
-- Additive and nullable — existing blocks keep null and simply show no blurb.
-- ─────────────────────────────────────────────────────────────────────────────

alter table kids_blocks add column if not exists description text;
