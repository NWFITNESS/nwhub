import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { MobileContactsList } from '@/components/mobile/MobileContactsList'
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
      {/* Mobile layout */}
      <MobileContactsList contacts={contacts} title="Leads" />

      {/* Desktop layout */}
      <div className="hidden lg:block bg-nw-900 min-h-screen">
        <TopBar title="Leads" />
        <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
          <PageHeader
            eyebrow="Admin Panel"
            title="Lead"
            titleGold="Pipeline"
            description={`${contacts.length} lead${contacts.length !== 1 ? 's' : ''} — contacts with no membership yet`}
          />
          <ContactsManager initialContacts={contacts} />
        </main>
      </div>
    </>
  )
}
