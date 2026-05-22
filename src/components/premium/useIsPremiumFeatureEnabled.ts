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

export function useIsPremiumFeatureEnabled(): boolean {
  const runtimeEnabled = useFeatureFlag('premium_enabled')
  return BUILD_TIME_ENABLED && Boolean(runtimeEnabled)
}
