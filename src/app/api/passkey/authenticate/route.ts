'use server'

import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RP_ID = process.env.NEXT_PUBLIC_PASSKEY_RP_ID ?? 'admin.northernwarrior.co.uk'
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? `https://${RP_ID}`

// Challenge store — same pattern as registration
const challengeStore = new Map<string, { challenge: string; userId: string; expires: number }>()

function cleanExpired() {
  const now = Date.now()
  for (const [k, v] of challengeStore) {
    if (v.expires < now) challengeStore.delete(k)
  }
}

/**
 * GET /api/passkey/authenticate?email=... — Generate authentication options
 * Called from the login page after email+password succeeds.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const admin = createAdminClient()
  const { data: credentials } = await admin
    .from('passkey_credentials')
    .select('credential_id, transports')
    .eq('user_id', userId)

  if (!credentials?.length) {
    return NextResponse.json({ hasPasskey: false })
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map((c) => ({
      id: c.credential_id,
      transports: (c.transports ?? ['internal', 'hybrid']) as AuthenticatorTransport[],
    })),
    userVerification: 'preferred',
  })

  cleanExpired()
  const sessionKey = `auth:${userId}`
  challengeStore.set(sessionKey, { challenge: options.challenge, userId, expires: Date.now() + 120_000 })

  return NextResponse.json({ hasPasskey: true, options })
}

/**
 * POST /api/passkey/authenticate — Verify authentication response
 */
export async function POST(req: NextRequest) {
  const { user_id, response } = await req.json() as { user_id: string; response: AuthenticationResponseJSON }

  const sessionKey = `auth:${user_id}`
  const stored = challengeStore.get(sessionKey)
  if (!stored || stored.expires < Date.now()) {
    return NextResponse.json({ error: 'Challenge expired' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: credential } = await admin
    .from('passkey_credentials')
    .select('*')
    .eq('credential_id', response.id)
    .eq('user_id', user_id)
    .single()

  if (!credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 400 })
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.credential_id,
        publicKey: new Uint8Array(Buffer.from(credential.public_key, 'base64')),
        counter: credential.counter,
        transports: (credential.transports ?? []) as AuthenticatorTransport[],
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    // Update counter + last_used_at
    await admin.from('passkey_credentials').update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    }).eq('id', credential.id)

    challengeStore.delete(sessionKey)
    return NextResponse.json({ verified: true })
  } catch (e) {
    console.error('[passkey] auth error:', (e as Error).message)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
