/**
 * OnboardingGate — KALMIO-45, space-aware since Kalmio Move (D8 rule 6).
 *
 * React Router layout route that sends first-time nutrition users to the
 * onboarding flow and routes members between the two spaces. The decision
 * itself is the pure `decideGate` in ./onboardingGate.rules.ts (tested in
 * OnboardingGate.test.ts); this component only gathers its inputs:
 *
 *   - `['users','me']` for meal / dietary preferences (shared query, usually warm)
 *   - `useMoveStatus()` for the Move gate, active spaces and the last space
 *     (GET /api/move/status, 60 s stale, defaults to "off" on any error)
 *   - the per-user local done-flag (completion or skip on this device)
 *
 * Rules, in order: /app/move/* always passes; /app → /app/move when Move is
 * active and is the last-used or the only active space; a Move-only member is
 * never sent to nutrition onboarding; otherwise no preferences + no local flag
 * → /app/onboarding (except /app/profile and /app/settings — KALMIO-414).
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { useInvestorPreview } from '@/lib/investorPreview'
import { useMoveStatus } from '@/features/move'
import { decideGate } from './onboardingGate.rules'

export function OnboardingGate() {
  const location = useLocation()
  const userId = useAuthStore((s) => s.user?.id ?? '')
  const { isValid: isInvestorPreview } = useInvestorPreview()
  const { status: move, isLoading: moveLoading } = useMoveStatus()

  const { data: user, isLoading } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
    enabled: !!userId,
  })

  // Spinner while user data (and the one status call) load on first visit.
  // Skipped under investor preview — the page doesn't need user data.
  if (((isLoading && !user) || moveLoading) && !isInvestorPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <Loader2 className="animate-spin text-[#F28C28]" size={32} />
      </div>
    )
  }

  const decision = decideGate({
    pathname: location.pathname,
    userId,
    prefs: user
      ? { mealPlanPreferences: user.mealPlanPreferences, dietaryPreferences: user.dietaryPreferences }
      : undefined,
    move,
    isInvestorPreview,
  })

  if (decision.action === 'redirect') {
    // Preserve the intended destination so the flow can return there.
    return <Navigate to={decision.to} replace state={{ from: location }} />
  }

  return <Outlet />
}
