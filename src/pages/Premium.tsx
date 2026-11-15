/**
 * Premium — pricing and upgrade page for signed-in users (/app/premium).
 *
 * Kalmio Prémium is a recurring Barion card subscription (monthly or yearly); the Founding
 * Member tier is sold by bank transfer on its own page (docs/product/payments-subscriptions.md).
 *
 * Flow:
 *   1. Plan cards (GET /api/billing/plans) plus the Founding Member offer.
 *   2. Choosing a plan opens the checkout step: what is charged and when (today's fee, the
 *      next charge and its day), billing address, ÁSZF acceptance, the express request to
 *      start now (losing the withdrawal right) and the separate acceptance of the recurring
 *      card payment — Barion's conditions for token payment (contract §5) — then
 *      POST /api/subscription/checkout and a full redirect to Barion's gateway. While
 *      Barion's approval of token payment is pending, a notice says so on both steps.
 *   3. Barion returns to /app/premium/success?plan=…&paymentId=… (PremiumSuccess.tsx).
 *
 * Barion Pixel: contentView per offer, addToCart + initiateCheckout when a plan is chosen,
 * initiatePurchase right before the redirect.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, Loader2, Star } from 'lucide-react'
import { billingService, BILLING_PLANS_QUERY_KEY } from '@/services/billing'
import { subscriptionService, SUBSCRIPTION_QUERY_KEY } from '@/services/subscription'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { PremiumFeatureGate } from '@/components/premium/PremiumFeatureGate'
import { PremiumFeatureList } from '@/components/premium/PremiumFeatureList'
import { PaymentMethods } from '@/components/PaymentMethods'
import { ChargeSchedule } from '@/components/premium/ChargeSchedule'
import { CardPaymentPendingNotice } from '@/components/premium/CardPaymentPendingNotice'
import { BillingAddressForm } from '@/components/checkout/BillingAddressForm'
import { EMPTY_BILLING, toBillingInfo, validateBilling, type BillingDraft, type BillingErrors } from '@/lib/billingDraft'
import {
  CARD_PAYMENT_PENDING_APPROVAL,
  DEFAULT_PRICES,
  chargeDateLabel,
  foundingMemberPixelProduct,
  isSubscriptionOpen,
  nextChargeDate,
  planPixelProduct,
  subscriptionReturnUrl,
  yearlySavingPercent,
} from '@/lib/billingProducts'
import { addToCart, contentView, initiateCheckout, initiatePurchase } from '@/lib/barionPixel'
import type { SubscriptionPlanCode } from '@/types'

function PremiumInner() {
  const { t, i18n } = useTranslation()

  const me = useQuery({ queryKey: USERS_ME_QUERY_KEY, queryFn: usersService.getMe, staleTime: 30_000 })
  const plans = useQuery({ queryKey: BILLING_PLANS_QUERY_KEY, queryFn: billingService.getPlans, staleTime: 60_000 })
  const subscription = useQuery({ queryKey: SUBSCRIPTION_QUERY_KEY, queryFn: subscriptionService.get, staleTime: 30_000 })

  const [selected, setSelected] = useState<SubscriptionPlanCode | null>(null)
  const [billing, setBilling] = useState<BillingDraft>(EMPTY_BILLING)
  const [billingErrors, setBillingErrors] = useState<BillingErrors>({})
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false)
  const [acceptRecurring, setAcceptRecurring] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<'exists' | 'pending' | 'generic' | null>(null)

  const priceOf = (code: SubscriptionPlanCode) =>
    plans.data?.plans.find((p) => p.code === code)?.priceHuf ?? DEFAULT_PRICES[code]
  const monthly = priceOf('MONTHLY')
  const yearly = priceOf('YEARLY')
  const fmPrice = plans.data?.foundingMember.priceHuf ?? DEFAULT_PRICES.FOUNDING_MEMBER
  const fmRemaining = plans.data?.foundingMember.remaining ?? null
  const fmSoldOut = fmRemaining === 0

  const isFoundingMember = me.data?.foundingMember === true
  const hasOpenSubscription = isSubscriptionOpen(subscription.data)
  // A failed subscription read does not block buying: the checkout answers 409 when one exists.
  const canBuy = me.isSuccess && !subscription.isLoading && !isFoundingMember && !hasOpenSubscription

  // contentView — once per offer, after the prices are known.
  const viewedRef = useRef(false)
  useEffect(() => {
    if (viewedRef.current || !canBuy || plans.isLoading) return
    viewedRef.current = true
    contentView(planPixelProduct('MONTHLY', monthly))
    contentView(planPixelProduct('YEARLY', yearly))
    if (!fmSoldOut) contentView(foundingMemberPixelProduct(fmPrice))
  }, [canBuy, plans.isLoading, monthly, yearly, fmPrice, fmSoldOut])

  function choose(plan: SubscriptionPlanCode) {
    const product = planPixelProduct(plan, priceOf(plan))
    addToCart(product)
    initiateCheckout([product])
    setSelected(plan)
    // the acceptance names the plan's amount and day, so it never carries over to another plan
    setAcceptRecurring(false)
    setError(null)
    window.scrollTo({ top: 0 })
  }

  async function handleCheckout() {
    if (!selected) return
    setError(null)
    const errs = validateBilling(billing)
    setBillingErrors(errs)
    if (Object.keys(errs).length > 0 || !acceptTerms || !waiveWithdrawal || !acceptRecurring) return
    setIsRedirecting(true)
    try {
      const result = await subscriptionService.checkout(
        selected,
        toBillingInfo(billing),
        subscriptionReturnUrl(window.location.origin, selected),
      )
      initiatePurchase([planPixelProduct(selected, priceOf(selected))])
      window.location.href = result.gatewayUrl
    } catch (err: unknown) {
      setIsRedirecting(false)
      const status = (err as { response?: { status?: number } })?.response?.status
      // until Barion switches token payment on, the gateway refuses to start the payment
      setError(status === 409 ? 'exists' : CARD_PAYMENT_PENDING_APPROVAL ? 'pending' : 'generic')
    }
  }

  const loading = me.isLoading || subscription.isLoading
  const lang = i18n.language?.startsWith('hu') ? 'hu' : 'en'
  const nextCharge = selected
    ? chargeDateLabel(nextChargeDate(selected), lang)
    : ''
  const allAccepted = acceptTerms && waiveWithdrawal && acceptRecurring

  return (
    <main className="min-h-screen flex justify-center px-6 py-12 sm:py-16 bg-[#111]">
      <section className="max-w-3xl w-full">
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4 text-center">
          {t('premiumPage.label')}
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-white/40" size={24} />
          </div>
        )}

        {/* Lifetime member — nothing to buy */}
        {!loading && isFoundingMember && (
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-semibold text-white mb-4 leading-snug">{t('premiumPage.foundingMember.title')}</h1>
            <p className="text-white/70 text-base leading-relaxed mb-8">{t('premiumPage.foundingMember.body')}</p>
            <Link to="/app" className="text-sm font-medium text-white/60 hover:text-white underline underline-offset-4">
              {t('premiumPage.backToApp')}
            </Link>
          </div>
        )}

        {/* Already subscribed — manage in Settings */}
        {!loading && !isFoundingMember && hasOpenSubscription && (
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-3xl font-semibold text-white mb-4 leading-snug">{t('premiumPage.subscribed.title')}</h1>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              {t('premiumPage.subscribed.body', { plan: t(`premiumPage.plans.${subscription.data!.plan}.short`) })}
            </p>
            <Link
              to="/app/settings#subscription"
              className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-3.5 rounded-full transition-colors"
            >
              {t('premiumPage.subscribed.manage')}
            </Link>
          </div>
        )}

        {/* Plan cards */}
        {canBuy && !selected && (
          <>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-4 text-center leading-snug">
              {t('premiumPage.headline')}
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-10 text-center max-w-xl mx-auto">
              {t('premiumPage.sub')}
            </p>

            {CARD_PAYMENT_PENDING_APPROVAL && <CardPaymentPendingNotice className="mb-6" />}

            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <PlanCard
                title={t('premiumPage.plans.MONTHLY.name')}
                price={t('premiumPage.plans.MONTHLY.price', { price: monthly })}
                note={t('premiumPage.plans.MONTHLY.note')}
                cta={t('premiumPage.choose')}
                onChoose={() => choose('MONTHLY')}
              />
              <PlanCard
                title={t('premiumPage.plans.YEARLY.name')}
                price={t('premiumPage.plans.YEARLY.price', { price: yearly })}
                note={t('premiumPage.plans.YEARLY.note', {
                  perMonth: Math.round(yearly / 12),
                  percent: yearlySavingPercent(monthly, yearly),
                })}
                badge={t('premiumPage.plans.YEARLY.badge')}
                cta={t('premiumPage.choose')}
                onChoose={() => choose('YEARLY')}
                highlighted
              />
            </div>

            {/* Founding Member — bank transfer only */}
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] px-6 py-5 mb-12 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="flex items-center gap-2 text-amber-300 text-sm font-semibold mb-1">
                  <Star className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                  {t('premiumPage.founding.title')}
                </p>
                <p className="text-white text-lg font-semibold">{t('premiumPage.founding.price', { price: fmPrice })}</p>
                <p className="text-white/60 text-sm leading-relaxed mt-1">
                  {fmSoldOut
                    ? t('premiumPage.founding.soldOut')
                    : fmRemaining !== null
                      ? t('premiumPage.founding.noteRemaining', { remaining: fmRemaining })
                      : t('premiumPage.founding.note')}
                </p>
              </div>
              {!fmSoldOut && (
                <Link
                  to="/app/founding-member"
                  className="inline-flex items-center justify-center gap-2 border border-amber-300/60 text-amber-200 hover:bg-amber-300/10 font-semibold text-sm px-5 py-3 rounded-full transition-colors shrink-0"
                >
                  {t('premiumPage.founding.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="max-w-md mx-auto">
              <PremiumFeatureList />
            </div>
          </>
        )}

        {/* Checkout step */}
        {canBuy && selected && (
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('premiumPage.checkout.back')}
            </button>

            <h1 className="text-2xl font-semibold text-white mb-6 leading-snug">{t('premiumPage.checkout.title')}</h1>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 mb-4">
              <p className="text-white/60 text-sm">{t(`premiumPage.plans.${selected}.name`)}</p>
              <p className="text-white text-2xl font-semibold mt-0.5">
                {t(`premiumPage.plans.${selected}.price`, { price: priceOf(selected) })}
              </p>
            </div>

            {/* When and how much — shown before the payment (Barion's condition for token payment) */}
            <ChargeSchedule plan={selected} priceHuf={priceOf(selected)} nextCharge={nextCharge} />

            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleCheckout()
              }}
            >
              <BillingAddressForm
                value={billing}
                onChange={setBilling}
                errors={billingErrors}
                onClearError={(f) => setBillingErrors((p) => ({ ...p, [f]: false }))}
                idPrefix="sub-billing"
              />

              <label className="flex items-start gap-2.5 mt-6 mb-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#F28C28]"
                />
                <span className="text-white/70 text-sm leading-relaxed">
                  {t('checkout.acceptPrefix')}
                  <Link to="/terms" target="_blank" className="text-[#F28C28] underline underline-offset-2">
                    {t('checkout.terms')}
                  </Link>
                  {t('checkout.acceptMid')}
                  <Link to="/privacy" target="_blank" className="text-[#F28C28] underline underline-offset-2">
                    {t('checkout.privacy')}
                  </Link>
                  {t('checkout.acceptSuffix')}
                </span>
              </label>

              <label className="flex items-start gap-2.5 mb-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={waiveWithdrawal}
                  onChange={(e) => setWaiveWithdrawal(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#F28C28]"
                />
                <span className="text-white/70 text-sm leading-relaxed">{t('checkout.startNowWaiveWithdrawal')}</span>
              </label>

              <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptRecurring}
                  onChange={(e) => setAcceptRecurring(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#F28C28]"
                />
                <span className="text-white/70 text-sm leading-relaxed">
                  {t(`premiumPage.checkout.acceptRecurring.${selected}`, { price: priceOf(selected), date: nextCharge })}
                </span>
              </label>

              {CARD_PAYMENT_PENDING_APPROVAL && error !== 'pending' && <CardPaymentPendingNotice className="mb-5" />}

              {error && (
                <p className="text-red-400 text-sm mb-4" role="alert">
                  {t(`premiumPage.checkout.errors.${error}`)}
                </p>
              )}

              <button
                type="submit"
                disabled={isRedirecting || !allAccepted}
                aria-disabled={isRedirecting || !allAccepted}
                className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t('premiumPage.checkout.ctaLoading')}
                  </>
                ) : (
                  t('premiumPage.checkout.cta')
                )}
              </button>

              <p className="text-white/40 text-xs leading-relaxed mt-4">{t('premiumPage.checkout.secureNote')}</p>

              <div className="mt-6 pt-5 border-t border-white/10">
                <PaymentMethods />
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}

interface PlanCardProps {
  title: string
  price: string
  note: string
  cta: string
  onChoose: () => void
  badge?: string
  highlighted?: boolean
}

function PlanCard({ title, price, note, cta, onChoose, badge, highlighted }: PlanCardProps) {
  return (
    <div
      className={[
        'rounded-2xl px-6 py-6 flex flex-col',
        highlighted ? 'border border-[#F28C28]/60 bg-[#F28C28]/[0.06]' : 'border border-white/10 bg-white/[0.04]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-white/80 text-sm font-semibold">{title}</p>
        {badge && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#F28C28] bg-[#F28C28]/15 rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </div>
      <p className="text-white text-3xl font-semibold mb-2">{price}</p>
      <p className="flex items-start gap-2 text-white/60 text-sm leading-relaxed mb-6 flex-1">
        <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#4F7942]" aria-hidden="true" />
        {note}
      </p>
      <button
        type="button"
        onClick={onChoose}
        className={[
          'inline-flex items-center justify-center gap-2 font-bold text-base px-6 py-3 rounded-full transition-colors w-full',
          highlighted
            ? 'bg-[#F28C28] hover:bg-[#e07820] text-white'
            : 'border border-white/20 text-white hover:bg-white/5',
        ].join(' ')}
      >
        {cta}
      </button>
    </div>
  )
}

export function Premium() {
  const { t } = useTranslation()
  return (
    <PremiumFeatureGate
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#111]">
          <section className="max-w-md w-full text-center">
            <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">{t('premiumPage.label')}</p>
            <h1 className="text-3xl font-semibold text-white mb-4 leading-snug">{t('premiumPage.comingSoon')}</h1>
            <Link to="/app" className="text-sm font-medium text-white/50 hover:text-white/80 underline underline-offset-4">
              {t('premiumPage.backToApp')}
            </Link>
          </section>
        </main>
      }
    >
      <PremiumInner />
    </PremiumFeatureGate>
  )
}
