import { NextResponse } from 'next/server'
import { twilioClient, WHATSAPP_FROM } from '@/lib/twilio'
import { requireAuth } from '@/lib/auth-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  // 10 test messages per hour
  const ip = getClientIp(request)
  if (!(await rateLimit(`sms-test:${ip}`, 10, 60 * 60 * 1000))) {
    return NextResponse.json({ error: 'Too many test messages — try again later' }, { status: 429 })
  }

  try {
    const { phone, message } = await request.json()
    if (!phone || !message) return NextResponse.json({ error: 'Phone and message are required' }, { status: 400 })

    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`

    await twilioClient.messages.create({
      from: WHATSAPP_FROM,
      to,
      body: `[TEST] ${message}`,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to send test message'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
