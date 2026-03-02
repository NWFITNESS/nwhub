import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContactsTable } from '@/components/contacts/ContactsTable'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: enquiries } = await supabase
    .from('contact_enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <TopBar title="Contacts" />
      <main className="p-6">
        <PageHeader title="Contact Enquiries" description={`${enquiries?.length ?? 0} enquiries`} />
        <ContactsTable initialEnquiries={enquiries ?? []} />
      </main>
    </>
  )
}
