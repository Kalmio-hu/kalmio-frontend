/**
 * useIsUserPremium — KALMIO-288
 *
 * Returns true when the currently authenticated user has an active premium
 * entitlement (admin flag, Founding Member purchase, or active taster grant).
 *
 * Source: `isPremium` on the `UserSettings` DTO from `GET /api/users/me`.
 * This is the composed field — never combine the raw sub-fields client-side.
 *
 * Distinct from {@link useIsPremiumFeatureEnabled}, which gates the commerce
 * *funnel* (the buy page, Stripe flow) behind build-time + PostHog flags.
 * This hook answers the question "does this user have premium right now?"
 * regardless of whether the purchase funnel is open.
 *
 * Defaults to `false` while the query is loading so UI starts in the locked
 * state; flips to `true` once the server confirms premium.
 *
 * @example
 *   const isPremium = useIsUserPremium()
 *   {!isPremium && <LockedBadge />}
 */

import { useQuery } from '@tanstack/react-query'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'

export function useIsUserPremium(): boolean {
  const { data } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
    retry: 1,
  })

  return data?.isPremium ?? false
}
