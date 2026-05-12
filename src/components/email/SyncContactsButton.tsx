'use client'

import { useState } from 'react'
import { RefreshCw, Users, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  unsyncedCount: number
}

export function SyncContactsButton({ unsyncedCount }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ synced: number } | null>(null)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res = await fetch('/api/email/sync-contacts', { method: 'POST' })
      const data = await res.json()
      setResult(data)
      router.refresh()
    } catch {
      // silent fail
    } finally {
      setSyncing(false)
    }
  }

  if (result) {
    return (
      <div className="flex items-center gap-2 text-[#22c55e]" style={{ fontSize: 12 }}>
        <Check size={14} /> {result.synced} contacts synced
      </div>
    )
  }

  return (
    <Button variant={unsyncedCount > 0 ? 'gold' : 'default'} size="sm" onClick={handleSync} loading={syncing}>
      {unsyncedCount > 0 ? (
        <><Users size={13} /> Sync {unsyncedCount} Contacts</>
      ) : (
        <><RefreshCw size={13} /> Sync Contacts</>
      )}
    </Button>
  )
}
