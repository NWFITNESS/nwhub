import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { MembershipGroups } from '@/components/settings/MembershipGroups'

export default async function MemberKPIsPage() {
  const supabase = await createClient()

  const [
    { data: memberGroupsSetting },
    { data: allContacts },
  ] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'member_groups').single(),
    supabase.from('contacts').select('status, groups'),
  ])

  const memberGroups = (memberGroupsSetting?.value as string[] | undefined) ?? []
  const contacts = allContacts ?? []

  // Count by actual group data, not status field
  function hasRealMembership(groups: string[]): boolean {
    if (memberGroups.length > 0) {
      return groups.some(g => memberGroups.some(mg => g.toLowerCase().includes(mg.toLowerCase())))
    }
    return groups.some(g => g.toLowerCase() !== 'lead')
  }

  function isLead(groups: string[]): boolean {
    if (!groups || groups.length === 0) return true
    return groups.every(g => g.toLowerCase() === 'lead')
  }

  function isTrial(groups: string[]): boolean {
    return groups.some(g => g.toLowerCase().includes('trial'))
  }

  const totalContacts = contacts.length
  const memberCount = contacts.filter(c => hasRealMembership(c.groups ?? []) && !isTrial(c.groups ?? [])).length
  const trialCount = contacts.filter(c => isTrial(c.groups ?? [])).length
  const leadCount = contacts.filter(c => isLead(c.groups ?? [])).length
  const cancelledCount = contacts.filter(c => c.status === 'cancelled').length

  const stats = [
    { label: 'Total Contacts', value: totalContacts },
    { label: 'Members', value: memberCount },
    { label: 'Trials', value: trialCount },
    { label: 'Leads', value: leadCount },
    { label: 'Cancelled', value: cancelledCount },
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Members"
        title="Member"
        titleGold="KPIs"
        description="Track membership metrics and configure what counts as a member"
      />

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-5">
        {stats.map(s => (
          <div key={s.label} className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 p-[15px_17px_13px] shadow-gold-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{s.label}</span>
            <div className="mt-2 font-brand text-[28px] font-bold leading-none tracking-[-0.5px] text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Membership Groups config */}
      <Panel>
        <PanelHeader eyebrow="Configuration" title="Membership Groups" />
        <div className="p-4">
          <MembershipGroups initialGroups={memberGroups} />
        </div>
      </Panel>
    </div>
  )
}
