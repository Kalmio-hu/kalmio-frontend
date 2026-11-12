/**
 * Settings card: the Kalmio Prémium subscription (docs/product/payments-subscriptions.md §1).
 *
 * Plan, status, next charge or end date, the registered card, cancel (inline confirm), resume,
 * "pay the overdue period with another card" while PAST_DUE, and the payment history with
 * invoice links. Hidden for lifetime members who never subscribed.
 */

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CreditCard, ExternalLink, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { subscriptionService, SUBSCRIPTION_QUERY_KEY } from '@/services/subscription'
import { USERS_ME_QUERY_KEY } from '@/services/users'
import { formatLocalDate } from '@/lib/utils'
import { formatCard, graceEnd, isResumable, planPixelProduct, subscriptionReturnUrl } from '@/lib/billingProducts'
import { initiatePurchase } from '@/lib/barionPixel'
import type { SubscriptionDto, SubscriptionPaymentStatus, SubscriptionStatus } from '@/types'

const STATUS_BADGE: Record<SubscriptionStatus, 'green' | 'amber' | 'gray' | 'red'> = {
  PENDING: 'gray',
  ACTIVE: 'green',
  PAST_DUE: 'amber',
  CANCELLED: 'gray',
  EXPIRED: 'gray',
  FAILED: 'red',
}

const PAYMENT_BADGE: Record<SubscriptionPaymentStatus, 'green' | 'amber' | 'gray' | 'red'> = {
  PENDING: 'gray',
  SUCCEEDED: 'green',
  FAILED: 'red',
  REFUNDED: 'amber',
}

interface Props {
  isFoundingMember: boolean
}

export function SubscriptionSection({ isFoundingMember }: Props) {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const lang = i18n.language?.startsWith('hu') ? 'hu' : 'en'
  const fmt = (iso: string | null | undefined) =>
    iso ? formatLocalDate(iso, lang, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  const [confirmingCancel, setConfirmingCancel] = useState(false)
  // Reference time for period-end checks; the card re-mounts on navigation, which is fresh enough.
  const [now] = useState(() => Date.now())

  const { data: sub, isLoading } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: subscriptionService.get,
    staleTime: 30_000,
  })

  // /app/settings#subscription (from the pricing and success pages) → bring the card into view.
  const { hash } = useLocation()
  useEffect(() => {
    if (hash === '#subscription' && !isLoading) {
      document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash, isLoading])

  function onUpdated(updated: SubscriptionDto) {
    qc.setQueryData(SUBSCRIPTION_QUERY_KEY, updated)
    void qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
  }

  const cancel = useMutation({
    mutationFn: subscriptionService.cancel,
    onSuccess: (updated) => {
      onUpdated(updated)
      setConfirmingCancel(false)
      toast({ title: t('settings.subscription.cancelled', { date: fmt(updated.currentPeriodEnd) }) })
    },
    onError: () => toast({ title: t('settings.subscription.actionError'), variant: 'destructive' }),
  })

  const resume = useMutation({
    mutationFn: subscriptionService.resume,
    onSuccess: (updated) => {
      onUpdated(updated)
      toast({ title: t('settings.subscription.resumed') })
    },
    onError: () => toast({ title: t('settings.subscription.actionError'), variant: 'destructive' }),
  })

  const payOverdue = useMutation({
    mutationFn: (plan: SubscriptionDto['plan']) =>
      subscriptionService.payOverdue(subscriptionReturnUrl(window.location.origin, plan, 'overdue')),
    onSuccess: (res, plan) => {
      initiatePurchase([planPixelProduct(plan, sub?.priceHuf)])
      window.location.href = res.gatewayUrl
    },
    onError: () => toast({ title: t('settings.subscription.actionError'), variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div id="subscription" className="max-w-lg mt-6">
        <Card>
          <CardContent className="pt-5 flex justify-center"><Spinner /></CardContent>
        </Card>
      </div>
    )
  }

  if (!sub && isFoundingMember) return null

  const periodEnded = sub?.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) <= now : false
  const isCancelling = !!sub && (sub.cancelAtPeriodEnd || sub.status === 'CANCELLED') && !periodEnded
  const isEnded = !!sub && (sub.status === 'EXPIRED' || sub.status === 'FAILED' || (sub.status === 'CANCELLED' && periodEnded))
  const card = formatCard(sub?.card)
  const grace = sub?.status === 'PAST_DUE' ? graceEnd(sub) : null
  const statusKey: SubscriptionStatus | 'CANCELLING' = isCancelling && sub?.status !== 'PAST_DUE' ? 'CANCELLING' : (sub?.status ?? 'EXPIRED')

  return (
    <div id="subscription" className="max-w-lg mt-6">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.subscription.title')}</h2>
          </div>

          {!sub && (
            <>
              <p className="text-sm text-[#6B6460]">{t('settings.subscription.none')}</p>
              <Button asChild size="sm">
                <Link to="/app/premium">{t('settings.subscription.subscribe')}</Link>
              </Button>
            </>
          )}

          {sub && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{t(`settings.subscription.plan.${sub.plan}`)}</p>
                  <p className="text-xs text-gray-500">
                    {t(`settings.subscription.price.${sub.plan}`, { price: sub.priceHuf })}
                  </p>
                </div>
                <Badge variant={statusKey === 'CANCELLING' ? 'amber' : STATUS_BADGE[sub.status]}>
                  {t(`settings.subscription.status.${statusKey}`)}
                </Badge>
              </div>

              {/* Next charge / end date */}
              {sub.status === 'ACTIVE' && !isCancelling && sub.nextChargeAt && (
                <p className="text-sm text-[#6B6460]">
                  {t('settings.subscription.nextCharge', { date: fmt(sub.nextChargeAt), price: sub.priceHuf })}
                </p>
              )}
              {isCancelling && (
                <p className="text-sm text-[#6B6460]">
                  {t('settings.subscription.endsOn', { date: fmt(sub.currentPeriodEnd) })}
                </p>
              )}
              {isEnded && (
                <p className="text-sm text-[#6B6460]">
                  {t('settings.subscription.ended', { date: fmt(sub.currentPeriodEnd) })}
                </p>
              )}
              {sub.status === 'PENDING' && (
                <p className="text-sm text-[#6B6460]">{t('settings.subscription.pending')}</p>
              )}

              {/* Overdue */}
              {sub.status === 'PAST_DUE' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
                  <p className="flex items-start gap-2 text-sm text-amber-800">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden="true" />
                    {t('settings.subscription.pastDue', { date: grace ? fmt(grace.toISOString()) : '—' })}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    disabled={payOverdue.isPending}
                    onClick={() => payOverdue.mutate(sub.plan)}
                  >
                    {payOverdue.isPending ? <Spinner /> : null}
                    {t('settings.subscription.payOverdue')}
                  </Button>
                </div>
              )}

              {/* Card */}
              {card && !isEnded && (
                <p className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <CreditCard size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
                  {card}
                </p>
              )}

              {/* Actions */}
              {isResumable(sub, now) && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={resume.isPending}
                  onClick={() => resume.mutate()}
                >
                  {resume.isPending ? <Spinner /> : null}
                  {t('settings.subscription.resume')}
                </Button>
              )}

              {(sub.status === 'ACTIVE' || sub.status === 'PAST_DUE') && !isCancelling && !confirmingCancel && (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="text-xs text-gray-500 hover:text-red-600 underline underline-offset-2"
                >
                  {t('settings.subscription.cancel')}
                </button>
              )}

              {confirmingCancel && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-3" role="group" aria-label={t('settings.subscription.cancel')}>
                  <p className="text-sm text-red-800">
                    {t('settings.subscription.cancelConfirm', { date: fmt(sub.currentPeriodEnd) })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate()}
                    >
                      {cancel.isPending ? <Spinner /> : null}
                      {t('settings.subscription.cancelConfirmCta')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                      {t('settings.subscription.keep')}
                    </Button>
                  </div>
                </div>
              )}

              {isEnded && !isFoundingMember && (
                <Button asChild size="sm">
                  <Link to="/app/premium">{t('settings.subscription.subscribeAgain')}</Link>
                </Button>
              )}

              {/* Payment history */}
              {sub.payments.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-[#1A1A1A] mb-2">{t('settings.subscription.history')}</p>
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                    {sub.payments.map((p) => (
                      <li key={p.paymentId} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#1A1A1A]">
                            {t('settings.subscription.amount', { price: p.amountHuf })}
                            <span className="text-gray-400"> · {t(`settings.subscription.kind.${p.kind}`)}</span>
                          </p>
                          <p className="text-xs text-gray-400">{fmt(p.createdAt)}</p>
                        </div>
                        <Badge variant={PAYMENT_BADGE[p.status]}>{t(`settings.subscription.paymentStatus.${p.status}`)}</Badge>
                        {p.invoiceUrl && (
                          <a
                            href={p.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#F28C28] hover:underline shrink-0"
                          >
                            {t('settings.subscription.invoice')}
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
