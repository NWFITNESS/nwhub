import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  const [{ data: contacts }, { data: kidsRegs }, { data: kidsParents }, { data: subscribers }] = await Promise.all([
    supabase.from('contacts').select('email, groups'),
    supabase.from('kids_registrations').select('parent_email'),
    supabase.from('kids_parents').select('email'),
    supabase.from('email_subscribers').select('email, tags, source').eq('status', 'subscribed'),
  ])

  const allContacts = contacts ?? []
  const contactsWithEmail = allContacts.filter(c => c.email)
  const allSubs = subscribers ?? []

  // Contact-based segments
  const members = contactsWithEmail.filter(c => {
    const g: string[] = c.groups ?? []
    return g.some(x => x.toLowerCase() !== 'lead' && !x.toLowerCase().includes('trial'))
  })

  const leads = contactsWithEmail.filter(c => {
    const g: string[] = c.groups ?? []
    if (!g.length) return true
    return g.every(x => x.toLowerCase() === 'lead')
  })

  const trials = contactsWithEmail.filter(c => {
    const g: string[] = c.groups ?? []
    return g.some(x => x.toLowerCase().includes('trial'))
  })

  // Kids — aggregate from all sources
  const kidsEmails = new Set<string>()
  for (const r of (kidsRegs ?? [])) {
    if (r.parent_email) kidsEmails.add(r.parent_email.toLowerCase())
  }
  // v2 kids_parents table (new booking system)
  for (const p of (kidsParents ?? [])) {
    if (p.email) kidsEmails.add(p.email.toLowerCase())
  }
  for (const c of contactsWithEmail) {
    const g: string[] = c.groups ?? []
    if (g.some(x => x.toLowerCase().includes('kid') || x.toLowerCase().includes('junior') || x.toLowerCase().includes('youth'))) {
      kidsEmails.add(c.email!.toLowerCase())
    }
  }
  // Imported subscribers tagged 'kids-parents'
  for (const s of allSubs) {
    if (s.tags?.includes('kids-parents') && s.email) kidsEmails.add(s.email.toLowerCase())
  }

  // Newsletter subscribers
  const newsletterSubs = allSubs.filter(s => s.tags?.includes('newsletter'))

  // Source-based subscriber segments
  const websiteSubs = allSubs.filter(s => s.source === 'website' || s.tags?.includes('website'))
  const squarespaceSubs = allSubs.filter(s => s.source === 'squarespace' || s.tags?.includes('squarespace'))

  // All unique tags across subscribers for custom segments
  const allTags = new Set<string>()
  for (const s of allSubs) {
    for (const t of (s.tags ?? [])) allTags.add(t)
  }

  // Build custom tag segments (only tags that aren't source names and have >0 subscribers)
  const sourceTags = new Set(['website', 'squarespace', 'mailchimp', 'manual', 'contacts_sync', 'wodboard_sync', 'import', 'admin'])
  const customTagSegments = [...allTags]
    .filter(t => !sourceTags.has(t))
    .map(tag => {
      const matching = allSubs.filter(s => s.tags?.includes(tag))
      return { id: `tag:${tag}`, label: tag.charAt(0).toUpperCase() + tag.slice(1), count: matching.length, emails: matching.map(s => s.email) }
    })
    .filter(s => s.count > 0)

  const segments = [
    // Core segments
    { id: 'all', label: 'All Subscribers', count: allSubs.length, emails: allSubs.map(s => s.email), category: 'core' },
    { id: 'all_contacts', label: 'All Contacts', count: contactsWithEmail.length, emails: contactsWithEmail.map(c => c.email), category: 'core' },

    // Membership segments
    { id: 'members', label: 'Members', count: members.length, emails: members.map(c => c.email), category: 'membership' },
    { id: 'leads', label: 'Leads', count: leads.length, emails: leads.map(c => c.email), category: 'membership' },
    { id: 'trials', label: 'Trials', count: trials.length, emails: trials.map(c => c.email), category: 'membership' },
    { id: 'kids', label: 'Kids & Teens Parents', count: kidsEmails.size, emails: [...kidsEmails], category: 'membership', tags: ['kids-parents'] },

    // Source segments
    { id: 'newsletter', label: 'Newsletter', count: newsletterSubs.length, emails: newsletterSubs.map(s => s.email), category: 'source', tags: ['newsletter'] },
    { id: 'website', label: 'Website Subscribers', count: websiteSubs.length, emails: websiteSubs.map(s => s.email), category: 'source' },
    { id: 'squarespace', label: 'Squarespace Import', count: squarespaceSubs.length, emails: squarespaceSubs.map(s => s.email), category: 'source' },

    // Custom tag segments
    ...customTagSegments.map(s => ({ ...s, category: 'tags' })),
  ]

  // Filter out empty segments (except core)
  return NextResponse.json(segments.filter(s => s.category === 'core' || s.count > 0))
}
