import { google } from 'googleapis'

/**
 * Build a Google auth client from a base64-encoded service account JSON.
 * Returns null if the env var is missing (allows workers to skip gracefully).
 */
export function getGoogleAuth(scopes: string[]) {
  const json = process.env.GSC_SERVICE_ACCOUNT_JSON
  if (!json) return null
  try {
    const credentials = JSON.parse(Buffer.from(json, 'base64').toString('utf-8'))
    return new google.auth.GoogleAuth({ credentials, scopes })
  } catch (e) {
    console.error('[google-auth] Failed to parse service account JSON:', e)
    return null
  }
}
