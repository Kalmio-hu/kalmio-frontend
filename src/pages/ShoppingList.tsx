import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart, ExternalLink, AlertCircle, Package, Archive,
  Refrigerator, Check, Printer, Copy, Mail,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { fridgeService } from '@/services/fridge'
import { planService } from '@/services/plans'
import { plannedMealsService } from '@/services/plannedMeals'
import { formatCurrency } from '@/lib/utils'
import { capture, buildCohortProperties } from '@/lib/analytics'
import { usersService } from '@/services/users'
import type { ShoppingListItem, IngredientCategory } from '@/types'

const CATEGORY_COLOR: Record<IngredientCategory, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

export function ShoppingList() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [leftoversAdded, setLeftoversAdded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tescoMappingWeak, setTescoMappingWeak] = useState(false)

  const { data: calendarPlan } = useQuery({
    queryKey: ['plan', 'active'],
    queryFn: planService.getActive,
    staleTime: 60_000,
  })

  const hasPlan = !!calendarPlan
  const planDays = calendarPlan?.shoppingCycleDays

  // ── User profile — needed for cohort analytics properties ─────────────────
  const { data: userProfile } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersService.getMe,
    staleTime: 300_000,
  })

  // ── Calendar-plan path: aggregate from planned_meal rows ─────────────────
  // Primary: GET /api/planned-meals/shopping-list?from=&to= (KALMIO-249).
  // Fallback: GET /api/plans/{id}/shopping-list when the planned_meals endpoint
  // returns null (i.e., KALMIO-249 not yet live on the backend).
  const planFrom = calendarPlan?.startDate ?? ''
  const planTo = calendarPlan?.endDate ?? ''

  const {
    data: plannedMealsShoppingList,
    isLoading: plannedMealsListLoading,
  } = useQuery({
    queryKey: ['planned-meals', 'shopping-list', planFrom, planTo],
    queryFn: () => plannedMealsService.getShoppingList(planFrom, planTo),
    enabled: !!calendarPlan && !!planFrom && !!planTo,
    staleTime: 60_000,
  })

  const {
    data: planShoppingList,
    isLoading: planListLoading,
    isError: calendarError,
    error: calendarErrorObj,
  } = useQuery({
    queryKey: ['shopping-list', calendarPlan?.id],
    queryFn: () => planService.getShoppingList(calendarPlan!.id),
    // Only fall back to the plan-based endpoint if planned_meals returned null.
    enabled: !!calendarPlan && plannedMealsShoppingList === null,
    staleTime: 60_000,
  })

  const calendarShoppingList = plannedMealsShoppingList ?? planShoppingList ?? undefined
  const calendarLoading = plannedMealsListLoading || (plannedMealsShoppingList === null && planListLoading)

  // Resolve the active shopping list and loading/error state
  const shoppingList = calendarShoppingList
  const isLoading = calendarLoading
  const isError = calendarError
  const errorMessage = (calendarErrorObj as Error | null)?.message ?? t('shoppingList.error')

  // ── Analytics: fire once when the shopping list first loads ──────────────
  const capturedRef = useRef(false)
  useEffect(() => {
    if (!shoppingList || capturedRef.current) return
    capturedRef.current = true
    const cohort = buildCohortProperties({
      createdAt: userProfile?.createdAt,
      dietaryPreferences: userProfile?.dietaryPreferences,
      mealPlanPreferences: userProfile?.mealPlanPreferences,
      planLengthDays: calendarPlan?.shoppingCycleDays ?? null,
    })
    capture('shopping_list_generated', {
      item_count: shoppingList.items.length,
      source: calendarPlan ? 'calendar_plan' : 'legacy',
      // user UUID only — no PII (no email, no name)
      user_id: userProfile?.id ?? null,
      ...cohort,
    })
  }, [shoppingList, calendarPlan, userProfile])

  // ── "I bought this" state ─────────────────────────────────────────────────
  // Key is per-plan so checks don't bleed across plans. The plan ID is unknown
  // during the initial loading render, so we sync from localStorage once the ID
  // resolves rather than reading in the useState initializer (which would always
  // read the "legacy" key on first render while the query is still in-flight).
  const planKey = calendarPlan?.id ?? 'legacy'
  const [bought, setBought] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`shopping-list-bought-${planKey}`)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBought(raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>())
    } catch {
      setBought(new Set<string>())
    }
  }, [planKey])

  function toggleBought(key: string) {
    setBought(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      localStorage.setItem(`shopping-list-bought-${planKey}`, JSON.stringify([...next]))
      return next
    })
  }

  // ── Leftovers helpers ─────────────────────────────────────────────────────
  const addLeftoversMutation = useMutation({
    mutationFn: fridgeService.addBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge'] })
      setLeftoversAdded(true)
    },
  })

  const missingCount = shoppingList?.items.filter(i => !i.retailProduct).length ?? 0
  const nonPantryLeftovers = shoppingList?.items.filter(
    i => !i.pantryItem && i.retailProduct?.leftoverAmount != null && i.retailProduct.leftoverAmount > 0
  ) ?? []
  const pantryLeftovers = shoppingList?.items.filter(
    i => i.pantryItem && i.retailProduct?.leftoverAmount != null && i.retailProduct.leftoverAmount > 0
  ) ?? []
  const leftoverItems = [...nonPantryLeftovers, ...pantryLeftovers]

  const totalLeftoverGrams = nonPantryLeftovers
    .filter(i => i.retailProduct!.unit === 'G')
    .reduce((sum, i) => sum + (i.retailProduct!.leftoverAmount ?? 0), 0)

  const totalLeftoverCost = shoppingList?.totalLeftoverCost
    ?? leftoverItems.reduce((sum, i) => sum + (i.retailProduct!.leftoverCost ?? 0), 0)

  function handleAddLeftoversToFridge() {
    const toAdd = leftoverItems
      .filter(i => i.retailProduct?.leftoverAmount != null && i.retailProduct.leftoverAmount > 0)
      .map(i => ({
        ingredientId: i.ingredientId,
        amount: i.retailProduct!.leftoverAmount!,
        unit: i.retailProduct!.unit,
      }))
    if (toAdd.length > 0) {
      addLeftoversMutation.mutate(toAdd)
    }
  }

  // ── Grouped items ─────────────────────────────────────────────────────────
  const grouped = shoppingList
    ? shoppingList.items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
        const cat = item.ingredientCategory ?? 'OTHER'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
      }, {})
    : {}

  // ── "All in fridge" state ─────────────────────────────────────────────────
  const allCovered = (shoppingList?.items.length ?? 0) > 0 &&
    shoppingList!.items.every(
      i => i.fridgeAmount != null && i.fridgeAmount >= i.totalAmount
    )

  // ── Copy / Email helpers ──────────────────────────────────────────────────
  function buildPlainText(): string {
    if (!shoppingList) return ''
    const lines: string[] = [t('shoppingList.title') + '\n']
    Object.entries(grouped).forEach(([cat, items]) => {
      lines.push(`\n${cat}`)
      items.forEach(item => {
        const needed = item.fridgeAmount != null
          ? Math.max(0, item.totalAmount - item.fridgeAmount)
          : item.totalAmount
        lines.push(`  ${item.ingredientName}: ${needed.toFixed(0)} ${item.unit}`)
      })
    })
    return lines.join('\n')
  }

  function handleCopy() {
    if (!shoppingList) return
    navigator.clipboard.writeText(buildPlainText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleEmail() {
    if (!shoppingList) return
    const body = encodeURIComponent(buildPlainText())
    window.open(`mailto:?subject=${encodeURIComponent(t('shoppingList.title'))}&body=${body}`)
  }

  function handleOpenInTesco() {
    if (!shoppingList) return
    const items = shoppingList.items

    // AC-5: warn if more than half of items lack a usable URL
    const resolvedCount = items.filter(
      item => item.retailProduct?.remoteUrl || item.ingredientName
    ).length
    const mappedCount = items.filter(item => item.retailProduct?.remoteUrl).length
    const failurePct = items.length > 0 ? (items.length - mappedCount) / items.length : 0
    if (failurePct > 0.5) {
      console.warn(
        `[ShoppingList] Tesco handoff: ${items.length - mappedCount}/${items.length} items have no RetailProduct URL — falling back to search`
      )
    }
    setTescoMappingWeak(failurePct > 0.5)

    capture('shopping-list-handoff-clicked', {
      provider: 'tesco',
      item_count: items.length,
      mapped_count: mappedCount,
      resolved_count: resolvedCount,
    })

    // Use RetailProductIngredientMapping remoteUrl when available; fall back to
    // ingredient-name search on www.tesco.hu
    items.forEach(item => {
      const url = item.retailProduct?.remoteUrl
        ?? `https://www.tesco.hu/groceries/hu-HU/search?query=${encodeURIComponent(item.ingredientName)}`
      window.open(url, '_blank', 'noopener,noreferrer')
    })
  }

  // ── No plan guard ─────────────────────────────────────────────────────────
  if (!hasPlan) {
    return (
      <div>
        <Header title={t('shoppingList.title')} />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <ShoppingCart className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('shoppingList.noActivePlan.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('shoppingList.noActivePlan.description')}</p>
            <Button onClick={() => navigate('/app/plans')}>{t('shoppingList.noActivePlan.button')}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={t('shoppingList.title')}
        subtitle={planDays != null ? t('shoppingList.subtitle', { days: planDays }) : undefined}
        actions={
          <Button variant="secondary" onClick={() => navigate('/app/plans')}>
            {t('shoppingList.backToPlan')}
          </Button>
        }
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-gray-500">{t('shoppingList.building')}</p>
        </div>
      )}

      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {shoppingList && (
        <div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('shoppingList.summary.totalItems')}</p>
                <p className="text-xl font-headline font-bold text-[#1A1A1A]">{shoppingList.items.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500 mb-1">{t('shoppingList.summary.estimatedTotal')}</p>
                <p className="text-xl font-headline font-bold text-[#4F7942]">
                  {formatCurrency(shoppingList.totalEstimatedCost, shoppingList.currency)}
                </p>
              </CardContent>
            </Card>
            {shoppingList.totalLeftoverCost != null && (
              <Card className={shoppingList.totalLeftoverCost > 0 ? 'border-orange-200 bg-orange-50' : ''}>
                <CardContent className="pt-4">
                  <p className={`text-xs mb-1 ${shoppingList.totalLeftoverCost > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {t('shoppingList.summary.totalLeftovers')}
                  </p>
                  <p className={`text-xl font-headline font-bold ${shoppingList.totalLeftoverCost > 0 ? 'text-orange-700' : 'text-[#4F7942]'}`}>
                    {formatCurrency(shoppingList.totalLeftoverCost, shoppingList.currency)}
                  </p>
                </CardContent>
              </Card>
            )}
            {missingCount > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <p className="text-xs text-amber-600 mb-1">{t('shoppingList.summary.noRetailMatch')}</p>
                  <p className="text-xl font-headline font-bold text-amber-700">{missingCount} {t('shoppingList.items')}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {missingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 mb-4 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t('shoppingList.missingItems', { count: missingCount })}
            </div>
          )}

          {/* "All in fridge" empty state */}
          {allCovered ? (
            <Card className="border-green-200 bg-green-50 mb-4">
              <CardContent className="py-12 flex flex-col items-center text-center">
                <Refrigerator className="h-10 w-10 text-green-600 mb-3" />
                <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">
                  {t('shoppingList.allInFridge.title')}
                </h3>
                <p className="text-sm text-gray-500">{t('shoppingList.allInFridge.desc')}</p>
              </CardContent>
            </Card>
          ) : (
            /* Grouped list */
            Object.entries(grouped).map(([category, items]) => (
              <Card key={category} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant={CATEGORY_COLOR[category as IngredientCategory] ?? 'gray'}>{category}</Badge>
                    <span className="text-gray-400 font-normal text-sm">{items.length} {t('shoppingList.items')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {items.map(item => {
                    const itemKey = `${item.ingredientId}:${item.unit}`
                    return (
                      <ShoppingItem
                        key={itemKey}
                        item={item}
                        currency={shoppingList.currency}
                        isBought={bought.has(itemKey)}
                        onToggle={() => toggleBought(itemKey)}
                      />
                    )
                  })}
                </CardContent>
              </Card>
            ))
          )}

          {/* Leftovers summary */}
          <Card className={leftoverItems.length > 0 ? 'border-orange-200' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Refrigerator className="h-4 w-4 text-orange-500" />
                {t('shoppingList.leftovers.summaryTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {leftoverItems.length === 0 ? (
                <p className="text-sm text-[#4F7942]">{t('shoppingList.leftovers.none')}</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('shoppingList.leftovers.summaryDesc')}
                  </p>
                  {nonPantryLeftovers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {nonPantryLeftovers.map(item => (
                        <div key={item.ingredientId + item.unit} className="flex items-center justify-between text-sm">
                          <span className="text-[#1A1A1A] font-medium">{item.ingredientName}</span>
                          <span className="text-orange-600 text-xs">
                            {item.retailProduct!.leftoverAmount!.toFixed(0)} {item.retailProduct!.unit}
                            {' · '}
                            {t('shoppingList.leftovers.cost', { cost: formatCurrency(item.retailProduct!.leftoverCost, shoppingList.currency) })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {pantryLeftovers.length > 0 && (
                    <>
                      <div className="flex items-center gap-1.5 mb-2 mt-1">
                        <Archive className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">{t('shoppingList.leftovers.pantrySection')}</span>
                      </div>
                      <div className="space-y-2">
                        {pantryLeftovers.map(item => (
                          <div key={item.ingredientId + item.unit} className="flex items-center justify-between text-sm">
                            <span className="text-[#1A1A1A] font-medium">{item.ingredientName}</span>
                            <span className="text-green-600 text-xs">
                              {item.retailProduct!.leftoverAmount!.toFixed(0)} {item.retailProduct!.unit}
                              {' · '}
                              {t('shoppingList.leftovers.cost', { cost: formatCurrency(item.retailProduct!.leftoverCost, shoppingList.currency) })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {(totalLeftoverCost > 0 || totalLeftoverGrams > 0) && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-100">
                      <span className="text-sm font-semibold text-[#1A1A1A]">{t('shoppingList.summary.totalLeftovers')}</span>
                      <span className="text-sm font-bold text-orange-700">
                        {totalLeftoverGrams > 0 && <>{Math.round(totalLeftoverGrams)} g</>}
                        {totalLeftoverGrams > 0 && totalLeftoverCost > 0 && ' · '}
                        {totalLeftoverCost > 0 && formatCurrency(totalLeftoverCost, shoppingList.currency)}
                      </span>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-orange-100">
                    {leftoversAdded ? (
                      <div className="flex items-center gap-2 text-sm text-[#4F7942]">
                        <Check className="h-4 w-4" />
                        {t('shoppingList.leftovers.addedToFridge')}
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddLeftoversToFridge}
                        disabled={addLeftoversMutation.isPending}
                        className="w-full"
                      >
                        <Refrigerator className="h-4 w-4 mr-1.5" />
                        {addLeftoversMutation.isPending
                          ? t('shoppingList.leftovers.addingToFridge')
                          : t('shoppingList.leftovers.addToFridge')}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AC-5: >50% no-mapping warning banner */}
          {tescoMappingWeak && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3 mt-4 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {t('shoppingList.tescoMappingWeak')}
            </div>
          )}

          {/* Footer action bar */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1.5" />
              {t('shoppingList.actions.print')}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied
                ? <><Check className="h-4 w-4 mr-1.5 text-green-600" />{t('shoppingList.actions.copied')}</>
                : <><Copy className="h-4 w-4 mr-1.5" />{t('shoppingList.actions.copy')}</>
              }
            </Button>
            <Button variant="secondary" size="sm" onClick={handleEmail}>
              <Mail className="h-4 w-4 mr-1.5" />
              {t('shoppingList.actions.email')}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleOpenInTesco}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              {t('shoppingList.openInTesco')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShoppingItem({
  item,
  currency,
  isBought,
  onToggle,
}: {
  item: ShoppingListItem
  currency: string
  isBought: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const hasProduct = !!item.retailProduct
  const coveredByFridge = item.fridgeAmount != null && item.fridgeAmount > 0

  return (
    <div className={`flex items-start gap-3 p-3 rounded-[12px] ${hasProduct ? 'bg-[#F9F7F2]' : 'bg-amber-50 border border-amber-200'}`}>
      <div className="shrink-0 mt-0.5">
        {isBought
          ? <Check className="h-4 w-4 text-green-600" />
          : hasProduct
            ? <Package className="h-4 w-4 text-[#4F7942]" />
            : <AlertCircle className="h-4 w-4 text-amber-500" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <p className={`font-semibold text-sm text-[#1A1A1A] ${isBought ? 'line-through opacity-50' : ''}`}>
            {item.ingredientName}
          </p>
          {item.pantryItem && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
              <Archive className="h-2.5 w-2.5" />
              {t('shoppingList.pantryLabel')}
            </span>
          )}
          {coveredByFridge && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
              <Refrigerator className="h-2.5 w-2.5" />
              {t('shoppingList.fridgeLabel', { amount: Number(item.fridgeAmount).toFixed(1), unit: item.unit })}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {t('shoppingList.totalNeeded')} <span className="font-medium">{item.totalAmount.toFixed(1)} {item.unit}</span>
        </p>

        {hasProduct ? (
          <div className="mt-1.5 flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-[#1A1A1A]">
                <span className="font-medium">{item.retailProduct!.name}</span>
                {item.retailProduct!.brand && <span className="text-gray-400"> · {item.retailProduct!.brand}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {item.retailProduct!.packageSize}{item.retailProduct!.unit} · {formatCurrency(item.retailProduct!.price, currency)}
              </p>
            </div>
            {item.retailProduct!.leftoverAmount != null && item.retailProduct!.leftoverAmount > 0 && (
              <p className="text-xs text-orange-500">
                {t('shoppingList.leftovers.amount', {
                  amount: item.retailProduct!.leftoverAmount.toFixed(item.retailProduct!.unit === 'PIECE' ? 0 : 0),
                  unit: item.retailProduct!.unit,
                })}
                {item.retailProduct!.leftoverCost != null && (
                  <> · {t('shoppingList.leftovers.cost', { cost: formatCurrency(item.retailProduct!.leftoverCost, currency) })}</>
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-600 mt-1">{t('shoppingList.noRetailProduct')}</p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5">
        {item.retailProduct?.estimatedCost != null && (
          <p className="text-sm font-bold text-[#4F7942]">
            {formatCurrency(item.retailProduct.estimatedCost, currency)}
          </p>
        )}
        {item.retailProduct?.remoteUrl && (
          <a
            href={item.retailProduct.remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#F28C28] hover:underline"
          >
            {t('shoppingList.tesco')} <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isBought}
          aria-label={t('shoppingList.bought')}
          className={`
            inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded
            transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]
            ${isBought
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }
          `}
        >
          {isBought && <Check className="h-2.5 w-2.5" />}
          {t('shoppingList.bought')}
        </button>
      </div>
    </div>
  )
}
