/**
 * useIsPremiumFeatureEnabled — paired with {@link ./PremiumFeatureGate}.
 *
 * AND-gates a build-time kill switch (`VITE_PREMIUM_ENABLED`) with the runtime
 * PostHog `premium_enabled` feature flag. Both must be on to return `true`.
 *
 * Lives in its own file so the gate component stays fast-refresh-friendly.
 *
 * @example
 *   const showPremiumLink = useIsPremiumFeatureEnabled()
 *   {showPremiumLink && <NavLink to="/app/founding-member">Premium</NavLink>}
 */

import { useFeatureFlag } from '@/lib/featureFlags'

const BUILD_TIME_ENABLED = import.meta.env.VITE_PREMIUM_ENABLED === 'true'

/**
 * Dev/QA escape hatch: append `?premium=1` to any URL to force the premium gate
 * on for the current page load. Only honoured in dev mode so it can never leak
 * into a production build. Safer than relying on PostHog's URL-param override,
 * which silently no-ops if consent has not been granted on the current session.
 */
function hasDevUrlOverride(): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('premium') === '1'
}

export function useIsPremiumFeatureEnabled(): boolean {
  const runtimeEnabled = useFeatureFlag('premium_enabled')
  if (hasDevUrlOverride()) return true
  return BUILD_TIME_ENABLED && Boolean(runtimeEnabled)
}
