/**
 * CalendarView — reusable calendar body extracted from pages/Calendar.tsx.
 *
 * KALMIO-308
 *
 * Renders the navigation bar, day cards (mobile), desktop grid, meal detail
 * panel, recipe picker, and recipe detail dialog. No page-level chrome
 * (Header) is included here — the consumer supplies that.
 *
 * Originally the full contents of pages/Calendar.tsx. The standalone Calendar
 * route now redirects to /app/dashboard?view=calendar; Dashboard renders this
 * component when the Calendar tab is active.
 */
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, CalendarDays, Info, Eye, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { RecipePickerDialog } from '@/components/plan/RecipePickerDialog'
import { RecipeDetailDialog } from '@/components/plan/RecipeDetailDialog'
import { plannedMealsService } from '@/services/plannedMeals'
import type { MaterializedPlannedMeal, MaterializedPlannedMealStatus, MealType, Recipe } from '@/types'
import { cn } from '@/lib/utils'

// ── Date helpers ────────────────────────────────────────────────────────────

function toIso(d: Date): string {
  return d.toISOString().split('T')[0]
}

/** Return Monday of the week containing `date`. */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Generate ISO date strings for `count` days starting at `start`. */
function dateRange(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => toIso(addDays(start, i)))
}

// Default: current week Monday
const TODAY_ISO = toIso(new Date())

// ── Meal-type order ─────────────────────────────────────────────────────────

const MEAL_TYPE_ORDER: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'SNACK',
]

// ── Status badge colour map ─────────────────────────────────────────────────

function statusVariant(s: MaterializedPlannedMealStatus): 'green' | 'gray' | 'amber' | 'red' {
  if (s === 'EATEN') return 'green'
  if (s === 'SKIPPED') return 'gray'
  if (s === 'REPLACED') return 'amber'
  return 'gray' // PLANNED — no badge
}

// ── Meal detail panel ────────────────────────────────────────────────────────

interface MealDetailPanelProps {
  meal: MaterializedPlannedMeal | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onStatusChange: (id: string, status: MaterializedPlannedMealStatus) => void
  onReplaceRecipe: (meal: MaterializedPlannedMeal) => void
  onViewRecipe: (meal: MaterializedPlannedMeal) => void
  isPending: boolean
}

function MealDetailPanel({
  meal,
  open,
  onOpenChange,
  onStatusChange,
  onReplaceRecipe,
  onViewRecipe,
  isPending,
}: MealDetailPanelProps) {
  const { t } = useTranslation()
  if (!meal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {meal.recipeName ?? t('calendar.noRecipe')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe thumbnail */}
          {meal.recipeImageUrl && (
            <img
              src={meal.recipeImageUrl}
              alt={meal.recipeName ?? ''}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-2 text-sm text-zinc-500">
            <span>{meal.date}</span>
            <span>·</span>
            <span>{t(`calendar.mealTypes.${meal.mealType}`)}</span>
            {meal.status !== 'PLANNED' && (
              <>
                <span>·</span>
                <Badge variant={statusVariant(meal.status)} className="text-xs">
                  {t(`calendar.status.${meal.status}`)}
                </Badge>
              </>
            )}
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2">
            {(['EATEN', 'SKIPPED'] as MaterializedPlannedMealStatus[]).map(s => (
              <Button
                key={s}
                size="sm"
                variant={meal.status === s ? 'primary' : 'outline'}
                disabled={isPending || meal.status === s}
                onClick={() => onStatusChange(meal.id, s)}
              >
                {isPending && meal.status !== s ? (
                  <Spinner className="h-3 w-3" />
                ) : (
                  t(`calendar.action.${s}`)
                )}
              </Button>
            ))}
            {meal.status !== 'PLANNED' && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onStatusChange(meal.id, 'PLANNED')}
              >
                {t('calendar.action.RESET')}
              </Button>
            )}
          </div>

          {/* Recipe actions — available only when a recipe is attached */}
          {meal.recipeId && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewRecipe(meal)}
                className="flex items-center gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" />
                {t('calendar.action.VIEW_RECIPE')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => onReplaceRecipe(meal)}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t('calendar.action.REPLACE_RECIPE')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Meal cell ───────────────────────────────────────────────────────────────

interface MealCellProps {
  meal: MaterializedPlannedMeal
  onClick: (meal: MaterializedPlannedMeal) => void
}

function MealCell({ meal, onClick }: MealCellProps) {
  const { t } = useTranslation()

  return (
    <button
      onClick={() => onClick(meal)}
      className={cn(
        'w-full text-left rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C28]',
        meal.status === 'EATEN'
          ? 'border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10'
          : meal.status === 'SKIPPED'
            ? 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/40'
            : 'border-zinc-200 bg-white hover:border-[#F28C28]/40 dark:border-zinc-700 dark:bg-zinc-900/60',
      )}
      aria-label={`${meal.recipeName ?? t('calendar.noRecipe')} — ${t(`calendar.status.${meal.status}`)}`}
    >
      {/* Thumbnail */}
      {meal.recipeImageUrl ? (
        <img
          src={meal.recipeImageUrl}
          alt=""
          className="w-full h-16 object-cover rounded-t-lg"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-8 rounded-t-lg bg-zinc-100 dark:bg-zinc-800" />
      )}

      <div className="px-2 py-1.5 space-y-1">
        {/* Recipe name */}
        <p className="text-xs font-medium leading-tight line-clamp-2 text-zinc-800 dark:text-zinc-100">
          {meal.recipeName ?? <span className="italic text-zinc-400">{t('calendar.noRecipe')}</span>}
        </p>

        {/* Status badge (only when not PLANNED) */}
        {meal.status !== 'PLANNED' && (
          <Badge variant={statusVariant(meal.status)} className="text-[10px] py-0 px-1.5">
            {t(`calendar.status.${meal.status}`)}
          </Badge>
        )}
      </div>
    </button>
  )
}

// ── Day card (mobile) ───────────────────────────────────────────────────────

interface DayCardProps {
  dateIso: string
  meals: MaterializedPlannedMeal[]
  onMealClick: (meal: MaterializedPlannedMeal) => void
  isToday: boolean
}

function DayCard({ dateIso, meals, onMealClick, isToday }: DayCardProps) {
  const { t, i18n } = useTranslation()

  const label = new Date(dateIso + 'T12:00:00').toLocaleDateString(
    i18n.resolvedLanguage ?? i18n.language,
    { weekday: 'long', month: 'short', day: 'numeric' },
  )

  const sorted = [...meals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType),
  )

  return (
    <section
      aria-label={label}
      className={cn(
        'rounded-xl border p-3 space-y-2',
        isToday
          ? 'border-[#F28C28]/60 bg-orange-50/50 dark:bg-orange-900/10'
          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/40',
      )}
    >
      <h3
        className={cn(
          'text-sm font-semibold capitalize',
          isToday ? 'text-[#F28C28]' : 'text-zinc-700 dark:text-zinc-200',
        )}
      >
        {label}
        {isToday && (
          <span className="ml-2 text-[11px] font-normal text-[#F28C28]/80">
            {t('calendar.today')}
          </span>
        )}
      </h3>

      {sorted.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">{t('calendar.noMeals')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {sorted.map(m => (
            <MealCell key={m.id} meal={m} onClick={onMealClick} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Desktop grid ────────────────────────────────────────────────────────────

interface DesktopGridProps {
  dates: string[]
  mealsByDate: Map<string, MaterializedPlannedMeal[]>
  onMealClick: (meal: MaterializedPlannedMeal) => void
}

function DesktopGrid({ dates, mealsByDate, onMealClick }: DesktopGridProps) {
  const { t, i18n } = useTranslation()

  // Collect all meal types that appear in this range
  const activeMealTypes = MEAL_TYPE_ORDER.filter(mt =>
    dates.some(d => (mealsByDate.get(d) ?? []).some(m => m.mealType === mt)),
  )

  const displayMealTypes = activeMealTypes.length > 0 ? activeMealTypes : MEAL_TYPE_ORDER.slice(0, 3)

  return (
    <div
      className="overflow-x-auto"
      role="grid"
      aria-label={t('calendar.gridLabel')}
    >
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr>
            {/* Meal-type header column */}
            <th className="w-28 text-left px-2 py-2 text-xs font-medium text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">
              {t('calendar.mealSlot')}
            </th>
            {dates.map(d => {
              const isToday = d === TODAY_ISO
              const label = new Date(d + 'T12:00:00').toLocaleDateString(
                i18n.resolvedLanguage ?? i18n.language,
                { weekday: 'short', day: 'numeric' },
              )
              return (
                <th
                  key={d}
                  scope="col"
                  className={cn(
                    'text-center px-1 py-2 text-xs font-medium border-b border-zinc-200 dark:border-zinc-700',
                    isToday ? 'text-[#F28C28]' : 'text-zinc-500 dark:text-zinc-400',
                  )}
                >
                  <span className={cn(isToday && 'underline underline-offset-2')}>{label}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {displayMealTypes.map(mt => (
            <tr key={mt} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="px-2 py-1 text-xs text-zinc-500 font-medium align-top whitespace-nowrap">
                {t(`calendar.mealTypes.${mt}`)}
              </td>
              {dates.map(d => {
                const meals = (mealsByDate.get(d) ?? []).filter(m => m.mealType === mt)
                return (
                  <td key={d} className="px-1 py-1 align-top">
                    <div className="flex flex-col gap-1">
                      {meals.map(m => (
                        <MealCell key={m.id} meal={m} onClick={onMealClick} />
                      ))}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── CalendarView ─────────────────────────────────────────────────────────────

/**
 * Renders the full calendar body: navigation, day cards (mobile), desktop
 * grid, and all associated dialogs. No page header — the parent provides that.
 */
export function CalendarView() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Window anchor: Monday of the starting week
  const [windowStart, setWindowStart] = useState<Date>(() => weekStart(new Date()))
  const [selectedMeal, setSelectedMeal] = useState<MaterializedPlannedMeal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [recipePickerMeal, setRecipePickerMeal] = useState<MaterializedPlannedMeal | null>(null)
  const [recipeDetailMeal, setRecipeDetailMeal] = useState<MaterializedPlannedMeal | null>(null)

  // 14-day window: current week + next week
  const from = toIso(windowStart)
  const to = toIso(addDays(windowStart, 13))

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ['planned-meals', from, to],
    queryFn: () => plannedMealsService.listInRange(from, to),
    staleTime: 30_000,
  })

  const { mutate: patchStatus, isPending: isPatching } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterializedPlannedMealStatus }) =>
      plannedMealsService.updateStatus(id, { status }),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      setSelectedMeal(updated)
      toast({ title: t('calendar.statusUpdated') })
    },
    onError: () => {
      toast({ title: t('calendar.statusUpdateError'), variant: 'destructive' })
    },
  })

  const { mutate: patchRecipe, isPending: isReplacingRecipe } = useMutation({
    mutationFn: ({ id, recipeId }: { id: string; recipeId: string }) =>
      plannedMealsService.replaceRecipe(id, { recipeId }),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      setSelectedMeal(updated)
      setRecipePickerMeal(null)
      toast({ title: t('calendar.recipeReplaced') })
    },
    onError: () => {
      toast({ title: t('calendar.recipeReplaceError'), variant: 'destructive' })
    },
  })

  function handleStatusChange(id: string, status: MaterializedPlannedMealStatus) {
    patchStatus({ id, status })
  }

  function handleReplaceRecipe(meal: MaterializedPlannedMeal) {
    setDetailOpen(false)
    setRecipePickerMeal(meal)
  }

  function handleViewRecipe(meal: MaterializedPlannedMeal) {
    setRecipeDetailMeal(meal)
  }

  function handleRecipeSelected(recipe: Recipe) {
    if (!recipePickerMeal) return
    patchRecipe({ id: recipePickerMeal.id, recipeId: recipe.id })
  }

  function handleMealClick(meal: MaterializedPlannedMeal) {
    setSelectedMeal(meal)
    setDetailOpen(true)
  }

  function goToToday() {
    setWindowStart(weekStart(new Date()))
  }

  function goPrevWeek() {
    setWindowStart(prev => addDays(prev, -7))
  }

  function goNextWeek() {
    setWindowStart(prev => addDays(prev, 7))
  }

  function handleDatePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return
    setWindowStart(weekStart(new Date(e.target.value + 'T12:00:00')))
  }

  // Build dates for both weeks
  const week1Dates = dateRange(windowStart, 7)
  const week2Dates = dateRange(addDays(windowStart, 7), 7)

  // Index meals by date for fast lookup
  const mealsByDate = useMemo<Map<string, MaterializedPlannedMeal[]>>(() => {
    const map = new Map<string, MaterializedPlannedMeal[]>()
    for (const meal of meals) {
      const bucket = map.get(meal.date) ?? []
      bucket.push(meal)
      map.set(meal.date, bucket)
    }
    return map
  }, [meals])

  const allDates = [...week1Dates, ...week2Dates]

  return (
    <>
      <div className="px-4 py-4 space-y-4 max-w-5xl mx-auto w-full pb-24 md:pb-6">
        {/* Navigation bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrevWeek}
            aria-label={t('calendar.prevTwoWeeks')}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">{t('calendar.prevTwoWeeks')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={goNextWeek}
            aria-label={t('calendar.nextTwoWeeks')}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{t('calendar.nextTwoWeeks')}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={goToToday}>
            {t('calendar.today')}
          </Button>

          {/* Date picker — jump to a week */}
          <div className="flex items-center gap-1 ml-auto">
            <CalendarDays className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="date"
              value={from}
              onChange={handleDatePick}
              aria-label={t('calendar.jumpToDate')}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#F28C28]/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>

          {/* Range label */}
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {from} – {to}
          </span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {!isLoading && meals.length === 0 && (
          <div
            role="status"
            className="flex flex-col items-center gap-3 py-16 text-center text-zinc-400"
          >
            <Info className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">{t('calendar.emptyTitle')}</p>
            <p className="text-xs max-w-xs">{t('calendar.emptyBody')}</p>
          </div>
        )}

        {/* Mobile view — vertical day cards */}
        {!isLoading && (
          <div className="md:hidden space-y-3">
            {allDates.map(d => (
              <DayCard
                key={d}
                dateIso={d}
                meals={mealsByDate.get(d) ?? []}
                onMealClick={handleMealClick}
                isToday={d === TODAY_ISO}
              />
            ))}
          </div>
        )}

        {/* Desktop view — two weekly grids */}
        {!isLoading && (
          <div className="hidden md:block space-y-6">
            {/* Week 1 */}
            <section aria-label={t('calendar.week1Label')}>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                {t('calendar.week1Label')}
              </h2>
              <DesktopGrid
                dates={week1Dates}
                mealsByDate={mealsByDate}
                onMealClick={handleMealClick}
              />
            </section>

            {/* Week 2 */}
            <section aria-label={t('calendar.week2Label')}>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                {t('calendar.week2Label')}
              </h2>
              <DesktopGrid
                dates={week2Dates}
                mealsByDate={mealsByDate}
                onMealClick={handleMealClick}
              />
            </section>
          </div>
        )}
      </div>

      <MealDetailPanel
        meal={selectedMeal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleStatusChange}
        onReplaceRecipe={handleReplaceRecipe}
        onViewRecipe={handleViewRecipe}
        isPending={isPatching || isReplacingRecipe}
      />

      {/* Recipe picker — opens when the user taps "Replace recipe" */}
      {recipePickerMeal?.recipeId && (
        <RecipePickerDialog
          open
          currentRecipeId={recipePickerMeal.recipeId}
          onSelect={handleRecipeSelected}
          onClose={() => setRecipePickerMeal(null)}
        />
      )}

      {/* Recipe detail — read-only view of the current recipe */}
      {recipeDetailMeal?.recipeId && (
        <RecipeDetailDialog
          open
          onOpenChange={open => !open && setRecipeDetailMeal(null)}
          recipeId={recipeDetailMeal.recipeId}
          displayName={recipeDetailMeal.recipeName ?? undefined}
        />
      )}
    </>
  )
}
