import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffProfile } from '@/lib/staff'
import type { RotaCoach } from '@/lib/rota'

export interface RotaCaller {
  userId: string | null
  profile: StaffProfile | null
  coach: RotaCoach | null
}

/** Resolve the current user's staff profile and/or coach record (via admin client). */
export async function getRotaCaller(): Promise<RotaCaller> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, profile: null, coach: null }

  const admin = createAdminClient()
  const [{ data: profile }, { data: coach }] = await Promise.all([
    admin.from('staff_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    admin.from('rota_coaches').select('*').eq('user_id', user.id).maybeSingle(),
  ])
  return { userId: user.id, profile: (profile as StaffProfile) ?? null, coach: (coach as RotaCoach) ?? null }
}

/** Owners/admins, or staff explicitly granted the coach_rota permission. */
export function isRotaAdmin(profile: StaffProfile | null): boolean {
  if (!profile) return false
  if (profile.role === 'owner' || profile.role === 'admin') return true
  return !!(profile.permissions as unknown as Record<string, boolean>)?.coach_rota
}

/** Guard for admin-only rota endpoints. Returns the admin client + caller, or a 401/403. */
export async function requireRotaAdmin(): Promise<
  | { ok: true; admin: ReturnType<typeof createAdminClient>; caller: RotaCaller }
  | { ok: false; res: NextResponse }
> {
  const caller = await getRotaCaller()
  if (!caller.userId) return { ok: false, res: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }
  if (!isRotaAdmin(caller.profile)) return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true, admin: createAdminClient(), caller }
}
