import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') // subscriber id

  if (!token) {
    return new Response('<p>Invalid unsubscribe link.</p>', { headers: { 'Content-Type': 'text/html' } })
  }

  const admin = createAdminClient()
  await admin.from('email_subscribers').update({
    status: 'unsubscribed',
    unsubscribed_at: new Date().toISOString(),
  }).eq('id', token)

  return new Response(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:4rem;background:#0a0a0a;color:white">
      <h2>Unsubscribed</h2>
      <p style="color:rgba(255,255,255,0.5)">You have been unsubscribed from Northern Warrior emails.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
