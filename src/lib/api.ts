import axios from 'axios'
import { supabase } from './supabase'
import { useAuthStore, waitForAuthInit } from '@/store/auth'
import { buildSessionFromAccessToken, persistPasskeyToken } from './passkeySession'
import { toast } from '@/components/ui/toast'
import i18n from '../i18n'

const BASE = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL: BASE,
})

api.interceptors.request.use(async (config) => {
  // Tell the backend which UI language the caller is using so AI-generated copy
  // (off-plan meal names etc.) matches the user's locale. i18next normalises this
  // to a BCP-47 tag like "hu" or "en"; the backend treats "hu*" as Hungarian and
  // everything else as English.
  const lang = i18n.language || i18n.resolvedLanguage
  if (lang) {
    config.headers['Accept-Language'] = lang
  }

  // Impersonation token takes priority over all other auth paths.
  // Impersonation is set synchronously so no init wait is needed.
  const impersonationToken = useAuthStore.getState().impersonationToken
  if (impersonationToken) {
    config.headers.Authorization = `Bearer ${impersonationToken}`
    return config
  }

  // Block until the auth store has finished its initial hydration from
  // Supabase. Without this gate, requests that fire in the first ~200 ms
  // (before the INITIAL_SESSION event resolves) would call getSession()
  // while Supabase's internal cache is still empty, get null back, and
  // send the request without a Bearer token — causing 500s on the backend.
  await waitForAuthInit()

  // Try Supabase session first (magic link / OAuth flows)
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
    // Fall back to Zustand store for passkey-issued JWTs
    ?? useAuthStore.getState().session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: expired-session redirect ────────────────────────────
//
// When a 401 comes back the session token has expired. We:
//   1. Capture the current pathname + search so we can return the user there
//      after they re-authenticate.
//   2. Sign out from Supabase (clears the cached session) and clear Zustand.
//   3. Redirect to /auth with `returnTo` (the original path, URL-encoded) and
//      `expired=1` (signals the auth page to show the expired-session notice).
//
// Guard: if we are already on /auth we skip to avoid an infinite redirect loop.
// Guard: if the request URL itself is a Supabase auth endpoint we skip — those
//        401s are expected (e.g. refreshing an already-invalid token).
let _isHandling401 = false

/**
 * Core logic for handling a 401 Unauthorized response.
 *
 * Extracted from the Axios response interceptor so it can be unit-tested
 * independently of the interceptor wiring. Returns `true` if the handler ran,
 * `false` if it was skipped (already handling / on /auth page).
 *
 * @internal — exported for testing only; do not call from application code.
 */
export async function _handle401(): Promise<boolean> {
  if (_isHandling401 || window.location.pathname.startsWith('/auth')) {
    return false
  }

  _isHandling401 = true
  try {
    // Capture whether a session was active before we tear it down.
    // We check Zustand synchronously; Supabase getSession is async and
    // we want to fire the toast before the await that clears state.
    const hadSession =
      useAuthStore.getState().session !== null ||
      useAuthStore.getState().impersonationToken !== null

    // Sign out without triggering onAuthStateChange navigation.
    await supabase.auth.signOut()
    useAuthStore.getState().setSession(null)

    const returnTo = encodeURIComponent(
      window.location.pathname + window.location.search,
    )

    if (hadSession) {
      toast({
        title: i18n.t('auth.errors.sessionExpired'),
        variant: 'destructive',
        duration: 4000,
      })
      // Brief pause so the toast is visible before the page unloads.
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    window.location.replace(`/auth?returnTo=${returnTo}&expired=1`)
    return true
  } finally {
    // Reset after a short delay so that any in-flight requests that
    // resolve before the page unloads do not trigger duplicate redirects.
    setTimeout(() => { _isHandling401 = false }, 2000)
  }
}

/**
 * Resets the `_isHandling401` flag immediately.
 *
 * @internal — exported for testing only; do not call from application code.
 */
export function _resetHandling401(): void {
  _isHandling401 = false
}

// ── Sliding-refresh: swap in fresh passkey JWT when backend sends one ────────
//
// The backend (`JwtSlidingRefreshFilter`) attaches `X-Refresh-Token` to
// responses whenever the bearer's expiry is within 15 minutes. We swap it into
// local storage + Zustand so the next request uses the fresh token. The user
// never notices.
function _consumeRefreshHeader(headers: unknown): void {
  if (!headers || typeof headers !== 'object') return
  const raw = (headers as Record<string, unknown>)['x-refresh-token']
    ?? (headers as Record<string, unknown>)['X-Refresh-Token']
  if (typeof raw !== 'string' || raw.length === 0) return
  try {
    const session = buildSessionFromAccessToken(raw)
    persistPasskeyToken(raw)
    useAuthStore.getState().updateSession(session)
  } catch {
    // Malformed token — ignore; the next 401 (if any) will trigger sign-out.
  }
}

api.interceptors.response.use(
  (response) => {
    _consumeRefreshHeader(response.headers)
    return response
  },
  async (error) => {
    const status = error?.response?.status

    if (status === 401) {
      await _handle401()
    }

    return Promise.reject(error)
  },
)
