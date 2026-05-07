import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

const SYNC_WORKERS = [
  { name: 'GSC Daily', path: '/api/seo/sync/gsc' },
  { name: 'GSC Queries', path: '/api/seo/sync/gsc-queries' },
  { name: 'GA4 Daily', path: '/api/seo/sync/ga4' },
  { name: 'Stripe', path: '/api/seo/sync/stripe' },
  { name: 'Health', path: '/api/seo/sync/health' },
]

export async function POST(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3001'
  const cronSecret = process.env.CRON_SECRET ?? 'nw-cron-2026'

  const results: Array<{ name: string; status: string; rows_written?: number; error?: string }> = []

  for (const worker of SYNC_WORKERS) {
    try {
      // Forward cookies for auth + use cron secret
      const res = await fetch(`${baseUrl}${worker.path}`, {
        method: 'POST',
        headers: {
          'x-cron-secret': cronSecret,
          'Cookie': req.headers.get('cookie') ?? '',
        },
      })

      const data = await res.json().catch(() => ({}))

      if (data.skipped) {
        results.push({ name: worker.name, status: 'skipped', error: data.reason })
      } else if (res.ok) {
        results.push({ name: worker.name, status: 'success', rows_written: data.rows_written ?? 0 })
      } else {
        results.push({ name: worker.name, status: 'error', error: data.error ?? `HTTP ${res.status}` })
      }
    } catch (err) {
      results.push({ name: worker.name, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  const succeeded = results.filter(r => r.status === 'success').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const failed = results.filter(r => r.status === 'error').length

  return NextResponse.json({ succeeded, skipped, failed, results })
}
