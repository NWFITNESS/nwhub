import { TopBar } from '@/components/layout/TopBar'
import { SmsCampaignComposer } from '@/components/sms/SmsCampaignComposer'

export default function NewSmsCampaignPage() {
  return (
    <>
      <TopBar title="New WhatsApp Campaign" />
      <main className="flex flex-col gap-6 px-6 lg:px-12 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <SmsCampaignComposer />
      </main>
    </>
  )
}
