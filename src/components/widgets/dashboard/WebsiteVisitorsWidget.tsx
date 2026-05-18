'use client'

import { WebsiteVisitorsChart, type ChartDataPoint } from '@/components/dashboard/MemberGrowthChart'

interface Props {
  data24h: ChartDataPoint[]
  data7d: ChartDataPoint[]
  data30d: ChartDataPoint[]
  data1y: ChartDataPoint[]
  comp7d?: ChartDataPoint[]
  comp30d?: ChartDataPoint[]
  comp1y?: ChartDataPoint[]
}

export function WebsiteVisitorsWidget(props: Props) {
  return <WebsiteVisitorsChart {...props} />
}
