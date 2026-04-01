import { createClient } from '@/lib/supabase/server'
import { type DashboardData } from '@/components/widgets/DashboardWidgetGrid'
import { MobileDashboard } from '@/components/mobile/MobileDashboard'
import { OverviewContent } from '@/components/dashboard/OverviewContent'
import type { ChartDataPoint } from '@/components/dashboard/MemberGrowthChart'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    { data: tasks },
    { data: recentPosts },
  ] = await Promise.all([
    supabase.from('contact_enquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).in('status', ['member', 'trial']),
    supabase
      .from('contact_enquiries')
      .select('id, name, enquiry_type, message, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('page_content').select('*', { count: 'exact', head: true }),
    supabase.from('global_settings').select('*', { count: 'exact', head: true }),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString()),
    supabase
      .from('tasks')
      .select('id, title, due_date, completed, priority, source')
      .eq('completed', false)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from('blog_posts')
      .select('id, title, status, created_at, published_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  // suppress unused variable warning — draftPosts is fetched but not displayed currently
  void draftPosts

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
    { label: 'Resend domain verified',                done: false, manual: true },
    { label: 'WhatsApp number registered in Twilio',  done: false, manual: true },
  ]

  const allVisitorRows = visitorRows1y ?? []
  const enquiriesAlert = (newContacts ?? 0) > 0

  const data: DashboardData = {
    membersTotal:    membersTotal    ?? 0,
    subscribers:     subscribers    ?? 0,
    newContacts:     newContacts     ?? 0,
    enquiriesAlert,
    data24h: buildHourlyVisitors(allVisitorRows),
    data7d:  buildDailyVisitors(allVisitorRows, 7),
    data30d: buildDailyVisitors(allVisitorRows, 30),
    data1y:  buildMonthlyVisitors(allVisitorRows, 12),
    recentEnquiries: (recentEnquiries ?? []) as DashboardData['recentEnquiries'],
    checklist,
    tasks: (tasks ?? []) as DashboardData['tasks'],
    recentPosts: (recentPosts ?? []) as DashboardData['recentPosts'],
  }

  return (
    <OverviewContent data={data} formattedDate={formattedDate} />
  )
}
