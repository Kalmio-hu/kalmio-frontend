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
import { ipVaultService } from '@/services/ipVault'

function getInvestorToken(): string | null {
  return new URLSearchParams(window.location.search).get('token')
}

export function useInvestorPreview() {
  const token = getInvestorToken()

  const { data, isLoading } = useQuery({
    queryKey: ['investor-token-verify', token],
    queryFn: () => ipVaultService.verifyToken(token!),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60_000,
  })

  return {
    isValid: !isLoading && data?.valid === true,
    isLoading: !!token && isLoading,
  }
}
