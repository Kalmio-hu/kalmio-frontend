/**
 * GuestFoundingMemberClaim — binds a settled guest payment to a freshly-created account.
 *
 * Mounted at /founding-member/claim?paymentId=… (PROTECTED, but OUTSIDE OnboardingGate so a
 * brand-new user isn't bounced into onboarding before their membership is granted).
 *
 * Reached right after registration/login in the guest-first flow. On mount it calls
 * POST /api/founding-member/claim exactly once. On success it refreshes the user and sends
 * them into the app, where OnboardingGate then runs the normal onboarding flow.
 *
 *   200 → membership granted; clear the stashed paymentId, go to /app.
 *   404 → no unclaimed payment for this id (already claimed, or unknown) → recovery copy.
 *   409 → payment not settled yet, or slots exhausted → recovery copy with retry.
 */

import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { USERS_ME_QUERY_KEY } from '@/services/users'
import { PENDING_FM_PAYMENT_KEY } from '@/pages/GuestFoundingMember'

export function GuestFoundingMemberClaim() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const paymentId = params.get('paymentId')
  const firedRef = useRef(false)

  const claim = useMutation({
    mutationFn: (id: string) => foundingMemberService.claimPayment(id),
    onSuccess: async () => {
      sessionStorage.removeItem(PENDING_FM_PAYMENT_KEY)
      await queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      navigate('/app', { replace: true })
    },
  })

  // Fire exactly once on mount when a paymentId is present.
  useEffect(() => {
    if (firedRef.current) return
    if (!paymentId) return
    firedRef.current = true
    claim.mutate(paymentId)
  }, [paymentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // No paymentId → nothing to claim.
  if (!paymentId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
        <section className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">
            {t('guestFoundingMemberClaim.error.title')}
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t('guestFoundingMemberClaim.error.missing')}
          </p>
          <Link
            to="/app"
            className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
          >
            {t('guestFoundingMemberClaim.error.toApp')}
          </Link>
        </section>
      </main>
    )
  }

  if (claim.isError) {
    const status = (claim.error as { response?: { status?: number } })?.response?.status
    const messageKey = status === 409 ? 'notSettled' : 'notFound'
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
        <section className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">
            {t('guestFoundingMemberClaim.error.title')}
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t(`guestFoundingMemberClaim.error.${messageKey}`)}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => claim.mutate(paymentId)}
              className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
            >
              {t('guestFoundingMemberClaim.error.retry')}
            </button>
            <Link
              to="/app"
              className="inline-flex items-center justify-center text-sm font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              {t('guestFoundingMemberClaim.error.toApp')}
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // Pending / settling.
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 py-16 bg-[#111]">
      <Loader2 className="animate-spin text-[#F28C28]" size={36} />
      <p className="text-white/70 text-base">{t('guestFoundingMemberClaim.activating')}</p>
    </main>
  )
}
