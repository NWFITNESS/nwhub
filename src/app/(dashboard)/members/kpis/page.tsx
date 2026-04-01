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
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 p-[15px_17px_13px] shadow-gold-sm">
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{s.label}</span>
            <div className="mt-2 font-brand text-[28px] font-bold leading-none tracking-[-0.5px] text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Lead conversion widget */}
      <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 shadow-gold-sm">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Total Leads */}
          <div className="flex-1 p-[17px_20px_15px]">
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">Total Leads</span>
            <div className="mt-2 font-brand text-[36px] font-bold leading-none tracking-[-0.5px] text-white">{leadCount}</div>
            <p className="mt-2 text-[11px] text-nw-500">Contacts without a membership</p>
          </div>

          {/* Divider */}
          <div className="h-px w-full md:h-auto md:w-px self-stretch mx-4 md:mx-0 my-0 md:my-3 bg-[rgba(255,255,255,0.09)]" />

          {/* Converted */}
          <div className="flex-1 p-[17px_20px_15px]">
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">Converted</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-brand text-[36px] font-bold leading-none tracking-[-0.5px] text-gold-300">{convertedLeads}</span>
              {conversionRate > 0 && (
                <span className="rounded-[6px] bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-1.5 py-0.5 text-[10px] font-semibold text-[#4ade80]">
                  {conversionRate}%
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-nw-500">Leads who became members</p>
          </div>

          {/* Divider */}
          <div className="h-px w-full md:h-auto md:w-px self-stretch mx-4 md:mx-0 my-0 md:my-3 bg-[rgba(255,255,255,0.09)]" />

          {/* Conversion rate visual */}
          <div className="flex-1 p-[17px_20px_15px] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">Conversion Rate</span>
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
            <p className="mt-2 text-[11px] text-nw-500">Lead → member pipeline</p>
          </div>
        </div>

        {/* Gold accent bar */}
        <div className="h-[2px] bg-gradient-to-r from-[rgba(212,160,23,0.5)] via-[rgba(212,160,23,0.2)] to-transparent" />
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
