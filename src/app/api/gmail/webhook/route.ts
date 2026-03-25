import { NextRequest, NextResponse } from 'next/server'

// Gmail sends a POST with base64-encoded message data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const messageData = body?.message?.data
    if (!messageData) return NextResponse.json({ ok: true })

    // Decode base64 message
    const decoded = JSON.parse(Buffer.from(messageData, 'base64').toString())
    const { emailAddress, historyId } = decoded

    console.log('[gmail/webhook] Push notification:', { emailAddress, historyId })

    // Trigger processing in background (fire and forget)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/inbox/process`, { method: 'POST' }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[gmail/webhook] Error:', e)
    return NextResponse.json({ ok: true }) // Always return 200 to Gmail
  }
}
