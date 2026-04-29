'use server'

import { NextRequest, NextResponse } from 'next/server'
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RP_NAME = 'NWHub'
const RP_ID = process.env.NEXT_PUBLIC_PASSKEY_RP_ID ?? 'admin.northernwarrior.co.uk'
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? `https://${RP_ID}`

// In-memory challenge store (short-lived, per-request)
// In production with multiple instances you'd use Redis, but for a single
// admin panel this is fine — challenges expire in 60 seconds anyway.
const challengeStore = new Map<string, { challenge: string; expires: number }>()

function cleanExpired() {
  const now = Date.now()
  for (const [k, v] of challengeStore) {
    if (v.expires < now) challengeStore.delete(k)
  }
}

/**
 * GET /api/passkey/register — Generate registration options (challenge)
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Fetch existing credentials so the browser excludes them
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('passkey_credentials')
    .select('credential_id')
    .eq('user_id', user.id)

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email ?? user.id,
    userDisplayName: user.email ?? 'Admin',
    attestationType: 'none',
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.credential_id,
      transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })

  // Store challenge for verification
  cleanExpired()
  challengeStore.set(user.id, { challenge: options.challenge, expires: Date.now() + 60_000 })

  return NextResponse.json(options)
}

/**
 * POST /api/passkey/register — Verify registration response and store credential
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const stored = challengeStore.get(user.id)
  if (!stored || stored.expires < Date.now()) {
    return NextResponse.json({ error: 'Challenge expired — try again' }, { status: 400 })
  }

  const body = await req.json()
  const { label, response } = body as { label?: string; response: RegistrationResponseJSON }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    const admin = createAdminClient()
    const { error } = await admin.from('passkey_credentials').insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      device_type: credentialDeviceType,
      backed_up: credentialBackedUp,
      transports: response.response.transports ?? [],
      label: label?.trim() || '',
    })

    if (error) {
      console.error('[passkey] insert failed:', error.message)
      return NextResponse.json({ error: 'Failed to save passkey' }, { status: 500 })
    }

    challengeStore.delete(user.id)
    return NextResponse.json({ verified: true })
  } catch (e) {
    console.error('[passkey] registration error:', (e as Error).message)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
