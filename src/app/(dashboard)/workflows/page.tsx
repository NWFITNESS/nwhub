import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/PageHeader'
import { WorkflowsClient } from '@/components/workflows/WorkflowsClient'

const DEFAULT_STATES: Record<string, boolean> = {
  new_member_journey:    false,
  google_review_sequence: true,
  re_engagement:         false,
  trial_conversion:      true,
  birthday_messages:     false,
}

export default async function WorkflowsPage() {
  const supabase = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: workflowSettings },
    { data: reviewRequests },
    { data: smsCampaigns },
    { count: trialCount },
    { count: memberCount },
    { count: newContactsThisMonth },
  ] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'workflow_states').single(),
    supabase.from('review_requests').select('messages_sent, review_detected, opted_out, created_at, last_sent_at'),
    supabase.from('sms_campaigns').select('stats, created_at').eq('status', 'sent'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['member', 'trial']),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
  ])

  const workflowStates: Record<string, boolean> = {
    ...DEFAULT_STATES,
    ...(workflowSettings?.value as Record<string, boolean> ?? {}),
  }

  const activeCount = Object.values(workflowStates).filter(Boolean).length

  const reviewAll = reviewRequests ?? []
  const reviewSent      = reviewAll.filter((r) => r.messages_sent >= 1).length
  const reviewDetected  = reviewAll.filter((r) => r.review_detected).length
  const reviewPending   = reviewAll.filter((r) => r.messages_sent >= 1 && !r.review_detected && !r.opted_out).length
  const reviewThisMonth = reviewAll.filter((r) => r.last_sent_at && r.last_sent_at >= startOfMonth).length

  const smsSentThisMonth = (smsCampaigns ?? [])
    .filter((c) => c.created_at >= startOfMonth)
    .reduce((sum, c) => sum + ((c.stats as { sent?: number })?.sent ?? 0), 0)

  const messagesSentThisMonth = reviewThisMonth + smsSentThisMonth
  const triggeredThisMonth    = (newContactsThisMonth ?? 0) + reviewThisMonth

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="System" title="Workflows" />
      <WorkflowsClient
        workflowStates={workflowStates}
        stats={{ activeCount, triggeredThisMonth, messagesSentThisMonth, membersInFlows: memberCount ?? 0 }}
        reviewStats={{ sent: reviewSent, reviewed: reviewDetected, pending: reviewPending }}
        trialCount={trialCount ?? 0}
        memberCount={memberCount ?? 0}
      />
    </div>
  )
}
