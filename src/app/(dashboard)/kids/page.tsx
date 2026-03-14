import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { KidsTable } from '@/components/kids/KidsTable'

export default async function KidsPage() {
  const supabase = await createClient()
  const { data: registrations } = await supabase
    .from('kids_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="Kids & Teens Registrations" />
      <main className="flex flex-col gap-6 px-6 lg:px-12 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Kids & Teens Registrations"
          description={`${registrations?.length ?? 0} registrations`}
        />
        <KidsTable initialRegistrations={registrations ?? []} />
      </main>
    </>
  )
}
