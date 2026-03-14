'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Drop this component into a layout to automatically track page views.
 * It fires a POST to /api/analytics/track on every route change.
 *
 * Usage (e.g. in the public site root layout):
 *   import { PageViewTracker } from '@/components/analytics/PageViewTracker'
 *   <PageViewTracker />
 *
 * If the public site is on a different domain, set the `endpoint` prop:
 *   <PageViewTracker endpoint="https://nwhub.vercel.app/api/analytics/track" />
 */
export function PageViewTracker({ endpoint = '/api/analytics/track' }: { endpoint?: string }) {
  const pathname = usePathname()

  useEffect(() => {
    // Use sendBeacon for reliability (fires even during page unload),
    // fall back to fetch for older browsers.
    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  }, [pathname, endpoint])

  return null
}
