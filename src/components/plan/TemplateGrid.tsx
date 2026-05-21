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
import { Plus } from 'lucide-react'
import { MEMBER_COLORS } from './memberColors'
import type { PlanTemplate, TemplateMeal, MealType } from '@/types'

interface TemplateGridProps {
  plan: PlanTemplate
  memberNames: Record<string, string>
  /** Recipe id → display name, for labeling filled cells. */
  recipeNames: Record<string, string>
  onCellClick: (dayIndex: number, mealType: MealType, memberId: string, existing: TemplateMeal | null) => void
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

export function TemplateGrid({ plan, memberNames, recipeNames, onCellClick }: TemplateGridProps) {
  const { t } = useTranslation()

  const days = Array.from({ length: plan.lengthDays }, (_, i) => i)
  const slots = plan.mealSlotsCovered
  const members = plan.memberIds

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
          meals={plan.templateMeals}
          onCellClick={onCellClick}
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
  meals: TemplateMeal[]
  onCellClick: TemplateGridProps['onCellClick']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}

function DayCard({ dayIndex, slots, members, memberNames, recipeNames, meals, onCellClick, t }: DayCardProps) {
  return (
    <section
      aria-label={t('plan.detail.dayLabel', { day: dayIndex + 1 })}
      className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden"
    >
      {/* Day header */}
      <div className="px-4 py-2.5 bg-[#F9F7F2] border-b border-[#e5e7eb]">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">
          {t('plan.detail.dayLabel', { day: dayIndex + 1 })}
        </h2>
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
            meals={meals}
            onCellClick={onCellClick}
            t={t}
          />
        ))}
      </div>
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
  meals: TemplateMeal[]
  onCellClick: TemplateGridProps['onCellClick']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}

function SlotRow({ slot, dayIndex, members, memberNames, recipeNames, meals, onCellClick, t }: SlotRowProps) {
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
          const recipeName = cell?.recipeId ? (recipeNames[cell.recipeId] ?? cell.recipeId.slice(0, 8)) : null

          return (
            <MemberCell
              key={memberId}
              memberId={memberId}
              memberName={name}
              colorClass={colorClass}
              cell={cell}
              recipeName={recipeName}
              onCellClick={() => onCellClick(dayIndex, slot, memberId, cell)}
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
  memberName: string
  colorClass: string
  cell: TemplateMeal | null
  recipeName: string | null
  onCellClick: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}

function MemberCell({ memberName, colorClass, cell, recipeName, onCellClick, t }: MemberCellProps) {
  const isEmpty = cell == null || (cell.recipeId == null && cell.offPlanMealTemplateId == null)

  if (isEmpty) {
    return (
      <button
        type="button"
        onClick={onCellClick}
        aria-label={`${memberName} — ${t('plan.detail.cell.emptyAria')}`}
        className="
          flex items-center gap-1.5 px-3 py-1.5 rounded-full
          border border-dashed border-[#d1d5db] text-[#9ca3af]
          text-xs hover:border-[#4f46e5] hover:text-[#4f46e5]
          transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
          min-w-0 max-w-[160px]
        "
      >
        {/* Member color dot */}
        <span
          aria-hidden
          className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`}
        />
        <Plus className="w-3 h-3 shrink-0" aria-hidden />
        <span className="truncate">{memberName}</span>
      </button>
    )
  }

  // Filled cell — show recipe name when available, otherwise member name
  const displayLabel = recipeName ?? memberName

  return (
    <button
      type="button"
      onClick={onCellClick}
      title={displayLabel}
      aria-label={`${memberName} — ${displayLabel}`}
      className="
        flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-[#F0EDE6] text-[#1A1A1A]
        text-xs font-medium hover:bg-[#e8e4dc]
        transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        min-w-0 max-w-[200px]
      "
    >
      <span
        aria-hidden
        className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`}
      />
      <span className="truncate">{displayLabel}</span>
    </button>
  )
}
