/**
 * PostHog-backed feature flag helpers for the Kalmio frontend (KALMIO-176).
 *
 * All flag evaluations are gated behind analytics consent — consistent with
 * {@link ./analytics.ts}. When consent is absent or declined, flags fall back to
 * compile-time defaults (always {@code false} unless a default is declared below).
 *
 * ### Manual QA override (no PostHog account needed)
 *
 * PostHog supports a built-in URL-parameter override for local testing:
 *
 * ```
 * ?__posthog_feature_flag_override__<flag-key>=<true|false|variant-name>
 * ```
 *
 * Example — force `premium_enabled` to true for a single page load:
 * ```
 * http://localhost:5173/app/dashboard?__posthog_feature_flag_override__premium_enabled=true
 * ```
 *
 * This override is honoured by posthog-js automatically and does not require any
 * server-side setup. It is intended for manual QA only — never rely on it in tests.
 *
 * ### Server-side companion
 *
 * Backend flag evaluation lives in `FeatureFlagService.java`. The `X-Feature-Override`
 * request header mirrors this URL-param mechanism for backend-rendered logic — it is only
 * honoured for accounts where `AppUser.testSource != null`.
 */

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { getConsent } from './analytics'

// ── Compile-time defaults ─────────────────────────────────────────────────────
// Flags not present in this map default to false when PostHog is unavailable.
const FLAG_DEFAULTS: Record<string, string | boolean> = {
  // PostHog only loads after analytics consent. These flags gate paid features, so a
  // user who declines cookies (or whose flags have not loaded yet) must see the
  // build-time default rather than a permanent "coming soon". The PostHog flag stays
  // a kill switch for users who did consent; VITE_PAYMENT_ENABLED / VITE_PREMIUM_ENABLED
  // remain the build-time kill switches for everyone.
  payment_enabled: true,
  premium_enabled: true,
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Returns true when posthog-js is initialised and the user has consented to analytics.
 * Mirrors the `isReady()` check in `analytics.ts`.
 */
function isReady(): boolean {
  return getConsent() === 'accepted' && !!posthog.__loaded
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns {@code true} when the named feature flag is enabled for the current user.
 *
 * Falls back to the compile-time default (always {@code false} unless declared in
 * {@code FLAG_DEFAULTS}) when PostHog is not initialised or analytics consent has
 * not been granted.
 *
 * @param key - The PostHog feature flag key (e.g. {@code "premium_enabled"})
 */
export function isFeatureEnabled(key: string): boolean {
  if (!isReady()) {
    return Boolean(FLAG_DEFAULTS[key] ?? false)
  }
  const value = posthog.isFeatureEnabled(key)
  if (value === undefined || value === null) {
    return Boolean(FLAG_DEFAULTS[key] ?? false)
  }
  return Boolean(value)
}

/**
 * Returns the raw flag value for a feature flag key.
 *
 * For boolean flags this is {@code true} or {@code false}.
 * For multivariate flags this is the variant name string.
 * Returns {@code undefined} when the flag is unrecognised or PostHog is unavailable.
 *
 * @param key - The PostHog feature flag key
 */
export function getFeatureFlag(key: string): string | boolean | undefined {
  if (!isReady()) {
    return FLAG_DEFAULTS[key]
  }
  const value = posthog.getFeatureFlag(key)
  if (value === undefined || value === null) {
    return FLAG_DEFAULTS[key]
  }
  return value as string | boolean
}

/**
 * React hook that subscribes to feature flag updates and re-renders the component
 * when flags load or change.
 *
 * Uses {@code posthog.onFeatureFlags()} so the component receives the correct value
 * even when flags are still loading on initial mount.
 *
 * Falls back to {@code false} (or the compile-time default) while PostHog loads or
 * when analytics consent has not been granted.
 *
 * @param key - The PostHog feature flag key (e.g. {@code "premium_enabled"})
 * @returns The current value of the flag (boolean for boolean flags)
 *
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const isPremium = useFeatureFlag('premium_enabled')
 *   if (!isPremium) return null
 *   return <PremiumContent />
 * }
 * ```
 */
export function useFeatureFlag(key: string): string | boolean {
  // Lazy initializer reads the current flag value synchronously on first render.
  // This covers the case where PostHog has already loaded flags by the time the
  // component mounts (e.g. after a page refresh with cached flags).
  const [value, setValue] = useState<string | boolean>(() => getFeatureFlag(key) ?? false)

  useEffect(() => {
    if (!isReady()) {
      return
    }

    // Subscribe to flag updates. The callback fires once when flags load from
    // PostHog and again whenever flags are reloaded (e.g. after identify()).
    const unsubscribe = posthog.onFeatureFlags(() => {
      setValue(getFeatureFlag(key) ?? false)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [key])

  return value
}
