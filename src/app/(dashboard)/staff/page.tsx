import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffPageClient } from './StaffPageClient'

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if caller is owner or admin
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    redirect('/')
  }

  return <StaffPageClient callerRole={profile.role as 'owner' | 'admin'} />
}
