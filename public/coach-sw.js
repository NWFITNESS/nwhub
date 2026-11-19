/* Coach app service worker — Web Push only (no offline caching).
   Scoped to /coach via the Service-Worker-Allowed header (see next.config.ts). */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = {} }
  const title = data.title || 'Northern Warrior'
  const options = {
    body: data.body || '',
    icon: '/icons/coach-icon-192.png',
    badge: '/icons/coach-icon-192.png',
    tag: data.tag || 'coach-reminder',
    renotify: true,
    vibrate: [120, 60, 120],
    data: { url: data.url || '/coach' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/coach'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes('/coach') && 'focus' in w) return w.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
