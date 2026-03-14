import { createHash } from 'crypto'

/** Returns the API key from env var, falling back to the value from the database. */
export function resolveApiKey(dbKey?: string): string {
  return process.env.MAILCHIMP_API_KEY || dbKey || ''
}

export function getMailchimpDc(apiKey: string): string {
  return apiKey.split('-').pop()!
}

export function getMailchimpBase(apiKey: string): string {
  return `https://${getMailchimpDc(apiKey)}.api.mailchimp.com/3.0`
}

export async function mc(
  apiKey: string,
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<Response> {
  const credentials = Buffer.from(`anystring:${apiKey}`).toString('base64')
  return fetch(`${getMailchimpBase(apiKey)}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}

export function emailHash(email: string): string {
  return createHash('md5').update(email.toLowerCase()).digest('hex')
}
