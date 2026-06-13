/**
 * FoundingMember — KALMIO-292
 *
 * Functional buy-page for the Founding Member tier. Guarded by PremiumFeatureGate
 * (build-time VITE_PREMIUM_ENABLED + PostHog runtime flag `premium_enabled`). When
 * the gate is closed the user sees the generic "coming soon" copy — the backend
 * endpoints are never hit.
 *
 * Flow:
 *   1. Fetch GET /api/founding-member/availability — shows price, seats remaining.
 *   2. Already-purchased users (me.foundingMember === true) see the "already member" state.
 *   3. Sold-out users (remaining === 0) see the sold-out copy.
 *   4. Eligible users see the CTA. On click: POST /api/founding-member/checkout →
 *      redirect browser to Barion gateway URL.
 *   5. On return from Barion the user lands on /app/founding-member/success
 *      (FoundingMemberSuccess.tsx) which polls users/me for the foundingMember flag.
 *
 * Tone: confident, warm, deferential — no exclamation marks, no motivational copy.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { foundingMemberService } from '@/services/foundingMember'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { PremiumFeatureGate } from '@/components/premium/PremiumFeatureGate'
import { PremiumFeatureList } from '@/components/premium/PremiumFeatureList'
import { PaymentMethods } from '@/components/PaymentMethods'

// The success page URL must be absolute so Barion can redirect to it.
function successUrl(): string {
  const token = new URLSearchParams(window.location.search).get('token')
  const base = `${window.location.origin}/app/founding-member/success`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

/** Billing fields the buyer must complete before checkout for the NAV e-invoice. */
type BillingField = 'name' | 'postCode' | 'city' | 'address'

function FoundingMemberInner() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [checkoutError, setCheckoutError] = useState<'capReached' | 'generic' | null>(null)

  // Billing address for the NAV e-invoice. countryCode defaults to "HU" (v1 ships HU only).
  const [billingName, setBillingName] = useState('')
  const [billingPostCode, setBillingPostCode] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingErrors, setBillingErrors] = useState<Partial<Record<BillingField, boolean>>>({})

  function validateBilling(): boolean {
    const next: Partial<Record<BillingField, boolean>> = {}
    if (!billingName.trim()) next.name = true
    if (!billingPostCode.trim()) next.postCode = true
    if (!billingCity.trim()) next.city = true
    if (!billingAddress.trim()) next.address = true
    setBillingErrors(next)
    return Object.keys(next).length === 0
  }

  // Fetch the current user to detect already-purchased state.
  const me = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 30_000,
  })

  // Fetch availability: price, remaining seats.
  const availability = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
  })

  const isAlreadyMember = me.data?.foundingMember === true
  const isSoldOut = availability.data ? availability.data.remaining === 0 : false
  const price = availability.data?.price ?? null
  const remaining = availability.data?.remaining ?? null

  // Recover a paid-but-unclaimed membership (e.g. claim link lost) so the user can
  // activate it instead of paying twice. Only checked once we know they're not already a member.
  const unclaimed = useQuery({
    queryKey: ['founding-member', 'unclaimed'],
    queryFn: foundingMemberService.getUnclaimed,
    enabled: me.isSuccess && !isAlreadyMember,
    staleTime: 30_000,
  })
  const unclaimedPaymentId = unclaimed.data?.paymentId ?? null

  const activate = useMutation({
    mutationFn: (paymentId: string) => foundingMemberService.claimPayment(paymentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['founding-member', 'unclaimed'] })
    },
  })

  async function handleCheckout() {
    setCheckoutError(null)
    if (!validateBilling()) return
    setIsRedirecting(true)
    try {
      const previewToken = new URLSearchParams(window.location.search).get('token') ?? undefined
      const result = await foundingMemberService.checkout(
        successUrl(),
        {
          name: billingName.trim(),
          countryCode: 'HU',
          postCode: billingPostCode.trim(),
          city: billingCity.trim(),
          address: billingAddress.trim(),
        },
        previewToken,
      )
      // Hand control to Barion — this is a full browser redirect.
      window.location.href = result.gatewayUrl
    } catch (err: unknown) {
      setIsRedirecting(false)
      // HTTP 409 = cap reached between our availability fetch and the checkout call.
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setCheckoutError('capReached')
      } else {
        setCheckoutError('generic')
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
      <section className="max-w-md w-full">

        {/* Label */}
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4 text-center">
          {t('foundingMember.buy.label')}
        </p>

        {/* Headline */}
        <h1 className="text-3xl font-semibold text-white mb-4 text-center leading-snug">
          {t('foundingMember.buy.headline')}
        </h1>

        {/* Sub */}
        <p className="text-white/70 text-base leading-relaxed mb-8 text-center">
          {t('foundingMember.buy.sub')}
        </p>

        {/* Price + seats */}
        {availability.isSuccess && !isAlreadyMember && (
          <div className="bg-white/5 rounded-2xl px-6 py-6 mb-8 text-center">
            {price !== null && (
              <p className="text-white text-2xl font-semibold mb-2">
                {t('foundingMember.buy.priceLine', { price })}
              </p>
            )}
            {remaining !== null && !isSoldOut && (
              <p className="text-white/60 text-sm">
                {t('foundingMember.buy.remainingLine', { remaining })}
              </p>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {availability.isLoading && !isAlreadyMember && (
          <div className="bg-white/5 rounded-2xl px-6 py-6 mb-8 text-center">
            <p className="text-white/40 text-sm">{t('foundingMember.buy.loading')}</p>
          </div>
        )}

        {/* What premium unlocks — only while the user can still buy */}
        {!isAlreadyMember && !isSoldOut && (
          <PremiumFeatureList className="mb-8" />
        )}

        {/* Already-member state */}
        {isAlreadyMember && (
          <p className="text-white/80 text-base leading-relaxed mb-8 text-center">
            {t('foundingMember.buy.alreadyMember')}
          </p>
        )}

        {/* Sold-out state */}
        {!isAlreadyMember && isSoldOut && (
          <div className="text-center">
            <p className="text-white text-xl font-semibold mb-2">
              {t('foundingMember.buy.soldOutTitle')}
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              {t('foundingMember.buy.soldOutSub')}
            </p>
          </div>
        )}

        {/* Error message */}
        {checkoutError && (
          <p className="text-red-400 text-sm text-center mb-4" role="alert">
            {t(`foundingMember.buy.errors.${checkoutError}`)}
          </p>
        )}

        {/* Recover a paid-but-unclaimed membership — activate instead of paying twice */}
        {!isAlreadyMember && !isSoldOut && unclaimedPaymentId && (
          <div className="text-center">
            <p className="text-white/80 text-base leading-relaxed mb-2">
              {t('foundingMember.buy.recover.found')}
            </p>
            {activate.isError && (
              <p className="text-red-400 text-sm mb-3" role="alert">
                {t('foundingMember.buy.recover.error')}
              </p>
            )}
            <button
              type="button"
              onClick={() => activate.mutate(unclaimedPaymentId)}
              disabled={activate.isPending}
              aria-disabled={activate.isPending}
              className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full sm:w-auto"
            >
              {activate.isPending
                ? t('foundingMember.buy.recover.activating')
                : t('foundingMember.buy.recover.cta')}
            </button>
          </div>
        )}

        {/* CTA */}
        {!isAlreadyMember && !isSoldOut && !unclaimedPaymentId && (
          <div className="text-center">
            {/* Billing details — captured for the NAV e-invoice */}
            <div className="mb-6 text-left">
              <h2 className="text-white text-sm font-semibold mb-1">
                {t('checkout.billing.title')}
              </h2>
              <p className="text-white/50 text-xs leading-relaxed mb-4">
                {t('checkout.billing.note')}
              </p>

              <label htmlFor="fm-billing-name" className="block text-white/70 text-sm mb-1.5">
                {t('checkout.billing.name.label')}
              </label>
              <input
                id="fm-billing-name"
                type="text"
                autoComplete="name"
                value={billingName}
                onChange={(e) => {
                  setBillingName(e.target.value)
                  if (billingErrors.name) setBillingErrors((p) => ({ ...p, name: false }))
                }}
                placeholder={t('checkout.billing.name.placeholder')}
                aria-invalid={billingErrors.name ?? false}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors"
              />
              {billingErrors.name && (
                <p className="text-red-400 text-xs mt-1" role="alert">
                  {t('checkout.billing.errors.name')}
                </p>
              )}

              <label htmlFor="fm-billing-country" className="block text-white/70 text-sm mb-1.5 mt-4">
                {t('checkout.billing.country.label')}
              </label>
              <select
                id="fm-billing-country"
                value="HU"
                disabled
                aria-label={t('checkout.billing.country.label')}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors disabled:opacity-100"
              >
                <option value="HU">{t('checkout.billing.country.hungary')}</option>
              </select>

              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="sm:w-1/3">
                  <label htmlFor="fm-billing-postcode" className="block text-white/70 text-sm mb-1.5">
                    {t('checkout.billing.postCode.label')}
                  </label>
                  <input
                    id="fm-billing-postcode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={billingPostCode}
                    onChange={(e) => {
                      setBillingPostCode(e.target.value)
                      if (billingErrors.postCode) setBillingErrors((p) => ({ ...p, postCode: false }))
                    }}
                    placeholder={t('checkout.billing.postCode.placeholder')}
                    aria-invalid={billingErrors.postCode ?? false}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors"
                  />
                </div>
                <div className="sm:flex-1">
                  <label htmlFor="fm-billing-city" className="block text-white/70 text-sm mb-1.5">
                    {t('checkout.billing.city.label')}
                  </label>
                  <input
                    id="fm-billing-city"
                    type="text"
                    autoComplete="address-level2"
                    value={billingCity}
                    onChange={(e) => {
                      setBillingCity(e.target.value)
                      if (billingErrors.city) setBillingErrors((p) => ({ ...p, city: false }))
                    }}
                    placeholder={t('checkout.billing.city.placeholder')}
                    aria-invalid={billingErrors.city ?? false}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors"
                  />
                </div>
              </div>
              {(billingErrors.postCode || billingErrors.city) && (
                <p className="text-red-400 text-xs mt-1" role="alert">
                  {t(billingErrors.postCode ? 'checkout.billing.errors.postCode' : 'checkout.billing.errors.city')}
                </p>
              )}

              <label htmlFor="fm-billing-address" className="block text-white/70 text-sm mb-1.5 mt-4">
                {t('checkout.billing.address.label')}
              </label>
              <input
                id="fm-billing-address"
                type="text"
                autoComplete="street-address"
                value={billingAddress}
                onChange={(e) => {
                  setBillingAddress(e.target.value)
                  if (billingErrors.address) setBillingErrors((p) => ({ ...p, address: false }))
                }}
                placeholder={t('checkout.billing.address.placeholder')}
                aria-invalid={billingErrors.address ?? false}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors"
              />
              {billingErrors.address && (
                <p className="text-red-400 text-xs mt-1" role="alert">
                  {t('checkout.billing.errors.address')}
                </p>
              )}
            </div>

            {/* Mandatory ÁSZF acceptance — purchase is blocked until ticked */}
            <label className="flex items-start gap-2.5 mb-4 text-left cursor-pointer select-none">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
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

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isRedirecting || availability.isLoading || !accepted}
              aria-disabled={isRedirecting || availability.isLoading || !accepted}
              className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full sm:w-auto"
            >
              {isRedirecting
                ? t('foundingMember.buy.ctaLoading')
                : isSoldOut
                  ? t('foundingMember.buy.ctaSoldOut')
                  : t('foundingMember.buy.cta')}
            </button>

            <div className="mt-6 pt-5 border-t border-white/10">
              <PaymentMethods />
            </div>
          </div>
        )}

      </section>
    </main>
  )
}

export function FoundingMember() {
  const { t } = useTranslation()

  return (
    <PremiumFeatureGate
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#111]">
          <section className="max-w-md w-full text-center">
            <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
              {t('foundingMember.buy.label')}
            </p>
            <h1 className="text-3xl font-semibold text-white mb-4 leading-snug">
              {t('foundingMember.comingSoonHeadline')}
            </h1>
            <p className="text-white/60 text-base leading-relaxed mb-10">
              {t('foundingMember.comingSoonSub')}
            </p>
            <Link
              to="/app"
              className="inline-flex items-center justify-center text-sm font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
            >
              {t('foundingMember.comingSoonBack')}
            </Link>
          </section>
        </main>
      }
    >
      <FoundingMemberInner />
    </PremiumFeatureGate>
  )
}
