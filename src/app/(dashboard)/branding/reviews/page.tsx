import { PageHeader } from '@/components/layout/PageHeader'
import { ReviewsPage } from '@/components/branding/ReviewsPage'

export default function GoogleReviewsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Branding"
        title="Google"
        titleGold="Reviews"
        description="View, sync, and manage your Google Reviews"
      />
      <ReviewsPage />
    </div>
  )
}
