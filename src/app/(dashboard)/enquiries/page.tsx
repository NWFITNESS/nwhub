import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { EnquiriesClient } from '@/components/enquiries/EnquiriesClient'

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  const supabase = await createClient()
  const { data: enquiries } = await supabase
    .from('contact_enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Admin Panel" title="Contact" titleGold="Enquiries" description={`${enquiries?.length ?? 0} enquiries`} />
      <EnquiriesClient initialEnquiries={enquiries ?? []} selectedId={id} />
    </div>
  )
}
