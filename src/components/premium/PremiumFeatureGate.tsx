/**
 * PremiumFeatureGate — W14 / Founding Member tier
 *
 * AND-gates two independent layers of feature-flag control:
 *
 *  1. **Build-time kill switch** — `VITE_PREMIUM_ENABLED`.
 *     A static, deploy-time env var. When `false`, the entire premium-purchase funnel
 *     is hidden — the buy page, success page, and any CTAs into them render the
 *     fallback. This is the production safety net: it keeps the funnel invisible to
 *     end users in environments where commerce is not ready, regardless of any
 *     runtime configuration.
 *
 *  2. **Runtime per-user flag** — PostHog `premium_enabled` via {@link useFeatureFlag}.
 *     Evaluated per-user with PostHog targeting rules (allow-lists, cohorts, percentage
 *     rollouts). Use this for staged launches within a deployed environment.
 *
 *     Manual QA override (no PostHog account needed):
 *       ?__posthog_feature_flag_override__premium_enabled=true
 *
 * Both layers must resolve to `true` for {@code children} to render. Otherwise the
 * gate renders {@code fallback} (default: nothing).
 *
 * @example
 * ```tsx
 * <PremiumFeatureGate>
 *   <FoundingMemberBuyPage />
 * </PremiumFeatureGate>
 * ```
 */

import type { ReactNode } from 'react'
import { useIsPremiumFeatureEnabled } from './useIsPremiumFeatureEnabled'

interface PremiumFeatureGateProps {
  children: ReactNode
  fallback?: ReactNode
}

export function PremiumFeatureGate({
  children,
  fallback = null,
}: PremiumFeatureGateProps) {
  const enabled = useIsPremiumFeatureEnabled()

  if (!enabled) return <>{fallback}</>
  return <>{children}</>
}
