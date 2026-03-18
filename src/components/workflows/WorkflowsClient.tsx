'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Activity, MessageSquare, Users,
  UserPlus, Star, RefreshCw, Clock, Gift,
  ChevronDown, Play, Eye,
} from 'lucide-react'

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
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  label, value, icon: Icon, iconBg,
}: {
  label: string; value: number; icon: React.ElementType; iconBg: string
}) {
  return (
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={18} className="text-white/70" />
        </div>
      </div>
      <p className="text-5xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>{value}</p>
    </div>
  )
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
    <div className={`bg-[#161616] border rounded-xl overflow-hidden transition-all duration-200 ${
      enabled ? 'border-white/[0.08] hover:border-white/[0.12]' : 'border-white/[0.04] opacity-70 hover:opacity-90'
    }`}>

      {/* Header */}
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h3 className="text-[#F0F0F0] font-semibold">{title}</h3>
              {enabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">ACTIVE</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.05] text-white/30 border border-white/[0.08]">PAUSED</span>
              )}
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xl">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Toggle */}
          <button
            onClick={() => onToggle(id, !enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#C9A70A]' : 'bg-white/10'}`}
            aria-label={enabled ? 'Pause workflow' : 'Activate workflow'}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>

          {/* Expand */}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
          >
            <ChevronDown size={18} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-6 pb-5 flex items-center gap-6 flex-wrap">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key}>
            <p className="text-xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>{value}</p>
            <p className="text-xs text-white/30 capitalize">{key.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-6 space-y-5">

          {/* Trigger */}
          <div>
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.1em] mb-2">TRIGGER</p>
            <div className="flex items-center gap-2.5 bg-[#1a1a1a] border border-white/[0.06] rounded-lg px-4 py-3">
              <Zap size={13} className="text-[#C9A70A] flex-shrink-0" />
              <p className="text-sm text-white/60">{trigger}</p>
            </div>
          </div>

          {/* Steps timeline */}
          <div>
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.1em] mb-4">SEQUENCE</p>
            <div className="relative">
              <div className="absolute left-[17px] top-5 bottom-5 w-px bg-white/[0.06]" />
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/[0.08] flex items-center justify-center flex-shrink-0 z-10">
                      <span className="text-[10px] font-bold text-[#C9A70A]">D{step.day}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 bg-[#1a1a1a] border border-white/[0.06] rounded-lg px-4 py-2.5">
                      <ChannelBadge channel={step.channel} />
                      <span className="text-sm text-white/60">{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity shadow-[0_0_16px_rgba(201,167,10,0.2)]">
              <Play size={11} />
              Run Now
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white/40 border border-white/[0.08] bg-white/[0.03] hover:text-white/70 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200">
              <Eye size={11} />
              View Members In Flow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Category header
// ---------------------------------------------------------------------------
function CategoryHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mt-2">
      <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] whitespace-nowrap">{label}</p>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
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
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">NORTHERN WARRIOR HUB</p>
        <h1 className="text-3xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>Workflows</h1>
        <p className="text-sm text-white/40 mt-1">Your automation command centre — manage every workflow from one place</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
