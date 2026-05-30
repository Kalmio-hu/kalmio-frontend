/**
 * GuestFoundingMemberSuccess — public return page after a guest Barion checkout.
 *
 * Mounted at /founding-member/success (PUBLIC). Barion redirects the buyer here after
 * the hosted payment page completes. The buyer still has no account at this point.
 *
 * Strategy:
 *   - Read the paymentId stashed in sessionStorage before the Barion redirect.
 *   - Poll GET /api/founding-member/guest-payment-status until it reports SUCCEEDED
 *     (the server-to-server webhook may land a moment after the browser redirect).
 *   - On SUCCEEDED: prompt the buyer to create an account. The CTA routes through
 *     /auth with a `next` that lands on /founding-member/claim?paymentId=… so the
 *     payment is claimed immediately after registration.
 *   - If the buyer is already logged in, skip auth and go straight to the claim page.
 *   - On FAILED / missing paymentId / timeout: show a recovery message.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { useAuthStore } from '@/store/auth'
import { PENDING_FM_PAYMENT_KEY } from '@/pages/GuestFoundingMember'

const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 45_000

export function GuestFoundingMemberSuccess() {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)

  // Read once on mount — the value persists across the Barion round-trip.
  const paymentId = useMemo(() => sessionStorage.getItem(PENDING_FM_PAYMENT_KEY), [])
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  const statusQuery = useQuery({
    queryKey: ['founding-member', 'guest-status', paymentId],
    queryFn: () => foundingMemberService.getGuestPaymentStatus(paymentId as string),
    enabled: !!paymentId,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'SUCCEEDED' || status === 'FAILED') return false
      if (!isPolling) return false
      return POLL_INTERVAL_MS
    },
  })

  const status = statusQuery.data?.status
  const isConfirmed = status === 'SUCCEEDED'
  const isFailed = status === 'FAILED'
  // 404 means we have no record of this payment (e.g. stale/forged id).
  const isUnknown = statusQuery.isError || !paymentId

  // Once confirmed, build the onward link. Logged-in buyers skip auth.
  const claimPath = `/founding-member/claim?paymentId=${encodeURIComponent(paymentId ?? '')}`
  const onwardTarget = session
    ? claimPath
    : `/auth?next=${encodeURIComponent(claimPath)}`

  function renderBody() {
    if (isUnknown) {
      return (
        <>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t('guestFoundingMemberSuccess.unknown')}
          </p>
          <Link
            to="/founding-member"
            className="inline-flex items-center justify-center text-sm font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
          >
            {t('guestFoundingMemberSuccess.backToOffer')}
          </Link>
        </>
      )
    }

    if (isFailed) {
      return (
        <>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t('guestFoundingMemberSuccess.failed')}
          </p>
          <Link
            to="/founding-member"
            className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
          >
            {t('guestFoundingMemberSuccess.tryAgain')}
          </Link>
        </>
      )
    }

    if (isConfirmed) {
      return (
        <>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            {t('guestFoundingMemberSuccess.confirmed')}
          </p>
          <Link
            to={onwardTarget}
            className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
          >
            {session
              ? t('guestFoundingMemberSuccess.activateCta')
              : t('guestFoundingMemberSuccess.createAccountCta')}
          </Link>
        </>
      )
    }

    // Still polling, or polling window elapsed without settlement.
    if (isPolling) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#F28C28]" size={32} />
          <p className="text-white/70 text-base leading-relaxed">
            {t('guestFoundingMemberSuccess.verifying')}
          </p>
        </div>
      )
    }

    return (
      <>
        <p className="text-white/70 text-base leading-relaxed mb-8">
          {t('guestFoundingMemberSuccess.slow')}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsPolling(true)
            setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
            statusQuery.refetch()
          }}
          className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
        >
          {t('guestFoundingMemberSuccess.refresh')}
        </button>
      </>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
      <section className="max-w-md w-full text-center">
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
          {t('foundingMember.buy.label')}
        </p>
        <h1 className="text-3xl font-semibold text-white mb-6">
          {isConfirmed
            ? t('guestFoundingMemberSuccess.confirmedTitle')
            : t('guestFoundingMemberSuccess.title')}
        </h1>
        {renderBody()}
      </section>
    </main>
  )
}
