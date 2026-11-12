/**
 * GuestFoundingMember — public Founding Member order page (/founding-member).
 *
 * Since Barion's 2026-11-12 review the lifetime tier is sold by bank transfer only
 * (docs/product/payments-subscriptions.md §2). A visitor without an account orders here:
 *
 *   1. GET /api/founding-member/availability (public). A 404 means the premium flow is off
 *      server-side → "coming soon".
 *   2. Email + billing address + ÁSZF → POST /api/founding-member/transfer-order/guest.
 *   3. Transfer instructions (beneficiary, account, amount, reference as közlemény, due date,
 *      díjbekérő). The order is remembered in localStorage so a reload shows it again.
 *   4. Once an admin confirms the credited transfer, the order is claimable: the visitor
 *      registers and /founding-member/claim?paymentId=… binds it (or /app/founding-member finds
 *      it through /unclaimed by email). A stored order is checked with
 *      GET /api/founding-member/guest-payment-status.
 *
 * Signed-in visitors are nudged to /app/founding-member, where the confirmation grants the
 * membership directly.
 *
 * Tone: confident, warm, deferential — no exclamation marks, no motivational copy.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, Loader2 } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { useAuthStore } from '@/store/auth'
import { PremiumFeatureList } from '@/components/premium/PremiumFeatureList'
import { BillingAddressForm } from '@/components/checkout/BillingAddressForm'
import { TransferInstructions } from '@/components/foundingMember/TransferInstructions'
import { EMPTY_BILLING, toBillingInfo, validateBilling, type BillingDraft, type BillingErrors } from '@/lib/billingDraft'
import { foundingMemberPixelProduct } from '@/lib/billingProducts'
import {
  clearGuestTransferOrder,
  loadGuestTransferOrder,
  markPurchaseTracked,
  saveGuestTransferOrder,
  type StoredGuestOrder,
} from '@/lib/guestTransferOrder'
import { addToCart, contentView, initiateCheckout, initiatePurchase, purchase } from '@/lib/barionPixel'
import heroImage from '@/assets/founding-member-hero.png'

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Shared shell: dark content panel on one side, hero photograph on the other. */
function SplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-[#111] text-white flex flex-col lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Hero image — banner on mobile, full-height right panel on desktop */}
      <div className="relative order-first h-52 sm:h-72 lg:order-last lg:h-auto overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Blend the image into the dark content panel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent lg:bg-gradient-to-r lg:from-[#111] lg:via-[#111]/10 lg:to-transparent" />
      </div>

      {/* Content panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
        <section className="w-full max-w-md">{children}</section>
      </div>
    </main>
  )
}

export function GuestFoundingMember() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)

  const [stored, setStored] = useState<StoredGuestOrder | null>(() => loadGuestTransferOrder())
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<'capReached' | 'generic' | 'email' | 'accept' | null>(null)
  const [billing, setBilling] = useState<BillingDraft>(EMPTY_BILLING)
  const [billingErrors, setBillingErrors] = useState<BillingErrors>({})

  // Availability doubles as the server-side feature gate: 404 when premium is disabled.
  const availability = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
    retry: false,
  })

  // A stored order: has the transfer been confirmed since?
  const storedStatus = useQuery({
    queryKey: ['founding-member', 'guest-status', stored?.order.paymentId],
    queryFn: () => foundingMemberService.getGuestPaymentStatus(stored!.order.paymentId),
    enabled: !!stored,
    retry: false,
    staleTime: 30_000,
  })
  const isConfirmed = storedStatus.data?.status === 'SUCCEEDED'

  const price = availability.data?.price ?? null
  const remaining = availability.data?.remaining ?? null
  const isSoldOut = availability.data ? availability.data.remaining === 0 : false
  const product = foundingMemberPixelProduct(price ?? undefined)
  const showOffer = !stored && !isSoldOut && availability.isSuccess

  const viewedRef = useRef(false)
  useEffect(() => {
    if (viewedRef.current || !showOffer) return
    viewedRef.current = true
    contentView(product)
  }, [showOffer, product])

  useEffect(() => {
    if (isConfirmed && stored && markPurchaseTracked(stored.order.reference)) {
      purchase([foundingMemberPixelProduct(stored.order.amountHuf)])
    }
  }, [isConfirmed, stored])

  function openForm() {
    addToCart(product)
    initiateCheckout([product])
    setFormOpen(true)
  }

  async function handleSubmit() {
    setError(null)
    if (!isValidEmail(email)) {
      setError('email')
      return
    }
    const errs = validateBilling(billing)
    setBillingErrors(errs)
    if (!accepted) {
      setError('accept')
      return
    }
    if (Object.keys(errs).length > 0) return
    setIsSubmitting(true)
    try {
      const order = await foundingMemberService.createGuestTransferOrder(email.trim(), toBillingInfo(billing))
      const next = { email: email.trim(), order }
      saveGuestTransferOrder(next)
      initiatePurchase([foundingMemberPixelProduct(order.amountHuf)])
      setStored(next)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 409 ? 'capReached' : 'generic')
    } finally {
      setIsSubmitting(false)
    }
  }

  function startOver() {
    clearGuestTransferOrder()
    setStored(null)
    setFormOpen(false)
  }

  // Feature gate: availability endpoint 404s when premium is disabled server-side.
  if (availability.isError && !stored) {
    return (
      <SplitLayout>
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
          {t('foundingMember.buy.label')}
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-tight">
          {t('foundingMember.comingSoonHeadline')}
        </h1>
        <p className="text-white/60 text-base leading-relaxed mb-10">
          {t('foundingMember.comingSoonSub')}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/50 hover:text-white/80 transition-colors underline underline-offset-4"
        >
          {t('foundingMember.comingSoonBack')}
        </Link>
      </SplitLayout>
    )
  }

  // An order exists on this device.
  if (stored) {
    const claimPath = `/founding-member/claim?paymentId=${encodeURIComponent(stored.order.paymentId)}`
    const onward = session ? claimPath : `/auth?next=${encodeURIComponent(claimPath)}`
    return (
      <SplitLayout>
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
          {t('foundingMember.buy.label')}
        </p>
        {isConfirmed ? (
          <>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-tight">
              {t('guestFoundingMember.transfer.confirmedTitle')}
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              {t('guestFoundingMember.transfer.confirmedBody', { email: stored.email })}
            </p>
            <Link
              to={onward}
              className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors w-full"
            >
              {session ? t('guestFoundingMemberSuccess.activateCta') : t('guestFoundingMemberSuccess.createAccountCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-tight">
              {t('foundingMember.transfer.pendingTitle')}
            </h1>
            <p className="flex items-start gap-2 text-white/70 text-sm leading-relaxed mb-8">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#F28C28]" aria-hidden="true" />
              {t('guestFoundingMember.transfer.pendingBody', { email: stored.email })}
            </p>
            <TransferInstructions order={stored.order} />
          </>
        )}
        <button
          type="button"
          onClick={startOver}
          className="mt-10 text-xs text-white/40 hover:text-white/70 underline underline-offset-4"
        >
          {t('guestFoundingMember.transfer.startOver')}
        </button>
      </SplitLayout>
    )
  }

  return (
    <SplitLayout>
      <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
        {t('foundingMember.buy.label')}
      </p>
      <h1 className="text-3xl sm:text-4xl font-semibold mb-4 leading-tight">
        {t('foundingMember.buy.headline')}
      </h1>
      <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-8">
        {t('foundingMember.buy.sub')}
      </p>

      {/* Price + seats */}
      {availability.isSuccess && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-6 mb-8">
          {price !== null && (
            <p className="text-white text-2xl sm:text-3xl font-semibold mb-1">
              {t('foundingMember.buy.priceLine', { price })}
            </p>
          )}
          {remaining !== null && !isSoldOut && (
            <p className="text-white/55 text-sm">
              {t('foundingMember.buy.remainingLine', { remaining })}
            </p>
          )}
          <p className="text-white/45 text-xs mt-3">{t('foundingMember.transfer.onlyByTransfer')}</p>
        </div>
      )}

      {availability.isLoading && (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-6 mb-8 flex items-center gap-3">
          <Loader2 className="animate-spin text-white/40" size={18} />
          <p className="text-white/40 text-sm">{t('foundingMember.buy.loading')}</p>
        </div>
      )}

      {/* Sold out */}
      {isSoldOut && (
        <div>
          <p className="text-white text-xl font-semibold mb-2">
            {t('foundingMember.buy.soldOutTitle')}
          </p>
          <p className="text-white/70 text-base leading-relaxed">
            {t('foundingMember.buy.soldOutSub')}
          </p>
        </div>
      )}

      {showOffer && !formOpen && (
        <>
          <PremiumFeatureList className="mb-8" />
          <p className="text-white/60 text-sm leading-relaxed mb-6">{t('foundingMember.transfer.howItWorks')}</p>
        </>
      )}

      {/* Already-logged-in nudge */}
      {showOffer && session && (
        <div>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            {t('guestFoundingMember.loggedInNote')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/founding-member')}
            className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors w-full"
          >
            {t('guestFoundingMember.loggedInCta')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showOffer && !session && !formOpen && (
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors w-full"
        >
          {t('foundingMember.transfer.cta')}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}

      {/* Guest order form */}
      {showOffer && !session && formOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <label htmlFor="fm-email" className="block text-white/70 text-sm mb-2">
            {t('guestFoundingMember.email.label')}
          </label>
          <input
            id="fm-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error === 'email') setError(null)
            }}
            placeholder={t('guestFoundingMember.email.placeholder')}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-[#F28C28] focus:ring-1 focus:ring-[#F28C28] transition-colors mb-2"
          />

          <div className="mt-6">
            <BillingAddressForm
              value={billing}
              onChange={setBilling}
              errors={billingErrors}
              onClearError={(f) => setBillingErrors((p) => ({ ...p, [f]: false }))}
              idPrefix="fm-billing"
            />
          </div>

          {/* Mandatory ÁSZF acceptance — ordering is blocked until ticked */}
          <label className="flex items-start gap-2.5 mt-4 mb-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                if (error === 'accept') setError(null)
              }}
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

          {error && (
            <p className="text-red-400 text-sm mb-3" role="alert">
              {t(error === 'accept' ? 'checkout.acceptRequired' : `guestFoundingMember.errors.${error}`)}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !accepted}
            aria-disabled={isSubmitting || !accepted}
            className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t('foundingMember.transfer.submitting')}
              </>
            ) : (
              <>
                {t('foundingMember.transfer.submit')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-white/40 text-xs leading-relaxed mt-4">
            {t('guestFoundingMember.afterOrderNote')}
          </p>
        </form>
      )}
    </SplitLayout>
  )
}
