/// <reference lib="webworker" />
// Custom Kalmio service worker (KALMIO-316, KALMIO-363).
// Loaded via VitePWA injectManifest strategy — Workbox injects the precache manifest at build time.
// This file handles:
//   - Push-notification click actions (KALMIO-316)
//   - Workbox runtime caching for GET /api/* with per-endpoint TTLs (KALMIO-363)

import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

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

// ── Runtime API caching (KALMIO-363) ──────────────────────────────────────────
//
// Design constraints:
//   1. Only GET requests are cached — non-GET bypass all routes entirely.
//   2. Per-user isolation: on sign-out the app posts CLEAR_API_CACHE and all
//      kalmio-api-* caches are wiped, preventing one user's data from being
//      served to the next user on the same device.
//   3. ExpirationPlugin enforces both TTL and maxEntries with purgeOnQuotaError.
//
// Route precedence (most-specific first — registerRoute order matters):
//   a. /api/macro-rollup/**   — NetworkFirst, 5 min   (real-time rollup, must be fresh)
//   b. /api/fridge/**         — NetworkFirst, 1 hour
//   c. /api/plans/**          — NetworkFirst, 6 hours
//   d. /api/planned-meals/**  — NetworkFirst, 6 hours
//   e. /api/recipes/**        — StaleWhileRevalidate,  7 days  (reference data, rarely changes)
//   f. /api/ingredients/**    — StaleWhileRevalidate,  7 days
//   g. /api/**                — StaleWhileRevalidate, 24 hours, max 200 entries (fallback)
//
// Non-GET requests are never matched by any registerRoute call below; they fall
// through to the network without touching the cache.

const CACHE_PREFIX = 'kalmio-api'

// ── (a) /api/macro-rollup/** — NetworkFirst, 5 minutes ───────────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/macro-rollup'),
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-macro-rollup`,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 5 * 60, maxEntries: 50, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (b) /api/fridge/** — NetworkFirst, 1 hour ─────────────────────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/fridge'),
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-fridge`,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60, maxEntries: 50, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (c) /api/plans/** — NetworkFirst, 6 hours ─────────────────────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/plans'),
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-plans`,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 6 * 60 * 60, maxEntries: 100, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (d) /api/planned-meals/** — NetworkFirst, 6 hours ────────────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/planned-meals'),
  new NetworkFirst({
    cacheName: `${CACHE_PREFIX}-planned-meals`,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 6 * 60 * 60, maxEntries: 100, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (e) /api/recipes/** — StaleWhileRevalidate, 7 days ───────────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/recipes'),
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-recipes`,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60, maxEntries: 500, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (f) /api/ingredients/** — StaleWhileRevalidate, 7 days ───────────────────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/ingredients'),
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-ingredients`,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 7 * 24 * 60 * 60, maxEntries: 1000, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── (g) /api/** default — StaleWhileRevalidate, 24 hours, max 200 entries ────
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: `${CACHE_PREFIX}-default`,
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 24 * 60 * 60, maxEntries: 200, purgeOnQuotaError: true }),
    ],
    fetchOptions: { credentials: 'include' },
  }),
  'GET',
)

// ── Sign-out cache clear ───────────────────────────────────────────────────────
// The app posts { type: 'CLEAR_API_CACHE' } from useAuthStore's signOut action.
// All kalmio-api-* caches are deleted to prevent one user's data from being
// served to the next user on the same device.
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if ((event.data as { type?: string } | null)?.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith(CACHE_PREFIX))
            .map(k => caches.delete(k)),
        ),
      ),
    )
  }
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
