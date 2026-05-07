import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'

interface StoredTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  email?: string
}

/**
 * Load Google OAuth tokens from global_settings, refresh if expired.
 * Returns an authenticated OAuth2 client, or null if not connected.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getGoogleAuth(): Promise<any> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'google_seo_tokens')
    .single()

  if (!data?.value) return null

  let tokens: StoredTokens
  try {
    tokens = typeof data.value === 'string' ? JSON.parse(data.value) : data.value as StoredTokens
  } catch {
    return null
  }

  if (!tokens.access_token || !tokens.refresh_token) return null

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )

  oauth2.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  })

  // Refresh if expired or within 60 seconds of expiry
  if (Date.now() >= (tokens.expires_at - 60000)) {
    try {
      const { credentials } = await oauth2.refreshAccessToken()
      oauth2.setCredentials(credentials)

      // Save refreshed tokens
      const updated: StoredTokens = {
        access_token: credentials.access_token ?? tokens.access_token,
        refresh_token: credentials.refresh_token ?? tokens.refresh_token,
        expires_at: credentials.expiry_date ?? (Date.now() + 3600000),
        email: tokens.email,
      }
      await supabase.from('global_settings').upsert(
        { key: 'google_seo_tokens', value: JSON.stringify(updated), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      )
    } catch (e) {
      console.error('[google-auth] Token refresh failed:', e instanceof Error ? e.message : e)
      return null
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return oauth2 as any
}
