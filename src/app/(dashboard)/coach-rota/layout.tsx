import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Gate the whole /coach-rota area: owners/admins, or staff granted coach_rota.
export default async function CoachRotaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role, permissions')
    .eq('user_id', user.id)
    .maybeSingle()

  const isAdmin = profile && (
    profile.role === 'owner' ||
    profile.role === 'admin' ||
    (profile.permissions as Record<string, boolean> | null)?.coach_rota === true
  )
  if (!isAdmin) redirect('/')

  return <>{children}</>
}
