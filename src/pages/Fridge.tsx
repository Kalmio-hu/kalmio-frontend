import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Refrigerator, Plus, Trash2, Search, Archive, Calendar, ClipboardCheck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Label } from '@/components/ui/label'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { fridgeService } from '@/services/fridge'
import { capture } from '@/lib/analytics'
import { toast } from '@/components/ui/toast'
import { useSyncInvalidation } from '@/hooks/useSyncInvalidation'
import type { FridgeItem, Ingredient, IngredientCategory, Unit } from '@/types'

const CATEGORY_COLOR: Record<IngredientCategory, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

/**
 * Client-side mirror of ExpiryCalculator.shelfLifeDays() (KALMIO-322).
 * Keep in sync with the backend enum. If the user submits without an expiry date the
 * backend applies the same default — this is purely for a better UI suggestion.
 */
const CATEGORY_SHELF_LIFE_DAYS: Record<IngredientCategory, number> = {
  VEGGIE: 5,
  PROTEIN: 3,
  CARB: 14,
  FAT: 365,
  SPICE: 180,
}

function computeDefaultExpiryDate(category: IngredientCategory): string {
  const days = CATEGORY_SHELF_LIFE_DAYS[category] ?? 14
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const UNITS: Unit[] = ['G', 'ML', 'PIECE']

type ExpiryStatus = 'fresh' | 'useSoon' | 'expired'

function getExpiryStatus(expiryDate: string | null, today: Date): ExpiryStatus {
  if (!expiryDate) return 'fresh'
  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 2) return 'useSoon'
  return 'fresh'
}

const EXPIRY_STATUS_ORDER: Record<ExpiryStatus, number> = {
  expired: 0,
  useSoon: 1,
  fresh: 2,
}

function sortByExpiry(items: FridgeItem[], today: Date): FridgeItem[] {
  return [...items].sort((a, b) => {
    const aStatus = getExpiryStatus(a.expiryDate, today)
    const bStatus = getExpiryStatus(b.expiryDate, today)
    const statusDiff = EXPIRY_STATUS_ORDER[aStatus] - EXPIRY_STATUS_ORDER[bStatus]
    if (statusDiff !== 0) return statusDiff
    // Within the same status, sort by expiryDate ascending (soonest first)
    if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate)
    if (a.expiryDate) return -1
    if (b.expiryDate) return 1
    return 0
  })
}

export function Fridge() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const todayIso = today.toISOString().split('T')[0]

  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<Unit>('G')
  const [expiryDate, setExpiryDate] = useState('')
  const [expiryAutoFilled, setExpiryAutoFilled] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['fridge'],
    queryFn: fridgeService.list,
  })

  // Re-align with server state after background-sync drains (KALMIO-378).
  useSyncInvalidation([['fridge']])

  const addMutation = useMutation({
    mutationFn: fridgeService.add,
    onMutate: async (req) => {
      await queryClient.cancelQueries({ queryKey: ['fridge'] })
      const snapshot = queryClient.getQueryData<FridgeItem[]>(['fridge'])
      // Optimistic placeholder — use a temp id; server will assign the real one.
      // We do not know the ingredient name at this point (the request only
      // carries the ingredientId), so we leave a minimal placeholder. The
      // invalidation in onSuccess will replace it with the real server item.
      const tempItem: FridgeItem = {
        id: `temp-${Date.now()}`,
        ingredientId: req.ingredientId,
        ingredientName: '…',
        ingredientCategory: null,
        pantryItem: false,
        amount: req.amount,
        unit: req.unit,
        addedAt: new Date().toISOString(),
        expiryDate: req.expiryDate ?? null,
        source: 'MANUAL',
      }
      queryClient.setQueryData<FridgeItem[]>(['fridge'], (prev) => [...(prev ?? []), tempItem])
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge'] })
      capture('fridge_item_added')
      setAddDialogOpen(false)
      setSelectedIngredient(null)
      setAmount('')
      setUnit('G')
      setExpiryDate('')
      setExpiryAutoFilled(false)
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['fridge'], context.snapshot)
      }
      toast({ title: t('mutation.fridgeAddError'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: fridgeService.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['fridge'] })
      const snapshot = queryClient.getQueryData<FridgeItem[]>(['fridge'])
      queryClient.setQueryData<FridgeItem[]>(['fridge'], (prev) =>
        (prev ?? []).filter((item) => item.id !== id),
      )
      return { snapshot }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge'] })
      capture('fridge_item_marked_used')
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['fridge'], context.snapshot)
      }
      toast({ title: t('mutation.fridgeDeleteError'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, expiryDate }: { id: string; expiryDate?: string }) =>
      fridgeService.updateItem(id, { expiryDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fridge'] }),
  })

  function handleUpdateExpiry(id: string, expiryDate: string | undefined) {
    updateMutation.mutate({ id, expiryDate })
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i => i.ingredientName.toLowerCase().includes(q))
  }, [items, search])

  const nonPantry = sortByExpiry(filtered.filter(i => !i.pantryItem), today)
  const pantry = sortByExpiry(filtered.filter(i => i.pantryItem), today)

  function handleIngredientSelect(ing: Ingredient) {
    setSelectedIngredient(ing)
    setUnit(ing.gramsPerPiece ? 'PIECE' : 'G')
    // Auto-fill expiry date from category default (KALMIO-322). The user can tap to change.
    const suggestion = computeDefaultExpiryDate(ing.category)
    setExpiryDate(suggestion)
    setExpiryAutoFilled(true)
    setIngredientDialogOpen(false)
    setAddDialogOpen(true)
  }

  function handleAdd() {
    if (!selectedIngredient || !amount || isNaN(Number(amount))) return
    addMutation.mutate({
      ingredientId: selectedIngredient.id,
      amount: Number(amount),
      unit,
      ...(expiryDate ? { expiryDate } : {}),
    })
  }

  const reviewMode = searchParams.get('review') === 'shopping'

  return (
    <div>
      <Header
        title={t('fridge.title')}
        subtitle={t('fridge.subtitle', { count: items.length })}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/app/grooming')}
              aria-label={t('fridge.checkButton.ariaLabel')}
            >
              <ClipboardCheck className="h-4 w-4 mr-1.5" />
              {t('fridge.checkButton.label')}
            </Button>
            <Button onClick={() => setIngredientDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('fridge.addItem')}
            </Button>
          </div>
        }
      />

      {reviewMode && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t('fridge.reviewShoppingBanner')}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder={t('fridge.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <Refrigerator className="h-10 w-10 text-[#F28C28] mb-3" />
            <h3 className="font-headline font-bold text-[#1A1A1A] mb-1">{t('fridge.empty.title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('fridge.empty.description')}</p>
            <Button onClick={() => setIngredientDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('fridge.addItem')}
            </Button>
          </CardContent>
        </Card>
      )}

      {nonPantry.length > 0 && (
        <FridgeGroup
          title={t('fridge.nonPantryGroup')}
          titleHint={t('fridge.nonPantryHint')}
          items={nonPantry}
          today={today}
          onDelete={id => setDeleteConfirmId(id)}
          onUpdateExpiry={handleUpdateExpiry}
        />
      )}

      {pantry.length > 0 && (
        <FridgeGroup
          title={t('fridge.pantryGroup')}
          titleHint={t('fridge.pantryHint')}
          items={pantry}
          today={today}
          onDelete={id => setDeleteConfirmId(id)}
          onUpdateExpiry={handleUpdateExpiry}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmId(null) }}
        title={t('confirm.delete.fridgeItem.title')}
        description={t('confirm.delete.fridgeItem.body')}
        destructiveLabel={t('confirm.delete.fridgeItem.confirm')}
        cancelLabel={t('confirm.delete.fridgeItem.cancel')}
        onConfirm={() => {
          if (deleteConfirmId) deleteMutation.mutate(deleteConfirmId)
        }}
        isPending={deleteMutation.isPending}
      />

      <IngredientSearchDialog
        open={ingredientDialogOpen}
        onOpenChange={setIngredientDialogOpen}
        onSelect={handleIngredientSelect}
        excludeIds={items.map(i => i.ingredientId)}
      />

      <Dialog open={addDialogOpen} onOpenChange={open => { setAddDialogOpen(open); if (!open) { setExpiryAutoFilled(false) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('fridge.addDialog.title')}</DialogTitle>
          </DialogHeader>
          {selectedIngredient && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Badge variant={CATEGORY_COLOR[selectedIngredient.category] ?? 'gray'}>
                  {selectedIngredient.category}
                </Badge>
                <span className="font-semibold">{selectedIngredient.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('fridge.addDialog.amount')}</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 200"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('fridge.addDialog.unit')}</Label>
                  <select
                    className="flex h-10 w-full rounded-[12px] border border-input bg-background px-3 py-2 text-sm"
                    value={unit}
                    onChange={e => setUnit(e.target.value as Unit)}
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry date field — auto-filled from category default (KALMIO-322) */}
              <div>
                <Label htmlFor="fridge-expiry-date">{t('fridge.expiry.dateLabel')}</Label>
                <Input
                  id="fridge-expiry-date"
                  type="date"
                  min={todayIso}
                  value={expiryDate}
                  onChange={e => {
                    setExpiryDate(e.target.value)
                    setExpiryAutoFilled(false)
                  }}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {expiryAutoFilled
                    ? t('fridge.add.expirySuggested')
                    : t('fridge.add.expiryHint')}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => { setAddDialogOpen(false); setExpiryAutoFilled(false) }}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleAdd}
                  disabled={!amount || isNaN(Number(amount)) || Number(amount) <= 0 || addMutation.isPending}
                >
                  {addMutation.isPending ? t('fridge.addDialog.adding') : t('fridge.addDialog.add')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InlineExpiryEditor({
  item,
  today,
  onSave,
}: {
  item: FridgeItem
  today: Date
  onSave: (id: string, expiryDate: string | undefined) => void
}) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(item.expiryDate ?? '')

  const todayIso = today.toISOString().split('T')[0]
  const status = getExpiryStatus(item.expiryDate, today)
  const statusColor =
    status === 'expired' ? 'text-red-500' : status === 'useSoon' ? 'text-amber-500' : 'text-gray-400'

  const formatted = item.expiryDate
    ? new Date(item.expiryDate + 'T00:00:00').toLocaleDateString(
        i18n.language === 'hu' ? 'hu-HU' : 'en-GB',
        { year: 'numeric', month: 'short', day: 'numeric' }
      )
    : null

  function commit() {
    setEditing(false)
    const next = value || undefined
    if (next !== (item.expiryDate ?? undefined)) {
      onSave(item.id, next)
    }
  }

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        value={value}
        min={todayIso}
        className="text-xs h-6 w-36 px-1.5 border border-[#4F7942] rounded-[8px] focus:outline-none bg-white"
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setEditing(false); setValue(item.expiryDate ?? '') }
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`flex items-center gap-1 text-xs ${statusColor} hover:text-[#4F7942] transition-colors w-fit`}
    >
      <Calendar className="h-3 w-3 shrink-0" />
      <span>{formatted ?? t('fridge.expiry.setDate')}</span>
    </button>
  )
}

function ExpiryBadge({ expiryDate, today }: { expiryDate: string | null; today: Date }) {
  const { t } = useTranslation()
  const status = getExpiryStatus(expiryDate, today)
  if (status === 'fresh') return null
  const variant = status === 'expired' ? 'red' : 'amber'
  const label = status === 'expired' ? t('fridge.expiry.expired') : t('fridge.expiry.useSoon')
  return <Badge variant={variant}>{label}</Badge>
}

function FridgeGroup({
  title,
  titleHint,
  items,
  today,
  onDelete,
  onUpdateExpiry,
}: {
  title: string
  titleHint: string
  items: FridgeItem[]
  today: Date
  onDelete: (id: string) => void
  onUpdateExpiry: (id: string, expiryDate: string | undefined) => void
}) {
  const { t } = useTranslation()
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-normal text-gray-400">{titleHint}</span>
          <Badge variant="gray">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className="flex flex-col gap-1.5 p-3 rounded-[12px] bg-[#F9F7F2]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                {item.pantryItem && (
                  <Archive className="h-3.5 w-3.5 text-green-600 shrink-0" />
                )}
                {item.ingredientCategory && (
                  <Badge variant={CATEGORY_COLOR[item.ingredientCategory] ?? 'gray'} className="shrink-0">
                    {item.ingredientCategory}
                  </Badge>
                )}
                <span className="font-medium text-sm text-[#1A1A1A] truncate">{item.ingredientName}</span>
                <ExpiryBadge expiryDate={item.expiryDate} today={today} />
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-sm font-semibold text-[#4F7942]">
                  {Number(item.amount).toFixed(item.unit === 'PIECE' ? 0 : 1)} {item.unit}
                </span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <InlineExpiryEditor
              item={item}
              today={today}
              onSave={onUpdateExpiry}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
