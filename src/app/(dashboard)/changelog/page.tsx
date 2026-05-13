import { PageHeader } from '@/components/layout/PageHeader'
import { ChangelogClient } from '@/components/changelog/ChangelogClient'

export default function ChangelogPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="System"
        title="System"
        titleGold="Log"
        description="Track all changes made to NWHub and the Northern Warrior website"
      />
      <ChangelogClient />
    </div>
  )
}
