-- ============================================================================
-- Coach Rota — privacy tightening
-- Coaches should NOT see each other's hourly_rate / email / phone.
-- - Restrict rota_coaches SELECT to admins or the coach themselves.
-- - Expose only safe display columns (name/colour) via a view for the rota UI.
-- ============================================================================

-- Only admins or the coach themselves may read the full coach row.
drop policy if exists "rota_coaches_select" on rota_coaches;
create policy "rota_coaches_select" on rota_coaches for select to authenticated
  using (is_rota_admin() or user_id = auth.uid());

-- Safe, name-only view so coaches can see who is assigned to sessions, without
-- leaking pay/contact details. Runs with the view owner's rights (not the
-- caller's), exposing only non-sensitive columns.
create or replace view rota_coaches_public
  with (security_invoker = false)
  as select id, name, color, active from rota_coaches;

grant select on rota_coaches_public to authenticated;
