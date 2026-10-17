/**
 * ShoppingList — the one shopping surface.
 *
 * Backed by the shopping cart: fridge-deducted amounts for the active plan's current
 * cycle, aisle grouping in the user's own order, persisted ticks, ad-hoc lines, retail
 * prices with package arithmetic, mark-shopped into the fridge, and receipt scanning.
 *
 * Designed for one-handed in-store use: 44 px rows, sticky aisle headers, undo toast.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, ChevronUp, ExternalLink, Link2, Loader2, Plus, ReceiptText, RefreshCw, Search, ShoppingBag, ShoppingCart as CartIcon, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { MarkShoppedToast } from '@/components/shopping/MarkShoppedToast'
import { planService } from '@/services/plans'
import { shoppingCartService } from '@/services/shoppingCartService'
import { retailService, RETAIL_PROVIDERS_QUERY_KEY } from '@/services/retail'
import { useRetailConnect } from '@/hooks/useRetailConnect'
import { RetailConnectManualDialog } from '@/components/retail/RetailConnectManualDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import shoppingCategoryOrderService, { SHOPPING_CATEGORY_ORDER_QUERY_KEY } from '@/services/shoppingCategoryOrder'
import { useIsUserPremium } from '@/hooks/useIsUserPremium'
import { useSyncInvalidation } from '@/hooks/useSyncInvalidation'
import { formatCurrency } from '@/lib/utils'
import { capture } from '@/lib/analytics'
import type { CartLineItemResponse, Ingredient, RetailHandoffResponse, RetailProvider, ShoppingCartResponse, ShoppingCategory } from '@/types'

const CART_QUERY_KEY = ['shopping-cart', 'current'] as const

const DEFAULT_ORDER: ShoppingCategory[] = [
  'PRODUCE', 'BAKERY', 'DAIRY', 'MEAT', 'FISH', 'DELI', 'FROZEN', 'PANTRY',
  'CANNED', 'CONDIMENTS', 'BEVERAGES', 'SNACKS', 'HOUSEHOLD', 'PERSONAL_CARE', 'OTHER',
]

function fmtAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return ''
  const n = Number.isInteger(amount) ? amount.toString() : amount.toFixed(1).replace(/\.0$/, '')
  return unit ? `${n} ${unit.toLowerCase() === 'piece' ? 'db' : unit.toLowerCase()}` : n
}

function isCovered(item: CartLineItemResponse): boolean {
  return item.source === 'PLAN' && item.totalAmount != null && item.totalAmount <= 0
}

function withBought(cart: ShoppingCartResponse | null | undefined, itemId: string, bought: boolean) {
  if (!cart) return cart
  return { ...cart, lineItems: cart.lineItems.map(l => (l.id === itemId ? { ...l, bought } : l)) }
}

// ── Row ───────────────────────────────────────────────────────────────────

function ItemRow({
  item, currency, onTick, onRemove,
}: {
  item: CartLineItemResponse
  currency: string | null
  onTick: (item: CartLineItemResponse) => void
  onRemove: (item: CartLineItemResponse) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const covered = isCovered(item)
  const ticked = item.bought || covered
  const retail = item.retailProduct

  return (
    <li className={`px-4 ${ticked ? 'bg-white' : 'bg-white'}`}>
      <div className="flex items-center gap-3 min-h-[44px] py-2">
        <button
          type="button"
          onClick={() => !covered && onTick(item)}
          aria-pressed={ticked}
          aria-label={t('shoppingList.tickAria', { name: item.ingredientName })}
          disabled={covered}
          className={[
            'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
            ticked ? 'bg-[#4F7942] border-[#4F7942]' : 'border-neutral-300 bg-white',
            covered ? 'opacity-60' : '',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]',
          ].join(' ')}
        >
          {ticked && <Check size={14} className="text-white" strokeWidth={3} />}
        </button>

        <button
          type="button"
          onClick={() => !covered && onTick(item)}
          className="flex-1 min-w-0 text-left"
        >
          <span className="flex items-baseline gap-2 min-w-0">
            <span className={`text-[15px] leading-snug truncate ${ticked ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
              {item.ingredientName}
            </span>
            {item.source === 'ADHOC' && (
              <span className="text-[10px] uppercase tracking-wide text-[#F28C28] shrink-0">{t('shoppingList.adhocBadge')}</span>
            )}
          </span>
          <span className="block text-[12px] text-neutral-500 truncate">
            {covered
              ? t('shoppingList.covered')
              : item.fridgeAmount != null && item.fridgeAmount > 0 && item.requiredAmount != null
                ? t('shoppingList.deducted', {
                    need: fmtAmount(item.requiredAmount, item.unit),
                    have: fmtAmount(item.fridgeAmount, item.unit),
                  })
                : null}
          </span>
        </button>

        <div className="shrink-0 text-right">
          <span className={`block text-[13px] tabular-nums ${ticked ? 'text-neutral-400' : 'text-neutral-700'}`}>
            {fmtAmount(item.totalAmount, item.unit)}
          </span>
          {item.estimatedCost != null && item.estimatedCost > 0 && (
            <span className="block text-[11px] text-neutral-400 tabular-nums">
              ~{formatCurrency(item.estimatedCost, currency ?? 'HUF')}
            </span>
          )}
        </div>

        {retail ? (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-label={t('shoppingList.retailDetails')}
            className="shrink-0 p-1 text-neutral-400 hover:text-[#4F7942]"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : item.source === 'ADHOC' ? (
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={t('shoppingList.removeItem', { name: item.ingredientName })}
            className="shrink-0 p-1 text-neutral-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {expanded && retail && (
        <div className="ml-9 mb-2 text-[12px] text-neutral-500 space-y-0.5">
          <p>
            {retail.providerName && <span className="font-medium text-neutral-600">{retail.providerName} · </span>}
            {retail.name}{retail.brand ? ` · ${retail.brand}` : ''} — {formatCurrency(retail.price, currency ?? 'HUF')} / {fmtAmount(retail.packageSize, retail.unit)}
          </p>
          {retail.listPrice != null && retail.listPrice > retail.price && (
            <p className="text-[#F28C28]">
              {t('shoppingList.sale', { list: formatCurrency(retail.listPrice, currency ?? 'HUF') })}
              {retail.saleValidTill ? ` · ${t('shoppingList.saleUntil', { date: new Date(retail.saleValidTill).toLocaleDateString() })}` : ''}
            </p>
          )}
          {retail.packagesNeeded != null && retail.packagesNeeded > 0 && (
            <p>{t('shoppingList.packages', { count: retail.packagesNeeded })}</p>
          )}
          {retail.leftoverAmount != null && retail.leftoverAmount > 0 && (
            <p>{t('shoppingList.leftover', { amount: fmtAmount(retail.leftoverAmount, retail.unit) })}{retail.leftoverCost != null ? ` (~${formatCurrency(retail.leftoverCost, currency ?? 'HUF')})` : ''}</p>
          )}
          {retail.remoteUrl && (
            <a href={retail.remoteUrl} target="_blank" rel="noreferrer" className="text-[#4F7942] underline">
              {t('shoppingList.openProduct')}
            </a>
          )}
        </div>
      )}
    </li>
  )
}

// ── Add item ──────────────────────────────────────────────────────────────

function AddItemForm({ cartId, onDone }: { cartId: string; onDone: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const addMutation = useMutation({
    mutationFn: () =>
      shoppingCartService.addItem(cartId, {
        ingredientId: ingredient?.id ?? null,
        adhocName: ingredient ? null : name.trim(),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CART_QUERY_KEY })
      onDone()
    },
    onError: () => toast({ title: t('shoppingList.errors.add'), variant: 'destructive' }),
  })

  const canSubmit = ingredient !== null || name.trim().length > 0

  return (
    <form
      onSubmit={e => { e.preventDefault(); if (canSubmit) addMutation.mutate() }}
      className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-2"
    >
      <Input
        autoFocus
        value={name}
        onChange={e => { setName(e.target.value); setIngredient(null) }}
        placeholder={t('shoppingList.addItemPlaceholder')}
        aria-label={t('shoppingList.addItem')}
        className="flex-1"
      />
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label={t('shoppingList.pickFromCatalog')}
        title={t('shoppingList.pickFromCatalog')}
        className="p-2 rounded-lg text-neutral-500 hover:text-[#4F7942] hover:bg-neutral-100"
      >
        <Search size={18} />
      </button>
      <Button type="submit" size="sm" disabled={!canSubmit || addMutation.isPending}>
        {addMutation.isPending ? t('shoppingList.adding') : t('shoppingList.add')}
      </Button>
      <button type="button" onClick={onDone} aria-label={t('common.cancel')} className="p-2 text-neutral-500 hover:text-neutral-800">
        <X size={18} />
      </button>
      <IngredientSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={ing => { setIngredient(ing); setName(ing.name); setSearchOpen(false) }}
      />
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function ShoppingList() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const isPremium = useIsUserPremium()
  const [showAdd, setShowAdd] = useState(false)
  const [shoppedResult, setShoppedResult] = useState<number | null>(null)
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useSyncInvalidation([CART_QUERY_KEY])

  const { data: activePlan, isLoading: planLoading } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const { data: cart, isLoading: cartLoading, isError } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => shoppingCartService.current(),
    staleTime: 30_000,
  })

  const { data: orderData } = useQuery({
    queryKey: SHOPPING_CATEGORY_ORDER_QUERY_KEY,
    queryFn: shoppingCategoryOrderService.getOrder,
    staleTime: 5 * 60_000,
  })
  const order = orderData?.order ?? DEFAULT_ORDER

  // Retail partners with a basket handoff: show one button per active, enabled MCP provider that
  // prices at least one open line. Connected → send; not connected → start linking.
  const { data: providers = [] } = useQuery({
    queryKey: RETAIL_PROVIDERS_QUERY_KEY,
    queryFn: retailService.listProviders,
    staleTime: 60_000,
  })
  const connect = useRetailConnect()
  const [handoffResult, setHandoffResult] = useState<RetailHandoffResponse | null>(null)
  const handoffMutation = useMutation({
    mutationFn: (providerId: string) => shoppingCartService.handoff(cart!.cartId, providerId),
    onSuccess: (res) => {
      setHandoffResult(res)
      capture('retail_basket_handoff', { provider: res.providerCode, sent: res.sent.length, failed: res.failed.length, skipped: res.skipped.length })
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        void qc.invalidateQueries({ queryKey: RETAIL_PROVIDERS_QUERY_KEY })
        toast({ title: t('shoppingList.handoff.notConnected', { provider: 'Kifli' }), variant: 'destructive' })
      } else {
        toast({ title: t('shoppingList.handoff.error'), variant: 'destructive' })
      }
    },
  })
  const handoffProviders: RetailProvider[] = useMemo(() => {
    if (!cart) return []
    const withLines = new Set(cart.lineItems.filter(l => !l.bought && l.retailProduct?.providerId).map(l => l.retailProduct!.providerId as string))
    return providers.filter(p => p.active && p.enabled && p.handoffType === 'MCP' && withLines.has(p.id))
  }, [cart, providers])
  const providerLabel = (p: RetailProvider) => (p.code === 'KIFLI' ? 'Kifli' : p.name)

  const generateMutation = useMutation({
    mutationFn: () => shoppingCartService.generate({ planId: activePlan?.id ?? null }),
    onSuccess: (generated) => {
      qc.setQueryData(CART_QUERY_KEY, generated)
      setShoppedResult(null)
      capture('shopping_cart_generated', { items: generated.lineItems.length, planId: generated.planId })
    },
    onError: () => toast({ title: t('shoppingList.errors.generate'), variant: 'destructive' }),
  })

  const toggleMutation = useMutation({
    mutationFn: (vars: { itemId: string; bought: boolean }) => shoppingCartService.toggleItem(vars.itemId, vars.bought),
    onMutate: async ({ itemId, bought }) => {
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
      const snapshot = qc.getQueryData<ShoppingCartResponse | null>(CART_QUERY_KEY)
      qc.setQueryData<ShoppingCartResponse | null>(CART_QUERY_KEY, prev => withBought(prev, itemId, bought) ?? prev)
      return { snapshot }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot !== undefined) qc.setQueryData(CART_QUERY_KEY, ctx.snapshot)
      toast({ title: t('shoppingList.errors.tick'), variant: 'destructive' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => shoppingCartService.deleteItem(itemId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: CART_QUERY_KEY }),
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const markShoppedMutation = useMutation({
    mutationFn: () => shoppingCartService.markShopped(cart!.cartId),
    onSuccess: (res) => {
      setShoppedResult(res.fridgeItemsAdded ?? 0)
      qc.setQueryData(CART_QUERY_KEY, null)
      void qc.invalidateQueries({ queryKey: ['fridge'] })
      capture('cart_marked_shopped', { fridgeItemsAdded: res.fridgeItemsAdded ?? 0 })
    },
    onError: () => toast({ title: t('shoppingList.errors.markShopped'), variant: 'destructive' }),
  })

  const handleTick = useCallback((item: CartLineItemResponse) => {
    const next = !item.bought
    toggleMutation.mutate({ itemId: item.id, bought: next })
    const existing = undoTimers.current.get(item.id)
    if (existing) clearTimeout(existing)
    if (next) {
      undoTimers.current.set(item.id, setTimeout(() => undoTimers.current.delete(item.id), 5000))
      toast({ title: t('shoppingList.itemTicked', { name: item.ingredientName }), description: t('shoppingList.undoHint'), duration: 4000 })
    }
  }, [toggleMutation, t])

  // Group by aisle in the user's order; covered lines go to their own section at the bottom.
  const { groups, covered, ticked, total } = useMemo(() => {
    const items = cart?.lineItems ?? []
    const coveredItems = items.filter(isCovered)
    const open = items.filter(i => !isCovered(i))
    const byCat = new Map<ShoppingCategory, CartLineItemResponse[]>()
    for (const i of open) {
      const cat = (order.includes(i.shoppingCategory) ? i.shoppingCategory : 'OTHER') as ShoppingCategory
      byCat.set(cat, [...(byCat.get(cat) ?? []), i])
    }
    const grouped = order
      .filter(c => byCat.has(c))
      .map(c => {
        const list = byCat.get(c)!
        return { category: c, items: [...list.filter(i => !i.bought), ...list.filter(i => i.bought)] }
      })
    return {
      groups: grouped,
      covered: coveredItems,
      ticked: open.filter(i => i.bought).length,
      total: open.length,
    }
  }, [cart, order])

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB', { month: 'short', day: 'numeric' }).format(new Date(iso))

  const loading = planLoading || cartLoading

  async function handleReceipt() {
    try {
      const c = cart ?? (await shoppingCartService.generate({ planId: activePlan?.id ?? null }))
      navigate(`/app/cart/${c.cartId}/receipt`)
    } catch {
      toast({ title: t('shoppingList.errors.generate'), variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col pb-28">
      <Header
        title={t('shoppingList.title')}
        subtitle={cart ? t('shoppingList.window', { start: formatDate(cart.windowStart), end: formatDate(cart.windowEnd) }) : undefined}
        actions={
          cart ? (
            <div className="flex items-center gap-2">
              {total > 0 && (
                <span className="text-sm tabular-nums text-neutral-500">{ticked} / {total}</span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                title={t('shoppingList.regenerateHint')}
                aria-label={t('shoppingList.regenerate')}
              >
                <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          ) : undefined
        }
      />

      {shoppedResult !== null && (
        <div className="mb-4"><MarkShoppedToast fridgeItemsAdded={shoppedResult} /></div>
      )}

      {loading && (
        <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>
      )}

      {!loading && isError && (
        <Card className="border-red-200"><CardContent className="py-6">
          <p className="text-sm text-red-600">{t('shoppingList.errors.load')}</p>
        </CardContent></Card>
      )}

      {!loading && !isError && !cart && !activePlan && (
        <Card><CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <CartIcon className="h-10 w-10 text-neutral-400" />
          <p className="font-semibold text-[#1A1A1A]">{t('shoppingList.noPlan.title')}</p>
          <p className="text-sm text-neutral-500 max-w-xs">{t('shoppingList.noPlan.desc')}</p>
          <Button onClick={() => navigate('/app/plans')}>{t('shoppingList.noPlan.button')}</Button>
        </CardContent></Card>
      )}

      {!loading && !isError && !cart && activePlan && (
        <Card><CardContent className="py-12 flex flex-col items-center text-center gap-3">
          <CartIcon className="h-10 w-10 text-neutral-400" />
          <p className="font-semibold text-[#1A1A1A]">{t('shoppingList.empty.title')}</p>
          <p className="text-sm text-neutral-500 max-w-xs">{t('shoppingList.empty.body')}</p>
          <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="min-h-[44px] px-6">
            {generateMutation.isPending ? t('shoppingList.generating') : t('shoppingList.empty.generate')}
          </Button>
        </CardContent></Card>
      )}

      {cart && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card><CardContent className="py-3">
              <p className="text-xs text-neutral-500">{t('shoppingList.summary.items')}</p>
              <p className="text-xl font-headline font-bold text-[#1A1A1A]">{total}</p>
              {covered.length > 0 && (
                <p className="text-[11px] text-[#4F7942]">{t('shoppingList.summary.covered', { count: covered.length })}</p>
              )}
            </CardContent></Card>
            <Card><CardContent className="py-3">
              <p className="text-xs text-neutral-500">{t('shoppingList.summary.estimatedTotal')}</p>
              <p className="text-xl font-headline font-bold text-[#1A1A1A]">
                {cart.totalCost != null
                  ? formatCurrency(cart.totalCost + (cart.totalLeftoverCost ?? 0), cart.currency ?? 'HUF')
                  : '—'}
              </p>
              {cart.totalCost != null && cart.totalLeftoverCost != null && cart.totalLeftoverCost > 0 && (
                <p className="text-[11px] text-neutral-500">
                  {t('shoppingList.summary.usedByRecipes', { cost: formatCurrency(cart.totalCost, cart.currency ?? 'HUF') })}
                </p>
              )}
              {cart.totalLeftoverCost != null && cart.totalLeftoverCost > 0 && (
                <p className="text-[11px] text-orange-600">
                  {t('shoppingList.summary.leftovers', { cost: formatCurrency(cart.totalLeftoverCost, cart.currency ?? 'HUF') })}
                </p>
              )}
            </CardContent></Card>
          </div>

          {/* Add item */}
          {showAdd ? (
            <AddItemForm cartId={cart.cartId} onDone={() => setShowAdd(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-[14px] text-neutral-600 border border-neutral-300 rounded-full px-4 py-2 min-h-[44px] hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]"
            >
              <Plus size={16} aria-hidden /> {t('shoppingList.addItem')}
            </button>
          )}

          {/* Aisles */}
          {groups.length === 0 && covered.length > 0 && (
            <Card><CardContent className="py-8 text-center">
              <p className="font-semibold text-[#1A1A1A]">{t('shoppingList.allInFridge.title')}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('shoppingList.allInFridge.desc')}</p>
            </CardContent></Card>
          )}
          {groups.length === 0 && covered.length === 0 && (
            <Card><CardContent className="py-8 text-center">
              <p className="font-semibold text-[#1A1A1A]">{t('shoppingList.nothingToBuy.title')}</p>
              <p className="text-sm text-neutral-500 mt-1">{t('shoppingList.nothingToBuy.desc')}</p>
            </CardContent></Card>
          )}
          <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white">
            {groups.map(group => (
              <section key={group.category}>
                <h2 className="sticky top-0 z-10 px-4 py-2 bg-neutral-100 text-[12px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                  {t(`shoppingList.categories.${group.category}`, group.category)}
                </h2>
                <ul className="divide-y divide-neutral-100">
                  {group.items.map(item => (
                    <ItemRow key={item.id} item={item} currency={cart.currency} onTick={handleTick} onRemove={i => removeMutation.mutate(i.id)} />
                  ))}
                </ul>
              </section>
            ))}
            {covered.length > 0 && (
              <section>
                <h2 className="sticky top-0 z-10 px-4 py-2 bg-[#eef6eb] text-[12px] font-semibold uppercase tracking-wider text-[#4F7942] border-b border-[#d4e8ce]">
                  {t('shoppingList.coveredSection')}
                </h2>
                <ul className="divide-y divide-neutral-100">
                  {covered.map(item => (
                    <ItemRow key={item.id} item={item} currency={cart.currency} onTick={handleTick} onRemove={i => removeMutation.mutate(i.id)} />
                  ))}
                </ul>
              </section>
            )}
          </div>

          {total > 0 && ticked === total && (
            <p className="text-center text-sm text-neutral-500">{t('shoppingList.allDone')}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {handoffProviders.map((p) => (
              p.connected ? (
                <Button
                  key={p.id}
                  onClick={() => handoffMutation.mutate(p.id)}
                  disabled={handoffMutation.isPending}
                  className="w-full min-h-[48px] bg-[#1A1A1A] hover:bg-black text-white"
                >
                  {handoffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  {handoffMutation.isPending ? t('shoppingList.handoff.sending') : t('shoppingList.handoff.cta', { provider: providerLabel(p) })}
                </Button>
              ) : (
                <Button
                  key={p.id}
                  variant="secondary"
                  onClick={() => connect.start.mutate(p.id)}
                  disabled={connect.start.isPending}
                  className="w-full min-h-[48px]"
                >
                  <Link2 className="h-4 w-4" /> {t('shoppingList.handoff.connectCta', { provider: providerLabel(p) })}
                </Button>
              )
            ))}
            <Button
              onClick={() => markShoppedMutation.mutate()}
              disabled={markShoppedMutation.isPending || cart.lineItems.length === 0}
              className="w-full min-h-[48px] bg-[#4F7942] hover:bg-[#3d6132]"
            >
              {markShoppedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t('shoppingList.markShoppedCta')}
            </Button>
            {isPremium && (
              <Button variant="secondary" onClick={() => void handleReceipt()} className="w-full min-h-[44px]">
                <ReceiptText className="h-4 w-4" /> {t('shoppingList.receipt')}
              </Button>
            )}
            {cart.planId && (
              <Link to={`/app/plans/${cart.planId}`} className="text-center text-sm text-[#4F7942] underline-offset-2 hover:underline">
                {t('shoppingList.backToPlan')}
              </Link>
            )}
          </div>
        </div>
      )}

      <RetailConnectManualDialog
        manual={connect.manual}
        onClose={() => connect.setManual(null)}
        onSubmit={(args) => connect.finish.mutate(args)}
        pending={connect.finish.isPending}
      />

      <Dialog open={!!handoffResult} onOpenChange={(o) => { if (!o) setHandoffResult(null) }}>
        <DialogContent>
          {handoffResult && (() => {
            const label = handoffResult.providerCode === 'KIFLI' ? 'Kifli' : handoffResult.providerName
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{t('shoppingList.handoff.title')}</DialogTitle>
                  <DialogDescription>
                    {handoffResult.sent.length > 0
                      ? t('shoppingList.handoff.sentSummary', { count: handoffResult.sent.length, provider: label })
                      : t('shoppingList.handoff.nothing')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  {handoffResult.failed.length > 0 && (
                    <div>
                      <p className="text-red-700">{t('shoppingList.handoff.failed', { count: handoffResult.failed.length })}</p>
                      <ul className="mt-1 text-xs text-neutral-600 list-disc pl-5">
                        {handoffResult.failed.map(f => <li key={f.lineItemId}>{f.name}{f.reason ? ` — ${f.reason}` : ''}</li>)}
                      </ul>
                    </div>
                  )}
                  {handoffResult.skipped.length > 0 && (
                    <p className="text-neutral-500 text-xs">{t('shoppingList.handoff.skipped', { count: handoffResult.skipped.length })}</p>
                  )}
                  {handoffResult.cartUrl && handoffResult.sent.length > 0 && (
                    <a
                      href={handoffResult.cartUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-[#4F7942] text-white font-medium hover:bg-[#3d6132]"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden /> {t('shoppingList.handoff.open', { provider: label })}
                    </a>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
