import { TopBar } from '@/components/layout/TopBar'
import { SmsCampaignComposer } from '@/components/sms/SmsCampaignComposer'

export default function NewSmsCampaignPage() {
  return (
    <>
      <TopBar title="New SMS Campaign" />
      <main className="p-6">
        <SmsCampaignComposer />
      </main>
    </>
  )
}
