/**
 * TemplateGrid — renders the day × slot × member grid for a plan template.
 *
 * Layout rules:
 * - Mobile (< md): each day is a stacked card; slots render vertically;
 *   member sub-cells run horizontally within each slot row.
 * - Desktop (≥ md): one column per (slot, member) pair; rows = days.
 *
 * Each sub-cell is a button:
 *  - Filled: shows recipe name (truncated) in a tinted pill.
 *  - Empty:  shows a "+" affordance with `emptyLabel` text.
 */
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Plus, GripVertical, Minus, Layers } from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { MEMBER_COLORS } from './memberColors'
import { DayMacroStrip } from './DayMacroStrip'
import { dndCellId, nextServings } from './templateDnd'
import { PrepLaneRow } from './PrepLaneRow'
import { PrepHoldViolationBanner } from './PrepHoldViolationBanner'
import type { PlanTemplate, Recipe, TemplateMeal, MealType, TemplatePrepSlot } from '@/types'
import type { MacroTargets, MacroTotals } from '@/lib/planMacros'

interface TemplateGridProps {
  plan: PlanTemplate
  memberNames: Record<string, string>
  /** Recipe id → display name, for labeling filled cells. */
  recipeNames: Record<string, string>
  /** Recipe id → full Recipe object (for per-meal macro computation). */
  recipesById: Record<string, Recipe>
  /** One entry per day; index = day index. Used to render header macro bars. */
  daily: MacroTotals[]
  /** Aggregate target across plan members; one set drives all DayCards. */
  targets: MacroTargets
  /**
   * Per-member daily kcal target divided evenly across covered slots, for the
   * per-meal slot bar. Family plans need this per-member: the aggregate is
   * null whenever any single member is missing goals, but each individual
   * member's bar should still render when THEIR target is known.
   */
  slotKcalTargetByMember: Record<string, number | null>
  /**
   * Per-member set of preferred meal-type names. Slots not in the set are
   * rendered dimmer with a small "Nem preferált" badge so the user can see at
   * a glance which cells fall outside that member's normal eating pattern.
   * Empty set = no preference recorded → no dimming.
   */
  preferredSlotsByMember: Record<string, Set<string>>
  /** Active drag source meal id, or null when nothing is being dragged. */
  dragSourceId: string | null
  /** Active drop target dnd id (cell:day:slot:member), or null. */
  dragOverId: string | null
  /** Meal currently sitting in the hovered drop target (for source preview). */
  dragOverMeal: TemplateMeal | null
  dragOverRecipe: Recipe | undefined
  dragOverRecipeName: string | null
  onCellClick: (dayIndex: number, mealType: MealType, memberId: string, existing: TemplateMeal | null) => void
  /** Persist a new servings multiplier for an existing meal cell. */
  onServingsChange: (cell: TemplateMeal, servings: number) => void
  // ── Prep lane ────────────────────────────────────────────────────────────
  /** All template prep slots for this plan (loaded from the prep-slots query). */
  prepSlots: TemplatePrepSlot[]
  /** True while any prep-slot chip is being dragged (drives drop-zone styling). */
  isPrepSlotDragging: boolean
  /** Tap on an empty prep cell — opens PrepSlotPicker. */
  onPrepAddClick: (dayIndex: number, window: 'MORNING' | 'EVENING') => void
  /** Delete a prep slot. */
  onPrepDelete: (slotId: string) => void
  // ── Prep-hold violation banner (KALMIO-268) ───────────────────────────────
  /**
   * The plan id used to query /api/plans/{planId}/prep-hold-violations.
   * Passed to PrepHoldViolationBanner inside each filled meal cell.
   */
  planId: string
  /**
   * Set of templateMealIds that currently have a prep-hold violation.
   * When non-empty, each corresponding filled cell renders the banner above it.
   * Kept as a Set for O(1) lookup in a list of potentially many cells.
   */
  violatingMealIds: Set<string>
}

/** Returns the template meal for a given (dayIndex, mealType, memberId) or null. */
function findCell(
  meals: TemplateMeal[],
  dayIndex: number,
  mealType: MealType,
  memberId: string,
): TemplateMeal | null {
  return meals.find(
    m => m.dayIndex === dayIndex && m.mealType === mealType && m.memberId === memberId,
  ) ?? null
}

export function TemplateGrid({ plan, memberNames, recipeNames, recipesById, daily, targets, slotKcalTargetByMember, preferredSlotsByMember, dragSourceId, dragOverId, dragOverMeal, dragOverRecipe, dragOverRecipeName, onCellClick, onServingsChange, prepSlots, isPrepSlotDragging, onPrepAddClick, onPrepDelete, planId, violatingMealIds }: TemplateGridProps) {
  const { t } = useTranslation()

  const days = Array.from({ length: plan.lengthDays }, (_, i) => i)
  const slots = plan.mealSlotsCovered
  const members = plan.memberIds

  // Resolve the dragged meal + its recipe once so each DropPreview can render
  // the source meal's content in the hovered target cell without re-searching.
  const dragSourceMeal = dragSourceId
    ? plan.templateMeals.find(m => m.id === dragSourceId) ?? null
    : null
  const dragSourceRecipe = dragSourceMeal?.recipeId
    ? recipesById[dragSourceMeal.recipeId]
    : undefined
  const dragSourceRecipeName = dragSourceMeal?.recipeId
    ? (recipeNames[dragSourceMeal.recipeId] ?? dragSourceMeal.recipeId.slice(0, 8))
    : null

  return (
    <div className="space-y-4">
      {days.map(dayIndex => (
        <DayCard
          key={dayIndex}
          dayIndex={dayIndex}
          slots={slots}
          members={members}
          memberNames={memberNames}
          recipeNames={recipeNames}
          recipesById={recipesById}
          meals={plan.templateMeals}
          dayTotals={daily[dayIndex] ?? { kcal: 0, protein: 0, fat: 0, carbs: 0 }}
          targets={targets}
          slotKcalTargetByMember={slotKcalTargetByMember}
          preferredSlotsByMember={preferredSlotsByMember}
          dragSourceMeal={dragSourceMeal}
          dragSourceRecipe={dragSourceRecipe}
          dragSourceRecipeName={dragSourceRecipeName}
          dragOverId={dragOverId}
          dragOverMeal={dragOverMeal}
          dragOverRecipe={dragOverRecipe}
          dragOverRecipeName={dragOverRecipeName}
          onCellClick={onCellClick}
          onServingsChange={onServingsChange}
          prepSlots={prepSlots.filter(s => s.dayIndex === dayIndex)}
          isPrepSlotDragging={isPrepSlotDragging}
          onPrepAddClick={onPrepAddClick}
          onPrepDelete={onPrepDelete}
          planId={planId}
          violatingMealIds={violatingMealIds}
          t={t}
        />
      ))}
    </div>
  )
}

// ── Per-day card ──────────────────────────────────────────────────────────

interface DayCardProps {
  dayIndex: number
  slots: MealType[]
  members: string[]
  memberNames: Record<string, string>
  recipeNames: Record<string, string>
  recipesById: Record<string, Recipe>
  meals: TemplateMeal[]
  dayTotals: MacroTotals
  targets: MacroTargets
  slotKcalTargetByMember: Record<string, number | null>
  preferredSlotsByMember: Record<string, Set<string>>
  dragSourceMeal: TemplateMeal | null
  dragSourceRecipe: Recipe | undefined
  dragSourceRecipeName: string | null
  dragOverId: string | null
  dragOverMeal: TemplateMeal | null
  dragOverRecipe: Recipe | undefined
  dragOverRecipeName: string | null
  onCellClick: TemplateGridProps['onCellClick']
  onServingsChange: TemplateGridProps['onServingsChange']
  // ── Prep lane ────────────────────────────────────────────────────────────
  prepSlots: TemplatePrepSlot[]
  isPrepSlotDragging: boolean
  onPrepAddClick: TemplateGridProps['onPrepAddClick']
  onPrepDelete: TemplateGridProps['onPrepDelete']
  // ── Prep-hold violation banner (KALMIO-268) ───────────────────────────────
  planId: string
  violatingMealIds: Set<string>
  t: TFunction
}

function DayCard({ dayIndex, slots, members, memberNames, recipeNames, recipesById, meals, dayTotals, targets, slotKcalTargetByMember, preferredSlotsByMember, dragSourceMeal, dragSourceRecipe, dragSourceRecipeName, dragOverId, dragOverMeal, dragOverRecipe, dragOverRecipeName, onCellClick, onServingsChange, prepSlots, isPrepSlotDragging, onPrepAddClick, onPrepDelete, planId, violatingMealIds, t }: DayCardProps) {
  return (
    <section
      aria-label={t('plan.detail.dayLabel', { day: dayIndex + 1 })}
      className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden"
    >
      {/* Day header */}
      <div className="px-4 pt-2.5 pb-3 bg-[#F9F7F2] border-b border-[#e5e7eb]">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2">
          {t('plan.detail.dayLabel', { day: dayIndex + 1 })}
        </h2>
        <DayMacroStrip totals={dayTotals} targets={targets} />
      </div>

      {/* Slot rows */}
      <div className="divide-y divide-[#f3f4f6]">
        {slots.map(slot => (
          <SlotRow
            key={slot}
            slot={slot}
            dayIndex={dayIndex}
            members={members}
            memberNames={memberNames}
            recipeNames={recipeNames}
            recipesById={recipesById}
            meals={meals}
            slotKcalTargetByMember={slotKcalTargetByMember}
            preferredSlotsByMember={preferredSlotsByMember}
            dragSourceMeal={dragSourceMeal}
            dragSourceRecipe={dragSourceRecipe}
            dragSourceRecipeName={dragSourceRecipeName}
            dragOverId={dragOverId}
            dragOverMeal={dragOverMeal}
            dragOverRecipe={dragOverRecipe}
            dragOverRecipeName={dragOverRecipeName}
            onCellClick={onCellClick}
            onServingsChange={onServingsChange}
            planId={planId}
            violatingMealIds={violatingMealIds}
            t={t}
          />
        ))}
      </div>

      {/* Prep lane — "Előkészítés" row beneath all meal-type rows */}
      <PrepLaneRow
        dayIndex={dayIndex}
        slots={prepSlots}
        recipeNames={recipeNames}
        isAnyDragging={isPrepSlotDragging}
        onAddClick={onPrepAddClick}
        onDelete={onPrepDelete}
      />
    </section>
  )
}

// ── Per-slot row ──────────────────────────────────────────────────────────

interface SlotRowProps {
  slot: MealType
  dayIndex: number
  members: string[]
  memberNames: Record<string, string>
  recipeNames: Record<string, string>
  recipesById: Record<string, Recipe>
  meals: TemplateMeal[]
  slotKcalTargetByMember: Record<string, number | null>
  preferredSlotsByMember: Record<string, Set<string>>
  dragSourceMeal: TemplateMeal | null
  dragSourceRecipe: Recipe | undefined
  dragSourceRecipeName: string | null
  dragOverId: string | null
  dragOverMeal: TemplateMeal | null
  dragOverRecipe: Recipe | undefined
  dragOverRecipeName: string | null
  onCellClick: TemplateGridProps['onCellClick']
  onServingsChange: TemplateGridProps['onServingsChange']
  planId: string
  violatingMealIds: Set<string>
  t: TFunction
}

function SlotRow({ slot, dayIndex, members, memberNames, recipeNames, recipesById, meals, slotKcalTargetByMember, preferredSlotsByMember, dragSourceMeal, dragSourceRecipe, dragSourceRecipeName, dragOverId, dragOverMeal, dragOverRecipe, dragOverRecipeName, onCellClick, onServingsChange, planId, violatingMealIds, t }: SlotRowProps) {
  return (
    <div className="flex items-start gap-0 min-h-[52px]">
      {/* Slot label */}
      <div className="w-24 shrink-0 px-3 py-3 self-center">
        <span className="text-xs font-medium text-[#6b7280]">
          {t(`plan.mealTypes.${slot}`, { defaultValue: slot })}
        </span>
      </div>

      {/* Member sub-cells */}
      <div className="flex-1 flex flex-wrap gap-2 px-2 py-2 min-w-0">
        {members.map((memberId, memberIdx) => {
          const cell = findCell(meals, dayIndex, slot, memberId)
          const name = memberNames[memberId] ?? memberId.slice(0, 8)
          const colorClass = MEMBER_COLORS[memberIdx % MEMBER_COLORS.length]
          const recipe = cell?.recipeId ? recipesById[cell.recipeId] : undefined
          const recipeName = cell?.recipeId ? (recipeNames[cell.recipeId] ?? cell.recipeId.slice(0, 8)) : null

          // True when this cell is currently the drag drop target AND the
          // drag source is something else (not this cell itself).
          const isDropTarget =
            dragOverId === dndCellId(dayIndex, slot, memberId)
            && dragSourceMeal != null
            && dragSourceMeal.id !== cell?.id
          // True when this cell IS the drag source — used to preview the
          // swap target's contents in place of its own while dragging.
          const isDragSource =
            dragSourceMeal != null
            && cell != null
            && cell.id === dragSourceMeal.id

          return (
            <MemberCell
              key={memberId}
              memberId={memberId}
              dayIndex={dayIndex}
              slot={slot}
              memberName={name}
              colorClass={colorClass}
              cell={cell}
              recipe={recipe}
              recipeName={recipeName}
              slotKcalTarget={slotKcalTargetByMember[memberId] ?? null}
              nonPreferred={
                (() => {
                  const set = preferredSlotsByMember[memberId]
                  // Empty/missing set = user never configured prefs → don't dim.
                  return set != null && set.size > 0 && !set.has(slot)
                })()
              }
              isDropTarget={isDropTarget}
              isDragSource={isDragSource}
              dragSourceRecipe={dragSourceRecipe}
              dragSourceRecipeName={dragSourceRecipeName}
              dragSourceServings={
                dragSourceMeal ? Number(dragSourceMeal.servings) : 1
              }
              dragOverMeal={dragOverMeal}
              dragOverRecipe={dragOverRecipe}
              dragOverRecipeName={dragOverRecipeName}
              onCellClick={() => onCellClick(dayIndex, slot, memberId, cell)}
              onServingsChange={onServingsChange}
              planId={planId}
              violatingMealIds={violatingMealIds}
              t={t}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Single member × slot cell ─────────────────────────────────────────────

interface MemberCellProps {
  memberId: string
  dayIndex: number
  slot: MealType
  memberName: string
  colorClass: string
  cell: TemplateMeal | null
  recipe: Recipe | undefined
  recipeName: string | null
  slotKcalTarget: number | null
  /** True when this slot is NOT in the member's preferred meal-type set. */
  nonPreferred: boolean
  /** True when a foreign cell is currently being dragged onto this one. */
  isDropTarget: boolean
  /** True when this cell IS the drag source (used to mirror swap preview). */
  isDragSource: boolean
  dragSourceRecipe: Recipe | undefined
  dragSourceRecipeName: string | null
  dragSourceServings: number
  /** Meal currently in the hovered drop target (drives source-side preview). */
  dragOverMeal: TemplateMeal | null
  dragOverRecipe: Recipe | undefined
  dragOverRecipeName: string | null
  onCellClick: () => void
  onServingsChange: TemplateGridProps['onServingsChange']
  planId: string
  violatingMealIds: Set<string>
  t: TFunction
}

function MemberCell(props: MemberCellProps) {
  const isEmpty = props.cell == null
    || (props.cell.recipeId == null && props.cell.offPlanMealTemplateId == null)

  // Show violation banner above a filled cell when this meal is in the violating set.
  const hasViolation = !isEmpty && props.cell != null && props.violatingMealIds.has(props.cell.id)

  return (
    <div className="flex flex-col min-w-0">
      {hasViolation && props.cell != null && (
        <PrepHoldViolationBanner
          surface="template"
          planOrScheduleId={props.planId}
          mealId={props.cell.id}
        />
      )}
      {isEmpty ? <EmptyMemberCell {...props} /> : <FilledMemberCell {...props} />}
    </div>
  )
}

function EmptyMemberCell({ dayIndex, slot, memberId, memberName, colorClass, isDropTarget, nonPreferred, dragSourceRecipeName, onCellClick, t }: MemberCellProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dndCellId(dayIndex, slot, memberId),
  })
  // When this empty cell is the active drop target during a drag, show the
  // source recipe name as a ghost so the user can read where it will land.
  const previewing = isDropTarget && isOver
  return (
    <button
      ref={setDropRef}
      type="button"
      onClick={onCellClick}
      aria-label={
        nonPreferred
          ? `${memberName} — ${t('plan.detail.cell.emptyAria')} — ${t('plan.detail.cell.nonPreferredAria')}`
          : `${memberName} — ${t('plan.detail.cell.emptyAria')}`
      }
      title={nonPreferred ? t('plan.detail.cell.nonPreferredTitle') : undefined}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        border border-dashed text-xs transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        min-w-0 max-w-[200px]
        ${isOver || isDropTarget
          ? 'border-[#4f46e5] text-[#4f46e5] bg-[#eef2ff]'
          : nonPreferred
            ? 'border-[#e5e7eb] text-[#d1d5db] opacity-60 hover:opacity-100 hover:border-[#4f46e5] hover:text-[#4f46e5]'
            : 'border-[#d1d5db] text-[#9ca3af] hover:border-[#4f46e5] hover:text-[#4f46e5]'}
      `}
    >
      <span aria-hidden className={`w-2 h-2 rounded-full shrink-0 ${colorClass} ${nonPreferred ? 'opacity-50' : ''}`} />
      {previewing && dragSourceRecipeName ? (
        <>
          <span className="text-[#4f46e5] shrink-0">↓</span>
          <span className="truncate font-medium">{dragSourceRecipeName}</span>
        </>
      ) : (
        <>
          <Plus className="w-3 h-3 shrink-0" aria-hidden />
          <span className="truncate">{memberName}</span>
          {nonPreferred && (
            <span
              className="ml-1 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]"
              aria-hidden
            >
              {t('plan.detail.cell.nonPreferredBadge')}
            </span>
          )}
        </>
      )}
    </button>
  )
}

function FilledMemberCell({ memberId, dayIndex, slot, memberName, colorClass, cell, recipe, recipeName, slotKcalTarget, nonPreferred, isDropTarget, isDragSource, dragSourceRecipe, dragSourceRecipeName, dragSourceServings, dragOverMeal, dragOverRecipe, dragOverRecipeName, onCellClick, onServingsChange, t }: MemberCellProps) {
  // Both the droppable + draggable hooks always fire on this code path
  // (cell is guaranteed non-null because the wrapper dispatched here).
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dndCellId(dayIndex, slot, memberId),
  })

  // When this filled cell is the swap target during a drag, render the SOURCE
  // meal's content instead — gives the user a concrete preview of the swap.
  const previewSwap = isDropTarget && isOver
  // When this filled cell IS the drag source and the user is hovering over
  // another filled cell, mirror the preview: show the swap target's contents
  // here so the user sees the full proposed exchange.
  const previewSourceSwap = isDragSource && dragOverMeal != null

  // Filled cell — show recipe name, per-serving macros, and a slot-target kcal bar.
  // When previewing a swap we substitute the appropriate side of the exchange.
  const effectiveRecipe =
    previewSwap ? dragSourceRecipe
    : previewSourceSwap ? dragOverRecipe
    : recipe
  const effectiveRecipeName =
    previewSwap ? dragSourceRecipeName
    : previewSourceSwap ? dragOverRecipeName
    : recipeName
  const effectiveServings =
    previewSwap ? dragSourceServings
    : previewSourceSwap ? Number(dragOverMeal!.servings)
    : Number(cell?.servings ?? 1)
  const displayLabel = effectiveRecipeName ?? memberName

  // Per-meal macros = (recipe.macros / recipe.servings) × cell.servings.
  let mealKcal = 0
  let mealProtein = 0
  let mealFat = 0
  let mealCarbs = 0
  if (effectiveRecipe?.macros && effectiveRecipe.servings > 0) {
    const factor = effectiveServings / effectiveRecipe.servings
    if (Number.isFinite(factor) && factor > 0) {
      mealKcal = effectiveRecipe.macros.kcal * factor
      mealProtein = effectiveRecipe.macros.protein * factor
      mealFat = effectiveRecipe.macros.fat * factor
      mealCarbs = effectiveRecipe.macros.carbs * factor
    }
  }

  const hasTarget = slotKcalTarget != null && slotKcalTarget > 0
  const ratio = hasTarget ? mealKcal / slotKcalTarget! : 0
  const primaryWidth = Math.min(100, ratio * 100)
  const overshoot = ratio > 1 ? Math.min(100, (ratio - 1) * 100) : 0
  const hasMacros = mealKcal > 0

  // The whole cell is the draggable so @dnd-kit measures the overlay against
  // the full card. Activation distance on the PointerSensor still lets click-
  // through-to-edit work (move <8px = click; >=8px = drag).
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } =
    useDraggable({ id: cell!.id })

  // Combine droppable + draggable refs onto the same DOM element.
  const setCombinedRef = (node: HTMLElement | null) => {
    setDropRef(node)
    setDragRef(node)
  }

  // Source side of the preview is highlighted with the same indigo accent as
  // the target so the eye reads the two cells as a paired swap.
  const showSwapHighlight = previewSwap || previewSourceSwap

  return (
    <div
      ref={setCombinedRef}
      title={nonPreferred ? t('plan.detail.cell.nonPreferredTitle') : displayLabel}
      aria-label={
        nonPreferred
          ? `${memberName} — ${displayLabel} — ${t('plan.detail.cell.nonPreferredAria')}`
          : `${memberName} — ${displayLabel}`
      }
      onClick={onCellClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCellClick()
        }
      }}
      className={`
        flex flex-col gap-1 px-3 py-2 rounded-[12px]
        bg-[#F0EDE6] text-[#1A1A1A]
        text-xs font-medium transition-all
        min-w-[140px] max-w-[220px]
        cursor-grab active:cursor-grabbing touch-none select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        ${showSwapHighlight ? 'ring-2 ring-[#4f46e5] bg-[#eef2ff]' : isOver ? 'ring-2 ring-[#4f46e5] bg-[#eef2ff]' : 'hover:bg-[#e8e4dc]'}
        ${isDragging ? 'opacity-40' : ''}
        ${nonPreferred && !showSwapHighlight && !isOver ? 'opacity-70 ring-1 ring-dashed ring-[#d1d5db]' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      {showSwapHighlight && (
        <span
          className="
            self-start inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
            bg-[#4f46e5] text-white text-[10px] font-semibold
          "
          aria-hidden
        >
          ↔ {t('plan.detail.cell.swapBadge')}
        </span>
      )}
      {nonPreferred && !showSwapHighlight && (
        <span
          className="
            self-start inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
            bg-[#f3f4f6] text-[#6b7280] text-[9px] font-semibold uppercase tracking-wide
          "
          title={t('plan.detail.cell.nonPreferredTitle')}
        >
          {t('plan.detail.cell.nonPreferredBadge')}
        </span>
      )}
      {/* Title row */}
      <div className="flex items-center gap-1.5 min-w-0 w-full">
        <GripVertical className="w-3 h-3 shrink-0 text-[#9ca3af]" aria-hidden />
        <span
          aria-hidden
          className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`}
        />
        <span className="truncate">{displayLabel}</span>
      </div>

      {/* Family indicator — surfaces the variant on plan-template cells so the
          user can identify family members at a glance even before opening the
          picker. The picker (TemplateCellPicker) does the actual sibling grouping;
          this is the read-only at-a-glance affordance on the grid itself. */}
      {effectiveRecipe?.familyId && (
        <p
          className="text-[10px] text-[#4F7942] font-semibold leading-tight flex items-center gap-1 min-w-0"
          title={effectiveRecipe.variantLabel ?? undefined}
        >
          <Layers className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span className="truncate">
            {effectiveRecipe.variantLabel ?? t('recipeFamily.variants')}
          </span>
        </p>
      )}

      {hasMacros && (
        <>
          {/* Per-meal macro summary */}
          <p className="text-[10.5px] text-[#6b7280] tabular-nums leading-tight text-left">
            <span className="font-semibold text-[#1A1A1A]">{Math.round(mealKcal)}</span>
            <span className="ml-0.5">kcal</span>
            <span className="mx-1 text-[#d1d5db]" aria-hidden>·</span>
            {Math.round(mealProtein)}P
            <span className="mx-0.5 text-[#d1d5db]" aria-hidden>·</span>
            {Math.round(mealFat)}F
            <span className="mx-0.5 text-[#d1d5db]" aria-hidden>·</span>
            {Math.round(mealCarbs)}C
          </p>

          {/* Slot kcal bar (only when a target exists) */}
          {hasTarget && (
            <div
              className="relative h-1 rounded-full overflow-hidden bg-[#eef2ff] w-full"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.round(slotKcalTarget!)}
              aria-valuenow={Math.round(mealKcal)}
              aria-label={t('plan.detail.cell.kcalVsSlotAria', {
                actual: Math.round(mealKcal),
                target: Math.round(slotKcalTarget!),
              })}
            >
              <div
                className="absolute inset-y-0 left-0 bg-[#4f46e5] transition-[width]"
                style={{ width: `${primaryWidth}%` }}
              />
              {overshoot > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-[#312e81] opacity-70 transition-[width]"
                  style={{ width: `${Math.min(100, overshoot)}%` }}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Servings stepper — in-place edit, doesn't open the picker */}
      {cell && !previewSwap && !previewSourceSwap && (
        <ServingsStepper
          servings={Number(cell.servings)}
          onChange={(next) => onServingsChange(cell, next)}
          t={t}
        />
      )}
    </div>
  )
}

interface ServingsStepperProps {
  servings: number
  onChange: (next: number) => void
  t: TFunction
}

/**
 * Compact ± stepper for adjusting servings without opening the picker.
 * Clicks are stopped from bubbling so the parent's cell-click handler does
 * not open the editor; pointer events are also stopped so @dnd-kit does not
 * start a drag from the stepper buttons.
 */
function ServingsStepper({ servings, onChange, t }: ServingsStepperProps) {
  const lower = nextServings(servings, -1)
  const upper = nextServings(servings, +1)

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      className="flex items-center gap-1 self-start"
      onClick={stop}
      onPointerDown={stop}
      onKeyDown={stop}
    >
      <button
        type="button"
        aria-label={t('plan.detail.cell.servingsDecAria')}
        disabled={lower == null}
        onClick={() => lower != null && onChange(lower)}
        className="
          h-5 w-5 inline-flex items-center justify-center rounded-full
          bg-white text-[#4f46e5] border border-[#e5e7eb]
          hover:border-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        "
      >
        <Minus className="w-3 h-3" aria-hidden />
      </button>
      <span
        aria-label={t('plan.detail.cell.servingsValueAria', { servings })}
        className="text-[10.5px] tabular-nums text-[#1A1A1A] font-semibold min-w-[2rem] text-center"
      >
        {servings}× {t('plan.detail.cell.servingsUnit')}
      </span>
      <button
        type="button"
        aria-label={t('plan.detail.cell.servingsIncAria')}
        disabled={upper == null}
        onClick={() => upper != null && onChange(upper)}
        className="
          h-5 w-5 inline-flex items-center justify-center rounded-full
          bg-white text-[#4f46e5] border border-[#e5e7eb]
          hover:border-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        "
      >
        <Plus className="w-3 h-3" aria-hidden />
      </button>
    </div>
  )
}
