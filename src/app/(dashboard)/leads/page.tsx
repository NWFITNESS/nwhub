import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
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
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Platform"
        title="Engagement"
        description={`${contacts.length} lead${contacts.length !== 1 ? 's' : ''} — contacts with no membership yet`}
      />
      <ContactsManager initialContacts={contacts} />
    </div>
  )
}
