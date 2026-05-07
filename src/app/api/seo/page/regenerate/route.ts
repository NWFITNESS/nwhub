import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// POST — regenerate a single page's content
// Delegates to the main generate endpoint with a single page_id
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json()
  const pageId = body.page_id
  if (!pageId) {
    return NextResponse.json({ error: 'page_id is required' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

  // Forward to the generate endpoint
  const res = await fetch(`${baseUrl}/api/seo/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ page_ids: [pageId] }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
