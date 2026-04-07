import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'

// Google Pub/Sub push notifications include a signed JWT in Authorization.
// We verify the token's signature, issuer, and (optional) audience.
const oAuth2Client = new OAuth2Client()

async function verifyGooglePushToken(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return false

  const token = authHeader.slice(7).trim()
  if (!token) return false

  try {
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      // If GMAIL_PUSH_AUDIENCE is set, enforce audience match. Otherwise just verify signature/issuer.
      audience: process.env.GMAIL_PUSH_AUDIENCE || undefined,
    })
    const payload = ticket.getPayload()
    if (!payload) return false

    // Issuer must be Google
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      return false
    }

    return true
  } catch {
    return false
  }
}

// Gmail sends a POST with base64-encoded message data
export async function POST(req: NextRequest) {
  try {
    // Verify the request actually came from Google Pub/Sub
    const valid = await verifyGooglePushToken(req)
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

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
