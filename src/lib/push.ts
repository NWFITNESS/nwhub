import * as webpushImport from 'web-push'

type WebPush = typeof import('web-push')
// web-push is CommonJS; depending on how it's bundled the callable module may be
// the namespace itself or hang off `.default`. Pick whichever exposes the API.
const webpush: WebPush = (
  (webpushImport as { setVapidDetails?: unknown }).setVapidDetails
    ? webpushImport
    : (webpushImport as unknown as { default: WebPush }).default
) as WebPush

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:info@northernwarrior.co.uk'
  if (!publicKey || !privateKey) throw new Error('VAPID keys not configured')
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export interface PushSub {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/** Send a push. Returns 'ok', or 'gone' if the subscription is dead (404/410)
 *  and should be deleted, or 'error' for a transient failure. */
export async function sendPush(sub: PushSub, payload: PushPayload): Promise<'ok' | 'gone' | 'error'> {
  try {
    ensureConfigured()
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
    )
    return 'ok'
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode
    if (status === 404 || status === 410) return 'gone'
    console.error('[push] send failed:', (err as Error).message)
    return 'error'
  }
}
