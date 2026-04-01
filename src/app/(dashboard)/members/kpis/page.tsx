import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { MembershipGroups } from '@/components/settings/MembershipGroups'

export default async function MemberKPIsPage() {
  const supabase = await createClient()

  const [
    { data: memberGroupsSetting },
    { count: totalContacts },
    { count: memberCount },
    { count: trialCount },
    { count: leadCount },
    { count: cancelledCount },
  ] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'member_groups').single(),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'member'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['inactive', 'active']),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  const memberGroups = (memberGroupsSetting?.value as string[] | undefined) ?? []

  const stats = [
    { label: 'Total Contacts', value: totalContacts ?? 0 },
    { label: 'Members', value: memberCount ?? 0 },
    { label: 'Trials', value: trialCount ?? 0 },
    { label: 'Leads', value: leadCount ?? 0 },
    { label: 'Cancelled', value: cancelledCount ?? 0 },
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
