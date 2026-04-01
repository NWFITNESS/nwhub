import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Contact } from '@/lib/types'

function isLead(groups: string[]): boolean {
  // A contact is a "lead" if they have no groups, or their only group is "lead"
  if (!groups || groups.length === 0) return true
  return groups.every(g => g.toLowerCase() === 'lead')
}

export default async function LeadsPipelinePage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter to contacts with no membership groups (only "lead" tag or empty)
  const contacts = ((data ?? []) as Contact[]).filter(c => isLead(c.groups ?? []))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Members"
        title="Leads"
        titleGold="Pipeline"
        description={`${contacts.length} lead${contacts.length !== 1 ? 's' : ''} — contacts without a membership`}
      />
      <ContactsManager initialContacts={contacts} />
    </div>
  )
}
