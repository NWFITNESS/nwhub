import { createAdminClient } from '@/lib/supabase/admin'

interface GmailTokens {
  access_token: string
  refresh_token: string
  expires_at: number // unix seconds
  email?: string
}

async function saveTokens(tokens: GmailTokens) {
  const supabase = createAdminClient()
  await supabase.from('global_settings').upsert(
    { key: 'gmail_tokens', value: JSON.stringify(tokens), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gmail token refresh failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Google doesn't always return a new refresh token
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    email: data.email,
  }
}

/** Read tokens from DB, refresh if expired, return valid access token */
export async function getValidAccessToken(): Promise<{ accessToken: string; email?: string } | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'gmail_tokens')
    .single()

  if (!data?.value) return null

  let tokens: GmailTokens
  try {
    tokens = JSON.parse(data.value)
  } catch {
    return null
  }

  if (!tokens.access_token || !tokens.refresh_token) return null

  // Refresh if expiring within 60 seconds
  if (tokens.expires_at < Math.floor(Date.now() / 1000) + 60) {
    try {
      tokens = await refreshAccessToken(tokens.refresh_token)
      await saveTokens(tokens)
    } catch {
      return null
    }
  }

  return { accessToken: tokens.access_token, email: tokens.email }
}

/** Save tokens after OAuth callback */
export async function storeGmailTokens(params: {
  access_token: string
  refresh_token: string
  expires_in: number
  email?: string
}) {
  const tokens: GmailTokens = {
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + params.expires_in,
    email: params.email,
  }
  await saveTokens(tokens)
}

/** Fetch from Gmail API with automatic token management */
export async function gmailFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const tokenData = await getValidAccessToken()
  if (!tokenData) throw new Error('Gmail not connected')

  return fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${tokenData.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
}

/** Decode base64url encoded email body */
export function decodeBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  try {
    return Buffer.from(base64, 'base64').toString('utf-8')
  } catch {
    return ''
  }
}

/** Extract plain text body from Gmail message payload */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractEmailBody(payload: any): string {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  // Multipart — prefer text/plain
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    // Fallback to first part with data
    for (const part of payload.parts) {
      if (part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
  }

  return ''
}

/** Extract header value from Gmail message headers */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getHeader(headers: any[], name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}
