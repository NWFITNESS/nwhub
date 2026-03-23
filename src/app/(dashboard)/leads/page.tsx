import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Contact } from '@/lib/types'

export default async function LeadsPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .contains('groups', ['lead'])
    .order('created_at', { ascending: false })
  const contacts = (data ?? []) as Contact[]

  return (
    <>
      <TopBar title="Leads" />
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Leads"
          description={`${contacts.length} lead${contacts.length !== 1 ? 's' : ''} — contacts with no membership yet`}
        />
        <ContactsManager initialContacts={contacts} />
      </main>
    </>
  )
}
