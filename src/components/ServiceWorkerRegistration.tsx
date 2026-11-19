'use client'
import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Unregister any previously installed service worker — EXCEPT the coach push
    // SW (scope /coach), which must survive so session reminders keep arriving.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const r of regs) {
          if (r.scope && r.scope.includes('/coach')) continue
          r.unregister()
        }
      })
    }
  }, [])
  return null
}
