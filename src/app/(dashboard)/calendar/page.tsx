import { PageHeader } from '@/components/layout/PageHeader'
import { CalendarClient } from './CalendarClient'

export const metadata = { title: 'Calendar — NW Hub' }

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Admin Panel" title="Training" titleGold="Calendar" description="Trials, events and upcoming sessions at a glance." />
      <CalendarClient />
    </div>
  )
}
