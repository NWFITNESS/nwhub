import Stripe from 'stripe'

// ─────────────────────────────────────────────────────────────────────────────
// Stripe — server-only client.
//
// SECURITY: never import this from a client component. STRIPE_SECRET_KEY must
// only be present in server runtime env.
//
// API version: not pinned explicitly — the installed SDK (stripe@22) bundles
// '2026-03-25.dahlia' as its default, and that's what we want. Pinning a
// version is only necessary if you need behaviour that lags or leads the SDK,
// which we don't.
// ─────────────────────────────────────────────────────────────────────────────

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  }
  return stripeSingleton
}

/** Resolve the public-site base URL for Stripe redirect URLs. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://northernwarrior.co.uk'
}
