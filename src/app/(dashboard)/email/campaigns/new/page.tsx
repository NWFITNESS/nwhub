import { TopBar } from '@/components/layout/TopBar'
import { CampaignBuilder } from '@/components/email/CampaignBuilder'

export default function NewEmailCampaignPage() {
  return (
    <>
      <TopBar title="New Email Campaign" />
      <main className="p-6">
        <CampaignBuilder />
      </main>
    </>
  )
}
