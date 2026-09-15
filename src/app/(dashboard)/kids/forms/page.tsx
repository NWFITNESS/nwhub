import { getAllRegistrations, getAllBlocks } from '@/lib/kids/queries'
import { RegistrationsClient } from './RegistrationsClient'
import type { RegistrationFull } from '@/lib/kids/types'

async function safe<T>(label: string, fetcher: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fetcher()
  } catch (e) {
    console.error(`[kids/registrations] ${label} failed:`, (e as Error).message)
    return fallback
  }
}

export default async function KidsRegistrationsPage() {
  const [registrations, blocks] = await Promise.all([
    safe<RegistrationFull[]>('getAllRegistrations', getAllRegistrations, []),
    safe('getAllBlocks', getAllBlocks, []),
  ])

  const blockOptions = blocks.map((b) => ({ id: b.id, name: b.name }))

  return <RegistrationsClient registrations={registrations} blocks={blockOptions} />
}
