/**
 * FoundingMember — Founding Member order page for signed-in users (/app/founding-member).
 *
 * Since Barion's 2026-11-12 review the lifetime tier is sold by bank transfer only
 * (docs/product/payments-subscriptions.md §2). Guarded by PremiumFeatureGate.
 *
 * Flow:
 *   1. GET /api/founding-member/availability — price, seats remaining.
 *      GET /api/founding-member/transfer-order — restores an open (or paid) order on reload.
 *   2. Members see the "already member" state; a paid-but-unclaimed guest order can be activated.
 *   3. "Megrendelem átutalással" opens the billing form → POST /api/founding-member/transfer-order
 *      → transfer instructions (beneficiary, account, amount, reference as közlemény, due date,
 *      díjbekérő). The order stays pending until an admin confirms the credited transfer, which
 *      grants the membership.
 *
 * Barion Pixel: contentView on the offer, addToCart + initiateCheckout when the form opens,
 * initiatePurchase when the order is placed, purchase once the order is confirmed.
 *
 * Tone: confident, warm, deferential — no exclamation marks, no motivational copy.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, Loader2 } from 'lucide-react'
import { foundingMemberService, FOUNDING_MEMBER_TRANSFER_ORDER_QUERY_KEY } from '@/services/foundingMember'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { PremiumFeatureGate } from '@/components/premium/PremiumFeatureGate'
import { PremiumFeatureList } from '@/components/premium/PremiumFeatureList'
import { BillingAddressForm } from '@/components/checkout/BillingAddressForm'
import { TransferInstructions } from '@/components/foundingMember/TransferInstructions'
import { EMPTY_BILLING, toBillingInfo, validateBilling, type BillingDraft, type BillingErrors } from '@/lib/billingDraft'
import { foundingMemberPixelProduct } from '@/lib/billingProducts'
import { markPurchaseTracked } from '@/lib/guestTransferOrder'
import { addToCart, contentView, initiateCheckout, initiatePurchase, purchase } from '@/lib/barionPixel'
import type { TransferOrderDto } from '@/types'

function FoundingMemberInner() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [formOpen, setFormOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [billing, setBilling] = useState<BillingDraft>(EMPTY_BILLING)
  const [billingErrors, setBillingErrors] = useState<BillingErrors>({})
  const [orderError, setOrderError] = useState<'capReached' | 'generic' | null>(null)

  const me = useQuery({ queryKey: USERS_ME_QUERY_KEY, queryFn: usersService.getMe, staleTime: 30_000 })
  const availability = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
  })
  const transferOrder = useQuery({
    queryKey: FOUNDING_MEMBER_TRANSFER_ORDER_QUERY_KEY,
    queryFn: foundingMemberService.getTransferOrder,
    staleTime: 30_000,
  })

  const isAlreadyMember = me.data?.foundingMember === true
  const isSoldOut = availability.data ? availability.data.remaining === 0 : false
  const price = availability.data?.price ?? null
  const remaining = availability.data?.remaining ?? null
  const order = transferOrder.data ?? null
  const pendingOrder = order?.status === 'PENDING' ? order : null
  const lapsedOrder = order && (order.status === 'CANCELLED' || order.status === 'EXPIRED') ? order : null
  const product = foundingMemberPixelProduct(price ?? undefined)

  // Recover a paid-but-unclaimed guest order so the user activates it instead of ordering twice.
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

  const placeOrder = useMutation({
    mutationFn: () => foundingMemberService.createTransferOrder(toBillingInfo(billing)),
    onSuccess: (created: TransferOrderDto) => {
      queryClient.setQueryData(FOUNDING_MEMBER_TRANSFER_ORDER_QUERY_KEY, created)
      initiatePurchase([foundingMemberPixelProduct(created.amountHuf)])
      setFormOpen(false)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      setOrderError(status === 409 ? 'capReached' : 'generic')
    },
  })

  const showOffer =
    me.isSuccess && transferOrder.isFetched && !isAlreadyMember && !pendingOrder && !isSoldOut && !unclaimedPaymentId

  // contentView once the offer is on screen.
  const viewedRef = useRef(false)
  useEffect(() => {
    if (viewedRef.current || !showOffer || !availability.isSuccess) return
    viewedRef.current = true
    contentView(product)
  }, [showOffer, availability.isSuccess, product])

  // purchase — once per confirmed transfer order.
  useEffect(() => {
    if (order?.status === 'SUCCEEDED' && markPurchaseTracked(order.reference)) {
      purchase([foundingMemberPixelProduct(order.amountHuf)])
    }
  }, [order])

  function openForm() {
    addToCart(product)
    initiateCheckout([product])
    setFormOpen(true)
  }

  function submit() {
    setOrderError(null)
    const errs = validateBilling(billing)
    setBillingErrors(errs)
    if (Object.keys(errs).length > 0 || !accepted) return
    placeOrder.mutate()
  }

  const loading = me.isLoading || transferOrder.isLoading

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
      <section className="max-w-md w-full">
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4 text-center">
          {t('foundingMember.buy.label')}
        </p>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-white/40" size={24} />
          </div>
        )}

        {/* Already a member */}
        {!loading && isAlreadyMember && (
          <>
            <h1 className="text-3xl font-semibold text-white mb-4 text-center leading-snug">
              {t('foundingMember.buy.headline')}
            </h1>
            <p className="text-white/80 text-base leading-relaxed mb-8 text-center">
              {t('foundingMember.buy.alreadyMember')}
            </p>
          </>
        )}

        {/* Order placed, waiting for the transfer */}
        {!loading && !isAlreadyMember && pendingOrder && (
          <>
            <h1 className="text-3xl font-semibold text-white mb-4 text-center leading-snug">
              {t('foundingMember.transfer.pendingTitle')}
            </h1>
            <p className="flex items-start gap-2 text-white/70 text-sm leading-relaxed mb-8">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#F28C28]" aria-hidden="true" />
              {t('foundingMember.transfer.pendingBody')}
            </p>
            <TransferInstructions order={pendingOrder} />
            <div className="mt-10 text-center">
              <Link to="/app" className="text-sm font-medium text-white/50 hover:text-white/80 underline underline-offset-4">
                {t('foundingMember.comingSoonBack')}
              </Link>
            </div>
          </>
        )}

        {/* Offer, recovery, sold out */}
        {!loading && !isAlreadyMember && !pendingOrder && (
          <>
            <h1 className="text-3xl font-semibold text-white mb-4 text-center leading-snug">
              {t('foundingMember.buy.headline')}
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8 text-center">{t('foundingMember.buy.sub')}</p>

            {availability.isSuccess && (
              <div className="bg-white/5 rounded-2xl px-6 py-6 mb-8 text-center">
                {price !== null && (
                  <p className="text-white text-2xl font-semibold mb-2">{t('foundingMember.buy.priceLine', { price })}</p>
                )}
                {remaining !== null && !isSoldOut && (
                  <p className="text-white/60 text-sm">{t('foundingMember.buy.remainingLine', { remaining })}</p>
                )}
                <p className="text-white/50 text-xs mt-3">{t('foundingMember.transfer.onlyByTransfer')}</p>
              </div>
            )}

            {availability.isLoading && (
              <div className="bg-white/5 rounded-2xl px-6 py-6 mb-8 text-center">
                <p className="text-white/40 text-sm">{t('foundingMember.buy.loading')}</p>
              </div>
            )}

            {lapsedOrder && !isSoldOut && (
              <p className="text-white/60 text-sm leading-relaxed mb-6 text-center">
                {t('foundingMember.transfer.lapsed', { reference: lapsedOrder.reference })}
              </p>
            )}

            {isSoldOut && (
              <div className="text-center">
                <p className="text-white text-xl font-semibold mb-2">{t('foundingMember.buy.soldOutTitle')}</p>
                <p className="text-white/70 text-base leading-relaxed mb-6">{t('foundingMember.buy.soldOutSub')}</p>
                <Link to="/app/premium" className="text-sm font-medium text-[#F28C28] underline underline-offset-4">
                  {t('foundingMember.transfer.subscriptionAlternative')}
                </Link>
              </div>
            )}

            {/* Paid-but-unclaimed guest order — activate instead of ordering again */}
            {!isSoldOut && unclaimedPaymentId && (
              <div className="text-center">
                <p className="text-white/80 text-base leading-relaxed mb-2">{t('foundingMember.buy.recover.found')}</p>
                {activate.isError && (
                  <p className="text-red-400 text-sm mb-3" role="alert">{t('foundingMember.buy.recover.error')}</p>
                )}
                <button
                  type="button"
                  onClick={() => activate.mutate(unclaimedPaymentId)}
                  disabled={activate.isPending}
                  aria-disabled={activate.isPending}
                  className="inline-flex items-center justify-center bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full sm:w-auto"
                >
                  {activate.isPending ? t('foundingMember.buy.recover.activating') : t('foundingMember.buy.recover.cta')}
                </button>
              </div>
            )}

            {showOffer && !formOpen && (
              <>
                <PremiumFeatureList className="mb-8" />
                <p className="text-white/60 text-sm leading-relaxed mb-6">{t('foundingMember.transfer.howItWorks')}</p>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={openForm}
                    disabled={availability.isLoading}
                    className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full sm:w-auto"
                  >
                    {t('foundingMember.transfer.cta')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-5">
                    <Link to="/app/premium" className="text-sm text-white/50 hover:text-white/80 underline underline-offset-4">
                      {t('foundingMember.transfer.subscriptionAlternative')}
                    </Link>
                  </p>
                </div>
              </>
            )}

            {showOffer && formOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <BillingAddressForm
                  value={billing}
                  onChange={setBilling}
                  errors={billingErrors}
                  onClearError={(f) => setBillingErrors((p) => ({ ...p, [f]: false }))}
                  idPrefix="fm-billing"
                />

                <label className="flex items-start gap-2.5 mt-6 mb-4 cursor-pointer select-none">
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

                {orderError && (
                  <p className="text-red-400 text-sm mb-4" role="alert">
                    {t(`foundingMember.transfer.errors.${orderError}`)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={placeOrder.isPending || !accepted}
                  aria-disabled={placeOrder.isPending || !accepted}
                  className="inline-flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#e07820] disabled:bg-[#F28C28]/50 text-white font-bold text-base px-10 py-4 rounded-full transition-colors w-full"
                >
                  {placeOrder.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {t('foundingMember.transfer.submitting')}
                    </>
                  ) : (
                    t('foundingMember.transfer.submit')
                  )}
                </button>
                <p className="text-white/40 text-xs leading-relaxed mt-4">{t('foundingMember.transfer.afterOrderNote')}</p>
              </form>
            )}
          </>
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
            <p className="text-white/60 text-base leading-relaxed mb-10">{t('foundingMember.comingSoonSub')}</p>
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
