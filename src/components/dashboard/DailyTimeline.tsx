import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Eye, Lock, Sparkles, RefreshCw, MoreHorizontal, Utensils, Check, MoveRight } from 'lucide-react'
import { useIsUserPremium } from '@/hooks/useIsUserPremium'
import { EmbeddedPrepChip } from './EmbeddedPrepChip'
import { LeftoverBadge } from './LeftoverBadge'
import { sumEmbeddedPrepDuration, allEmbeddedPrepsDone, isBatchPrep, getPortionBreakdownData } from '@/lib/prep'
import type { PortionBreakdownData } from '@/lib/prep'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type Modifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useDraggable } from '@dnd-kit/core'
import { dashboardService } from '@/services/dashboard'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { planService } from '@/services/plans'
import { prepTasksService } from '@/services/prepTasks'
import { offPlanMealsService } from '@/services/offPlanMeals'
import { getRecipeNameFromTranslations } from '@/lib/i18nRecipe'
import { todayIsoLocal } from '@/lib/utils'
import { MealRationalePanel } from '@/components/plan/MealRationalePanel'
import { RecipePickerDialog } from '@/components/plan/RecipePickerDialog'
import type { DashboardDto, MaterializedPlannedMeal, PrepTaskCard, Recipe, TimePreferencesDto } from '@/types'
import { isMealSlotPast } from '@/lib/time'
import { OffPlanMealLogModal } from './OffPlanMealLogModal'
import { AiOffPlanLogModal } from './AiOffPlanLogModal'
import { PrepGooDragContext, usePrepGoo } from './PrepGooDragContext'
import { AttachMealPicker } from './AttachMealPicker'
import type { MealPickerOption } from './AttachMealPicker'
import { PrepDragCoachmark, usePrepDragCoachmarkVisible } from '@/components/onboarding/PrepDragCoachmark'

// ── time helpers ──────────────────────────────────────────────────────────

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function snapToGrid(minutes: number, snap = 15): number {
  return Math.round(minutes / snap) * snap
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function gapPx(diffMinutes: number): number {
  return clamp(diffMinutes * 0.22, 10, 52)
}

const DRAG_MIN_PER_PX = 2

// ── defaults ──────────────────────────────────────────────────────────────

const MEAL_DEFAULTS: Record<string, string> = {
  BREAKFAST: '08:00',
  MORNING_SNACK: '10:30',
  LUNCH: '12:30',
  AFTERNOON_SNACK: '16:00',
  DINNER: '19:00',
  SNACK: '21:00',
}

const PREP_WINDOW_DEFAULTS: Record<string, string> = {
  MORNING: '07:30',
  AFTERNOON: '13:00',
  EVENING: '18:00',
  NIGHT: '22:00',
}

// ── node styles ───────────────────────────────────────────────────────────

type NodeStyle = { ring: string; bg: string; icon: string }

const NODE_STYLES: Record<string, NodeStyle> = {
  wake:            { ring: 'ring-amber-300',  bg: 'bg-amber-50',  icon: '☀️' },
  sleep:           { ring: 'ring-indigo-400', bg: 'bg-indigo-50', icon: '🌙' },
  BREAKFAST:       { ring: 'ring-amber-400',  bg: 'bg-amber-50',  icon: '🍳' },
  MORNING_SNACK:   { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  LUNCH:           { ring: 'ring-orange-400', bg: 'bg-orange-50', icon: '🥗' },
  AFTERNOON_SNACK: { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  DINNER:          { ring: 'ring-rose-400',   bg: 'bg-rose-50',   icon: '🍽' },
  SNACK:           { ring: 'ring-lime-400',   bg: 'bg-lime-50',   icon: '🍎' },
  prep:            { ring: 'ring-teal-400',   bg: 'bg-teal-50',   icon: '🥘' },
  shopping:        { ring: 'ring-blue-400',   bg: 'bg-blue-50',   icon: '🛒' },
  grooming:        { ring: 'ring-purple-400', bg: 'bg-purple-50', icon: '🧊' },
  offplan:         { ring: 'ring-gray-200',   bg: 'bg-gray-50',   icon: '+' },
}

function nodeStyle(type: string): NodeStyle {
  return NODE_STYLES[type] ?? { ring: 'ring-gray-300', bg: 'bg-gray-50', icon: '•' }
}

// ── card data ─────────────────────────────────────────────────────────────

interface TimelineCardData {
  id: string
  type: string
  /** What appears on the card. For prep cards this is "Meal prep: <recipe>". */
  label: string
  /** Localized recipe name without any prefix — used inside dialogs and pickers. */
  recipeName?: string
  subtitle?: string
  startMinutes: number
  mealType?: string
  window?: string
  mealId?: string
  prepTaskId?: string
  /** Current server-side status of the prep task — "PENDING" | "DONE" | "SKIPPED". KALMIO-311. */
  prepStatus?: string
  /** Set on off-plan (manually logged) meals; identifies the row to delete. */
  offPlanMealId?: string
  recipeId?: string
  macros?: { kcal: number; protein: number; fat: number; carbs: number } | null
  /**
   * For standalone prep cards: the planned meal IDs this prep task feeds.
   * Populated from PrepTaskCard.feedsPlannedMealIds. Used to build the
   * AttachMealPicker option list. KALMIO-335.
   */
  feedsPlannedMealIds?: string[]
}

// ── time-from-log helper ──────────────────────────────────────────────────
// Returns the minute on the timeline at which an off-plan meal should appear:
//   - the clock-time when the user pressed log, in their local timezone, when
//     it falls between wake and sleep;
//   - just after wake when logged before wake;
//   - just before sleep when logged after sleep.
// Falls back to noon-clamped-to-window when createdAt is missing or unparseable,
// so the card never renders with NaN:NaN.
function offPlanTimelineMinutes(createdAt: string | null | undefined, wakeMinutes: number, sleepMinutes: number): number {
  const fallback = clamp(12 * 60, wakeMinutes + 1, sleepMinutes - 1)
  if (!createdAt) return fallback
  const d = new Date(createdAt)
  const loggedMinutes = d.getHours() * 60 + d.getMinutes()
  if (!Number.isFinite(loggedMinutes)) return fallback
  if (loggedMinutes < wakeMinutes) return Math.min(wakeMinutes + 1, sleepMinutes - 1)
  if (loggedMinutes >= sleepMinutes) return Math.max(sleepMinutes - 1, wakeMinutes + 1)
  return loggedMinutes
}

// ── SleepBanner ───────────────────────────────────────────────────────────

function SleepBanner({ from, to }: { from: string; to: string }) {
  const { t } = useTranslation()
  return (
    <div className="mx-3 my-2 rounded-2xl overflow-hidden">
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-3.5 flex items-center gap-3">
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          {([
            [18, 8], [55, 15], [72, 5], [88, 18],
            [32, 20], [64, 9], [45, 22], [78, 13],
          ] as [number, number][]).map(([x, y], i) => (
            <div key={i} className="absolute rounded-full bg-white/20"
              style={{ left: `${x}%`, top: `${y * 4}px`, width: 2, height: 2 }} />
          ))}
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-800/60 ring-1 ring-indigo-600/40 flex items-center justify-center text-sm shrink-0">
          🌙
        </div>
        <div>
          <p className="text-white/90 text-xs font-semibold tracking-wide">{t('timeline.sleep')}</p>
          <p className="text-indigo-300/70 text-xs">{from} – {to}</p>
        </div>
        <div aria-hidden className="ml-auto text-indigo-300/25 text-sm font-light tracking-[0.3em] select-none">
          zzz
        </div>
      </div>
    </div>
  )
}

// ── DraggableRow ──────────────────────────────────────────────────────────
// setNodeRef is on the CARD div only (not the whole row) so DragOverlay
// appears exactly at the card's position, not at the cursor.

interface DraggableRowProps {
  card: TimelineCardData
  isFirst: boolean
  isLast: boolean
  liveDragMinutes: number | null  // non-null only for the card being dragged
  rationaleOpen: boolean
  menuOpen: boolean
  /** When false the rationale sparkle renders as a locked affordance. */
  isPremium: boolean
  onViewRecipe: () => void
  onToggleRationale: () => void
  onOpenSwap: () => void
  onToggleMenu: () => void
  onMarkEaten: () => void
  onMarkSkipped: () => void
  mutating?: boolean
  /**
   * Prep tasks that must execute immediately before this meal.
   * Rendered inline inside the card body; their timeline circle is suppressed.
   * KALMIO-317.
   */
  embeddedPreps?: PrepTaskCard[]
  /**
   * When true the meal's slot time has passed and it is rendered as presumed-eaten
   * (green tick). The server-side status remains PLANNED.  KALMIO-310.
   */
  isAutoTicked?: boolean
  /** Called when the user taps the green tick to revert to PLANNED view. */
  onAutoTickUndo?: () => void
  /** Called on second tap / long-press to open the SKIPPED / REPLACED menu. */
  onAutoTickMenu?: () => void
  /**
   * When set, renders a batch-prep portion breakdown line below the chip.
   * Only on the first-consumption meal of a batch. KALMIO-321.
   */
  portionBreakdown?: PortionBreakdownData | null
  /**
   * When set, renders a "leftover from X" badge on this meal card.
   * Only on the non-first-consumption meals of a batch. KALMIO-321.
   */
  leftoverSourceLabel?: string
  /** Scrolls the timeline to the batch source meal card. KALMIO-321. */
  onScrollToSource?: () => void
  /**
   * Called when user activates the keyboard Detach button for an embedded prep.
   * prepTaskId is the task to detach. KALMIO-328.
   */
  onDetachEmbeddedPrep?: (prepTaskId: string) => void
  /**
   * Valid meals this meal's embedded preps can attach to — used by the
   * keyboard Attach button's picker. KALMIO-328.
   */
  attachMealOptions?: MealPickerOption[]
  /**
   * Called when user selects a target meal from the AttachMealPicker.
   * (prepTaskId, mealId) → patch executeImmediatelyBefore = true. KALMIO-328.
   */
  onAttachPrepToMeal?: (prepTaskId: string, mealId: string) => void
  /**
   * Current status of the prep task ("PENDING" | "DONE"). Used by the prep-ball
   * tick handler to show DONE/PENDING state. KALMIO-311.
   */
  prepStatus?: string
  /** Short-tap on the prep-ball spine dot — toggles DONE / PENDING. KALMIO-311. */
  onPrepTickToggle?: () => void
  /** Long-press (600 ms) on the prep-ball — opens the step-by-step modal. KALMIO-311. */
  onPrepLongPress?: () => void
}

function DraggableRow({
  card,
  isFirst,
  isLast,
  liveDragMinutes,
  rationaleOpen,
  menuOpen,
  isPremium,
  onViewRecipe,
  onToggleRationale,
  onOpenSwap,
  onToggleMenu,
  onMarkEaten,
  onMarkSkipped,
  mutating,
  embeddedPreps,
  isAutoTicked,
  onAutoTickUndo,
  onAutoTickMenu,
  portionBreakdown,
  leftoverSourceLabel,
  onScrollToSource,
  onDetachEmbeddedPrep,
  attachMealOptions,
  onAttachPrepToMeal,
  prepStatus,
  onPrepTickToggle,
  onPrepLongPress,
}: DraggableRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  const ns = nodeStyle(card.type)
  const isPrep = card.type === 'prep'
  const isMeal = !!card.mealId

  // KALMIO-335: local open state for the AttachMealPicker popover on standalone prep balls.
  const [attachPickerOpen, setAttachPickerOpen] = useState(false)

  // KALMIO-336: consume goo drag state to apply rejection cue on invalid drop targets.
  const { state: prepGooState } = usePrepGoo()
  const isRejectionTarget =
    isMeal &&
    card.mealId != null &&
    prepGooState.isOverInvalidTarget &&
    prepGooState.invalidTargetMealId === card.mealId

  // Material-style "pickup" cue during the 250ms long-press hold (KALMIO-327).
  // @dnd-kit's isDragging only flips AFTER the sensor fires; isPressing covers
  // the holding window via native pointer events on the drag handle itself.
  // Forward dnd-kit's pointer handlers so PointerSensor is not clobbered by
  // last-write-wins JSX spread order. KALMIO-327 reviewer fix.
  const [isPressing, setIsPressing] = useState(false)
  const handleSpinePointerDown = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerDown?.(e)
    setIsPressing(true)
  }, [listeners])
  const handleSpinePointerUp = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerUp?.(e)
    setIsPressing(false)
  }, [listeners])
  const handleSpinePointerCancel = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerCancel?.(e)
    setIsPressing(false)
  }, [listeners])
  const handleSpinePointerLeave = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerLeave?.(e)
    setIsPressing(false)
  }, [listeners])

  // Drop zone for embedded prep drag-and-drop (KALMIO-325). Only meal cards
  // act as drop targets. The PrepGooDragContext (nested DndContext) handles
  // these — the outer DndContext ignores 'meal-drop:' prefixed IDs.
  const dropId = isMeal && card.mealId ? `meal-drop:${card.mealId}` : `noop-${card.id}`
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId })
  // Prep cards get a slightly tinted background to distinguish them from meals.
  const cardSurface = isPrep
    ? 'bg-[#F2F7F5] border-teal-100'
    : 'bg-white border-gray-100/80'

  // Ref for the embedded prep list — chip tap scrolls it into view. KALMIO-318.
  const embeddedPrepListRef = useRef<HTMLUListElement | null>(null)
  const handleChipTap = useCallback(() => {
    embeddedPrepListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  // Chip state derived from embedded preps. KALMIO-318.
  const chipTotalMinutes = useMemo(
    () => sumEmbeddedPrepDuration(embeddedPreps ?? []),
    [embeddedPreps],
  )
  const chipAllDone = useMemo(
    () => allEmbeddedPrepsDone(embeddedPreps ?? []),
    [embeddedPreps],
  )
  const showChip = (embeddedPreps?.length ?? 0) > 0

  // While dragging: left label shows live snapped time in orange
  const displayTime = isDragging && liveDragMinutes !== null
    ? minutesToHm(liveDragMinutes)
    : minutesToHm(card.startMinutes)

  // Derived: whether the prep ball is in DONE state. KALMIO-311.
  const isPrepDone = isPrep && prepStatus === 'DONE'

  // Long-press detection for the prep-ball tick circle. KALMIO-311.
  // Short-tap (< 600 ms) → toggle DONE/PENDING.
  // Long-press (≥ 600 ms) → open step-by-step modal.
  const prepTickPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prepTickDidLongPress = useRef(false)

  const handlePrepTickPointerDown = useCallback((e: React.PointerEvent) => {
    // Forward to dnd-kit so the drag sensor still works.
    listeners?.onPointerDown?.(e)
    prepTickDidLongPress.current = false
    prepTickPressTimer.current = setTimeout(() => {
      prepTickDidLongPress.current = true
      onPrepLongPress?.()
    }, 600)
    setIsPressing(true)
  }, [listeners, onPrepLongPress])

  const handlePrepTickPointerUp = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerUp?.(e)
    if (prepTickPressTimer.current !== null) {
      clearTimeout(prepTickPressTimer.current)
      prepTickPressTimer.current = null
    }
    setIsPressing(false)
  }, [listeners])

  const handlePrepTickPointerCancel = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerCancel?.(e)
    if (prepTickPressTimer.current !== null) {
      clearTimeout(prepTickPressTimer.current)
      prepTickPressTimer.current = null
    }
    setIsPressing(false)
  }, [listeners])

  const handlePrepTickPointerLeave = useCallback((e: React.PointerEvent) => {
    listeners?.onPointerLeave?.(e)
    if (prepTickPressTimer.current !== null) {
      clearTimeout(prepTickPressTimer.current)
      prepTickPressTimer.current = null
    }
    setIsPressing(false)
  }, [listeners])

  const handlePrepTickClick = useCallback(() => {
    if (prepTickDidLongPress.current) return
    onPrepTickToggle?.()
  }, [onPrepTickToggle])

  // Long-press detection for the auto-tick button — triggers the secondary menu.
  const autoTickPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTickDidLongPress = useRef(false)

  const handleAutoTickPointerDown = useCallback(() => {
    autoTickDidLongPress.current = false
    autoTickPressTimer.current = setTimeout(() => {
      autoTickDidLongPress.current = true
      onAutoTickMenu?.()
    }, 600)
  }, [onAutoTickMenu])

  const handleAutoTickPointerUp = useCallback(() => {
    if (autoTickPressTimer.current !== null) {
      clearTimeout(autoTickPressTimer.current)
      autoTickPressTimer.current = null
    }
  }, [])

  const handleAutoTickClick = useCallback(() => {
    // Long-press already opened the menu — do not also untick
    if (autoTickDidLongPress.current) return
    onAutoTickUndo?.()
  }, [onAutoTickUndo])

  return (
    <div data-card-id={card.id} className="flex items-start gap-0">
      {/* Time label */}
      <div className={[
        'w-12 shrink-0 pt-2 text-right pr-2.5 text-[10px] select-none tabular-nums',
        isDragging ? 'font-bold text-[#F28C28]' : 'font-medium text-gray-400',
      ].join(' ')}>
        {displayTime}
      </div>

      {/* Spine */}
      <div className="relative flex flex-col items-center w-7 shrink-0">
        {!isFirst && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
        {isAutoTicked && isMeal ? (
          // Green tick button replaces the recipe-type emoji when auto-ticked.
          // Tap = undo (revert to PLANNED view). Long-press = secondary menu.
          <button
            type="button"
            onPointerDown={handleAutoTickPointerDown}
            onPointerUp={handleAutoTickPointerUp}
            onPointerLeave={handleAutoTickPointerUp}
            onClick={handleAutoTickClick}
            aria-label={t('dashboard.meals.autoTick.presumedEaten')}
            aria-pressed={true}
            className="relative z-10 w-7 h-7 rounded-full ring-1 ring-emerald-400 bg-emerald-50 flex items-center justify-center shrink-0 touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          </button>
        ) : isPrep ? (
          // Prep-ball tick circle. KALMIO-311.
          // Short-tap: toggle DONE / PENDING.
          // Long-press (600 ms): open step-by-step modal.
          // Drag still works: pointer events are forwarded to dnd-kit listeners.
          <button
            type="button"
            onPointerDown={handlePrepTickPointerDown}
            onPointerUp={handlePrepTickPointerUp}
            onPointerCancel={handlePrepTickPointerCancel}
            onPointerLeave={handlePrepTickPointerLeave}
            onClick={handlePrepTickClick}
            aria-label={isPrepDone ? t('dashboard.prep.tick.undoAriaLabel') : t('dashboard.prep.tick.doneAriaLabel')}
            aria-pressed={isPrepDone}
            className={[
              'relative z-10 w-7 h-7 rounded-full ring-1 flex items-center justify-center shrink-0 touch-none transition-all focus-visible:outline-none focus-visible:ring-2',
              isPrepDone
                ? 'ring-emerald-400 bg-emerald-50 focus-visible:ring-emerald-500'
                : [ns.ring, ns.bg, 'cursor-grab active:cursor-grabbing'].join(' '),
              isPressing && !isDragging ? 'scale-[1.04] shadow-md' : '',
            ].filter(Boolean).join(' ')}
          >
            {isPrepDone
              ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              : <span className="text-sm" aria-hidden>{ns.icon}</span>
            }
          </button>
        ) : (
          <div
            {...listeners}
            aria-label={t('common.moveLabel')}
            onPointerDown={handleSpinePointerDown}
            onPointerUp={handleSpinePointerUp}
            onPointerCancel={handleSpinePointerCancel}
            onPointerLeave={handleSpinePointerLeave}
            className={[
              'relative z-10 w-7 h-7 rounded-full ring-1 flex items-center justify-center text-sm shrink-0 cursor-grab active:cursor-grabbing touch-none transition-transform',
              ns.ring, ns.bg,
              // Material-style pickup cue: lifts slightly during the 250ms hold (KALMIO-327).
              isPressing && !isDragging ? 'scale-[1.04] shadow-md' : '',
            ].filter(Boolean).join(' ')}
          >
            {ns.icon}
          </div>
        )}
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
      </div>

      {/* Card — setNodeRef HERE so DragOverlay aligns to card, not row */}
      {/* setDropRef makes this card a drop target for PrepGooDragContext (KALMIO-325) */}
      <div
        ref={(el) => { setNodeRef(el); setDropRef(el) }}
        {...attributes}
        className="flex-1 pl-2.5 pt-0.5 pb-0.5 min-w-0"
      >
        {isDragging ? (
          // Ghost placeholder: dashed outline, same height as real card
          <div className="h-10 rounded-xl border-2 border-dashed border-[#F28C28]/30 bg-orange-50/30" />
        ) : (
          <>
            {/* Embedded prep slots — rendered ABOVE the meal card because prep happens
                chronologically before the meal. Sits visually attached on top. */}
            {embeddedPreps && embeddedPreps.length > 0 && (
              <div className="mb-1">
                <EmbeddedPrepList
                  preps={embeddedPreps}
                  listRef={embeddedPrepListRef}
                  onDetach={onDetachEmbeddedPrep}
                  mealName={card.label}
                />
              </div>
            )}
            <div className={[
              'rounded-xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-3 py-2.5 flex items-center gap-1 select-none',
              cardSurface,
              // Highlight the card when a prep is dragged over it (KALMIO-325).
              isOver && isMeal && !isRejectionTarget ? 'ring-2 ring-teal-400 ring-offset-1' : '',
              // KALMIO-336: red rejection cue when a wrong-meal prep is dragged over this card.
              isRejectionTarget ? 'ring-2 ring-red-300 ring-offset-1 bg-red-50 [animation:prep-rejection-shake_0.35s_ease-in-out]' : '',
            ].filter(Boolean).join(' ')}>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{card.label}</p>
                {card.subtitle && (
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{card.subtitle}</p>
                )}
              </div>

              {/* Prep chip — shown near top-right of meal card when ≥1 embedded prep. KALMIO-318. */}
              {showChip && (
                <EmbeddedPrepChip
                  totalMinutes={chipTotalMinutes}
                  allDone={chipAllDone}
                  onTap={handleChipTap}
                />
              )}

              {/* Action icons */}
              <div className="flex items-center gap-0 shrink-0 text-gray-400">
                {isMeal && card.recipeId && (
                  isPremium ? (
                    <button
                      type="button"
                      onClick={onToggleRationale}
                      aria-label={t('plan.rationale.toggle')}
                      aria-expanded={rationaleOpen}
                      className={`p-1.5 rounded-md transition-colors ${
                        rationaleOpen
                          ? 'text-[#F28C28] bg-[#FFF3E5]'
                          : 'hover:text-[#F28C28] hover:bg-gray-200/60'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/app/founding-member')}
                      aria-label={t('premium.rationaleLocked.ariaLabel')}
                      title={t('premium.rationaleLocked.teaser')}
                      className="relative p-1.5 rounded-md text-gray-300 hover:text-gray-400 hover:bg-gray-200/60 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <Lock
                        className="absolute bottom-0.5 right-0.5 h-2 w-2 text-gray-400"
                        aria-hidden
                      />
                    </button>
                  )
                )}

                {isPrep && card.recipeId && (
                  <button
                    type="button"
                    onClick={onViewRecipe}
                    aria-label={t('mealPlan.viewRecipe')}
                    className="p-1.5 rounded-md hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* KALMIO-335: Attach-to-meal button for standalone prep balls.
                    Rendered when feedsPlannedMealIds is non-empty; opens AttachMealPicker. */}
                {isPrep && (attachMealOptions?.length ?? 0) > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAttachPickerOpen(v => !v)}
                      aria-label={t('dashboard.prep.drag.attachAriaLabel')}
                      aria-expanded={attachPickerOpen}
                      title={t('dashboard.prep.drag.attachToMeal')}
                      className="p-1.5 rounded-md text-teal-500 hover:text-teal-700 hover:bg-teal-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <MoveRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    {attachPickerOpen && attachMealOptions && (
                      <AttachMealPicker
                        options={attachMealOptions}
                        onSelect={(mealId) => {
                          if (card.prepTaskId && onAttachPrepToMeal) {
                            onAttachPrepToMeal(card.prepTaskId, mealId)
                          }
                          setAttachPickerOpen(false)
                        }}
                        onClose={() => setAttachPickerOpen(false)}
                      />
                    )}
                  </div>
                )}

                {isMeal && (
                  <button
                    type="button"
                    onClick={onOpenSwap}
                    aria-label={t('mealPlan.editSlot.swapRecipe')}
                    disabled={mutating}
                    className="p-1.5 rounded-md hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}

                {isMeal && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={onToggleMenu}
                      disabled={mutating}
                      aria-label={t('plan.mealActions')}
                      aria-expanded={menuOpen}
                      className="p-1.5 rounded-md hover:text-[#1A1A1A] hover:bg-gray-200/60 transition-colors disabled:opacity-40"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-[10px] shadow-md py-1 min-w-[160px]">
                        <button
                          type="button"
                          onClick={onMarkEaten}
                          className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F7F2] transition-colors"
                        >
                          {t('plan.actions.markEaten')}
                        </button>
                        <button
                          type="button"
                          onClick={onMarkSkipped}
                          className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F7F2] transition-colors"
                        >
                          {t('plan.actions.markSkipped')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Drag handle */}
                <button
                  type="button"
                  {...listeners}
                  aria-label={t('common.moveLabel')}
                  className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded p-0.5 ml-0.5"
                >
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
                    <circle cx="3" cy="2.5" r="1.3" /><circle cx="7" cy="2.5" r="1.3" />
                    <circle cx="3" cy="7"    r="1.3" /><circle cx="7" cy="7"    r="1.3" />
                    <circle cx="3" cy="11.5" r="1.3" /><circle cx="7" cy="11.5" r="1.3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Batch-prep portion breakdown — first-consumption meal only. KALMIO-321. */}
            {portionBreakdown && (
              <p className="mt-1 text-[11px] text-stone-500 leading-snug px-0.5">
                {t('dashboard.prep.portion.breakdown', {
                  total: portionBreakdown.total,
                  laterCount: portionBreakdown.laterCount,
                  laterLabels: portionBreakdown.laterLabels,
                })}
              </p>
            )}

            {/* Leftover badge — dependent meals that draw from a batch. KALMIO-321. */}
            {leftoverSourceLabel && onScrollToSource && (
              <LeftoverBadge
                sourceLabel={leftoverSourceLabel}
                onTapSource={onScrollToSource}
              />
            )}

            {/* Auto-tick undo strip — shown when the slot time has passed. KALMIO-310. */}
            {isAutoTicked && isMeal && (
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={onAutoTickUndo}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {t('dashboard.meals.autoTick.undo')}
                </button>
                <button
                  type="button"
                  onClick={onMarkSkipped}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  {t('dashboard.meals.autoTick.markSkipped')}
                </button>
                <button
                  type="button"
                  onClick={onOpenSwap}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  {t('dashboard.meals.autoTick.markReplaced')}
                </button>
              </div>
            )}

            {/* Inline rationale panel — only rendered for meals while open. */}
            {isMeal && card.mealId && (
              <MealRationalePanel
                plannedMealId={card.mealId}
                recipeId={card.recipeId}
                open={rationaleOpen}
                onStartCooking={rid => navigate(`/app/recipes/${rid}/cook`)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── DraggableSpineDot (wake / sleep) ──────────────────────────────────────

interface SpineDotProps {
  id: string
  time: string
  label: string
  type: 'wake' | 'sleep'
  showLineAbove?: boolean
  showLineBelow?: boolean
  liveDragMinutes: number | null
}

function DraggableSpineDot({ id, time, label, type, showLineAbove, showLineBelow, liveDragMinutes }: SpineDotProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const ns = nodeStyle(type)

  const displayTime = isDragging && liveDragMinutes !== null
    ? minutesToHm(liveDragMinutes)
    : time

  return (
    <div className="flex items-start gap-0">
      <div className={[
        'w-12 shrink-0 pt-1.5 text-right pr-2.5 tabular-nums select-none',
        isDragging ? 'text-[10px] font-bold text-[#F28C28]' : 'text-[10px] font-medium text-gray-400',
      ].join(' ')}>
        {displayTime}
      </div>
      <div className="relative flex flex-col items-center w-7 shrink-0">
        {showLineAbove && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
        {/* setNodeRef on the button so overlay appears at dot position */}
        <button
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={label}
          className={[
            'relative z-10 w-6 h-6 rounded-full ring-1 flex items-center justify-center text-xs cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]',
            ns.ring, ns.bg,
            isDragging ? 'opacity-30' : '',
          ].join(' ')}
        >
          {ns.icon}
        </button>
        {showLineBelow && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
      </div>
      <div className="flex-1 pl-2.5 pt-1">
        <span className="text-[11px] text-gray-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

// ── OffPlanRow ────────────────────────────────────────────────────────────
// Renders a manually logged meal on the timeline. Draggable: the new time is
// PATCHed to /api/dashboard/off-plan-meals/{id}/scheduled-time. When the user
// has never moved the card, the slot is inferred from createdAt and clamped
// to the wake/sleep window.

interface OffPlanRowProps {
  card: TimelineCardData
  isFirst: boolean
  isLast: boolean
  deleting: boolean
  liveDragMinutes: number | null
  onDelete: () => void
}

function OffPlanRow({ card, isFirst, isLast, deleting, liveDragMinutes, onDelete }: OffPlanRowProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const ns = nodeStyle('offplan')
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })

  const displayTime = isDragging && liveDragMinutes !== null
    ? minutesToHm(liveDragMinutes)
    : minutesToHm(card.startMinutes)

  return (
    <div data-card-id={card.id} className="flex items-start gap-0">
      <div className={[
        'w-12 shrink-0 pt-2 text-right pr-2.5 text-[10px] select-none tabular-nums',
        isDragging ? 'font-bold text-[#F28C28]' : 'font-medium text-gray-400',
      ].join(' ')}>
        {displayTime}
      </div>

      <div className="relative flex flex-col items-center w-7 shrink-0">
        {!isFirst && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
        <div
          {...listeners}
          aria-label={t('common.moveLabel')}
          className={[
            'relative z-10 w-7 h-7 rounded-full ring-1 flex items-center justify-center text-sm shrink-0 cursor-grab active:cursor-grabbing touch-none',
            ns.ring, ns.bg,
          ].join(' ')}
        >
          {ns.icon}
        </div>
        {!isLast && <div style={{ width: 1, flex: 1, minHeight: 8, background: '#e5e7eb', alignSelf: 'center' }} />}
      </div>

      <div ref={setNodeRef} {...attributes} className="flex-1 pl-2.5 pt-0.5 pb-0.5 min-w-0">
        {isDragging ? (
          <div className="h-10 rounded-xl border-2 border-dashed border-[#F28C28]/30 bg-orange-50/30" />
        ) : (
          <div className="rounded-xl bg-white border border-gray-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-3 py-2.5 flex items-center gap-1 select-none">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{card.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium shrink-0">
                  {t('dashboard.meals.offPlanBadge')}
                </span>
              </div>
              {card.subtitle && (
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight truncate">{card.subtitle}</p>
              )}
            </div>

            {confirming ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => { onDelete(); setConfirming(false) }}
                  disabled={deleting}
                  aria-label={t('common.delete')}
                  className="text-[11px] px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  {t('common.delete')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  aria-label={t('common.cancel')}
                  className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  aria-label={t('dashboard.offPlanMeal.deleteConfirm')}
                  className="text-gray-300 hover:text-red-400 shrink-0 rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
                    <path d="M5.5 1a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3ZM2 3.5A.5.5 0 0 1 2.5 3h9a.5.5 0 0 1 0 1H11v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4H2.5A.5.5 0 0 1 2 3.5ZM4 4v7h6V4H4Z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  {...listeners}
                  aria-label={t('common.moveLabel')}
                  className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded p-0.5 ml-0.5"
                >
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden>
                    <circle cx="3" cy="2.5" r="1.3" /><circle cx="7" cy="2.5" r="1.3" />
                    <circle cx="3" cy="7"    r="1.3" /><circle cx="7" cy="7"    r="1.3" />
                    <circle cx="3" cy="11.5" r="1.3" /><circle cx="7" cy="11.5" r="1.3" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── EmbeddedPrepList ──────────────────────────────────────────────────────
// Renders inside a meal card body to show the "execute immediately before"
// prep slots in compact form: knife icon + title + duration. KALMIO-317.
// Added detach button (KALMIO-328).

interface EmbeddedPrepListProps {
  preps: PrepTaskCard[]
  listRef?: React.RefObject<HTMLUListElement | null>
  /** Called with the prepTaskId when the user activates the keyboard Detach button. KALMIO-328. */
  onDetach?: (prepTaskId: string) => void
  /** Meal label for aria-label interpolation on the detach button. KALMIO-328. */
  mealName?: string
}

function EmbeddedPrepList({ preps, listRef, onDetach, mealName }: EmbeddedPrepListProps) {
  const { t } = useTranslation()
  return (
    <ul ref={listRef} className="mt-1.5 flex flex-col gap-1" aria-label={t('dashboard.prep.embedded.listLabel')}>
      {preps.map((prep, i) => (
        <li
          key={prep.id ?? `embedded-prep-${i}`}
          className="flex items-center gap-1.5 rounded-lg bg-teal-50/70 border border-teal-100 px-2.5 py-1.5"
        >
          <Utensils
            className="h-3 w-3 text-teal-500 shrink-0"
            aria-hidden
          />
          <span className="text-[11px] font-medium text-teal-800 leading-tight truncate flex-1">
            {t('timeline.prepLabel', { recipe: prep.recipeName })}
          </span>
          {prep.durationMin != null && (
            <span className="text-[10px] text-teal-500 tabular-nums shrink-0">
              {t('dashboard.prep.embedded.duration', { count: prep.durationMin })}
            </span>
          )}
          {/* Detach affordance (KALMIO-328) — always visible so users can
              undo an embed; gets a bit louder on hover/focus. */}
          {onDetach && prep.id && (
            <button
              type="button"
              onClick={() => onDetach(prep.id!)}
              aria-label={t('dashboard.prep.drag.detachAriaLabel', { mealName: mealName ?? '' })}
              title={t('dashboard.prep.drag.moveToTimeline')}
              className="opacity-60 hover:opacity-100 focus-visible:opacity-100 shrink-0 p-0.5 rounded text-teal-500 hover:text-teal-700 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400"
            >
              <MoveRight className="h-3 w-3" aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

// ── SpacerRow ─────────────────────────────────────────────────────────────

function SpacerRow({ minutes }: { minutes: number }) {
  const h = gapPx(minutes)
  return (
    <div className="flex" style={{ height: h, transition: 'height 0.15s ease' }}>
      <div className="w-12 shrink-0" />
      <div className="w-7 shrink-0 flex justify-center">
        <div style={{ width: 1, height: '100%', background: '#e5e7eb' }} />
      </div>
    </div>
  )
}

// ── DragFeedbackPill ──────────────────────────────────────────────────────

interface DragFeedbackPillProps {
  label: string
  todayOnlyLabel: string
  defaultLabel: string
  onTodayOnly: () => void
  onSetDefault: () => void
  onDismiss: () => void
}

function DragFeedbackPill({ label, todayOnlyLabel, defaultLabel, onTodayOnly, onSetDefault, onDismiss }: DragFeedbackPillProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="flex items-center gap-1.5 ml-[76px] mt-1 mb-1 flex-wrap" role="status" aria-live="polite">
      <span className="text-[10px] text-gray-400 mr-0.5">{label}</span>
      <button type="button" onClick={onTodayOnly}
        className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
        {todayOnlyLabel}
      </button>
      <button type="button" onClick={onSetDefault}
        className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1A1A1A] text-white hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
        {defaultLabel}
      </button>
    </div>
  )
}

// ── OffPlanLogButtons ─────────────────────────────────────────────────────
// Action row at the foot of the timeline. The actual logged meals render on
// the timeline itself via OffPlanRow.

interface OffPlanLogButtonsProps {
  onLog: () => void
  onLogAi: () => void
  /** When false the AI log button renders as a locked affordance. */
  isPremium: boolean
}

function OffPlanLogButtons({ onLog, onLogAi, isPremium }: OffPlanLogButtonsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const aiIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  )

  return (
    <div className="mx-3 mt-3 mb-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onLog}
          className="w-full rounded-xl border border-dashed border-gray-200 py-2.5 text-[13px] font-medium text-gray-500 hover:border-[#F28C28] hover:text-[#F28C28] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          {t('dashboard.offPlanMeal.logButton')}
        </button>

        {isPremium ? (
          <button
            type="button"
            onClick={onLogAi}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#F28C28]/40 bg-[#F28C28]/5 py-2.5 text-[13px] font-medium text-[#F28C28] hover:border-[#F28C28] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          >
            {aiIcon}
            {t('premium.aiOffPlanLocked.buttonLabel')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/app/founding-member')}
            aria-label={t('premium.aiOffPlanLocked.ariaLabel')}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-2.5 text-[13px] font-medium text-gray-400 hover:border-gray-300 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {aiIcon}
            {t('premium.aiOffPlanLocked.buttonLabel')}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 leading-none">
              <Lock className="h-2.5 w-2.5" aria-hidden />
              {t('premium.aiOffPlanLocked.badge')}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── DailyTimeline ─────────────────────────────────────────────────────────

interface DailyTimelineProps {
  date: string
  hasShoppingDay?: boolean
  activePlanId?: string | null
  /**
   * Today's materialized planned_meal rows from the new planned_meal table
   * (meal-planning-v2). When provided, these are used as the authoritative
   * source of meal slots; the legacy dashboardService todaysMeals are still
   * rendered alongside for backward compatibility until KALMIO-249 is fully live.
   */
  plannedMeals?: MaterializedPlannedMeal[]
}

interface PendingFeedback {
  cardId: string
  newTime: string
  cardType: 'meal' | 'prep' | 'sleep-wake'
  mealType?: string
  window?: string
  mealId?: string
  prepTaskId?: string
  dotKind?: 'wake' | 'sleep'
  label: string
}

export function DailyTimeline({ date, hasShoppingDay, activePlanId, plannedMeals }: DailyTimelineProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isPremium = useIsUserPremium()

  const { data: dashboard } = useQuery<DashboardDto>({
    queryKey: ['dashboard', date],
    queryFn: () => dashboardService.get(date),
    staleTime: 30_000,
  })

  const { data: timePref } = useQuery<TimePreferencesDto>({
    queryKey: ['time-preferences'],
    queryFn: usersService.getTimePreferences,
    staleTime: 300_000,
    retry: false,
  })

  const wakeDefault = timePref?.wakeTime ?? '07:00'
  const sleepDefault = timePref?.sleepTime ?? '23:00'

  const [localWake, setLocalWake] = useState<string | null>(null)
  const [localSleep, setLocalSleep] = useState<string | null>(null)
  const [cardTimeOverrides, setCardTimeOverrides] = useState<Record<string, string>>({})
  const [activeCard, setActiveCard] = useState<TimelineCardData | null>(null)
  const [activeDotKind, setActiveDotKind] = useState<'wake' | 'sleep' | null>(null)
  const [pendingFeedback, setPendingFeedback] = useState<PendingFeedback | null>(null)
  const [liveDragId, setLiveDragId] = useState<string | null>(null)
  const [liveDragMinutes, setLiveDragMinutes] = useState<number | null>(null)
  const [showOffPlanModal, setShowOffPlanModal] = useState(false)
  const [showAiOffPlanModal, setShowAiOffPlanModal] = useState(false)
  const [openRationaleCardId, setOpenRationaleCardId] = useState<string | null>(null)
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null)
  const [swapCard, setSwapCard] = useState<TimelineCardData | null>(null)

  // ── auto-tick (KALMIO-310) ────────────────────────────────────────────────
  // currentMinutes ticks every 60 s so isMealSlotPast re-evaluates automatically.
  const [currentMinutes, setCurrentMinutes] = useState<number>(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date()
      setCurrentMinutes(d.getHours() * 60 + d.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Set of card IDs the user explicitly un-ticked this session.
  // Never auto-re-ticks within the same page load.
  const [sessionUnticked, setSessionUnticked] = useState<Set<string>>(new Set())
  const dragBaseMinutesRef = useRef<number>(0)
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const isDotDragRef = useRef(false)

  const wakeTime = localWake ?? wakeDefault
  const sleepTime = localSleep ?? sleepDefault
  const wakeMinutes = hmToMinutes(wakeTime)
  const sleepMinutes = hmToMinutes(sleepTime)

  const patchTimePref = useMutation({
    mutationFn: (req: Partial<TimePreferencesDto>) => usersService.patchTimePreferences(req),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['time-preferences'] }),
  })
  const patchMealTime = useMutation({
    mutationFn: ({ planId, mealId, time }: { planId: string; mealId: string; time: string | null }) =>
      planService.patchMealScheduledTime(planId, mealId, time),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })
  const patchPrepTime = useMutation({
    mutationFn: ({ taskId, time }: { taskId: string; time: string | null }) =>
      prepTasksService.patchScheduledTime(taskId, time),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  // Status changes (mark eaten/skipped) and recipe swaps reuse the same
  // updateMeal endpoint; we invalidate both the dashboard view and the plan
  // cache so the meal plans page stays in sync.
  const updateMeal = useMutation({
    mutationFn: ({ planId, mealId, req }: { planId: string; mealId: string; req: import('@/types').UpdatePlannedMealRequest }) =>
      planService.updateMeal(planId, mealId, req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', date] })
      void queryClient.invalidateQueries({ queryKey: ['plan', 'active'] })
    },
  })

  const deleteOffPlanMeal = useMutation({
    mutationFn: (id: string) => offPlanMealsService.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  const patchOffPlanTime = useMutation({
    mutationFn: ({ id, time }: { id: string; time: string | null }) =>
      offPlanMealsService.patchScheduledTime(id, time),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  // KALMIO-311: toggle prep task status PENDING ↔ DONE.
  // The server handles fridge depletion (on DONE) and fridge restore (on PENDING).
  const updatePrepStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: 'DONE' | 'PENDING' }) =>
      prepTasksService.updateStatus(taskId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  // Embed / detach a prep task (KALMIO-325 + KALMIO-328).
  const patchEmbedPrep = useMutation({
    mutationFn: ({ taskId, value }: { taskId: string; value: boolean }) =>
      prepTasksService.patchExecuteImmediatelyBefore(taskId, value),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['dashboard', date] }),
  })

  const handleEmbedPrepTask = useCallback((prepTaskId: string) => {
    patchEmbedPrep.mutate({ taskId: prepTaskId, value: true })
  }, [patchEmbedPrep])

  const handleDetachPrepTask = useCallback((prepTaskId: string) => {
    patchEmbedPrep.mutate({ taskId: prepTaskId, value: false })
  }, [patchEmbedPrep])

  // Coachmarks — read from the me query cache (already populated by other callers). KALMIO-326.
  const { data: me } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 300_000,
  })

  const coachmarksSeen = me?.coachmarksSeen ?? []

  // ── build card list ──────────────────────────────────────────────────────

  const lang = (i18n.language?.startsWith('hu') ? 'hu' : 'en') as 'hu' | 'en'

  const cards: TimelineCardData[] = useMemo(() => {
    const legacyMeals = dashboard?.todaysMeals ?? []
    const prepTasks = dashboard?.todaysPrepTasks ?? []
    const offPlanMeals = dashboard?.offPlanMeals ?? []
    const result: TimelineCardData[] = []

    // When materialized planned_meal rows are available (meal-planning-v2), use
    // those as the authoritative meal list for today. Fall back to the legacy
    // dashboard meals when the new endpoint returns nothing (KALMIO-249 not yet live).
    const meals = (plannedMeals && plannedMeals.length > 0)
      ? plannedMeals.map(pm => ({
          mealId: pm.id,
          mealType: pm.mealType,
          recipeId: pm.recipeId ?? '',
          recipeName: pm.recipeName ?? '',
          recipeTranslations: null,
          scheduledTime: null,
          macros: null,
          status: pm.status,
        }))
      : legacyMeals

    meals.forEach(meal => {
      const mealTimePrefs = timePref?.mealTimePrefs ?? {}
      const defaultTime = mealTimePrefs[meal.mealType] ?? MEAL_DEFAULTS[meal.mealType] ?? '12:00'
      const scheduledTime = cardTimeOverrides[`meal-${meal.mealId}`] ?? meal.scheduledTime ?? defaultTime
      const recipeName = getRecipeNameFromTranslations(meal.recipeTranslations ?? null, meal.recipeName, lang)
      result.push({
        id: `meal-${meal.mealId}`,
        type: meal.mealType,
        label: recipeName,
        recipeName,
        subtitle: meal.macros ? `${meal.macros.kcal} kcal · ${meal.macros.protein}g ${t('dashboard.macros.protein')}` : undefined,
        startMinutes: hmToMinutes(scheduledTime),
        mealType: meal.mealType,
        mealId: meal.mealId,
        recipeId: meal.recipeId,
        macros: meal.macros,
      })
    })

    prepTasks.forEach(task => {
      // executeImmediatelyBefore tasks are embedded inside the meal card — skip
      // them as standalone timeline items. KALMIO-317.
      if (task.executeImmediatelyBefore) return

      const defaultTime = PREP_WINDOW_DEFAULTS[task.window] ?? '12:00'
      const scheduledTime = cardTimeOverrides[`prep-${task.id ?? task.recipeId}`] ?? task.scheduledTime ?? defaultTime
      const recipeName = getRecipeNameFromTranslations(task.recipeTranslations ?? null, task.recipeName, lang)
      result.push({
        id: `prep-${task.id ?? task.recipeId}`,
        type: 'prep',
        label: t('timeline.prepLabel', { recipe: recipeName }),
        recipeName,
        subtitle: task.durationMin ? t('dashboard.prep.durationMin', { count: task.durationMin }) : undefined,
        startMinutes: hmToMinutes(scheduledTime),
        window: task.window,
        prepTaskId: task.id,
        recipeId: task.recipeId,
        prepStatus: task.status,
        // KALMIO-335: carry feedsPlannedMealIds so the Attach button can build
        // its picker options list from the valid meal IDs for this prep task.
        feedsPlannedMealIds: task.feedsPlannedMealIds ?? [],
      })
    })

    offPlanMeals.forEach(meal => {
      const subtitleParts: string[] = []
      if (meal.macros) {
        subtitleParts.push(`${meal.macros.kcal} kcal`)
        if (meal.macros.protein > 0) {
          subtitleParts.push(`${meal.macros.protein}g ${t('dashboard.macros.protein')}`)
        }
      }
      // Order of precedence for the slot:
      //   1. local override from an in-flight drag
      //   2. persisted scheduledTime from the server
      //   3. createdAt-derived clock time (clamped to wake/sleep)
      const overrideTime = cardTimeOverrides[`offplan-${meal.id}`]
      const startMinutes = overrideTime
        ? hmToMinutes(overrideTime)
        : meal.scheduledTime
          ? hmToMinutes(meal.scheduledTime)
          : offPlanTimelineMinutes(meal.createdAt, wakeMinutes, sleepMinutes)
      result.push({
        id: `offplan-${meal.id}`,
        type: 'offplan',
        label: meal.displayName,
        subtitle: subtitleParts.join(' · ') || undefined,
        startMinutes,
        offPlanMealId: meal.id,
        macros: meal.macros,
      })
    })

    if (hasShoppingDay) {
      result.push({
        id: 'shopping',
        type: 'shopping',
        label: t('timeline.shopping'),
        startMinutes: hmToMinutes(cardTimeOverrides['shopping'] ?? '15:00'),
      })
    }

    return result
  }, [dashboard, plannedMeals, timePref, cardTimeOverrides, hasShoppingDay, t, lang, wakeMinutes, sleepMinutes])

  // ── auto-tick set (KALMIO-310) ────────────────────────────────────────────
  // A meal is auto-ticked when:
  //   - it is a real meal card (has mealId)
  //   - its slot start + AUTO_TICK_OFFSET_MINUTES <= currentMinutes (wall clock)
  //   - the user has NOT explicitly un-ticked it this session
  //   - it is today's date (the DailyTimeline only ever renders one date)
  // We only auto-tick on today; past/future dates are left as-is.
  // Use todayIsoLocal() so users east of UTC (e.g. HU = UTC+2) do not lose
  // auto-tick in the evening: toISOString() is UTC and would return tomorrow's
  // date after 22:00 local time. KALMIO-310 bounce fix.
  const isToday = useMemo(() => date === todayIsoLocal(), [date])

  const autoTickedIds = useMemo((): Set<string> => {
    if (!isToday) return new Set()
    const ids = new Set<string>()
    for (const card of cards) {
      if (!card.mealId) continue
      if (sessionUnticked.has(card.id)) continue
      if (isMealSlotPast(card.startMinutes, currentMinutes)) {
        ids.add(card.id)
      }
    }
    return ids
  }, [cards, currentMinutes, sessionUnticked, isToday])

  // ── embedded prep map ─────────────────────────────────────────────────────
  // Maps each meal ID to the list of prep tasks that must run immediately before
  // it. These are rendered inside the meal card, not on the spine. KALMIO-317.

  const embeddedPrepsByMealId = useMemo((): Record<string, PrepTaskCard[]> => {
    const prepTasks = dashboard?.todaysPrepTasks ?? []
    const map: Record<string, PrepTaskCard[]> = {}
    for (const task of prepTasks) {
      if (!task.executeImmediatelyBefore) continue
      for (const mealId of task.feedsPlannedMealIds ?? []) {
        if (!map[mealId]) map[mealId] = []
        map[mealId]!.push(task)
      }
    }
    return map
  }, [dashboard])

  // ── prepFeedsMap (KALMIO-335 + KALMIO-336) ──────────────────────────────────
  // Maps prepTaskId → array of valid plannedMealIds for goo-drag validation and
  // AttachMealPicker option building.

  const prepFeedsMap = useMemo((): Record<string, string[]> => {
    const prepTasks = dashboard?.todaysPrepTasks ?? []
    const map: Record<string, string[]> = {}
    for (const task of prepTasks) {
      if (task.id) map[task.id] = task.feedsPlannedMealIds ?? []
    }
    return map
  }, [dashboard])

  // ── meal label map — used to build AttachMealPicker option labels ─────────
  // Maps mealId → human-readable label for the picker. We use the card label
  // (which already contains the recipe name) from the sorted card list.
  const mealLabelById = useMemo((): Record<string, string> => {
    const labels: Record<string, string> = {}
    for (const card of cards) {
      if (card.mealId) labels[card.mealId] = card.label
    }
    return labels
  }, [cards])

  // ── coachmark visibility (KALMIO-326) ────────────────────────────────────
  const hasEmbeddedPrep = Object.keys(embeddedPrepsByMealId).length > 0
  const hasStandalonePrep = (dashboard?.todaysPrepTasks ?? []).some(t => !t.executeImmediatelyBefore)
  const showPrepDragCoachmark = usePrepDragCoachmarkVisible(
    coachmarksSeen,
    hasEmbeddedPrep,
    hasStandalonePrep,
    false, // DailyTimeline is always the daily view, never the calendar view
  )

  // ── batch prep: first-consumption and dependent meal maps ─────────────────
  // KALMIO-321.
  //
  // For each batch prep (feedsPlannedMealIds.length > 1), the first meal in the
  // feeds list is the "first-consumption" meal (shows portion breakdown).
  // All other meals in the list are "dependent" meals (show leftover badge).
  //
  // portionBreakdownByMealId: mealId → PortionBreakdownData (first meal only)
  // leftoverSourceMealIdByMealId: mealId → source mealId (dependent meals only)
  // mealDayLabels: mealId → short label used in the portion breakdown text.

  const mealDayLabels = useMemo((): Record<string, string> => {
    // Build a map from mealId → short day+slot label.
    // For today's meals we use the meal type label; cross-day meals would need
    // enrichment from the plan endpoint. This is a best-effort display.
    const labels: Record<string, string> = {}
    const meals = (plannedMeals && plannedMeals.length > 0) ? plannedMeals : []
    const legacy = dashboard?.todaysMeals ?? []

    meals.forEach(pm => {
      if (pm.id) labels[pm.id] = pm.mealType ?? pm.id
    })
    legacy.forEach(m => {
      if (m.mealId) labels[m.mealId] = m.mealType ?? m.mealId
    })
    return labels
  }, [plannedMeals, dashboard])

  const { portionBreakdownByMealId, leftoverSourceMealIdByMealId } = useMemo(() => {
    const breakdown: Record<string, PortionBreakdownData> = {}
    const leftoverSource: Record<string, string> = {}

    const prepTasks = dashboard?.todaysPrepTasks ?? []
    for (const task of prepTasks) {
      if (!isBatchPrep(task)) continue
      const feeds = task.feedsPlannedMealIds ?? []
      if (feeds.length < 2) continue
      const firstMealId = feeds[0]!
      // Portion breakdown on the first meal
      const data = getPortionBreakdownData(task, firstMealId, mealDayLabels)
      if (data && !breakdown[firstMealId]) {
        breakdown[firstMealId] = data
      }
      // Leftover source on the remaining meals
      for (let i = 1; i < feeds.length; i++) {
        const depMealId = feeds[i]!
        if (!leftoverSource[depMealId]) {
          leftoverSource[depMealId] = firstMealId
        }
      }
    }

    return { portionBreakdownByMealId: breakdown, leftoverSourceMealIdByMealId: leftoverSource }
  }, [dashboard, mealDayLabels])

  // ── dnd handlers ─────────────────────────────────────────────────────────

  const restrictToTimeline = useCallback<Modifier>(({ transform, draggingNodeRect }) => {
    const ref = isDotDragRef.current ? outerRef : innerRef
    if (!ref.current || !draggingNodeRect) return transform
    const bounds = ref.current.getBoundingClientRect()
    return {
      ...transform,
      y: clamp(transform.y, bounds.top - draggingNodeRect.top, bounds.bottom - draggingNodeRect.bottom),
    }
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = String(event.active.id)
    if (id === 'dot-wake') {
      isDotDragRef.current = true
      setActiveDotKind('wake')
      setLiveDragId(id)
      dragBaseMinutesRef.current = wakeMinutes
      setLiveDragMinutes(wakeMinutes)
      return
    }
    if (id === 'dot-sleep') {
      isDotDragRef.current = true
      setActiveDotKind('sleep')
      setLiveDragId(id)
      dragBaseMinutesRef.current = sleepMinutes
      setLiveDragMinutes(sleepMinutes)
      return
    }
    isDotDragRef.current = false
    const card = cards.find(c => c.id === id)
    if (card) {
      setActiveCard(card)
      setLiveDragId(id)
      dragBaseMinutesRef.current = card.startMinutes
      setLiveDragMinutes(card.startMinutes)
    }
  }, [cards, wakeMinutes, sleepMinutes])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const id = String(event.active.id)
    const base = dragBaseMinutesRef.current
    const delta = event.delta.y
    let newMin: number
    if (id === 'dot-wake') {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), 0, sleepMinutes - 30)
    } else if (id === 'dot-sleep') {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), wakeMinutes + 30, 23 * 60 + 59)
    } else {
      newMin = clamp(snapToGrid(base + delta * DRAG_MIN_PER_PX), wakeMinutes, sleepMinutes - 15)
    }
    setLiveDragMinutes(newMin)
  }, [wakeMinutes, sleepMinutes])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const id = String(event.active.id)
    const newMin = liveDragMinutes ?? dragBaseMinutesRef.current
    const newTime = minutesToHm(newMin)

    setLiveDragId(null)
    setLiveDragMinutes(null)

    if (id === 'dot-wake') {
      setActiveDotKind(null)
      setLocalWake(newTime)
      patchTimePref.mutate({ wakeTime: newTime })
      return
    }
    if (id === 'dot-sleep') {
      setActiveDotKind(null)
      setLocalSleep(newTime)
      patchTimePref.mutate({ sleepTime: newTime })
      return
    }

    const card = cards.find(c => c.id === id)
    if (!card) { setActiveCard(null); return }

    setCardTimeOverrides(prev => ({ ...prev, [id]: newTime }))
    setActiveCard(null)

    if (card.type === 'prep') {
      if (card.prepTaskId) patchPrepTime.mutate({ taskId: card.prepTaskId, time: newTime })
      return
    }

    if (card.type === 'offplan') {
      if (card.offPlanMealId) patchOffPlanTime.mutate({ id: card.offPlanMealId, time: newTime })
      return
    }

    if (card.mealId && activePlanId)
      patchMealTime.mutate({ planId: activePlanId, mealId: card.mealId, time: newTime })

    // pill offers optional upgrade to "set as default" time preference
    setPendingFeedback({
      cardId: id, newTime,
      cardType: 'meal',
      mealType: card.mealType,
      mealId: card.mealId,
      label: newTime,
    })
  }, [cards, liveDragMinutes, activePlanId, patchTimePref, patchMealTime, patchPrepTime, patchOffPlanTime])

  const handleTodayOnly = useCallback(() => {
    setPendingFeedback(null)
  }, [])

  const handleSetDefault = useCallback(() => {
    if (!pendingFeedback) return
    const { mealType, newTime } = pendingFeedback
    if (mealType) {
      patchTimePref.mutate({ mealTimePrefs: { ...(timePref?.mealTimePrefs ?? {}), [mealType]: newTime } })
    }
    setPendingFeedback(null)
  }, [pendingFeedback, timePref, patchTimePref])

  // ── sorted point list — uses liveDragMinutes for magnetic re-sort ─────────

  const getEffectiveMinutes = (card: TimelineCardData) =>
    liveDragId === card.id && liveDragMinutes !== null ? liveDragMinutes : card.startMinutes

  type Row =
    | { kind: 'dot';      dotType: 'wake' | 'sleep'; time: string; minutes: number }
    | { kind: 'card';     card: TimelineCardData; minutes: number }
    | { kind: 'spacer';   minutes: number }
    | { kind: 'feedback'; cardId: string }

  const allPoints = ([
    { minutes: wakeMinutes,  row: { kind: 'dot'  as const, dotType: 'wake'  as const, time: wakeTime,  minutes: wakeMinutes  } },
    { minutes: sleepMinutes, row: { kind: 'dot'  as const, dotType: 'sleep' as const, time: sleepTime, minutes: sleepMinutes } },
    ...cards.map(c => ({
      minutes: getEffectiveMinutes(c),
      row: { kind: 'card' as const, card: { ...c, startMinutes: getEffectiveMinutes(c) }, minutes: getEffectiveMinutes(c) },
    })),
  ] satisfies Array<{ minutes: number; row: Row }>).sort((a, b) => a.minutes - b.minutes)

  const rows: Row[] = []
  const nodeCount = allPoints.length

  allPoints.forEach((pt, i) => {
    if (i > 0) {
      const diff = pt.minutes - allPoints[i - 1]!.minutes
      if (diff > 0) rows.push({ kind: 'spacer', minutes: diff })
    }
    rows.push(pt.row)
    const id = pt.row.kind === 'card'
      ? pt.row.card.id
      : pt.row.kind === 'dot' ? `dot-${pt.row.dotType}` : ''
    if (pendingFeedback?.cardId === id) {
      rows.push({ kind: 'feedback', cardId: id })
    }
  })

  // ── DragOverlay content ───────────────────────────────────────────────────

  const overlayTime = liveDragMinutes !== null ? minutesToHm(liveDragMinutes) : ''

  return (
    <PrepGooDragContext
      onEmbedPrepTask={handleEmbedPrepTask}
      onDetachPrepTask={handleDetachPrepTask}
      prepFeedsMap={prepFeedsMap}
    >
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {/* Coachmark: shown once when embedded AND standalone preps coexist. KALMIO-326. */}
      {showPrepDragCoachmark && (
        <div className="px-3 pb-2">
          <PrepDragCoachmark visible={showPrepDragCoachmark} />
        </div>
      )}

      <div ref={outerRef} className="flex flex-col py-1 pb-6">
        <SleepBanner from="00:00" to={wakeTime} />

        <div ref={innerRef} className="flex flex-col px-3 pt-2">
          {(() => {
            let nodeIndex = -1
            return rows.map((row, i) => {
              if (row.kind === 'spacer') {
                return <SpacerRow key={`spacer-${i}`} minutes={row.minutes} />
              }

              if (row.kind === 'feedback') {
                const pf = pendingFeedback
                if (!pf || pf.cardId !== row.cardId) return null
                return (
                  <DragFeedbackPill
                    key={`pill-${row.cardId}`}
                    label={pf.label}
                    todayOnlyLabel={t('timeline.todayOnly')}
                    defaultLabel={
                      pf.cardType === 'sleep-wake'
                        ? (pf.dotKind === 'wake' ? t('timeline.setAsWakeTime') : t('timeline.setAsSleepTime'))
                        : t('timeline.setDefault')
                    }
                    onTodayOnly={handleTodayOnly}
                    onSetDefault={handleSetDefault}
                    onDismiss={() => setPendingFeedback(null)}
                  />
                )
              }

              nodeIndex++
              const isFirst = nodeIndex === 0
              const isLast  = nodeIndex === nodeCount - 1

              if (row.kind === 'dot') {
                const dotId = `dot-${row.dotType}`
                return (
                  <DraggableSpineDot
                    key={dotId}
                    id={dotId}
                    time={row.time}
                    type={row.dotType}
                    label={row.dotType === 'wake' ? t('timeline.wake') : t('timeline.sleep')}
                    showLineAbove={!isFirst}
                    showLineBelow={!isLast}
                    liveDragMinutes={liveDragId === dotId ? liveDragMinutes : null}
                  />
                )
              }

              const cardData = row.card

              if (cardData.type === 'offplan' && cardData.offPlanMealId) {
                const opId = cardData.offPlanMealId
                const isDeleting =
                  deleteOffPlanMeal.isPending &&
                  (deleteOffPlanMeal.variables as string | undefined) === opId
                return (
                  <OffPlanRow
                    key={cardData.id}
                    card={cardData}
                    isFirst={isFirst}
                    isLast={isLast}
                    deleting={isDeleting}
                    liveDragMinutes={liveDragId === cardData.id ? liveDragMinutes : null}
                    onDelete={() => deleteOffPlanMeal.mutate(opId)}
                  />
                )
              }

              const cardMutating =
                updateMeal.isPending &&
                (updateMeal.variables as { mealId?: string } | undefined)?.mealId === cardData.mealId
              const embeddedPreps = cardData.mealId
                ? (embeddedPrepsByMealId[cardData.mealId] ?? [])
                : []
              const cardIsAutoTicked = autoTickedIds.has(cardData.id)

              // KALMIO-321: batch prep portion breakdown + leftover badge.
              const portionBreakdown = cardData.mealId
                ? (portionBreakdownByMealId[cardData.mealId] ?? null)
                : null
              const leftoverSourceMealId = cardData.mealId
                ? (leftoverSourceMealIdByMealId[cardData.mealId] ?? null)
                : null
              const leftoverSourceLabel = leftoverSourceMealId
                ? (mealDayLabels[leftoverSourceMealId] ?? undefined)
                : undefined
              // Scroll to the source meal card using the data-card-id attribute
              // already present on each DraggableRow root div. KALMIO-321.
              const handleScrollToSource = leftoverSourceMealId
                ? () => {
                    const sourceCardId = `meal-${leftoverSourceMealId}`
                    const el = innerRef.current?.querySelector(`[data-card-id="${sourceCardId}"]`)
                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                : undefined

              return (
                <DraggableRow
                  key={cardData.id}
                  card={cardData}
                  isFirst={isFirst}
                  isLast={isLast}
                  liveDragMinutes={liveDragId === cardData.id ? liveDragMinutes : null}
                  rationaleOpen={openRationaleCardId === cardData.id}
                  menuOpen={openMenuCardId === cardData.id}
                  mutating={cardMutating}
                  isPremium={isPremium}
                  embeddedPreps={embeddedPreps.length > 0 ? embeddedPreps : undefined}
                  isAutoTicked={cardIsAutoTicked}
                  portionBreakdown={portionBreakdown}
                  leftoverSourceLabel={leftoverSourceLabel}
                  onScrollToSource={handleScrollToSource}
                  onAutoTickUndo={() => {
                    setSessionUnticked(prev => {
                      const next = new Set(prev)
                      next.add(cardData.id)
                      return next
                    })
                  }}
                  onAutoTickMenu={() => {
                    setOpenMenuCardId(cardData.id)
                  }}
                  onViewRecipe={() => {
                    if (cardData.recipeId) {
                      navigate(`/app/recipes/${cardData.recipeId}?from=timeline`)
                    }
                  }}
                  onToggleRationale={() =>
                    setOpenRationaleCardId(prev => (prev === cardData.id ? null : cardData.id))
                  }
                  onOpenSwap={() => { setOpenMenuCardId(null); setSwapCard(cardData) }}
                  onToggleMenu={() =>
                    setOpenMenuCardId(prev => (prev === cardData.id ? null : cardData.id))
                  }
                  onMarkEaten={() => {
                    setOpenMenuCardId(null)
                    if (activePlanId && cardData.mealId) {
                      updateMeal.mutate({ planId: activePlanId, mealId: cardData.mealId, req: { status: 'EATEN' } })
                    }
                  }}
                  onMarkSkipped={() => {
                    setOpenMenuCardId(null)
                    if (activePlanId && cardData.mealId) {
                      updateMeal.mutate({ planId: activePlanId, mealId: cardData.mealId, req: { status: 'SKIPPED' } })
                    }
                  }}
                  onDetachEmbeddedPrep={handleDetachPrepTask}
                  attachMealOptions={
                    // KALMIO-335: build picker options from feedsPlannedMealIds.
                    // Only relevant for standalone prep cards; meal cards will have an
                    // empty feedsPlannedMealIds so this will produce an empty array.
                    (cardData.feedsPlannedMealIds ?? [])
                      .map(mealId => ({
                        mealId,
                        label: mealLabelById[mealId] ?? mealId,
                      }))
                  }
                  onAttachPrepToMeal={(prepTaskId, mealId) => {
                    patchEmbedPrep.mutate({ taskId: prepTaskId, value: true })
                    void mealId // mealId used for UI context by the picker; PATCH only needs taskId
                  }}
                  prepStatus={cardData.prepStatus}
                  onPrepTickToggle={() => {
                    if (!cardData.prepTaskId) return
                    const nextStatus = cardData.prepStatus === 'DONE' ? 'PENDING' : 'DONE'
                    updatePrepStatus.mutate({ taskId: cardData.prepTaskId, status: nextStatus })
                  }}
                  onPrepLongPress={() => {
                    if (cardData.recipeId) {
                      navigate(`/app/recipes/${cardData.recipeId}/cook`)
                    }
                  }}
                />
              )
            })
          })()}
        </div>

        <SleepBanner from={sleepTime} to="00:00" />

        {cards.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">
            {t('dashboard.meals.noMealsToday')}
          </p>
        )}

        {/* ── Log buttons — manual + AI. Logged meals render on the timeline above. ─ */}
        <OffPlanLogButtons
          onLog={() => setShowOffPlanModal(true)}
          onLogAi={() => setShowAiOffPlanModal(true)}
          isPremium={isPremium}
        />
      </div>

      {showOffPlanModal && (
        <OffPlanMealLogModal
          date={date}
          onClose={() => setShowOffPlanModal(false)}
        />
      )}

      <AiOffPlanLogModal
        open={showAiOffPlanModal}
        onOpenChange={setShowAiOffPlanModal}
        date={date}
      />

      {/* Recipe swap picker — meal cards only. */}
      {swapCard?.recipeId && (
        <RecipePickerDialog
          open
          currentRecipeId={swapCard.recipeId}
          onSelect={(recipe: Recipe) => {
            if (activePlanId && swapCard.mealId) {
              updateMeal.mutate({
                planId: activePlanId,
                mealId: swapCard.mealId,
                req: { replacedWithRecipeId: recipe.id },
              })
            }
            setSwapCard(null)
          }}
          onClose={() => setSwapCard(null)}
        />
      )}

      {/* DragOverlay — anchored to the card rect (setNodeRef is on the card div),
          so it appears exactly where the card is and only moves vertically */}
      <DragOverlay modifiers={[restrictToVerticalAxis, restrictToTimeline]} dropAnimation={null}>
        {activeCard ? (() => {
          const ns = nodeStyle(activeCard.type)
          return (
            <div className="rounded-xl bg-white border border-[#F28C28]/50 shadow-[0_8px_32px_rgba(0,0,0,0.14)] px-3 py-2.5 flex items-center gap-2 select-none">
              <div className={`w-7 h-7 rounded-full ring-1 ${ns.ring} ${ns.bg} flex items-center justify-center text-sm shrink-0`}>
                {ns.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{activeCard.label}</p>
                <p className="text-[11px] font-bold text-[#F28C28] tabular-nums mt-0.5">{overlayTime}</p>
              </div>
            </div>
          )
        })() : activeDotKind ? (() => {
          const ns = nodeStyle(activeDotKind)
          return (
            <div className={`w-6 h-6 rounded-full ring-1 ${ns.ring} ${ns.bg} flex items-center justify-center text-xs shadow-md`}>
              {ns.icon}
            </div>
          )
        })() : null}
      </DragOverlay>
    </DndContext>
    </PrepGooDragContext>
  )
}
