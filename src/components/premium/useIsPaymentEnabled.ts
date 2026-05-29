/**
 * useIsPaymentEnabled — gates the payment / purchase funnel independently of
 * premium feature access.
 *
 * AND-gates a build-time kill switch (`VITE_PAYMENT_ENABLED`) with the runtime
 * PostHog `payment_enabled` feature flag. Both must be on to return `true`.
 *
 * Intentionally separate from `useIsPremiumFeatureEnabled` so that:
 *  - The purchase funnel can be closed (stop selling) without affecting users who
 *    already have premium access.
 *  - The purchase funnel can be opened to a subset of users independently of
 *    premium feature surfacing.
 *
 * Dev/QA escape hatch: append `?payment=1` to any URL to force the gate on for
 * the current page load (dev mode only).
 */

import { useFeatureFlag } from '@/lib/featureFlags'
import { useInvestorPreview } from '@/lib/investorPreview'

const BUILD_TIME_ENABLED = import.meta.env.VITE_PAYMENT_ENABLED === 'true'

function hasDevUrlOverride(): boolean {
  if (!import.meta.env.DEV) return false
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('payment') === '1'
}

export function useIsPaymentEnabled(): boolean {
  const runtimeEnabled = useFeatureFlag('payment_enabled')
  const { isValid: isInvestorPreview, isLoading: isVerifyingToken } = useInvestorPreview()
  if (hasDevUrlOverride()) return true
  if (isInvestorPreview) return true
  // Return false while the token is being verified to avoid a flash of the
  // "coming soon" fallback that would immediately flip to the buy page.
  if (isVerifyingToken) return false
  return BUILD_TIME_ENABLED && Boolean(runtimeEnabled)
}
