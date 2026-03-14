import { TopBar } from '@/components/layout/TopBar'
import { CampaignBuilder } from '@/components/email/CampaignBuilder'

export default function NewEmailCampaignPage() {
  return (
    <>
      <TopBar title="New Email Campaign" />
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <CampaignBuilder />
      </main>
    </>
  )
}
