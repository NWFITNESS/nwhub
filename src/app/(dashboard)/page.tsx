import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { WebsiteVisitorsChart, type ChartDataPoint } from '@/components/dashboard/MemberGrowthChart'
import Link from 'next/link'
import {
  Mail,
  Users,
  MessageSquare,
  FileEdit,
  CheckCircle2,
  Circle,
  LayoutTemplate,
  Send,
  Newspaper,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Build hourly buckets for last 24 hours
function buildHourlyVisitors(rows: Array<{ created_at: string }>): ChartDataPoint[] {
  const now = new Date()
  const buckets: ChartDataPoint[] = []
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - i)
    buckets.push({ label: `${String(h.getHours()).padStart(2, '0')}:00`, value: 0 })
  }
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  for (const row of rows) {
    const d = new Date(row.created_at)
    if (d < cutoff) continue
    const hoursDiff = Math.floor((now.getTime() - d.getTime()) / (60 * 60 * 1000))
    const idx = 23 - hoursDiff
    if (idx >= 0 && idx < 24) buckets[idx].value++
  }
  return buckets
}

// Build daily buckets for last N days
function buildDailyVisitors(rows: Array<{ created_at: string }>, days: number): ChartDataPoint[] {
  const now = new Date()
  const buckets: ChartDataPoint[] = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const label = days <= 7
      ? dayNames[d.getDay()]
      : `${d.getDate()}/${d.getMonth() + 1}`
    buckets.push({ label, value: 0 })
  }
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  for (const row of rows) {
    const d = new Date(row.created_at)
    if (d < cutoff) continue
    const daysDiff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000))
    const idx = (days - 1) - daysDiff
    if (idx >= 0 && idx < days) buckets[idx].value++
  }
  return buckets
}

// Build monthly buckets for last N months
function buildMonthlyVisitors(rows: Array<{ created_at: string }>, months: number): ChartDataPoint[] {
  const now = new Date()
  const buckets: ChartDataPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ label: d.toLocaleString('en-GB', { month: 'short' }), value: 0 })
  }
  const cutoff = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  for (const row of rows) {
    const d = new Date(row.created_at)
    if (d < cutoff) continue
    const idx = (d.getFullYear() - cutoff.getFullYear()) * 12 + (d.getMonth() - cutoff.getMonth())
    if (idx >= 0 && idx < months) buckets[idx].value++
  }
  return buckets
}

// ---------------------------------------------------------------------------
// Quick actions
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: Array<{
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  title: string
  desc: string
  href: string
  mobileHide?: boolean
}> = [
  {
    icon: Mail,
    title: 'Contacts & Enquiries',
    desc: 'View inbound enquiries, track leads from the AI chat, and manage your contacts.',
    href: '/contacts',
  },
  {
    icon: LayoutTemplate,
    title: 'Edit Website Content',
    desc: 'Update page copy, hero sections, memberships, FAQs and more without touching code.',
    href: '/content',
    mobileHide: true,
  },
  {
    icon: Newspaper,
    title: 'Blog & Posts',
    desc: 'Write and publish blog posts to keep members informed and improve SEO.',
    href: '/blog',
  },
  {
    icon: Send,
    title: 'Email Campaigns',
    desc: 'Send newsletters and campaigns to your subscriber list via Mailchimp.',
    href: '/mailchimp',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: newContacts },
    { count: draftPosts },
    { count: subscribers },
    { count: membersTotal },
    { data: recentEnquiries },
    { count: contentCount },
    { count: settingsCount },
    { count: subscribersTotal },
    { count: postsTotal },
    { data: visitorRows1y },
  ] = await Promise.all([
    supabase.from('contact_enquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
    supabase.from('kids_registrations').select('*', { count: 'exact', head: true }),
    supabase
      .from('contact_enquiries')
      .select('id, name, enquiry_type, message, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('page_content').select('*', { count: 'exact', head: true }),
    supabase.from('global_settings').select('*', { count: 'exact', head: true }),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    // Single query fetching last 12 months of page views — we slice client-side for 24h/7d/30d
    supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString()),
  ])

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const checklist = [
    { label: 'Content seeded',                        done: (contentCount     ?? 0) > 0 },
    { label: 'Settings seeded',                       done: (settingsCount    ?? 0) > 0 },
    { label: 'First subscriber',                      done: (subscribersTotal ?? 0) > 0 },
    { label: 'First blog post',                       done: (postsTotal       ?? 0) > 0 },
    { label: 'Resend domain verified',                done: false },
    { label: 'WhatsApp number registered in Twilio',  done: false },
  ]
  const doneCount = checklist.filter((i) => i.done).length

  // Try to fetch Xero monthly revenue (gracefully skip if not connected)
  let monthlyRevenue = 0
  try {
    const { data: xeroTokens } = await supabase
      .from('settings').select('value').eq('key', 'xero_tokens').single()
    const { data: xeroTenant } = await supabase
      .from('settings').select('value').eq('key', 'xero_tenant_id').single()
    if (xeroTokens && xeroTenant) {
      const { xero } = await import('@/lib/xero')
      await xero.setTokenSet(JSON.parse(xeroTokens.value))
      const tokenSet = xero.readTokenSet()
      if (tokenSet.expired()) await xero.refreshToken()
      const now2 = new Date()
      const fromDate = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString().split('T')[0]
      const invoicesRes = await xero.accountingApi.getInvoices(
        xeroTenant.value, undefined, undefined, undefined, undefined, undefined, undefined,
        ['PAID'], undefined, undefined, undefined, undefined, undefined, 100
      )
      const invs = invoicesRes.body.invoices ?? []
      monthlyRevenue = invs
        .filter((inv: { date?: string; total?: number }) => {
          if (!inv.date) return false
          const match = inv.date.match(/\/Date\((\d+)/)
          const d = match ? new Date(parseInt(match[1])) : new Date(inv.date)
          return d.getFullYear() === now2.getFullYear() && d.getMonth() === now2.getMonth()
        })
        .reduce((s: number, inv: { total?: number }) => s + (inv.total ?? 0), 0)
    }
  } catch {
    // Xero not connected or error — keep monthlyRevenue = 0
  }

  const allVisitorRows = visitorRows1y ?? []
  const data24h = buildHourlyVisitors(allVisitorRows)
  const data7d  = buildDailyVisitors(allVisitorRows, 7)
  const data30d = buildDailyVisitors(allVisitorRows, 30)
  const data1y  = buildMonthlyVisitors(allVisitorRows, 12)

  const enquiriesAlert = (newContacts ?? 0) > 0

  // Stat cards — exact order & icons from SKILL.md §9
  const statCards = [
    {
      label:   'Total Members',
      value:   membersTotal ?? 0,
      icon:    Users,
      iconBg:  'rgba(201,167,10,0.15)',
      trend:   null as number | null,
      alert:   false,
      isCurrency: false,
    },
    {
      label:   'Email Subscribers',
      value:   subscribers ?? 0,
      icon:    Mail,
      iconBg:  'rgba(59,130,246,0.15)',
      trend:   null as number | null,
      alert:   false,
      isCurrency: false,
    },
    {
      label:   'Unread Enquiries',
      value:   newContacts ?? 0,
      icon:    MessageSquare,
      iconBg:  enquiriesAlert ? 'rgba(239,68,68,0.15)' : 'rgba(201,167,10,0.15)',
      trend:   null as number | null,
      alert:   enquiriesAlert,
      isCurrency: false,
    },
    {
      label:   'Monthly Revenue',
      value:   monthlyRevenue,
      icon:    TrendingUp,
      iconBg:  'rgba(34,197,94,0.15)',
      trend:   null as number | null,
      alert:   false,
      isCurrency: true,
    },
  ]

  return (
    <>
      <TopBar title="Overview" />

      {/* SKILL.md §8 — page layout wrapper */}
      <div className="page-pad flex flex-col gap-4 @md/page:gap-6 py-4 @md/page:py-8 min-h-[calc(100vh-5rem)]">

        {/* ── Section 1 — Greeting (SKILL.md §9) ── */}
        <div>
          <p className="text-xs text-white/30 uppercase tracking-[0.15em]">ADMIN PANEL</p>
          <h1 style={{ fontFamily: 'Rajdhani' }} className="leading-tight mt-0.5">
            <span className="text-[#F0F0F0] font-bold text-4xl">Northern Warrior </span>
            <span className="text-[#C9A70A] font-bold text-4xl">Hub</span>
          </h1>
          <p className="text-white/30 text-sm mt-1">{formattedDate}</p>
        </div>

        {/* ── Section 2 — Stat Cards (SKILL.md §4.1 + §9) ── */}
        <div className="grid grid-cols-2 @md/page:grid-cols-4 gap-3 @md/page:gap-5">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="bg-[#161616] border border-white/[0.06] rounded-xl p-3 @md/page:p-6 min-h-[110px] @md/page:min-h-[130px] flex flex-col justify-between hover:border-[#967705]/30 transition-colors duration-200"
              >
                {/* Top row: label + icon */}
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[10px] @md/page:text-xs font-semibold text-white/40 uppercase tracking-[0.08em] leading-tight">
                    {card.label}
                  </p>
                  <div
                    className="w-7 h-7 @md/page:w-9 @md/page:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: card.iconBg }}
                  >
                    <Icon size={16} className="text-white/70" strokeWidth={1.75} />
                  </div>
                </div>

                {/* Bottom: number + trend */}
                <div>
                  <p
                    className="text-3xl @md/page:text-5xl font-bold text-[#F0F0F0]"
                    style={{ fontFamily: 'Rajdhani' }}
                  >
                    {card.isCurrency ? `£${card.value.toLocaleString()}` : card.value.toLocaleString()}
                  </p>

                  {card.alert ? (
                    <p className="text-[10px] @md/page:text-xs mt-1 flex items-center gap-0.5 text-red-400">
                      <ArrowUpRight size={10} />
                      Needs attention
                    </p>
                  ) : card.trend !== null ? (
                    <p className="text-[10px] @md/page:text-xs text-white/40 mt-1 flex items-center gap-0.5">
                      {card.trend >= 0
                        ? <ArrowUpRight size={10} className="text-green-500" />
                        : <ArrowDownRight size={10} className="text-red-500" />}
                      {Math.abs(card.trend)}% vs last month
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Section 3 — Website Visitors Chart (SKILL.md §5.1) ── */}
        <WebsiteVisitorsChart data24h={data24h} data7d={data7d} data30d={data30d} data1y={data1y} />

        {/* ── Section 4 — Two Columns (SKILL.md §8 — grid-cols-3) ── */}
        <div className="grid grid-cols-1 @md/page:grid-cols-3 gap-5">

          {/* Left col-span-2 — Recent Enquiries */}
          <div className="@md/page:col-span-2 bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col">

            {/* Section header (SKILL.md §4.3) */}
            <div className="flex items-center justify-between px-4 @md/page:px-6 py-4 @md/page:py-5 border-b border-white/[0.06]">
              <div>
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">
                  Inbound
                </p>
                <h3 className="text-[#F0F0F0] font-semibold">Recent Enquiries</h3>
              </div>
              <Link
                href="/contacts"
                className="text-xs font-semibold text-white/40 hover:text-[#C9A70A] transition-colors duration-200"
              >
                View all →
              </Link>
            </div>

            {/* Content or empty state (SKILL.md §6) */}
            {!recentEnquiries || recentEnquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <MessageSquare size={20} className="text-white/20" />
                </div>
                <p className="text-sm font-medium text-white/40">No enquiries yet</p>
                <p className="text-xs text-white/20 text-center max-w-[240px]">
                  New enquiries from the website will appear here
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04] flex-1">
                {recentEnquiries.map((e) => {
                  const initials = e.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  const preview = e.message
                    ? String(e.message).slice(0, 70) + (String(e.message).length > 70 ? '…' : '')
                    : e.enquiry_type
                  return (
                    <li
                      key={e.id}
                      className="px-4 @md/page:px-6 py-3 @md/page:py-4 flex items-center gap-3 @md/page:gap-4 hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-[#967705]/15 border border-[#967705]/25 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#C9A70A]">{initials}</span>
                      </div>

                      {/* Name + preview */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F0F0F0] truncate">{e.name}</p>
                        <p className="text-xs text-white/30 truncate mt-0.5">{preview}</p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-white/20 flex-shrink-0">
                        {formatTimeAgo(e.created_at)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Right col-span-1 — Setup Checklist */}
          <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-4 @md/page:p-6 flex flex-col">

            {/* Section header */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">
                  Onboarding
                </p>
                <h3 className="text-[#F0F0F0] font-semibold">Setup Checklist</h3>
              </div>
              <span className="text-sm font-semibold text-[#C9A70A]">
                {doneCount}/{checklist.length}
              </span>
            </div>
            <p className="text-xs text-white/30 mb-5">Complete these to get NWHub fully running.</p>

            {/* Gold progress bar */}
            <div className="h-1.5 bg-white/[0.06] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#967705] to-[#C9A70A] rounded-full transition-all duration-700"
                style={{ width: `${(doneCount / checklist.length) * 100}%` }}
              />
            </div>

            {/* Checklist */}
            <ul className="space-y-3 flex-1">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 size={17} className="text-[#C9A70A] flex-shrink-0" />
                  ) : (
                    <Circle size={17} className="text-white/20 flex-shrink-0" />
                  )}
                  <span className={`text-sm flex-1 ${item.done ? 'text-white/50' : 'text-white/40'}`}>
                    {item.label}
                  </span>
                  {item.done && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#967705]/15 text-[#C9A70A] border border-[#967705]/25 uppercase tracking-wider">
                      done
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Section 5 — Quick Actions 2×2 (SKILL.md §9) ── */}
        <div>
          <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-4">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group bg-[#161616] border border-white/[0.06] rounded-xl p-4 @md/page:p-6 min-h-[100px] @md/page:min-h-[120px] flex items-start gap-4 @md/page:gap-5 hover:border-[#967705]/40 hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer ${action.mobileHide ? 'hidden md:flex' : ''}`}
                >
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-lg bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#967705]/40 transition-colors duration-200">
                    <Icon size={20} className="text-[#C9A70A]" strokeWidth={1.75} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#F0F0F0] group-hover:text-[#C9A70A] transition-colors duration-200 leading-tight">
                      {action.title}
                    </p>
                    <p className="text-xs text-white/40 mt-1.5 leading-relaxed">{action.desc}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}
