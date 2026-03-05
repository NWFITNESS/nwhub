import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { StatCard } from '@/components/ui/Card'
import Link from 'next/link'
import {
  Mail,
  Users,
  PenSquare,
  Baby,
  FileText,
  Image,
  ArrowRight,
  CheckCircle2,
  Circle,
} from 'lucide-react'

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const enquiryTypeLabels: Record<string, string> = {
  general: 'General',
  membership: 'Membership',
  training: 'Training',
  media: 'Media',
  other: 'Other',
}

const quickActions = [
  { label: 'Edit Content', href: '/content', icon: FileText },
  { label: 'New Blog Post', href: '/blog/new', icon: PenSquare },
  { label: 'View Enquiries', href: '/contacts', icon: Mail },
  { label: 'New Email Campaign', href: '/email/campaigns/new', icon: Users },
  { label: 'Media Library', href: '/media', icon: Image },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: newContacts },
    { count: draftPosts },
    { count: subscribers },
    { count: kidsRegs },
    { data: recentEnquiries },
    { count: contentCount },
    { count: settingsCount },
    { count: subscribersTotal },
    { count: postsTotal },
  ] = await Promise.all([
    supabase.from('contact_enquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'subscribed'),
    supabase.from('kids_registrations').select('*', { count: 'exact', head: true }),
    supabase
      .from('contact_enquiries')
      .select('id, name, enquiry_type, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('page_content').select('*', { count: 'exact', head: true }),
    supabase.from('global_settings').select('*', { count: 'exact', head: true }),
    supabase.from('email_subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
  ])

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const checklist = [
    { label: 'Content seeded', done: (contentCount ?? 0) > 0 },
    { label: 'Settings seeded', done: (settingsCount ?? 0) > 0 },
    { label: 'First subscriber', done: (subscribersTotal ?? 0) > 0 },
    { label: 'First blog post', done: (postsTotal ?? 0) > 0 },
    { label: 'Resend domain verified', done: false, manual: true },
    { label: 'WhatsApp number registered in Twilio', done: false, manual: true },
  ]
  const doneCount = checklist.filter((i) => i.done).length

  return (
    <>
      <TopBar title="Overview" />
      <main className="p-10">

        {/* Header */}
        <div className="mb-10 relative">
          <div
            className="absolute -left-4 -top-4 w-64 h-20 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.6), transparent)' }}
          />
          <div className="relative">
            <p className="text-sm uppercase tracking-[0.35em] text-white/30 mb-3">Admin Panel</p>
            <h2 className="text-4xl font-bold text-white tracking-tight">
              Northern Warrior <span className="text-[#c9a70a]">Hub</span>
            </h2>
            <p className="text-base text-white/35 mt-2">{today}</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <StatCard label="Unread Enquiries" value={newContacts ?? 0} icon={<Mail size={22} />} accent="blue" />
          <StatCard label="Draft Posts" value={draftPosts ?? 0} icon={<PenSquare size={22} />} accent="gold" />
          <StatCard label="Email Subscribers" value={subscribers ?? 0} icon={<Users size={22} />} accent="green" />
          <StatCard label="Kids Registrations" value={kidsRegs ?? 0} icon={<Baby size={22} />} accent="gold" />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Recent Enquiries */}
          <div className="bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
            <div className="px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Enquiries</h3>
              <Link href="/contacts" className="text-sm text-white/35 hover:text-[#c9a70a] transition-colors">
                View all →
              </Link>
            </div>
            {!recentEnquiries || recentEnquiries.length === 0 ? (
              <div className="px-7 py-14 text-center">
                <p className="text-sm text-white/25">No enquiries yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {recentEnquiries.map((e) => (
                  <li key={e.id} className="px-7 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-white/80 truncate">{e.name}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#967705]/15 text-[#c9a70a] flex-shrink-0">
                      {enquiryTypeLabels[e.enquiry_type] ?? e.enquiry_type}
                    </span>
                    <span className="text-xs text-white/25 flex-shrink-0 w-14 text-right">
                      {formatTimeAgo(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
            <div className="px-7 py-5 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.04] m-px rounded-b-2xl overflow-hidden">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 px-6 py-5 bg-[#161616] hover:bg-[#1c1c1c] transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-[#967705]/15 transition-colors">
                    <Icon size={18} className="text-white/40 group-hover:text-[#c9a70a] transition-colors" />
                  </div>
                  <span className="text-[15px] text-white/60 group-hover:text-white flex-1 transition-colors">{label}</span>
                  <ArrowRight
                    size={14}
                    className="text-white/0 group-hover:text-[#c9a70a] transition-all group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Setup Checklist */}
        <div className="bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-7">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Setup Checklist</h3>
            <span className="text-sm text-white/35">{doneCount} / {checklist.length}</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full mb-7 overflow-hidden">
            <div
              className="h-full bg-[#967705] rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-4">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-base">
                {item.done ? (
                  <CheckCircle2 size={18} className="text-[#c9a70a] flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-white/20 flex-shrink-0" />
                )}
                <span className={item.done ? 'text-white/60' : 'text-white/40'}>{item.label}</span>
                {item.done && (
                  <span className="text-xs text-[#967705] bg-[#967705]/10 px-2 py-0.5 rounded">done</span>
                )}
              </li>
            ))}
          </ul>
        </div>

      </main>
    </>
  )
}
