/**
 * queryClient.ts
 *
 * Creates the singleton QueryClient and the IndexedDB persister used by
 * PersistQueryClientProvider in main.tsx.
 *
 * Design decisions (KALMIO-362 — Track A, offline-PWA epic KALMIO-360):
 *
 *  - idb-keyval is used as the IndexedDB backend (single key per user, ~600 B
 *    overhead, no schema migrations required).
 *  - The IDB key is namespaced by `userId` so switching accounts never serves
 *    stale data belonging to a previous user.
 *  - `buster` is injected from VITE_BUILD_HASH (set by the CI build step) so
 *    that a fresh deploy automatically invalidates any persisted cache whose
 *    shape has changed.  Falls back to the build timestamp in dev so local
 *    reloads do not erroneously purge in-dev sessions.
 *  - maxAge is 7 days (AC requirement).
 *  - QueryClient defaults are intentionally unchanged (retry: 1, staleTime:
 *    30 s) — this file is about persistence, not fetch behaviour.
 *  - `clearPersistedCache()` is exported so auth state changes (signOut,
 *    user-id change) can call it imperatively before the old user's data can
 *    ever be visible.
 */

import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'

// ---------------------------------------------------------------------------
// Build hash — used as `buster` to invalidate caches after deploys.
// VITE_BUILD_HASH is injected by CI (e.g. `git rev-parse --short HEAD`).
// In local dev the env var is undefined so we fall back to the hour boundary
// of the current time, which is good enough for development sessions without
// causing cache churn on every hot-reload.
// ---------------------------------------------------------------------------
const buildHash: string =
  (import.meta.env.VITE_BUILD_HASH as string | undefined) ??
  `dev-${Math.floor(Date.now() / 3_600_000)}`

// ---------------------------------------------------------------------------
// Persisted-cache IDB key helpers
// ---------------------------------------------------------------------------

/** IDB store key for a given user. Scoped so accounts never bleed. */
export function cacheKeyForUser(userId: string): string {
  return `kalmio-qc-${userId}`
}

/** The key used while no user is authenticated — anonymous / pre-login. */
const ANONYMOUS_CACHE_KEY = 'kalmio-qc-anon'

/**
 * Clears the persisted cache for the given userId (or the anonymous cache if
 * no userId is provided).  Idempotent — safe to call even if nothing is stored.
 */
export async function clearPersistedCache(userId?: string | null): Promise<void> {
  const key = userId ? cacheKeyForUser(userId) : ANONYMOUS_CACHE_KEY
  try {
    await del(key)
  } catch {
    // IDB may be unavailable in some private-browsing modes — fail silently.
  }
}

// ---------------------------------------------------------------------------
// Async storage adapter backed by idb-keyval
// ---------------------------------------------------------------------------

/**
 * Builds an async-storage adapter for the given IDB key.
 * PersistQueryClientProvider calls this once at mount with the resolved key.
 */
function buildStorage(idbKey: string) {
  return {
    getItem: (key: string) => get<string>(key === 'REACT_QUERY_OFFLINE_CACHE' ? idbKey : key),
    setItem: (key: string, value: string) =>
      set(key === 'REACT_QUERY_OFFLINE_CACHE' ? idbKey : key, value),
    removeItem: (key: string) => del(key === 'REACT_QUERY_OFFLINE_CACHE' ? idbKey : key),
  }
}

// ---------------------------------------------------------------------------
// QueryClient singleton
// ---------------------------------------------------------------------------

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

// ---------------------------------------------------------------------------
// Persister factory
// ---------------------------------------------------------------------------

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000 // 7 days

/**
 * Creates an async-storage persister scoped to the given userId.
 * Called from main.tsx whenever the authenticated userId changes.
 *
 * @param userId  Authenticated user's UUID, or null/undefined for the
 *                anonymous cache bucket.
 */
export function createUserPersister(userId?: string | null) {
  const idbKey = userId ? cacheKeyForUser(userId) : ANONYMOUS_CACHE_KEY

  return createAsyncStoragePersister({
    storage: buildStorage(idbKey),
    key: 'REACT_QUERY_OFFLINE_CACHE',
    // Throttle writes so rapid query invalidations don't hammer IDB.
    throttleTime: 1_000,
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  })
}

/**
 * The `persistOptions` object passed to `PersistQueryClientProvider`.
 * Re-create this (by calling the factory again) whenever the userId changes.
 */
export function buildPersistOptions(userId?: string | null) {
  return {
    persister: createUserPersister(userId),
    maxAge: MAX_AGE_MS,
    buster: buildHash,
  }
}
