/// <reference lib="webworker" />
// Custom Kalmio service worker (KALMIO-316, KALMIO-363, KALMIO-377, KALMIO-413).
// Loaded via VitePWA injectManifest strategy — Workbox injects the precache manifest at build time.
// This file handles:
//   - Shell precaching for offline (KALMIO-413) — HTML, JS, CSS, fonts, icons
//   - Push-notification click actions (KALMIO-316)
//   - Workbox runtime caching for GET /api/* with per-endpoint TTLs (KALMIO-363)
//   - BackgroundSync queue for mutating requests to /api/* (KALMIO-377)

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { BackgroundSyncPlugin, Queue } from 'workbox-background-sync'

declare const self: ServiceWorkerGlobalScope

// ── Shell precache (KALMIO-413) ──────────────────────────────────────────────
// The build tool replaces __WB_MANIFEST with the asset manifest array
// (index.html, the built JS/CSS chunks, icons, fonts, etc.). Without this
// call the SW touched the token but never registered the precache, so the
// shell was not available offline and a cold reload while offline showed a
// blank page even after the SW had activated.
//
// SPA navigation fallback: any in-app navigation (e.g. /app, /app/recipes/123)
// while offline should serve the cached index.html. NavigationRoute pairs the
// precached index.html with all navigation requests by default. The denylist
// keeps explicit OS / debug paths off the SPA shell.
precacheAndRoute(self.__WB_MANIFEST)

const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(
  new NavigationRoute(navigationHandler, {
    denylist: [/^\/api\//, /^\/actuator\//, /^\/sw\.js$/, /^\/registerSW\.js$/, /^\/manifest\.webmanifest$/],
  }),
)

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
  }),
  'GET',
)

// ── BackgroundSync for mutating requests (KALMIO-377) ─────────────────────────
//
// Any POST / PATCH / PUT / DELETE to /api/* that fails due to network error or
// a 5xx response is queued in IndexedDB by BackgroundSyncPlugin. When the SW
// receives a Background Sync event (or the next time the device comes online),
// Workbox replays the queued requests in FIFO order.
//
// Idempotency: the original request headers (including Idempotency-Key, if the
// caller opted in via the Axios interceptor) are preserved in the queue, so the
// backend can safely deduplicate replays — no re-generation is needed.
//
// Queue name: 'kalmio-mutations' — 24-hour retention window.
//
// After each successful or exhausted replay, the SW posts
// { type: 'SYNC_QUEUE_UPDATE', count: <remaining items> }
// to all open window clients so the banner in the app can update its count.
//
// NOTE: plan-generation and replan endpoints are NOT routed here. Those are
// intentionally excluded — they are non-idempotent, long-running operations
// that must not be auto-retried by the SW. They bypass the BackgroundSync route
// because registerRoute matches on the request URL, not the Axios opt-in flag.
// The consumer is responsible for not enabling `requestIdempotencyKey` on those.

const MUTATION_QUEUE_NAME = 'kalmio-mutations'
const MUTATION_MAX_RETENTION_SECONDS = 24 * 60 * 60 // 24 hours

const bgSyncPlugin = new BackgroundSyncPlugin(MUTATION_QUEUE_NAME, {
  maxRetentionTime: MUTATION_MAX_RETENTION_SECONDS,
  async onSync({ queue }: { queue: Queue }) {
    // Attempt to replay all queued requests.
    let entry = await queue.shiftRequest()
    while (entry) {
      try {
        await fetch(entry.request.clone())
      } catch {
        // Network still down — push it back and abort the sync attempt.
        await queue.unshiftRequest(entry)
        // Broadcast the current queue size so the UI banner stays accurate.
        await _broadcastQueueSize(queue)
        throw new Error('Sync aborted: network still unavailable')
      }
      entry = await queue.shiftRequest()
    }
    // All requests replayed successfully — notify clients.
    await _broadcastQueueSize(queue)
  },
})

// Helper: reads the queue size and posts it to all open window clients.
// Queue.size() is O(1) — it queries the IDB count without draining the queue.
async function _broadcastQueueSize(queue: Queue): Promise<void> {
  const count = await queue.size()
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_QUEUE_UPDATE', count })
  }
}

// Route: POST / PATCH / PUT / DELETE to /api/* — NetworkOnly + BackgroundSync fallback.
// Excludes plan-generation and replan paths which must never be auto-retried.
//
// Workbox's registerRoute(captureFn, handler, method) matches only the specified
// HTTP method. We register four separate routes — one per verb — sharing the
// same capture logic and plugin instance.

function _isMutableApiRoute({ url }: { request: Request; url: URL }): boolean {
  if (!url.pathname.startsWith('/api/')) return false
  // Exclude plan generation / replan: they are not idempotent.
  if (url.pathname.includes('/generate') || url.pathname.includes('/replan')) return false
  return true
}

const _networkOnlyWithBgSync = new NetworkOnly({
  plugins: [bgSyncPlugin],
})

registerRoute(_isMutableApiRoute, _networkOnlyWithBgSync, 'POST')
registerRoute(_isMutableApiRoute, _networkOnlyWithBgSync, 'PATCH')
registerRoute(_isMutableApiRoute, _networkOnlyWithBgSync, 'PUT')
registerRoute(_isMutableApiRoute, _networkOnlyWithBgSync, 'DELETE')

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

// ── Kitchen timer notifications (KALMIO-408) ──────────────────────────────────
// Called from the main thread via postMessage when a timer boundary fires and
// the tab is backgrounded. Uses the existing SW registration so the notification
// appears even when the app is not in focus.
//
// NOTE: Does NOT intercept notificationclick for these timer alerts; they are
// informational only and dismissed by tapping.

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string; title?: string; body?: string } | null
  if (data?.type === 'SHOW_TIMER_NOTIFICATION') {
    const title = data.title ?? 'Kalmio'
    const body  = data.body  ?? ''
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: 'kalmio-timer',
      }),
    )
  }
})

