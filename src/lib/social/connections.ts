import { createAdminClient } from '@/lib/supabase/admin'

// ─── Connection types ─────────────────────────────────────────────────────────

export interface FacebookConnection {
  connected: true
  page_id: string
  page_name: string
  page_access_token: string
  connected_at: string
}

export interface InstagramConnection {
  connected: true
  ig_user_id: string
  username: string
  /** Same page access token used for Facebook */
  page_access_token: string
  connected_at: string
}

export interface LinkedInConnection {
  connected: true
  organization_id: string
  organization_name: string
  access_token: string
  refresh_token: string | null
  /** ISO date string — null = no expiry info */
  expires_at: string | null
  connected_at: string
}

type Disconnected = { connected: false }

export interface SocialConnections {
  facebook: FacebookConnection | Disconnected
  instagram: InstagramConnection | Disconnected
  linkedin: LinkedInConnection | Disconnected
}

export const DEFAULT_CONNECTIONS: SocialConnections = {
  facebook: { connected: false },
  instagram: { connected: false },
  linkedin: { connected: false },
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export async function getSocialConnections(): Promise<SocialConnections> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'social_connections')
    .single()

  if (!data?.value) return DEFAULT_CONNECTIONS
  return { ...DEFAULT_CONNECTIONS, ...(data.value as Partial<SocialConnections>) }
}

export async function saveSocialConnections(connections: SocialConnections): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('global_settings').upsert(
    { key: 'social_connections', value: connections as unknown as Record<string, unknown>, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
}

// ─── LinkedIn token refresh ───────────────────────────────────────────────────

export async function refreshLinkedInToken(conn: LinkedInConnection): Promise<LinkedInConnection> {
  if (!conn.refresh_token) return conn

  // Refresh if expiry is within 7 days or already past
  if (conn.expires_at) {
    const expiresAt = new Date(conn.expires_at).getTime()
    const sevenDays = 7 * 24 * 60 * 60 * 1000
    if (expiresAt - Date.now() > sevenDays) return conn // still valid
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: conn.refresh_token,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  })

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) return conn // return stale token; publish route will surface the error

  const json = await res.json()
  const refreshed: LinkedInConnection = {
    ...conn,
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? conn.refresh_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
  }

  // Persist refreshed token
  const existing = await getSocialConnections()
  await saveSocialConnections({ ...existing, linkedin: refreshed })

  return refreshed
}
