import { createAdminClient } from '@/lib/supabase/admin'
import { ContactsManager } from '@/components/contacts/ContactsManager'
import { PageHeader } from '@/components/layout/PageHeader'
import type { Contact } from '@/lib/types'

function hasRealMembership(groups: string[]): boolean {
  // A contact is a "member" if they have any group that isn't just "lead"
  return groups.some(g => g.toLowerCase() !== 'lead')
}

export default async function MemberListPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  // Filter to contacts with real membership groups (not just "lead")
  const contacts = ((data ?? []) as Contact[]).filter(c => hasRealMembership(c.groups ?? []))

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Members"
        title="Member"
        titleGold="List"
        description={`${contacts.length} member${contacts.length !== 1 ? 's' : ''}`}
      />
      <ContactsManager initialContacts={contacts} />
    </div>
  )
}
