import { PageHeader } from '@/components/layout/PageHeader'
import { SyncClient } from '@/components/sync/SyncClient'

export default function SyncPage() {
  return (
    <div className="bg-nw-900 min-h-screen">
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          eyebrow="Admin Panel"
          title="Data"
          titleGold="Sync"
          description="Import your WodBoard member export to keep contacts up to date"
        />
        <SyncClient />
      </main>
    </div>
  )
}
