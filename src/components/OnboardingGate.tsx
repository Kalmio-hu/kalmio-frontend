/**
 * OnboardingGate — KALMIO-45
 *
 * React Router layout route that redirects first-time users to the onboarding
 * flow before they can access the main app. Pass-through for returning users.
 *
 * Usage in App.tsx (layout route pattern, same as ProtectedRoute / AdminRoute):
 *
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/app/onboarding" element={<OnboardingShell />} />
 *     <Route element={<OnboardingGate />}>   ← wraps all post-onboarding routes
 *       <Route path="/app" element={<AppShell />}>…</Route>
 *     </Route>
 *   </Route>
 *
 * A user is considered "new" (needs onboarding) when ALL of these are true:
 *   1. The user has no `mealPlanPreferences` on the server (null).
 *   2. The user has no `dietaryPreferences` on the server (null).
 *   3. The local "onboarding done" flag is not set in localStorage.
 *
 * Condition 3 catches two cases:
 *   a. The user already completed onboarding on this device.
 *   b. The user explicitly skipped onboarding (OnboardingShell writes the
 *      flag on both completion and skip — see writeOnboardingDone).
 *
 * The server-side conditions (1 + 2) act as a cross-device safety net: if the
 * user completes onboarding on device A and signs in on device B where the
 * localStorage flag is absent, they are not re-onboarded because preferences
 * already exist on the server.
 *
 * The gate is intentionally lightweight:
 *   - Reuses the `['users', 'me']` TanStack Query — already fetched by most
 *     authenticated pages, so there is normally no extra network request.
 *   - Renders a full-screen spinner while the query is pending.
 *   - Preserves the intended destination in location state so the flow can
 *     redirect back after completion (future enhancement).
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { readOnboardingDone } from '@/hooks/useOnboardingProgress'

export function OnboardingGate() {
  const location = useLocation()
  const userId = useAuthStore((s) => s.user?.id ?? '')

  const { data: user, isLoading } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
    enabled: !!userId,
  })

  // Show a spinner while we wait for user data on first load.
  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <Loader2 className="animate-spin text-[#F28C28]" size={32} />
      </div>
    )
  }

  // Determine whether this user needs onboarding.
  const doneLocally = userId ? readOnboardingDone(userId) : false
  const hasPreferences = !!(user?.mealPlanPreferences || user?.dietaryPreferences)
  const needsOnboarding = !doneLocally && !hasPreferences

  // KALMIO-414: paths the gate should let through even mid-onboarding, so the
  // body-data CTA on onboarding step 3 doesn't dead-end the user back into
  // the same flow they came from. /app/profile is the destination for the
  // "Testadatok megadása" link; /app/settings hosts language/passkey controls.
  const ALWAYS_ALLOWED = ['/app/profile', '/app/settings']
  const isAllowed = ALWAYS_ALLOWED.some((p) => location.pathname.startsWith(p))

  if (needsOnboarding && !isAllowed) {
    // Preserve the intended destination so we can return there after onboarding
    // completes (wired in OnboardingShell when navigate('/app') is called).
    return (
      <Navigate
        to="/app/onboarding"
        replace
        state={{ from: location }}
      />
    )
  }

  // User has completed or skipped onboarding — render the requested route.
  return <Outlet />
}
