-- ============================================================================
-- Coach Rota — security advisor fixes
--
-- Resolves three Supabase database-linter findings without changing any
-- app-visible behaviour:
--
--  #1 (ERROR 0010 security_definer_view) — `rota_coaches_public` was a
--     SECURITY DEFINER view. It intentionally bypasses RLS so every signed-in
--     coach can see all coaches' name/colour (never emails/phone/pay). We keep
--     that behaviour but move the privileged read into a SECURITY DEFINER
--     *function* (search_path locked, not callable by anon) and expose it via a
--     `security_invoker` view. Same view name + columns, so no app change.
--
--  #3 (WARN 0028 anon_security_definer_function_executable) —
--     `is_rota_admin()` / `my_coach_id()` are only used inside RLS policies on
--     authenticated-only tables, so anon never needs them. Revoke from PUBLIC
--     (which covers anon) and grant execute to the roles that actually call
--     them.
--
-- (#2 — "Leaked password protection disabled" — is an Auth config toggle, not
--  SQL; enable it in Dashboard → Authentication → Sign In / Providers →
--  Password protection.)
-- ============================================================================

-- ── #1: rota_coaches_public ─────────────────────────────────────────────────

-- Privileged safe-column read of every coach. SECURITY DEFINER so it bypasses
-- the row-restricting RLS on rota_coaches; only ever returns non-sensitive
-- columns (id, name, color, active) — never email / phone / hourly_rate.
create or replace function rota_coaches_public_rows()
returns table (id uuid, name text, color text, active boolean)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, color, active from rota_coaches;
$$;

-- Supabase grants EXECUTE to anon/authenticated EXPLICITLY on create, so a
-- `revoke from public` isn't enough — revoke from anon by name.
revoke all on function rota_coaches_public_rows() from public, anon;
grant execute on function rota_coaches_public_rows() to authenticated, service_role;

-- Recreate the view as security_invoker (clears linter 0010). Reading it runs
-- as the caller, who needs only EXECUTE on the function above — the function
-- (not the caller) touches rota_coaches, so RLS stays bypassed exactly as
-- before and no email/pay column is reachable.
drop view if exists rota_coaches_public;
create view rota_coaches_public
  with (security_invoker = on)
  as select id, name, color, active from rota_coaches_public_rows();

grant select on rota_coaches_public to authenticated, service_role;

-- ── #3: lock down helper functions to signed-in callers only ────────────────

revoke execute on function is_rota_admin() from public, anon;
grant execute on function is_rota_admin() to authenticated, service_role;

revoke execute on function my_coach_id() from public, anon;
grant execute on function my_coach_id() to authenticated, service_role;
