'use server'

import { searchChildren as searchChildrenQuery } from '@/lib/kids/queries'

/**
 * Server action wrapper around `searchChildren` query so the roster's client
 * component can call it without importing server-only code directly.
 */
export async function searchChildren(query: string) {
  return searchChildrenQuery(query)
}
