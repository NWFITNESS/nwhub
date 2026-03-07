import { TopBar } from '@/components/layout/TopBar'
import { SmsCampaignComposer } from '@/components/sms/SmsCampaignComposer'

export default function NewSmsCampaignPage() {
  return (
    <>
      <TopBar title="New WhatsApp Campaign" />
      <main className="p-10">
        <SmsCampaignComposer />
      </main>
    </>
  )
}
