import { PageHeader } from '@/components/layout/PageHeader'
import PopupAdmin from '@/components/popup/PopupAdmin'

export default function PopupPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Marketing"
        title="Website"
        titleGold="Popup"
        description="Manage the promotional popup shown to first-time visitors"
      />
      <PopupAdmin />
    </div>
  )
}
