import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { PageStatCard } from '@/components/ui/PageStatCard'
import { MembershipGroups } from '@/components/settings/MembershipGroups'

export default async function MemberKPIsPage() {
  const supabase = createAdminClient()

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

  // Lost members = had a real membership group but status is now cancelled or inactive
  const lostMembers = contacts.filter(c => {
    const g: string[] = c.groups ?? []
    return hasRealMembership(g) && (c.status === 'cancelled' || c.status === 'inactive')
  }).length

  // Converted leads = contacts who have "lead" in groups AND also a real membership group
  const convertedLeads = contacts.filter(c => {
    const g: string[] = c.groups ?? []
    const hasLead = g.some((x: string) => x.toLowerCase() === 'lead')
    const hasOther = g.some((x: string) => x.toLowerCase() !== 'lead')
    return hasLead && hasOther
  }).length

  const conversionRate = leadCount + convertedLeads > 0
    ? Math.round((convertedLeads / (leadCount + convertedLeads)) * 100)
    : 0

  const stats = [
    { label: 'Total Contacts', value: totalContacts },
    { label: 'Members', value: memberCount },
    { label: 'Trials', value: trialCount },
    { label: 'Cancelled', value: cancelledCount },
    { label: 'Lost Members', value: lostMembers },
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <PageStatCard label="Total Contacts" value={totalContacts} sub="All contacts" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>} color="#C9A70A" />
        <PageStatCard label="Members" value={memberCount} sub="Active memberships" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.5 2-4.5 5-4.5s5 2 5 4.5"/><circle cx="12" cy="5" r="1.5"/><path d="M15 12c0-1.5-1.2-2.8-3-2.8" strokeLinecap="round"/></svg>} color="#22c55e" />
        <PageStatCard label="Trials" value={trialCount} sub="On trial" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" strokeLinecap="round"/></svg>} color="#3b82f6" />
        <PageStatCard label="Cancelled" value={cancelledCount} sub="Cancelled membership" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6"/><path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round"/></svg>} color="#f59e0b" />
        <PageStatCard label="Lost Members" value={lostMembers} sub="No longer active" alert={lostMembers > 0} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 1l7 13H1L8 1z"/><path d="M8 6v3M8 11.5v.5" strokeLinecap="round"/></svg>} />
      </div>

      {/* Lead conversion widget */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.13)] bg-nw-750 shadow-gold-sm">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Total Leads */}
          <div className="flex-1" style={{ padding: 20 }}>
            <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">Total Leads</span>
            <div className="mt-2 font-brand text-[36px] font-bold leading-none tracking-[-0.5px] text-white">{leadCount}</div>
            <p className="mt-2 text-xs font-medium text-nw-400">Contacts without a membership</p>
          </div>

          {/* Divider */}
          <div className="h-px w-full md:h-auto md:w-px self-stretch mx-4 md:mx-0 my-0 md:my-3 bg-[rgba(255,255,255,0.09)]" />

          {/* Converted */}
          <div className="flex-1" style={{ padding: 20 }}>
            <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">Converted</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-brand text-[36px] font-bold leading-none tracking-[-0.5px] text-gold-300">{convertedLeads}</span>
              {conversionRate > 0 && (
                <span className="rounded-[6px] bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-1.5 py-0.5 text-[10px] font-semibold text-[#22c55e]">
                  {conversionRate}%
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-nw-400">Leads who became members</p>
          </div>

          {/* Divider */}
          <div className="h-px w-full md:h-auto md:w-px self-stretch mx-4 md:mx-0 my-0 md:my-3 bg-[rgba(255,255,255,0.09)]" />

          {/* Conversion rate visual */}
          <div className="flex-1 flex flex-col justify-between" style={{ padding: 20 }}>
            <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">Conversion Rate</span>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-brand text-[20px] font-bold text-white">{conversionRate}%</span>
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-nw-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-[width] duration-500"
                  style={{ width: `${Math.max(conversionRate, 2)}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-nw-400">Lead → member pipeline</p>
          </div>
        </div>

        {/* Gold accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-[rgba(212,160,23,0.5)] via-[rgba(212,160,23,0.2)] to-transparent" />
      </div>

      {/* Membership Groups config */}
      <Panel>
        <PanelHeader eyebrow="Configuration" title="Membership Groups" />
        <div style={{ padding: 20 }}>
          <MembershipGroups initialGroups={memberGroups} />
        </div>
      </Panel>
    </div>
  )
}
