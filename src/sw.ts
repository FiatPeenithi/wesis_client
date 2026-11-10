/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

// Enforce instant updates: take over as soon as a new SW is installed,
// and drop obsolete precaches so users never stick on stale bundles.
self.skipWaiting()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// index.html / SPA navigations: Network-First so users always fetch the
// newest script references after a deploy, with precache as offline fallback.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'navigations',
      networkTimeoutSeconds: 5,
    }),
  ),
)

// Google Fonts (preserved from vite.config workbox.runtimeCaching — that key
// is ignored under `strategies: 'injectManifest'`, so register here).
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
)

// Allow the client (virtual:pwa-register `updateServiceWorker(true)`) to
// trigger skipWaiting on demand.
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && (event.data as { type?: string }).type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim())
})

interface PushData {
  title?: string
  body?: string
  url?: string
  tag?: string
  logId?: string
  userId?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let data: PushData = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data?.text() }
  }

  const title = data.title || 'WE SIS'
  event.waitUntil(
    self.registration
      .showNotification(title, {
        body: data.body || '',
        icon: '/wesis-icon.png',
        badge: '/wesis-icon.png',
        tag: data.tag,
        data: { url: data.url || '/', logId: data.logId, userId: data.userId },
      })
      .catch((err) => {
        console.error('showNotification failed:', err)
      }),
  )
})

async function reportPushClicked(logId?: string, userId?: string): Promise<void> {
  if (!logId) return
  try {
    await fetch('/api/push/clicked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, userId }),
    })
  } catch (err) {
    console.error('Failed to report push click:', err)
  }
}

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const data: PushData = event.notification.data || {}
  const url: string = data.url || '/'
  event.waitUntil(
    Promise.all([
      reportPushClicked(data.logId, data.userId),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      }),
    ]),
  )
})
