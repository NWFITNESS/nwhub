import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { KidsTable } from '@/components/kids/KidsTable'
import { MobileKidsList } from '@/components/mobile/MobileKidsList'

export default async function KidsPage() {
  const supabase = await createClient()
  const { data: registrations } = await supabase
    .from('kids_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      {/* Mobile layout */}
      <MobileKidsList registrations={registrations ?? []} />

      {/* Desktop layout */}
      <div className="hidden lg:block bg-nw-900 min-h-screen">
        <TopBar title="Kids & Teens Registrations" />
        <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
          <PageHeader
            eyebrow="Admin Panel"
            title="Kids &"
            titleGold="Teens"
            description={`${registrations?.length ?? 0} registrations`}
          />
          <KidsTable initialRegistrations={registrations ?? []} />
        </main>
      </div>
    </>
  )
}
