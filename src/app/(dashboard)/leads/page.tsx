import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Contact } from '@/lib/types'

export default async function MemberListPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  const contacts = (data ?? []) as Contact[]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Members"
        title="Member"
        titleGold="List"
        description={`${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
      />
      <ContactsManager initialContacts={contacts} />
    </div>
  )
}
