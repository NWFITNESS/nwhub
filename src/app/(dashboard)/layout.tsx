import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/layout/SidebarProvider'
import { EnquiryToast } from '@/components/enquiries/EnquiryToast'
import type { StaffProfile } from '@/lib/staff'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const [
    { count: unreadCount },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('contact_enquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase.auth.getUser(),
  ])

  // Fetch staff profile for permissions and display name
  let staffProfile: StaffProfile | null = null
  if (user) {
    try {
      const { data } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      staffProfile = data as StaffProfile | null
    } catch (e) {
      console.error('[layout] staff_profiles query failed:', (e as Error).message)
    }
  }

  return (
    <SidebarProvider
      unreadCount={unreadCount ?? 0}
      userEmail={user?.email}
      staffProfile={staffProfile}
    >
      {children}
      <EnquiryToast />
    </SidebarProvider>
  )
}
