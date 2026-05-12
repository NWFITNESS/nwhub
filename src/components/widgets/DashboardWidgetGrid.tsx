'use client'

import { Users, Mail, MessageSquare } from 'lucide-react'
import { WidgetGrid } from './WidgetGrid'
import { WidgetShell } from './WidgetShell'
import { useWidgetLayout, type WidgetDef } from './useWidgetLayout'
import { StatCard } from './dashboard/StatCard'
import { WebsiteVisitorsWidget } from './dashboard/WebsiteVisitorsWidget'
import { RecentEnquiriesWidget } from './dashboard/RecentEnquiriesWidget'
import { SetupChecklistWidget } from './dashboard/SetupChecklistWidget'
import { QuickActionsWidget } from './dashboard/QuickActionsWidget'
import { XeroRevenueCard } from '@/components/dashboard/XeroRevenueCard'
import type { ChartDataPoint } from '@/components/dashboard/MemberGrowthChart'

export interface ChecklistItem { label: string; done: boolean; manual?: boolean }
interface Enquiry { id: string; name: string; enquiry_type: string; message: string | null; created_at: string }
export interface DashboardTask { id: string; title: string; due_date: string | null; completed: boolean; priority: string; source: string }
export interface RecentPost { id: string; title: string; status: 'draft' | 'published'; created_at: string; published_at: string | null }

export interface DashboardData {
  membersTotal: number
  kidsRegistrations: number
  leadCount: number
  convertedLeads: number
  subscribers: number
  newContacts: number
  enquiriesAlert: boolean
  data24h: ChartDataPoint[]
  data7d: ChartDataPoint[]
  data30d: ChartDataPoint[]
  data1y: ChartDataPoint[]
  recentEnquiries: Enquiry[]
  checklist: ChecklistItem[]
  tasks: DashboardTask[]
  recentPosts: RecentPost[]
}

const DASHBOARD_WIDGETS: WidgetDef[] = [
  { id: 'kpi-members',        name: 'Total Members',       category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 0, y: 0 } },
  { id: 'kpi-subscribers',    name: 'Email Subscribers',   category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 3, y: 0 } },
  { id: 'kpi-enquiries',      name: 'Unread Enquiries',    category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 6, y: 0 } },
  { id: 'kpi-revenue',        name: 'Monthly Revenue',     category: 'kpi',   defaultLayout: { w: 3, h: 3, x: 9, y: 0 } },
  { id: 'chart-visitors',     name: 'Website Visitors',    category: 'chart', defaultLayout: { w: 12, h: 6, x: 0, y: 3 } },
  { id: 'list-enquiries',     name: 'Recent Enquiries',    category: 'misc',  defaultLayout: { w: 8, h: 7, x: 0, y: 9 } },
  { id: 'misc-checklist',     name: 'Setup Checklist',     category: 'misc',  defaultLayout: { w: 4, h: 7, x: 8, y: 9 } },
  { id: 'misc-quick-actions', name: 'Quick Actions',       category: 'misc',  defaultLayout: { w: 12, h: 5, x: 0, y: 16 } },
]

interface Props {
  data: DashboardData
}

export function DashboardWidgetGrid({ data }: Props) {
  const { layouts, visibleIds, saveLayouts, removeWidget, addWidget } = useWidgetLayout('dashboard', DASHBOARD_WIDGETS)

  function renderWidget(id: string, isCustomising: boolean, onRemove: (id: string) => void) {
    switch (id) {
      case 'kpi-members':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove}>
            <StatCard
              label="Total Members"
              value={data.membersTotal}
              icon={Users}
              iconBg="rgba(201,167,10,0.15)"
            />
          </WidgetShell>
        )
      case 'kpi-subscribers':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove}>
            <StatCard
              label="Email Subscribers"
              value={data.subscribers}
              icon={Mail}
              iconBg="rgba(59,130,246,0.15)"
            />
          </WidgetShell>
        )
      case 'kpi-enquiries':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove}>
            <StatCard
              label="Unread Enquiries"
              value={data.newContacts}
              icon={MessageSquare}
              iconBg={data.enquiriesAlert ? 'rgba(239,68,68,0.15)' : 'rgba(201,167,10,0.15)'}
              alert={data.enquiriesAlert}
            />
          </WidgetShell>
        )
      case 'kpi-revenue':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove}>
            <XeroRevenueCard />
          </WidgetShell>
        )
      case 'chart-visitors':
        return (
          <WidgetShell key={id} id={id} isCustomising={isCustomising} onRemove={onRemove} noPad>
            <WebsiteVisitorsWidget
              data24h={data.data24h}
              data7d={data.data7d}
              data30d={data.data30d}
              data1y={data.data1y}
            />
          </WidgetShell>
        )
      case 'list-enquiries':
        return (
          <WidgetShell
            key={id} id={id}
            subtitle="Inbound" title="Recent Enquiries"
            isCustomising={isCustomising} onRemove={onRemove}
          >
            <RecentEnquiriesWidget enquiries={data.recentEnquiries} />
          </WidgetShell>
        )
      case 'misc-checklist':
        return (
          <WidgetShell
            key={id} id={id}
            subtitle="Onboarding" title="Setup Checklist"
            isCustomising={isCustomising} onRemove={onRemove}
          >
            <SetupChecklistWidget checklist={data.checklist} />
          </WidgetShell>
        )
      case 'misc-quick-actions':
        return (
          <WidgetShell
            key={id} id={id}
            subtitle="Navigation" title="Quick Actions"
            isCustomising={isCustomising} onRemove={onRemove}
          >
            <QuickActionsWidget />
          </WidgetShell>
        )
      default:
        return null
    }
  }

  return (
    <WidgetGrid
      layouts={layouts}
      visibleIds={visibleIds}
      allWidgets={DASHBOARD_WIDGETS}
      saveLayouts={saveLayouts}
      removeWidget={removeWidget}
      addWidget={addWidget}
      renderWidget={renderWidget}
    />
  )
}
