/**
 * ShopNow — in-store shopping checklist (KALMIO-375 / C12).
 *
 * Route: `/app/shop/:planId`
 *
 * Designed for one-handed, in-pocket-out-of-pocket use in a supermarket.
 * Tap targets are at least 44 px (11 Tailwind units). Category headers
 * are sticky on scroll.
 *
 * Layout (mobile-first, 375 px):
 *   ┌────────────────────────────────────────┐
 *   │ ← Bevásárlás           12 / 47         │  sticky header
 *   ├────────────────────────────────────────┤
 *   │ [+ Termék hozzáadása]                  │  add-item pill
 *   ├────────────────────────────────────────┤
 *   │ ▼ Zöldség / gyümölcs          (sticky) │
 *   │   □ Brokkoli         500 g            │  item row
 *   │   ☑ Alma             3 db  (struck)    │
 *   ├────────────────────────────────────────┤
 *   │ ▼ Pékáru                      (sticky) │
 *   │   …                                    │
 *   └────────────────────────────────────────┘
 *
 * State logic:
 * - Optimistic tick: item is immediately struck in the cache; server mutation
 *   runs in background. On error the cache is rolled back.
 * - Untick snackbar: 5s window via a simple timeout; triggers untick mutation.
 * - Add-item: inline expandable form; ingredient search debounced 300 ms;
 *   falls back to free-text when no catalog match.
 */
import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, X, Check } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { persistentShoppingListService } from '@/services/shoppingList'
import { ingredientsService } from '@/services/ingredients'
import type {
  PersistentShoppingListResponse,
  PersistentShoppingListItem,
  PersistentShoppingListCategoryGroup,
  Ingredient,
} from '@/types'

// ── Query key factory ─────────────────────────────────────────────────────

const shopListKey = (planId: string) => ['shopping-list', 'persistent', planId] as const

// ── Helpers ───────────────────────────────────────────────────────────────

/** Applies an optimistic tick / untick on a cached list response. */
function applyTickOptimistic(
  prev: PersistentShoppingListResponse | undefined,
  itemId: string,
  ticked: boolean,
): PersistentShoppingListResponse | undefined {
  if (!prev) return prev
  const now = new Date().toISOString()
  return {
    ...prev,
    groups: prev.groups.map((g) => ({
      ...g,
      items: g.items.map((item) =>
        item.id === itemId ? { ...item, tickedAt: ticked ? now : null } : item,
      ),
    })),
  }
}

/** Counts ticked and total items across all groups. */
function countItems(groups: PersistentShoppingListCategoryGroup[]): {
  ticked: number
  total: number
} {
  let ticked = 0
  let total = 0
  for (const g of groups) {
    for (const item of g.items) {
      total++
      if (item.tickedAt !== null) ticked++
    }
  }
  return { ticked, total }
}

// ── Undo snackbar state ───────────────────────────────────────────────────

interface UndoEntry {
  itemId: string
  name: string
  timerId: ReturnType<typeof setTimeout>
}

// ── Sub-components ────────────────────────────────────────────────────────

interface ItemRowProps {
  item: PersistentShoppingListItem
  onTick: (itemId: string, currentlyTicked: boolean) => void
}

function ItemRow({ item, onTick }: ItemRowProps) {
  const isTicked = item.tickedAt !== null

  return (
    <button
      type="button"
      onClick={() => onTick(item.id, isTicked)}
      aria-pressed={isTicked}
      className={[
        // Minimum 44 px tap target per spec
        'w-full flex items-center gap-3 px-4 py-3 min-h-[44px]',
        'text-left transition-colors',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-inset',
      ].join(' ')}
    >
      {/* Tick indicator */}
      <span
        aria-hidden="true"
        className={[
          'flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
          isTicked
            ? 'bg-neutral-800 border-neutral-800'
            : 'border-neutral-300 bg-white',
        ].join(' ')}
      >
        {isTicked && <Check size={14} className="text-white" strokeWidth={3} />}
      </span>

      {/* Name + amount */}
      <span className="flex-1 flex items-baseline gap-2 min-w-0">
        <span
          className={[
            'text-[15px] leading-snug truncate',
            isTicked ? 'line-through text-neutral-400' : 'text-neutral-900',
          ].join(' ')}
        >
          {item.name}
        </span>
        {(item.amount !== null || item.unit) && (
          <span
            className={[
              'flex-shrink-0 text-[13px] tabular-nums',
              isTicked ? 'text-neutral-400' : 'text-neutral-500',
            ].join(' ')}
          >
            {item.amount !== null ? item.amount : ''}
            {item.unit ? ` ${item.unit.toLowerCase()}` : ''}
          </span>
        )}
      </span>
    </button>
  )
}

interface CategorySectionProps {
  group: PersistentShoppingListCategoryGroup
  onTick: (itemId: string, currentlyTicked: boolean) => void
}

function CategorySection({ group, onTick }: CategorySectionProps) {
  const { t } = useTranslation()

  // Unticked items first, ticked items at the bottom
  const sorted = [
    ...group.items.filter((i) => i.tickedAt === null),
    ...group.items.filter((i) => i.tickedAt !== null),
  ]

  if (sorted.length === 0) return null

  return (
    <section>
      {/* Sticky category header */}
      <h2 className="sticky top-[56px] z-10 px-4 py-2 bg-neutral-100 text-[12px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
        {t(`shopNow.categories.${group.category}`, group.category)}
      </h2>
      <ul className="divide-y divide-neutral-100">
        {sorted.map((item) => (
          <li key={item.id}>
            <ItemRow item={item} onTick={onTick} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── Add-item inline form ──────────────────────────────────────────────────

interface AddItemFormProps {
  planId: string
  onAdded: () => void
  onCancel: () => void
}

function AddItemForm({ planId, onAdded, onCancel }: AddItemFormProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelectedIngredient(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300)
  }

  const { data: suggestions, isFetching: searchFetching } = useQuery({
    queryKey: ['ingredients', 'search', debouncedQuery],
    queryFn: () => ingredientsService.list(),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30_000,
    select: (all) =>
      all
        .filter((i) =>
          i.name.toLowerCase().includes(debouncedQuery.toLowerCase()),
        )
        .slice(0, 6),
  })

  const addMutation = useMutation({
    mutationFn: () =>
      persistentShoppingListService.addAdHocItem(planId, {
        ingredientId: selectedIngredient?.id ?? null,
        adhocName: selectedIngredient ? null : query.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopListKey(planId) })
      onAdded()
    },
    onError: () => {
      toast({ title: t('shopNow.error.addItem'), variant: 'destructive' })
    },
  })

  const canSubmit = selectedIngredient !== null || query.trim().length > 0

  return (
    <div className="bg-white border-b border-neutral-200 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('shopNow.addItemPlaceholder')}
          className="flex-1 text-[15px] bg-transparent border-b border-neutral-300 focus:border-neutral-700 outline-none py-1 transition-colors"
        />
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('common.cancel', 'Mégse')}
          className="p-2 text-neutral-500 hover:text-neutral-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Ingredient suggestions */}
      {debouncedQuery.length >= 2 && !selectedIngredient && (
        <ul className="rounded-md border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
          {searchFetching && (
            <li className="px-3 py-2 text-[13px] text-neutral-400">
              {t('shopNow.searching')}
            </li>
          )}
          {!searchFetching && suggestions && suggestions.length === 0 && (
            <li className="px-3 py-2 text-[13px] text-neutral-500">
              {t('shopNow.noIngredientMatch')} — {t('shopNow.willAddAdhoc')}
            </li>
          )}
          {suggestions?.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedIngredient(ingredient)
                  setQuery(ingredient.name)
                }}
                className="w-full text-left px-3 py-2 text-[14px] hover:bg-neutral-50 active:bg-neutral-100 min-h-[44px] flex items-center"
              >
                {ingredient.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!canSubmit || addMutation.isPending}
          onClick={() => addMutation.mutate()}
        >
          {addMutation.isPending ? t('shopNow.adding') : t('shopNow.add')}
        </Button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export function ShopNow() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const undoMapRef = useRef<Map<string, UndoEntry>>(new Map())

  // ── Load the shopping list ─────────────────────────────────────────────

  const {
    data: list,
    isLoading,
    isError,
    error: loadError,
  } = useQuery({
    queryKey: shopListKey(planId!),
    queryFn: () => persistentShoppingListService.getForPlan(planId!),
    enabled: !!planId,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      // Do not retry on 404 — the list has not been generated yet
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) return false
      return failureCount < 2
    },
  })

  const is404 =
    !list &&
    !isLoading &&
    (loadError as { response?: { status?: number } })?.response?.status === 404

  // ── Generate mutation ─────────────────────────────────────────────────

  const generateMutation = useMutation({
    mutationFn: () => persistentShoppingListService.generate(planId!),
    onSuccess: (generated) => {
      queryClient.setQueryData(shopListKey(planId!), generated)
    },
    onError: () => {
      toast({ title: t('shopNow.error.generate'), variant: 'destructive' })
    },
  })

  // ── Tick / untick ─────────────────────────────────────────────────────

  const tickMutation = useMutation({
    mutationFn: (itemId: string) => persistentShoppingListService.tick(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: shopListKey(planId!) })
      const snapshot = queryClient.getQueryData<PersistentShoppingListResponse>(
        shopListKey(planId!),
      )
      queryClient.setQueryData<PersistentShoppingListResponse>(
        shopListKey(planId!),
        (prev) => applyTickOptimistic(prev, itemId, true),
      )
      return { snapshot }
    },
    onError: (_err, _itemId, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(shopListKey(planId!), context.snapshot)
      }
      toast({ title: t('shopNow.error.tick'), variant: 'destructive' })
    },
  })

  const untickMutation = useMutation({
    mutationFn: (itemId: string) => persistentShoppingListService.untick(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: shopListKey(planId!) })
      const snapshot = queryClient.getQueryData<PersistentShoppingListResponse>(
        shopListKey(planId!),
      )
      queryClient.setQueryData<PersistentShoppingListResponse>(
        shopListKey(planId!),
        (prev) => applyTickOptimistic(prev, itemId, false),
      )
      return { snapshot }
    },
    onError: (_err, _itemId, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(shopListKey(planId!), context.snapshot)
      }
    },
  })

  // ── Tick handler with undo snackbar ──────────────────────────────────

  const handleTick = useCallback(
    (itemId: string, currentlyTicked: boolean) => {
      if (currentlyTicked) {
        // Immediate untick — user is reversing their own earlier tick
        const entry = undoMapRef.current.get(itemId)
        if (entry) {
          clearTimeout(entry.timerId)
          undoMapRef.current.delete(itemId)
        }
        untickMutation.mutate(itemId)
        return
      }

      // Tick: fire mutation immediately, show undo snackbar for 5s
      tickMutation.mutate(itemId)

      // Resolve item name from current cache for the snackbar
      const currentList = queryClient.getQueryData<PersistentShoppingListResponse>(
        shopListKey(planId!),
      )
      const itemName =
        currentList?.groups
          .flatMap((g) => g.items)
          .find((i) => i.id === itemId)?.name ?? ''

      // Clear any existing undo timer for this item
      const existing = undoMapRef.current.get(itemId)
      if (existing) clearTimeout(existing.timerId)

      const timerId = setTimeout(() => {
        undoMapRef.current.delete(itemId)
      }, 5000)

      undoMapRef.current.set(itemId, { itemId, name: itemName, timerId })

      toast({
        title: t('shopNow.itemTicked', { name: itemName }),
        description: t('shopNow.undo'),
        duration: 5000,
      })
    },
    [planId, tickMutation, untickMutation, queryClient, t],
  )

  // ── Render ────────────────────────────────────────────────────────────

  const { ticked, total } = list ? countItems(list.groups) : { ticked: 0, total: 0 }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-white border-b border-neutral-200">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('shopNow.back')}
          className="p-2 -ml-2 text-neutral-600 hover:text-neutral-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <span className="flex-1 text-[16px] font-medium text-neutral-900 truncate">
          {t('shopNow.title')}
        </span>

        {total > 0 && (
          <span className="text-[14px] tabular-nums text-neutral-500 flex-shrink-0">
            {ticked} / {total}
          </span>
        )}
      </header>

      {/* Add-item pill or form */}
      {!showAddForm ? (
        <div className="px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className={[
              'flex items-center gap-2 text-[14px] text-neutral-600',
              'border border-neutral-300 rounded-full px-4 py-2 min-h-[44px]',
              'hover:bg-neutral-50 active:bg-neutral-100 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
            ].join(' ')}
          >
            <Plus size={16} aria-hidden="true" />
            {t('shopNow.addItem')}
          </button>
        </div>
      ) : (
        <AddItemForm
          planId={planId!}
          onAdded={() => setShowAddForm(false)}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Error state — not 404 */}
        {isError && !is404 && (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] text-neutral-600">{t('shopNow.error.load')}</p>
          </div>
        )}

        {/* Empty state — no list generated yet */}
        {is404 && (
          <div className="px-6 py-16 flex flex-col items-center gap-4 text-center">
            <p className="text-[17px] font-medium text-neutral-800">
              {t('shopNow.emptyState.title')}
            </p>
            <p className="text-[14px] text-neutral-500 max-w-xs">
              {t('shopNow.emptyState.body')}
            </p>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="mt-2 min-h-[44px] px-6"
            >
              {generateMutation.isPending
                ? t('shopNow.generating')
                : t('shopNow.emptyState.generate')}
            </Button>
          </div>
        )}

        {/* List */}
        {list && list.groups.length > 0 && (
          <div>
            {list.groups.map((group) => (
              <CategorySection
                key={group.category}
                group={group}
                onTick={handleTick}
              />
            ))}
          </div>
        )}

        {/* All items ticked */}
        {list && list.groups.length > 0 && ticked === total && total > 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-[15px] text-neutral-500">{t('shopNow.allDone')}</p>
          </div>
        )}
      </main>
    </div>
  )
}
