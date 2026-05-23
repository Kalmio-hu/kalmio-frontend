/**
 * ShoppingCart — multi-plan aggregated shopping cart.
 *
 * Powered by BE2's POST /api/shopping-cart/generate endpoint.
 *
 * Features:
 * - Cadence window selector (next 3 / 7 / 14 / 30 days)
 * - Aggregated ingredient list with per-item check-off (localStorage, session-only)
 * - Source plans drill-down per line item
 * - "Mark all as shopped" — calls POST /api/shopping-cart/{cartId}/mark-shopped
 * - Leftover-rescue visual flag: items from returned-to-fridge dispositions
 *   (BE4 data not yet available — placeholder rendered, not yet populated)
 *
 * Route: /app/cart
 *
 * KALMIO-289: Converted from useMutation+useEffect to useQuery so the cart is
 * cached for `staleTime` and survives tab switching without a re-fetch.
 * Check-off state is now keyed on a stable date-range hash (windowDays) rather
 * than the server-generated cartId, so back-navigation restores checkmarks.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ShoppingCart as CartIcon, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { shoppingCartService } from '@/services/shoppingCartService'
import { useAuthStore } from '@/store/auth'
import { todayIsoLocal, addDaysIsoLocal } from '@/lib/utils'
import type { ShoppingCartResponse, CartLineItemResponse } from '@/types'

const WINDOW_OPTIONS = [
  { days: 3, labelKey: 'cart.window.days3' },
  { days: 7, labelKey: 'cart.window.days7' },
  { days: 14, labelKey: 'cart.window.days14' },
  { days: 30, labelKey: 'cart.window.days30' },
]

/**
 * Stable localStorage key: keyed on userId + windowDays (not server cartId).
 * This means check state survives a tab switch because the query key is the same.
 */
const CART_CHECK_KEY = (userId: string, windowDays: number) =>
  `cart-checked-${userId}-${windowDays}d`

function readChecked(userId: string, windowDays: number): Set<string> {
  try {
    const raw = localStorage.getItem(CART_CHECK_KEY(userId, windowDays))
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>()
  } catch {
    return new Set<string>()
  }
}

function writeChecked(userId: string, windowDays: number, checked: Set<string>) {
  try {
    localStorage.setItem(CART_CHECK_KEY(userId, windowDays), JSON.stringify([...checked]))
  } catch {
    /* storage unavailable */
  }
}

export function ShoppingCart() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const userId = useAuthStore(s => s.user?.id ?? '')

  const [windowDays, setWindowDays] = useState(7)
  const [markedShopped, setMarkedShopped] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // ── Derive date window ────────────────────────────────────────────────────
  const windowStart = todayIsoLocal()
  const windowEnd = addDaysIsoLocal(new Date(), windowDays)

  // ── Fetch cart via useQuery — cached for 60s, shared across tab switches ──
  const {
    data: cart,
    isFetching,
    isError,
  } = useQuery<ShoppingCartResponse>({
    queryKey: ['shopping-cart', windowDays],
    queryFn: () => shoppingCartService.generate({ windowStart, windowEnd }),
    staleTime: 60_000,
  })

  // ── Check-off state — localStorage keyed on (userId, windowDays) ──────────
  // Initialised lazily from localStorage so back-nav restores checkmarks.
  const [checked, setChecked] = useState<Set<string>>(() =>
    readChecked(userId, windowDays),
  )

  function handleWindowChange(days: number) {
    setWindowDays(days)
    setMarkedShopped(false)
    // Load persisted check state for the new window immediately
    setChecked(readChecked(userId, days))
  }

  function toggleCheck(ingredientId: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      writeChecked(userId, windowDays, next)
      return next
    })
  }

  function toggleExpand(ingredientId: string) {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      return next
    })
  }

  // ── Mark shopped mutation ─────────────────────────────────────────────────
  const markShoppedMutation = useMutation({
    mutationFn: () => shoppingCartService.markShopped(cart!.cartId),
    onSuccess: data => {
      // Update the cached cart in place
      queryClient.setQueryData<ShoppingCartResponse>(['shopping-cart', windowDays], data)
      setMarkedShopped(true)
      queryClient.invalidateQueries({ queryKey: ['multiMemberPlan'] })
    },
  })

  const allChecked =
    (cart?.lineItems.length ?? 0) > 0 &&
    cart!.lineItems.every(li => checked.has(li.ingredientId))

  return (
    <div>
      <Header
        title={t('cart.title')}
        subtitle={cart ? t('cart.subtitle', { planCount: cart.planIds.length }) : undefined}
      />

      {/* Window selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {WINDOW_OPTIONS.map(opt => (
          <button
            key={opt.days}
            type="button"
            onClick={() => handleWindowChange(opt.days)}
            aria-pressed={windowDays === opt.days}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
              ${windowDays === opt.days
                ? 'bg-[#4f7942] text-white border-[#4f7942]'
                : 'bg-white text-[#1a1a1a] border-[#e5e7eb] hover:bg-[#f3f4f6]'}
            `}
          >
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isFetching && !cart && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-[#6b7280]">{t('cart.generating')}</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {cart && cart.lineItems.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <CartIcon className="h-10 w-10 text-[#6b7280] mb-3" />
            <p className="font-semibold text-[#1a1a1a]">{t('cart.empty.title')}</p>
            <p className="text-sm text-[#6b7280] mt-1">{t('cart.empty.desc')}</p>
          </CardContent>
        </Card>
      )}

      {/* Cart content */}
      {cart && cart.lineItems.length > 0 && (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-[#6b7280]">
              {t('cart.itemCount', { count: cart.lineItems.length })}
            </p>
            <p className="text-xs text-[#9ca3af]">
              {cart.windowStart} – {cart.windowEnd}
            </p>
          </div>

          {/* "Mark all shopped" CTA */}
          {markedShopped ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-[#4f7942]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {t('cart.markedShopped')}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => markShoppedMutation.mutate()}
              disabled={markShoppedMutation.isPending}
              className="
                w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-[#4f7942] text-white text-sm font-semibold
                hover:bg-[#3d6132] transition-colors disabled:opacity-50
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942]
              "
            >
              {markShoppedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('cart.markShoppedCta')}
            </button>
          )}

          {/* BE4 leftover-rescue note */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] text-xs text-[#0369a1]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{t('cart.leftoversRescueNotice')}</span>
          </div>

          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{t('cart.ingredientsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 divide-y divide-[#f0ede8]">
              {cart.lineItems.map(li => (
                <CartLineItem
                  key={li.ingredientId}
                  item={li}
                  isChecked={checked.has(li.ingredientId)}
                  isExpanded={expandedItems.has(li.ingredientId)}
                  onToggleCheck={() => toggleCheck(li.ingredientId)}
                  onToggleExpand={() => toggleExpand(li.ingredientId)}
                />
              ))}
            </CardContent>
          </Card>

          {/* All-checked nudge */}
          {allChecked && !markedShopped && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-[#4f7942]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {t('cart.allCheckedNudge')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CartLineItem({
  item,
  isChecked,
  isExpanded,
  onToggleCheck,
  onToggleExpand,
}: {
  item: CartLineItemResponse
  isChecked: boolean
  isExpanded: boolean
  onToggleCheck: () => void
  onToggleExpand: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className={`py-3 transition-opacity ${isChecked ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        {/* Check-off button */}
        <button
          type="button"
          aria-pressed={isChecked}
          aria-label={t('cart.checkItem', { name: item.ingredientName })}
          onClick={onToggleCheck}
          className={`
            shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942]
            ${isChecked
              ? 'bg-[#4f7942] border-[#4f7942]'
              : 'border-[#d1d5db] hover:border-[#4f7942]'}
          `}
        >
          {isChecked && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Ingredient info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-[#1a1a1a] ${isChecked ? 'line-through' : ''}`}>
            {item.ingredientName}
          </p>
          <p className="text-xs text-[#6b7280]">
            {item.totalAmount % 1 === 0
              ? item.totalAmount.toString()
              : item.totalAmount.toFixed(1)} {item.unit}
          </p>
        </div>

        {/* Source plans drill-down toggle */}
        {item.sourcePlanIds.length > 0 && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            aria-label={t('cart.showSourcePlans')}
            className="shrink-0 p-1 rounded text-[#9ca3af] hover:text-[#4f46e5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
          >
            {isExpanded
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Source plans (expanded) */}
      {isExpanded && item.sourcePlanIds.length > 0 && (
        <div className="ml-8 mt-2 space-y-0.5">
          {item.sourcePlanIds.map(planId => (
            <p key={planId} className="text-xs text-[#6b7280]">
              {t('cart.sourcePlan')}: <span className="font-mono text-[10px]">{planId.slice(0, 8)}…</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
