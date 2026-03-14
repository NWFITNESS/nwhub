import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContactsTable } from '@/components/contacts/ContactsTable'

export default async function EnquiriesPage() {
  const supabase = await createClient()
  const { data: enquiries } = await supabase
    .from('contact_enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="Enquiries" />
      <main className="flex flex-col gap-6 px-6 lg:px-12 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader title="Contact Enquiries" description={`${enquiries?.length ?? 0} enquiries`} />
        <ContactsTable initialEnquiries={enquiries ?? []} />
      </main>
    </>
  )
}
