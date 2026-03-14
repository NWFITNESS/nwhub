import { TopBar } from '@/components/layout/TopBar'
import { SmsCampaignComposer } from '@/components/sms/SmsCampaignComposer'

export default function NewSmsCampaignPage() {
  return (
    <>
      <TopBar title="New WhatsApp Campaign" />
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <SmsCampaignComposer />
      </main>
    </>
  )
}
