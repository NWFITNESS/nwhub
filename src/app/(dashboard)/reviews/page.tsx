import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ReviewsDashboard } from '@/components/reviews/ReviewsDashboard'
import type { ReviewRequest, ReviewSettings } from '@/lib/types'

const DEFAULT_SETTINGS: ReviewSettings = {
  enabled: false,
  google_place_id: '',
  review_link: '',
  first_content_sid: '',
  reminder_content_sid: '',
  days_after_joining: 7,
  reminder_interval_days: 7,
  max_messages: 2,
  last_known_review_count: 0,
}

export default async function ReviewsPage() {
  const supabase = createAdminClient()

  const [{ data: requestsData }, { data: settingsData }] = await Promise.all([
    supabase
      .from('review_requests')
      .select('*, contact:contacts(first_name, last_name, phone)')
      .order('created_at', { ascending: false }),
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'review_settings')
      .single(),
  ])

  const requests = (requestsData ?? []) as ReviewRequest[]
  const settings: ReviewSettings = settingsData?.value
    ? { ...DEFAULT_SETTINGS, ...(settingsData.value as Partial<ReviewSettings>) }
    : DEFAULT_SETTINGS

  return (
    <>
      <TopBar title="Reviews" />
      <main className="p-6">
        <PageHeader title="Google Reviews" description="Automate review requests and track your reputation" />
        <ReviewsDashboard initialRequests={requests} initialSettings={settings} />
      </main>
    </>
  )
}
