import { createClient } from '@/lib/supabase/server'
import { CoachLogin } from './CoachLogin'
import { CoachApp } from './CoachApp'
import { CoachSignOut } from './CoachSignOut'
import type { RotaCoach } from '@/lib/rota'

export const dynamic = 'force-dynamic'

export default async function CoachHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <CoachLogin />

  const { data: coach } = await supabase
    .from('rota_coaches')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!coach || !coach.active) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Not set up yet</h1>
        <p style={{ fontSize: 14, color: '#8296b4', marginBottom: 24 }}>
          You’re signed in as <strong style={{ color: '#b9c6da' }}>{user.email}</strong>, but this email isn’t an active coach.
          Ask the gym to add you to the rota.
        </p>
        <CoachSignOut />
      </div>
    )
  }

  return <CoachApp coach={coach as RotaCoach} userEmail={user.email ?? ''} />
}
