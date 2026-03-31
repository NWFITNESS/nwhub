'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Activity, MessageSquare, Users,
  UserPlus, Star, RefreshCw, Clock, Gift,
  ChevronDown, Play, Eye,
} from 'lucide-react'
import { StatCard } from '@/components/widgets/dashboard/StatCard'
import { Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Step {
  day: number
  channel: 'whatsapp' | 'sms' | 'email'
  label: string
}

interface WorkflowDef {
  id: string
  title: string
  description: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  trigger: string
  steps: Step[]
  stats: Record<string, number>
  category: string
}

interface Props {
  workflowStates: Record<string, boolean>
  stats: {
    activeCount: number
    triggeredThisMonth: number
    messagesSentThisMonth: number
    membersInFlows: number
  }
  reviewStats: { sent: number; reviewed: number; pending: number }
  trialCount: number
  memberCount: number
}

// ---------------------------------------------------------------------------
// Channel badge
// ---------------------------------------------------------------------------
function ChannelBadge({ channel }: { channel: Step['channel'] }) {
  const styles: Record<Step['channel'], string> = {
    whatsapp: 'bg-green-500/10 text-green-400',
    sms:      'bg-blue-500/10 text-blue-400',
    email:    'bg-purple-500/10 text-purple-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${styles[channel]}`}>
      {channel}
    </span>
  )
}

// ---------------------------------------------------------------------------
// WorkflowCard
// ---------------------------------------------------------------------------
function WorkflowCard({
  workflow, enabled, onToggle,
}: {
  workflow: WorkflowDef
  enabled: boolean
  onToggle: (id: string, val: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { id, title, description, icon: Icon, iconColor, iconBg, trigger, steps, stats } = workflow

  return (
    <Panel>
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-nw-800" style={{ background: iconBg }}>
            <Icon size={18} className={iconColor} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-[13px] font-medium text-nw-200">{title}</h3>
              <Badge variant={enabled ? 'active' : 'paused'}>{enabled ? 'Active' : 'Paused'}</Badge>
            </div>
            <p className="text-[11px] text-nw-500 mt-0.5 leading-relaxed max-w-xl">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={() => onToggle(id, !enabled)}
            className={`relative w-11 h-[22px] rounded-full transition-colors duration-200 ${enabled ? 'bg-gold-500' : 'bg-nw-600'}`}
            aria-label={enabled ? 'Pause workflow' : 'Activate workflow'}
          >
            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-[3px]'}`} />
          </button>

          {/* Expand */}
          <button onClick={() => setExpanded((e) => !e)} className="text-nw-500 hover:text-nw-300 transition-colors p-1">
            <ChevronDown size={16} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 pb-4 flex-wrap">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key}>
            <p className="text-[10px] uppercase tracking-[0.8px] text-nw-600">{key.replace(/_/g, ' ')}</p>
            <p className="text-xs font-medium text-nw-300 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[rgba(255,255,255,0.07)] p-4 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-nw-500 mb-2">Trigger</p>
            <div className="flex items-center gap-2.5 rounded-[8px] bg-nw-800 border border-[rgba(255,255,255,0.07)] px-4 py-3">
              <Zap size={13} className="text-gold-400 flex-shrink-0" />
              <p className="text-[13px] text-nw-400">{trigger}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-nw-500 mb-3">Sequence</p>
            <div className="relative">
              <div className="absolute left-[17px] top-5 bottom-5 w-px bg-[rgba(255,255,255,0.07)]" />
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-nw-800 border border-[rgba(255,255,255,0.07)] z-10">
                      <span className="text-[10px] font-bold text-gold-300">D{step.day}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 rounded-[8px] bg-nw-800 border border-[rgba(255,255,255,0.07)] px-4 py-2.5">
                      <ChannelBadge channel={step.channel} />
                      <span className="text-[13px] text-nw-400">{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button variant="gold" size="sm"><Play size={11} /> Run Now</Button>
            <Button variant="default" size="sm"><Eye size={11} /> View Members In Flow</Button>
          </div>
        </div>
      )}
    </Panel>
  )
}

// ---------------------------------------------------------------------------
// Category header
// ---------------------------------------------------------------------------
function CategoryHeader({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-nw-500 mb-2 mt-4">{label}</p>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export function WorkflowsClient({ workflowStates: initial, stats, reviewStats, trialCount, memberCount }: Props) {
  const supabase = createClient()
  const [states, setStates] = useState<Record<string, boolean>>(initial)

  async function handleToggle(id: string, enabled: boolean) {
    const next = { ...states, [id]: enabled }
    setStates(next)

    const { data } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'workflow_states')
      .single()

    await supabase.from('global_settings').upsert(
      { key: 'workflow_states', value: { ...(data?.value ?? {}), [id]: enabled }, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  const WORKFLOWS: WorkflowDef[] = [
    // ── Member Journey ───────────────────────────────────────────────────────
    {
      id: 'new_member_journey',
      category: 'MEMBER JOURNEY',
      title: 'New Member Journey',
      description: 'Automatically welcomes new members and guides them through their first 60 days.',
      icon: UserPlus,
      iconColor: 'text-green-400',
      iconBg: 'rgba(34,197,94,0.15)',
      trigger: "Member status changes to 'member' in WodBoard sync",
      steps: [
        { day: 0,  channel: 'whatsapp', label: 'Welcome message' },
        { day: 3,  channel: 'sms',      label: 'Book your first class nudge' },
        { day: 7,  channel: 'whatsapp', label: 'First class check-in' },
        { day: 14, channel: 'email',    label: 'Add to Mailchimp newsletter' },
        { day: 30, channel: 'whatsapp', label: 'Google review request' },
        { day: 37, channel: 'sms',      label: 'Google review follow up' },
        { day: 60, channel: 'email',    label: 'Membership check-in + loyalty offer' },
      ],
      stats: { active: memberCount, completed: 0, pending: 0 },
    },

    // ── Google Reviews ────────────────────────────────────────────────────────
    {
      id: 'google_review_sequence',
      category: 'GOOGLE REVIEWS',
      title: 'Google Review Request',
      description: 'Sends a review request at day 30, follows up at day 37. Maximum 2 messages per member, then stops automatically.',
      icon: Star,
      iconColor: 'text-[#C9A70A]',
      iconBg: 'rgba(201,167,10,0.15)',
      trigger: 'Member reaches 30 days since joining',
      steps: [
        { day: 30, channel: 'whatsapp', label: 'Story-led review request' },
        { day: 37, channel: 'sms',      label: 'Gentle follow up (if no review)' },
      ],
      stats: { sent: reviewStats.sent, reviewed: reviewStats.reviewed, pending: reviewStats.pending },
    },

    // ── Re-engagement ─────────────────────────────────────────────────────────
    {
      id: 're_engagement',
      category: 'RE-ENGAGEMENT',
      title: 'Re-engagement',
      description: "Reaches out to members who haven't attended in 14 days. Checks in and encourages them back.",
      icon: RefreshCw,
      iconColor: 'text-blue-400',
      iconBg: 'rgba(59,130,246,0.15)',
      trigger: "last_attendance > 14 days ago AND status = 'member'",
      steps: [
        { day: 14, channel: 'whatsapp', label: 'We miss you check-in' },
        { day: 21, channel: 'sms',      label: 'Special offer to return' },
      ],
      stats: { active: 0, recovered: 0, lost: 0 },
    },

    // ── Trial Conversion ──────────────────────────────────────────────────────
    {
      id: 'trial_conversion',
      category: 'TRIAL CONVERSION',
      title: 'Trial Conversion',
      description: 'Nurtures trial members toward becoming full members before their trial expires.',
      icon: Clock,
      iconColor: 'text-amber-400',
      iconBg: 'rgba(245,158,11,0.15)',
      trigger: "Member status = 'trial'",
      steps: [
        { day: 0,  channel: 'whatsapp', label: 'Trial welcome + what to expect' },
        { day: 7,  channel: 'whatsapp', label: 'Halfway check-in' },
        { day: 12, channel: 'sms',      label: '2 days left — join now prompt' },
        { day: 14, channel: 'email',    label: 'Trial ended — membership options' },
      ],
      stats: { active: trialCount, converted: 0, expired: 0 },
    },

    // ── Birthdays ─────────────────────────────────────────────────────────────
    {
      id: 'birthday_messages',
      category: 'BIRTHDAYS',
      title: 'Birthday Messages',
      description: 'Sends a personal birthday message to every member on their birthday.',
      icon: Gift,
      iconColor: 'text-purple-400',
      iconBg: 'rgba(168,85,247,0.15)',
      trigger: 'contact.birthday = today',
      steps: [
        { day: 0, channel: 'whatsapp', label: 'Happy birthday + special offer' },
      ],
      stats: { sent: 0, upcoming: 0 },
    },
  ]

  // Group workflows by category
  const categories = Array.from(new Set(WORKFLOWS.map((w) => w.category)))

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-[10px] md:grid-cols-4">
        <StatCard label="Active Workflows"      value={stats.activeCount}            icon={Zap}            iconBg="rgba(201,167,10,0.15)" />
        <StatCard label="Triggered This Month"  value={stats.triggeredThisMonth}     icon={Activity}       iconBg="rgba(34,197,94,0.15)" />
        <StatCard label="Messages Sent"         value={stats.messagesSentThisMonth}  icon={MessageSquare}  iconBg="rgba(59,130,246,0.15)" />
        <StatCard label="Members In Flows"      value={stats.membersInFlows}         icon={Users}          iconBg="rgba(168,85,247,0.15)" />
      </div>

      {/* Workflow cards by category */}
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-4">
          <CategoryHeader label={category} />
          {WORKFLOWS.filter((w) => w.category === category).map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              enabled={states[workflow.id] ?? false}
              onToggle={handleToggle}
            />
          ))}
        </div>
      ))}

    </div>
  )
}
