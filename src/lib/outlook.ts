import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────────────────────────────────────────────────────
// Microsoft Graph API helper for Outlook integration
//
// Handles OAuth2 token storage + refresh and provides an `outlookFetch`
// wrapper that auto-refreshes expired tokens before every request, mirroring
// the gmailFetch pattern.
//
// Token lifecycle:
//   1. User clicks "Connect Outlook" → /api/outlook/connect redirects to MS
//   2. MS redirects back to /api/outlook/callback with an auth code
//   3. Callback exchanges the code for access_token + refresh_token and stores
//      them in global_settings under key 'outlook_tokens'
//   4. Every subsequent outlookFetch call checks if the token has expired and
//      refreshes it via the refresh_token before making the Graph API call
//
// Env vars: OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

interface OutlookTokens {
  access_token: string
  refresh_token: string
  expires_at: number // epoch ms
  email?: string
}

/**
 * Load stored Outlook tokens from global_settings.
 * Returns null if not connected.
 */
export async function getOutlookTokens(): Promise<OutlookTokens | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'outlook_tokens')
    .single()
  if (!data?.value) return null
  try {
    return typeof data.value === 'string' ? JSON.parse(data.value) : data.value as OutlookTokens
  } catch {
    return null
  }
}

/**
 * Save tokens to global_settings.
 */
export async function saveOutlookTokens(tokens: OutlookTokens): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('global_settings')
    .upsert({ key: 'outlook_tokens', value: JSON.stringify(tokens) }, { onConflict: 'key' })
}

/**
 * Refresh the access token using the stored refresh_token.
 * Returns the new tokens (also saves them to the DB).
 */
async function refreshAccessToken(current: OutlookTokens): Promise<OutlookTokens> {
  const clientId = process.env.OUTLOOK_CLIENT_ID
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET must be set')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: current.refresh_token,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Outlook token refresh failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const refreshed: OutlookTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? current.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000, // 60s grace period
    email: current.email,
  }
  await saveOutlookTokens(refreshed)
  return refreshed
}

/**
 * Make an authenticated request to the Microsoft Graph API.
 * Auto-refreshes the token if it's expired or about to expire.
 *
 * Usage: `outlookFetch('/me/messages?$top=50')`
 *
 * The `path` is relative to https://graph.microsoft.com/v1.0 — do NOT
 * include the base URL. Headers and options are forwarded to fetch().
 */
export async function outlookFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let tokens = await getOutlookTokens()
  if (!tokens) throw new Error('Outlook is not connected')

  // Refresh if expired or within 60 seconds of expiry
  if (Date.now() >= tokens.expires_at) {
    tokens = await refreshAccessToken(tokens)
  }

  const url = path.startsWith('http') ? path : `${GRAPH_BASE}${path}`
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

// ── Outlook Categories (colour-coded tags, equivalent to Gmail labels) ───────

const OUTLOOK_CATEGORIES: Record<string, { displayName: string; color: string }> = {
  needs_attention: { displayName: 'NWHub - Action Required', color: 'preset9' },   // red
  new_lead:        { displayName: 'NWHub - New Lead',        color: 'preset7' },   // green
  receipt_notification: { displayName: 'NWHub - Receipt', color: 'preset0' },      // blue
  newsletter:      { displayName: 'NWHub - Newsletter',      color: 'preset3' },   // purple
}

/**
 * Ensure NWHub categories exist on the Outlook mailbox.
 * Creates any that are missing. Returns a map of category key → display name.
 * Cached in-memory for 10 minutes.
 */
let categoryCache: { map: Record<string, string>; fetchedAt: number } | null = null
const CATEGORY_CACHE_TTL = 10 * 60 * 1000

export async function ensureOutlookCategories(
  fetcher: typeof outlookFetch = outlookFetch,
): Promise<Record<string, string>> {
  if (categoryCache && (Date.now() - categoryCache.fetchedAt) < CATEGORY_CACHE_TTL) {
    return categoryCache.map
  }

  // Fetch existing categories
  const res = await fetcher('/me/outlook/masterCategories')
  const existing: string[] = []
  if (res.ok) {
    const data = await res.json()
    for (const cat of data.value ?? []) {
      existing.push(cat.displayName)
    }
  }

  // Create missing ones
  for (const [, cat] of Object.entries(OUTLOOK_CATEGORIES)) {
    if (!existing.includes(cat.displayName)) {
      await fetcher('/me/outlook/masterCategories', {
        method: 'POST',
        body: JSON.stringify({ displayName: cat.displayName, color: cat.color }),
      }).catch(() => { /* may already exist, ignore */ })
    }
  }

  const map: Record<string, string> = {}
  for (const [key, cat] of Object.entries(OUTLOOK_CATEGORIES)) {
    map[key] = cat.displayName
  }

  categoryCache = { map, fetchedAt: Date.now() }
  return map
}

/**
 * Build the OAuth2 authorization URL for the "Connect Outlook" flow.
 */
export function getOutlookAuthUrl(redirectUri: string): string {
  const clientId = process.env.OUTLOOK_CLIENT_ID
  if (!clientId) throw new Error('OUTLOOK_CLIENT_ID is not set')

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'openid offline_access Mail.ReadWrite User.Read',
    response_mode: 'query',
    prompt: 'consent',
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens. Called from the callback route.
 */
export async function exchangeOutlookCode(
  code: string,
  redirectUri: string,
): Promise<OutlookTokens> {
  const clientId = process.env.OUTLOOK_CLIENT_ID
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET must be set')
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Outlook token exchange failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const tokens: OutlookTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  }

  // Fetch the user's email address for display in the UI
  try {
    const profileRes = await fetch(`${GRAPH_BASE}/me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    if (profileRes.ok) {
      const profile = await profileRes.json()
      tokens.email = profile.mail ?? profile.userPrincipalName ?? null
    }
  } catch { /* non-critical */ }

  await saveOutlookTokens(tokens)
  return tokens
}
