import { PageHeader } from '@/components/layout/PageHeader'
import { SubscriberImporter } from '@/components/email/SubscriberImporter'

export default function ImportSubscribersPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Import"
        titleGold="Subscribers"
        description="Upload a CSV of email subscribers from Squarespace, website forms, or other sources"
      />
      <SubscriberImporter />
    </div>
  )
}
