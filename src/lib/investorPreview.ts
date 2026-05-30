/**
 * useInvestorPreview — detects a valid investor vault token in the current URL
 * and signals that auth + feature-flag gates should be bypassed.
 *
 * Used by:
 *   - ProtectedRoute  — skips session check when token is valid
 *   - OnboardingGate  — skips onboarding redirect when token is valid
 *   - useIsPaymentEnabled — forces payment funnel open when token is valid
 *
 * The token is validated server-side via /api/ip-vault/public/verify (same
 * endpoint used by /vault, /valuation, /timeline). TanStack Query caches the
 * result so all three consumers share a single network request per page load.
 */

import { useQuery } from '@tanstack/react-query'

function getInvestorToken(): string | null {
  return new URLSearchParams(window.location.search).get('token')
}

const BASE = import.meta.env.VITE_API_URL ?? ''

// Use fetch directly — bypasses the Axios auth interceptor (waitForAuthInit)
// which would deadlock: the verify call is what lets ProtectedRoute render, so
// it cannot block on the very auth state it is trying to bootstrap.
async function verifyTokenDirect(token: string): Promise<{ valid: boolean }> {
  const res = await fetch(`${BASE}/api/ip-vault/public/verify?token=${encodeURIComponent(token)}`)
  if (!res.ok) return { valid: false }
  return res.json()
}

export function useInvestorPreview() {
  const token = getInvestorToken()

  const { data, isPending } = useQuery({
    queryKey: ['investor-token-verify', token],
    queryFn: () => verifyTokenDirect(token!),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 0,  // never persist to IDB — token validity must be re-checked on every page load
  })

  // isPending = status === 'pending' (no data yet, regardless of whether the
  // fetch has actually started). isLoading = isPending && isFetching misses the
  // very first render where fetchStatus is still 'idle' — causing ProtectedRoute
  // to see isVerifyingToken=false before the HTTP request has gone out.
  return {
    isValid: data?.valid === true,
    isLoading: !!token && isPending,
  }
}
