import crypto from 'crypto'

const SECRET = process.env.EDITOR_TOKEN_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'nw-editor-fallback'
const TTL_MS = 30 * 60 * 1000 // 30 minutes

interface TokenPayload {
  sub: string   // user_id
  slug: string  // page url_path
  exp: number   // expiry timestamp ms
}

/** Create a signed editor token for a specific page + user */
export function createEditorToken(userId: string, slug: string): string {
  const payload: TokenPayload = {
    sub: userId,
    slug,
    exp: Date.now() + TTL_MS,
  }
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}

/** Verify and decode an editor token. Returns null if invalid or expired. */
export function verifyEditorToken(token: string): TokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [data, sig] = parts
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url')
  if (sig !== expected) return null

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
