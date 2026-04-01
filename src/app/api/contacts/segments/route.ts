import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  const [{ data: contacts }, { data: kidsRegs }] = await Promise.all([
    supabase.from('contacts').select('email, groups'),
    supabase.from('kids_registrations').select('parent_email'),
  ])

  const all = contacts ?? []
  const withEmail = all.filter(c => c.email)

  // Build segments
  const members = withEmail.filter(c => {
    const g: string[] = c.groups ?? []
    return g.some(x => x.toLowerCase() !== 'lead' && !x.toLowerCase().includes('trial'))
  })

  const leads = withEmail.filter(c => {
    const g: string[] = c.groups ?? []
    if (!g.length) return true
    return g.every(x => x.toLowerCase() === 'lead')
  })

  const trials = withEmail.filter(c => {
    const g: string[] = c.groups ?? []
    return g.some(x => x.toLowerCase().includes('trial'))
  })

  // Kids: parent emails from registrations + contacts with kids-related groups
  const kidsEmails = new Set<string>()
  for (const r of (kidsRegs ?? [])) {
    if (r.parent_email) kidsEmails.add(r.parent_email.toLowerCase())
  }
  for (const c of withEmail) {
    const g: string[] = c.groups ?? []
    if (g.some(x => x.toLowerCase().includes('kid') || x.toLowerCase().includes('junior') || x.toLowerCase().includes('youth'))) {
      kidsEmails.add(c.email!.toLowerCase())
    }
  }

  const segments = [
    { id: 'all', label: 'All Contacts', count: withEmail.length, emails: withEmail.map(c => c.email) },
    { id: 'members', label: 'Members', count: members.length, emails: members.map(c => c.email) },
    { id: 'leads', label: 'Leads', count: leads.length, emails: leads.map(c => c.email) },
    { id: 'trials', label: 'Trials', count: trials.length, emails: trials.map(c => c.email) },
    { id: 'kids', label: 'Kids & Teens Parents', count: kidsEmails.size, emails: [...kidsEmails] },
  ]

  return NextResponse.json(segments)
}
