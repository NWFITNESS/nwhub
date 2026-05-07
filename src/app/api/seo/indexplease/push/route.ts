import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const apiKey = process.env.INDEXPLEASE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'INDEXPLEASE_API_KEY not configured' }, { status: 501 })
  }

  try {
    const { page_ids } = await req.json()
    if (!Array.isArray(page_ids) || page_ids.length === 0) {
      return NextResponse.json({ error: 'page_ids array required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: pages } = await supabase
      .from('seo_pages')
      .select('id, url_path')
      .in('id', page_ids)

    if (!pages?.length) {
      return NextResponse.json({ error: 'No matching pages found' }, { status: 404 })
    }

    const baseUrl = 'https://northernwarrior.co.uk'
    let pushed = 0
    let failed = 0
    const results: Array<{ url: string; status: string; response?: unknown }> = []

    for (const page of pages) {
      const fullUrl = `${baseUrl}${page.url_path}`
      try {
        const res = await fetch('https://app.indexplease.com/api/v1/urls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ url: fullUrl, priority: 'high' }),
        })

        const responseData = await res.json().catch(() => null)

        await supabase.from('seo_indexplease_pushes').insert({
          page_id: page.id,
          status: res.ok ? 'submitted' : 'failed',
          response: responseData,
        })

        if (res.ok) {
          pushed++
          results.push({ url: fullUrl, status: 'submitted', response: responseData })
        } else {
          failed++
          results.push({ url: fullUrl, status: 'failed', response: responseData })
        }
      } catch (err) {
        failed++
        results.push({ url: fullUrl, status: 'error' })
        await supabase.from('seo_indexplease_pushes').insert({
          page_id: page.id,
          status: 'failed',
          response: { error: err instanceof Error ? err.message : 'Unknown error' },
        })
      }
    }

    return NextResponse.json({ pushed, failed, results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
