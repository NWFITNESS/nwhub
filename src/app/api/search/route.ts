import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({})

  const supabase = createAdminClient()
  const like = `%${q}%`

  const [
    contacts,
    enquiries,
    blog,
    blogCats,
    media,
    kids,
    emailSubs,
    smsSubs,
    emailCampaigns,
    smsCampaigns,
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .limit(4),

    supabase
      .from('contact_enquiries')
      .select('id, name, email, enquiry_type, message')
      .or(`name.ilike.${like},email.ilike.${like},message.ilike.${like}`)
      .limit(4),

    supabase
      .from('blog_posts')
      .select('id, title, status, author, excerpt')
      .or(`title.ilike.${like},author.ilike.${like},excerpt.ilike.${like}`)
      .limit(4),

    supabase
      .from('blog_categories')
      .select('id, name, slug')
      .ilike('name', like)
      .limit(3),

    supabase
      .from('media')
      .select('id, filename, alt_text, public_url')
      .or(`filename.ilike.${like},alt_text.ilike.${like}`)
      .limit(4),

    supabase
      .from('kids_registrations')
      .select('id, parent')
      .ilike('parent->>name', like)
      .limit(4),

    supabase
      .from('email_subscribers')
      .select('id, email, first_name, last_name, status')
      .or(`email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like}`)
      .limit(4),

    supabase
      .from('sms_subscribers')
      .select('id, phone, first_name, status')
      .or(`phone.ilike.${like},first_name.ilike.${like}`)
      .limit(4),

    supabase
      .from('email_campaigns')
      .select('id, name, subject, status')
      .or(`name.ilike.${like},subject.ilike.${like}`)
      .limit(3),

    supabase
      .from('sms_campaigns')
      .select('id, name, message, status')
      .or(`name.ilike.${like},message.ilike.${like}`)
      .limit(3),
  ])

  const results: Record<string, { id: string; label: string; sub: string; href: string }[]> = {}

  if (contacts.data?.length) {
    results.contacts = contacts.data.map((c) => ({
      id: c.id,
      label: `${c.first_name} ${c.last_name}`.trim() || c.email || c.phone || 'Contact',
      sub: [c.email, c.phone].filter(Boolean).join(' · '),
      href: '/contacts',
    }))
  }

  if (enquiries.data?.length) {
    results.enquiries = enquiries.data.map((e) => ({
      id: e.id,
      label: e.name,
      sub: `${e.enquiry_type} · ${e.email}`,
      href: '/enquiries',
    }))
  }

  if (blog.data?.length) {
    results.blog = blog.data.map((b) => ({
      id: b.id,
      label: b.title,
      sub: `${b.status} · ${b.author}`,
      href: `/blog/${b.id}`,
    }))
  }

  if (blogCats.data?.length) {
    results.blog_categories = blogCats.data.map((c) => ({
      id: c.id,
      label: c.name,
      sub: 'Blog category',
      href: '/blog',
    }))
  }

  if (media.data?.length) {
    results.media = media.data.map((m) => ({
      id: m.id,
      label: m.filename,
      sub: m.alt_text || 'Media file',
      href: '/media',
    }))
  }

  if (kids.data?.length) {
    results.kids = kids.data.map((k) => ({
      id: k.id,
      label: (k.parent as { name?: string })?.name ?? 'Parent',
      sub: 'Kids & Teens registration',
      href: '/kids',
    }))
  }

  if (emailSubs.data?.length) {
    results.email_subscribers = emailSubs.data.map((s) => ({
      id: s.id,
      label: `${s.first_name} ${s.last_name}`.trim() || s.email,
      sub: `${s.email} · ${s.status}`,
      href: '/email',
    }))
  }

  if (smsSubs.data?.length) {
    results.sms_subscribers = smsSubs.data.map((s) => ({
      id: s.id,
      label: s.first_name || s.phone,
      sub: `${s.phone} · ${s.status}`,
      href: '/sms',
    }))
  }

  if (emailCampaigns.data?.length) {
    results.email_campaigns = emailCampaigns.data.map((c) => ({
      id: c.id,
      label: c.name,
      sub: `${c.subject} · ${c.status}`,
      href: '/email/campaigns',
    }))
  }

  if (smsCampaigns.data?.length) {
    results.sms_campaigns = smsCampaigns.data.map((c) => ({
      id: c.id,
      label: c.name,
      sub: c.status,
      href: '/sms/campaigns',
    }))
  }

  return NextResponse.json(results)
}
