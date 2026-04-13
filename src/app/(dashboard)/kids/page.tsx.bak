import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { KidsTable } from '@/components/kids/KidsTable'

export default async function KidsPage() {
  const supabase = await createClient()
  const { data: registrations } = await supabase
    .from('kids_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Admin Panel"
        title="Kids &"
        titleGold="Teens"
        description={`${registrations?.length ?? 0} registrations`}
      />
      <KidsTable initialRegistrations={registrations ?? []} />
    </div>
  )
}
