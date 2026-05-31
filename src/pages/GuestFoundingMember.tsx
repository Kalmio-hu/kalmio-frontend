/**
 * GuestFoundingMember — public guest-first Founding Member checkout.
 *
 * Mounted at /founding-member (PUBLIC — no auth, no AppShell). This is the eager
 * conversion funnel: a visitor pays BEFORE creating an account, so payment intent is
 * captured the moment it's hottest. The account is created afterwards on the success
 * page, and the payment is claimed once they register.
 *
 * Layout: a responsive two-panel split. On desktop the content sits on the left and a
 * full-height hero photograph fills the right, fading into the dark content panel. On
 * mobile the photograph becomes a banner at the top, fading down into the content.
 *
 * Flow:
 *   1. Fetch GET /api/founding-member/availability (public). If it 404s, the premium
 *      flow is disabled server-side → show the "coming soon" state.
 *   2. Visitor enters their email, clicks pay.
 *   3. POST /api/founding-member/checkout/guest → { paymentId, gatewayUrl }.
 *   4. Stash paymentId in sessionStorage, then full-redirect to Barion.
 *   5. Barion returns the browser to /founding-member/success.
 *
 * Already-logged-in visitors are nudged to the authenticated buy page (/app/founding-member),
 * which grants membership immediately via the webhook with no claim step.
 *
 * Tone: confident, warm, deferential — no exclamation marks, no motivational copy.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { useAuthStore } from '@/store/auth'
import { PaymentMethods } from '@/components/PaymentMethods'
import heroImage from '@/assets/founding-member-hero.png'

/** sessionStorage key used to carry the paymentId across the Barion redirect. */
export const PENDING_FM_PAYMENT_KEY = 'kalmio_pending_fm_payment_id'

function successUrl(): string {
  return `${window.location.origin}/founding-member/success`
}

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

  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<'capReached' | 'generic' | 'email' | 'accept' | null>(null)

  // Availability doubles as the server-side feature gate: 404 when premium is disabled.
  const availability = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
    retry: false,
  })

  const price = availability.data?.price ?? null
  const remaining = availability.data?.remaining ?? null
  const isSoldOut = availability.data ? availability.data.remaining === 0 : false

  async function handleCheckout() {
    setError(null)
    if (!isValidEmail(email)) {
      setError('email')
      return
    }
    if (!accepted) {
      setError('accept')
      return
    }
    setIsRedirecting(true)
    try {
      const result = await foundingMemberService.checkoutGuest(email.trim(), successUrl())
      // Carry the paymentId across the Barion round-trip so the success page can poll it.
      sessionStorage.setItem(PENDING_FM_PAYMENT_KEY, result.paymentId)
      window.location.href = result.gatewayUrl
    } catch (err: unknown) {
      setIsRedirecting(false)
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 409 ? 'capReached' : 'generic')
    }
  }

  // Feature gate: availability endpoint 404s when premium is disabled server-side.
  if (availability.isError) {
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

      {/* Already-logged-in nudge */}
      {!isSoldOut && session && (
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

      {/* Guest checkout form */}
      {!isSoldOut && !session && availability.isSuccess && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCheckout()
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

          {/* Mandatory ÁSZF acceptance — purchase is blocked until ticked */}
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
            disabled={isRedirecting || !accepted}
            aria-disabled={isRedirecting || !accepted}
            className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full mt-2"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t('foundingMember.buy.ctaLoading')}
              </>
            ) : (
              <>
                {t('guestFoundingMember.cta')}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="flex items-center gap-2 text-white/40 text-xs leading-relaxed mt-4">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            {t('guestFoundingMember.trust')}
          </p>
          <p className="text-white/40 text-xs leading-relaxed mt-3">
            {t('guestFoundingMember.afterPaymentNote')}
          </p>

          <div className="mt-6 pt-5 border-t border-white/10">
            <PaymentMethods align="start" />
          </div>
        </form>
      )}
    </SplitLayout>
  )
}
