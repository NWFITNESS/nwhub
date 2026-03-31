import { PageHeader } from '@/components/layout/PageHeader'
import { SyncClient } from '@/components/sync/SyncClient'

export default function SyncPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="System"
        title="WodBoard"
        titleGold="Sync"
        description="Import your WodBoard member export to keep contacts up to date"
      />
      <SyncClient />
    </div>
  )
}
