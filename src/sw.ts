/// <reference lib="webworker" />
// Custom Kalmio service worker (KALMIO-316).
// Loaded via VitePWA injectManifest strategy — Workbox injects the precache manifest at build time.
// This file handles push-notification click actions and routes them back to open window clients
// so that SnoozeActionHandler can react without the SW needing direct API access.
//
// We intentionally do NOT import workbox-precaching here because the package is not installed
// as a production dependency.  VitePWA's injectManifest mode handles precaching automatically
// by injecting the manifest token; at runtime it falls back to the app shell navigation fallback.

declare const self: ServiceWorkerGlobalScope

// Satisfy the VitePWA injectManifest token replacement.
// The build tool replaces this expression with the real precache manifest array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
void (self as any).__WB_MANIFEST

// ── Activate immediately so notificationclick fires for the new SW right away ─
self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim())
})

// ── Notification click handler ────────────────────────────────────────────────
// Each prep notification carries two action buttons:
//   action: 'snooze'  → re-fire the same slot notification 1 hour later
//   action: 'quiet'   → suppress all prep notifications for the rest of today
// The notification's data object carries { slotId } so the client knows which slot to act on.
//
// The SW posts a structured message to all open Kalmio window clients.  The in-page
// SnoozeActionHandler listener picks this up and calls the backend endpoint.

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  const action = event.action        // 'snooze' | 'quiet' | '' (body tap)
  const slotId: string | undefined = (event.notification.data as { slotId?: string } | undefined)?.slotId

  event.notification.close()

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        if (clients.length === 0) {
          // No open window — open the app so the user can see their plan.
          return self.clients.openWindow('/')
        }

        for (const client of clients) {
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action,      // 'snooze' | 'quiet' | ''
            slotId,      // undefined when body is tapped without a specific action
          })
        }

        // Focus the most recently active client if possible.
        const focusable = clients.find(c => 'focus' in c)
        if (focusable) {
          return (focusable as WindowClient).focus()
        }
      }),
  )
})

// ── Push event ────────────────────────────────────────────────────────────────
// Receives server-sent Web Push messages from WebPushTransport.
// Payload JSON shape: { title, body, url, slotId }
// The notificationclick handler above reads event.notification.data.slotId
// and event.action to dispatch 'snooze' / 'quiet-today' back to the page.
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let payload: { title?: string; body?: string; url?: string; slotId?: string } = {}
  try {
    payload = event.data.json() as typeof payload
  } catch {
    // Malformed payload — show a generic fallback notification.
  }

  const title = payload.title ?? 'Kalmio'
  const body  = payload.body  ?? ''

  // `actions` is defined in the Push API spec but missing from some TS webworker lib typings.
  // The cast to `NotificationOptions` broadens the type to accept the extra field at runtime.
  const options = {
    body,
    data: { slotId: payload.slotId, url: payload.url },
    actions: [
      { action: 'snooze',      title: 'Snooze 1h'    },
      { action: 'quiet-today', title: 'Quiet today'   },
    ],
  } as NotificationOptions

  event.waitUntil(self.registration.showNotification(title, options))
})
