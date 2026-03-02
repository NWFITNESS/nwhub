import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/layout/SidebarProvider'

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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SidebarProvider unreadCount={unreadCount ?? 0} userEmail={user?.email}>
        {children}
      </SidebarProvider>
    </div>
  )
}
