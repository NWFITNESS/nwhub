import { TopBar } from '@/components/layout/TopBar'
import { CampaignBuilder } from '@/components/email/CampaignBuilder'

export default function NewEmailCampaignPage() {
  return (
    <>
      <TopBar title="New Email Campaign" />
      <main className="flex flex-col gap-6 p-4 lg:p-8 min-h-[calc(100vh-5rem)]">
        <CampaignBuilder />
      </main>
    </>
  )
}
