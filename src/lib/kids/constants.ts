import type { KidsCategory } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Kids & Teens — fixed constants
//
// Session times are HARDCODED, not stored in the database. They never change
// per block. If they ever do, change them here and they update everywhere.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORY_LABEL: Record<KidsCategory, string> = {
  minis: 'Minis',
  littles: 'Littles',
  teens: 'Teens',
}

export const CATEGORY_AGE_RANGE: Record<KidsCategory, string> = {
  minis: '3–5',
  littles: '5–10',
  teens: '10–18',
}

export const CATEGORY_TIME: Record<KidsCategory, string> = {
  minis: '10:15 – 10:35',
  littles: '10:45 – 11:15',
  teens: '11:30 – 12:30',
}

// Drop-in single-session prices (different from block prices, in pence)
export const DROPIN_PRICE_PENCE: Record<KidsCategory, number> = {
  minis: 800,
  littles: 800,
  teens: 1000,
}

// Category badge colours — matches the prompt's spec
export const CATEGORY_BADGE: Record<KidsCategory, { bg: string; fg: string }> = {
  minis:   { bg: '#EEEDFE', fg: '#3C3489' },
  littles: { bg: '#E1F5EE', fg: '#085041' },
  teens:   { bg: '#FAEEDA', fg: '#633806' },
}

export function categoryFromAge(ageInYears: number): KidsCategory {
  if (ageInYears <= 5) return 'minis'
  if (ageInYears <= 10) return 'littles'
  return 'teens'
}

export function ageFromDob(dob: string, asOf: Date = new Date()): number {
  const birth = new Date(dob)
  let age = asOf.getFullYear() - birth.getFullYear()
  const m = asOf.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age--
  return age
}

export function categoryFromDob(dob: string): KidsCategory {
  return categoryFromAge(ageFromDob(dob))
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, '')}`
}
