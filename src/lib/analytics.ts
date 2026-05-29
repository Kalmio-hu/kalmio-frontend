import posthog from 'posthog-js'
import type { DietaryConstraints } from '@/types'
import type { UserMealPreferences } from '@/services/users'

const CONSENT_KEY = 'kalmio-analytics-consent'
const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

export type Consent = 'accepted' | 'declined'

export function getConsent(): Consent | null {
  return localStorage.getItem(CONSENT_KEY) as Consent | null
}

/** Returns true when PostHog is initialised and the user has consented. */
function isReady(): boolean {
  return !!PH_KEY && getConsent() === 'accepted' && !!posthog.__loaded
}

export function initAnalytics(): void {
  if (!PH_KEY || getConsent() !== 'accepted') return
  if (posthog.__loaded) return
  posthog.init(PH_KEY, {
    api_host: PH_HOST,
    persistence: 'localStorage+cookie',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
  })
}

export function acceptAnalytics(): void {
  localStorage.setItem(CONSENT_KEY, 'accepted')
  initAnalytics()
}

export function declineAnalytics(): void {
  localStorage.setItem(CONSENT_KEY, 'declined')
  if (posthog.__loaded) posthog.opt_out_capturing()
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!isReady()) return
  posthog.capture(event, props)
}

export function identify(userId: string): void {
  if (!isReady()) return
  posthog.identify(userId)
}

/**
 * Alias the current anonymous ID to a known user ID.
 * Call this once on signup completion, before `identify()`.
 */
export function alias(userId: string): void {
  if (!isReady()) return
  // posthog.alias merges the anonymous session into the user profile.
  posthog.alias(userId)
}

/**
 * Reset PostHog identity — call on logout so the next session starts
 * as a fresh anonymous user and does not inherit the previous identity.
 */
export function resetIdentity(): void {
  if (!posthog.__loaded) return
  // Do not call posthog.reset() — it generates a new anonymous ID on every logout,
  // breaking flag targeting by distinct_id. The next identify() call on login is
  // sufficient to switch to the correct user.
  posthog.unregister('test_source')
  posthog.unregister('isAdmin')
}

/**
 * Register sticky super-properties that are sent with every subsequent event
 * for the duration of the browser session (uses sessionStorage via PostHog).
 */
export function registerSuperProperties(props: Record<string, unknown>): void {
  if (!isReady()) return
  posthog.register(props)
}

/**
 * Fire a manual page_view event with routing context.
 * Use this because `capture_pageview: false` — we own all page view tracking.
 */
export function pageView(path: string, locale: string, isAuthenticated: boolean): void {
  if (!isReady()) return
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
    i18n_locale: locale,
    is_authenticated: isAuthenticated,
  })
}

export function resetConsent(): void {
  localStorage.removeItem(CONSENT_KEY)
}

// ── Cohort helpers ────────────────────────────────────────────────────────────

type HouseholdSizeBucket = '1' | '2' | '3-4' | '5+' | 'unknown'
type DietaryProfile = 'vegetarian' | 'vegan' | 'gluten-free' | 'lactose-free' | 'none'

/**
 * Derives the first matching dietary profile label from a user's dietary
 * constraints object. Priority order mirrors the AC: vegan > vegetarian >
 * gluten-free > lactose-free > none.
 */
function deriveDietaryProfile(prefs: DietaryConstraints | null | undefined): DietaryProfile {
  if (!prefs) return 'none'
  if (prefs.vegan) return 'vegan'
  if (prefs.vegetarian) return 'vegetarian'
  if (prefs.glutenFree) return 'gluten-free'
  if (prefs.lactoseFree) return 'lactose-free'
  return 'none'
}

/**
 * Derives a household-size bucket from the user's serving config.
 * `maxMultiplier` is the largest serving multiplier the user plans for,
 * which is the closest available proxy for household size.
 */
function deriveHouseholdSizeBucket(mealPrefs: UserMealPreferences | null | undefined): HouseholdSizeBucket {
  const max = mealPrefs?.servingConfig?.maxMultiplier
  if (max == null) return 'unknown'
  if (max <= 1) return '1'
  if (max <= 2) return '2'
  if (max <= 4) return '3-4'
  return '5+'
}

export interface CohortProperties {
  'cohort.signupMonth': string | null    // "YYYY-MM", null if unavailable
  'cohort.dietaryProfile': DietaryProfile
  'cohort.householdSizeBucket': HouseholdSizeBucket
  'cohort.planLengthDays': number | null
}

/**
 * Builds the cohort properties object to attach to analytics events.
 * No PII — userId is the UUID only and must be passed separately if needed.
 */
export function buildCohortProperties(opts: {
  createdAt: string | null | undefined
  dietaryPreferences: DietaryConstraints | null | undefined
  mealPlanPreferences: UserMealPreferences | null | undefined
  planLengthDays: number | null | undefined
}): CohortProperties {
  const signupMonth = opts.createdAt
    ? opts.createdAt.slice(0, 7)   // "YYYY-MM-DDTHH:..." → "YYYY-MM"
    : null

  return {
    'cohort.signupMonth': signupMonth,
    'cohort.dietaryProfile': deriveDietaryProfile(opts.dietaryPreferences),
    'cohort.householdSizeBucket': deriveHouseholdSizeBucket(opts.mealPlanPreferences),
    'cohort.planLengthDays': opts.planLengthDays ?? null,
  }
}
