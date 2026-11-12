/**
 * PremiumSuccess — return page after a Barion subscription payment (/app/premium/success).
 *
 * Barion redirects here after the hosted gateway, appending `paymentId` to the redirect URL we
 * sent (`?plan=MONTHLY|YEARLY[&kind=overdue]`). The page polls
 * GET /api/subscription/payments/{paymentId}/status (a PENDING read re-checks Barion server-side)
 * until it settles, then refreshes the user and the subscription.
 *
 * Barion Pixel: `purchase` once per paymentId on the outcome, with step -1 on failure.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { subscriptionService, SUBSCRIPTION_QUERY_KEY } from '@/services/subscription'
import { billingService, BILLING_PLANS_QUERY_KEY } from '@/services/billing'
import { USERS_ME_QUERY_KEY } from '@/services/users'
import { isPlanCode, planPixelProduct } from '@/lib/billingProducts'
import { purchase } from '@/lib/barionPixel'

const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 60_000
const TRACKED_PREFIX = 'kalmio-pixel-purchase-'

function alreadyTracked(paymentId: string): boolean {
  try {
    return sessionStorage.getItem(TRACKED_PREFIX + paymentId) === '1'
  } catch {
    return false
  }
}

function markTracked(paymentId: string): void {
  try {
    sessionStorage.setItem(TRACKED_PREFIX + paymentId, '1')
  } catch {
    // ignore
  }
}

export function PremiumSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const paymentId = params.get('paymentId') ?? params.get('PaymentId')
  const planParam = params.get('plan')
  const plan = isPlanCode(planParam) ? planParam : null
  const isOverdue = params.get('kind') === 'overdue'

  const [isPolling, setIsPolling] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  const plans = useQuery({ queryKey: BILLING_PLANS_QUERY_KEY, queryFn: billingService.getPlans, staleTime: 60_000 })

  const statusQuery = useQuery({
    queryKey: ['subscription', 'payment-status', paymentId],
    queryFn: () => subscriptionService.getPaymentStatus(paymentId as string),
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
  const isSucceeded = status === 'SUCCEEDED'
  const isFailed = status === 'FAILED'

  // Refresh premium state and fire the pixel exactly once per outcome.
  const handledRef = useRef(false)
  useEffect(() => {
    if (handledRef.current || !paymentId || (!isSucceeded && !isFailed)) return
    handledRef.current = true
    if (isSucceeded) {
      void queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY })
    }
    if (plan && !alreadyTracked(paymentId)) {
      markTracked(paymentId)
      const price = plans.data?.plans.find((p) => p.code === plan)?.priceHuf
      purchase([planPixelProduct(plan, price)], { failed: isFailed })
    }
  }, [paymentId, isSucceeded, isFailed, plan, plans.data, queryClient])

  function retryPolling() {
    setIsPolling(true)
    setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
    void statusQuery.refetch()
  }

  const primaryBtn =
    'inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors'
  const secondaryLink =
    'inline-flex items-center justify-center text-sm font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-4'

  function renderBody() {
    if (!paymentId || statusQuery.isError) {
      return (
        <>
          <p className="text-white/70 text-base leading-relaxed mb-8">{t('premiumSuccess.unknown')}</p>
          <Link to="/app/settings#subscription" className={secondaryLink}>
            {t('premiumSuccess.toSettings')}
          </Link>
        </>
      )
    }
    if (isSucceeded) {
      return (
        <>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            {isOverdue ? t('premiumSuccess.overdueSucceeded') : t('premiumSuccess.succeeded')}
          </p>
          <button type="button" onClick={() => navigate('/app')} className={primaryBtn}>
            {t('premiumSuccess.toApp')}
          </button>
        </>
      )
    }
    if (isFailed) {
      return (
        <>
          <p className="text-white/70 text-base leading-relaxed mb-8">{t('premiumSuccess.failed')}</p>
          <Link to={isOverdue ? '/app/settings#subscription' : '/app/premium'} className={primaryBtn}>
            {t('premiumSuccess.tryAgain')}
          </Link>
        </>
      )
    }
    if (isPolling) {
      return (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#F28C28]" size={32} />
          <p className="text-white/70 text-base leading-relaxed">{t('premiumSuccess.verifying')}</p>
        </div>
      )
    }
    return (
      <>
        <p className="text-white/70 text-base leading-relaxed mb-8">{t('premiumSuccess.slow')}</p>
        <button type="button" onClick={retryPolling} className={primaryBtn}>
          {t('premiumSuccess.refresh')}
        </button>
      </>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
      <section className="max-w-md w-full text-center">
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">{t('premiumPage.label')}</p>
        <h1 className="text-3xl font-semibold text-white mb-6">
          {isSucceeded ? t('premiumSuccess.succeededTitle') : isFailed ? t('premiumSuccess.failedTitle') : t('premiumSuccess.title')}
        </h1>
        {renderBody()}
      </section>
    </main>
  )
}
