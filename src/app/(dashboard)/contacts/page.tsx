import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Contact } from '@/lib/types'

export default async function ContactsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  const contacts = (data ?? []) as Contact[]

  return (
    <>
      <TopBar title="Contacts" />
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader title="Contacts" description={`${contacts.length} contacts`} />
        <ContactsManager initialContacts={contacts} />
      </main>
    </>
  )
}
