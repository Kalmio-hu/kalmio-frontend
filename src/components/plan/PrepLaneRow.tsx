/**
 * PrepLaneRow — the "Előkészítés" lane rendered beneath meal-type rows in each
 * DayCard of the TemplateGrid.
 *
 * One row per day; each row contains 0..N draggable prep-slot chips.
 * Cells are droppable with id `prep-cell:{dayIndex}:{window}` (one per window
 * within the day). Chips are draggable with id `prep-slot:{slotId}`.
 *
 * Right-click menu on a chip: Delete, Split (Split disabled until KALMIO-268).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { Sun, Moon, Snowflake, GripVertical, Trash2, Scissors, Plus } from 'lucide-react'
import { prepSlotDragId, prepCellDropId } from './prepLaneDnd'
import type { TemplatePrepSlot } from '@/types'

// ── Context-menu state ─────────────────────────────────────────────────────

interface ContextMenuState {
  slotId: string
  x: number
  y: number
}

// ── Window icon ────────────────────────────────────────────────────────────

function WindowIcon({ window }: { window: 'MORNING' | 'EVENING' }) {
  if (window === 'MORNING') {
    return <Sun className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
  }
  return <Moon className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden />
}

// ── Single draggable chip ──────────────────────────────────────────────────

interface PrepSlotChipProps {
  slot: TemplatePrepSlot
  recipeName: string
  onContextMenu: (state: ContextMenuState) => void
}

function PrepSlotChip({ slot, recipeName, onContextMenu }: PrepSlotChipProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: prepSlotDragId(slot.id),
  })

  const servingsCount = Number(slot.servingsToMake)
  const servingsLabel = t('plan.prep.servings', { count: servingsCount })
  const frozenCount = Number(slot.servingsToFreeze)
  const windowLabel = slot.scheduledWindow === 'MORNING'
    ? t('plan.prep.windowMorning')
    : t('plan.prep.windowEvening')

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${recipeName} — ${windowLabel} — ${servingsLabel}`}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]
        bg-[#F0EDE6] text-[#1A1A1A] text-xs font-medium
        cursor-grab active:cursor-grabbing touch-none select-none
        transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
        ${isDragging ? 'opacity-30' : 'hover:bg-[#e8e4dc]'}
      `}
      onContextMenu={e => {
        e.preventDefault()
        onContextMenu({ slotId: slot.id, x: e.clientX, y: e.clientY })
      }}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-[#9ca3af]" aria-hidden />
      <WindowIcon window={slot.scheduledWindow} />
      <span className="truncate max-w-[120px]">{recipeName}</span>
      <span
        className="shrink-0 tabular-nums text-[10.5px] text-[#6b7280]"
        aria-hidden
      >
        {servingsCount}×
      </span>
      {frozenCount > 0 && (
        <Snowflake
          className="h-3 w-3 shrink-0 text-sky-500"
          aria-label={t('plan.prep.freezeMarker')}
        />
      )}
    </div>
  )
}

// ── Droppable cell (one per window within a day) ───────────────────────────

interface PrepDropCellProps {
  dayIndex: number
  window: 'MORNING' | 'EVENING'
  slots: TemplatePrepSlot[]
  recipeNames: Record<string, string>
  isAnyDragging: boolean
  onAddClick: (dayIndex: number, window: 'MORNING' | 'EVENING') => void
  onContextMenu: (state: ContextMenuState) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}

function PrepDropCell({
  dayIndex,
  window,
  slots,
  recipeNames,
  isAnyDragging,
  onAddClick,
  onContextMenu,
  t,
}: PrepDropCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: prepCellDropId(dayIndex, window),
  })

  const isEmpty = slots.length === 0

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-row flex-wrap items-center gap-1 flex-1 min-w-0 min-h-[28px] rounded-[8px] p-1 transition-colors
        ${isAnyDragging && isOver
          ? 'bg-[#eef2ff] ring-2 ring-[#4f46e5]'
          : isAnyDragging
            ? 'ring-1 ring-dashed ring-[#d1d5db]'
            : ''}
      `}
    >
      {isEmpty && !isAnyDragging && (
        <button
          type="button"
          onClick={() => onAddClick(dayIndex, window)}
          aria-label={t('plan.prep.empty')}
          className="
            flex items-center gap-1 px-2 py-1 rounded-[8px]
            border border-dashed border-[#d1d5db] text-[10px] text-[#9ca3af]
            hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
          "
        >
          <Plus className="h-2.5 w-2.5" aria-hidden />
          {window === 'MORNING' ? t('plan.prep.windowMorning') : t('plan.prep.windowEvening')}
        </button>
      )}
      {slots.map(slot => (
        <PrepSlotChip
          key={slot.id}
          slot={slot}
          recipeName={recipeNames[slot.recipeId] ?? slot.recipeId.slice(0, 8)}
          onContextMenu={onContextMenu}
        />
      ))}
      {/* Drop affordance label when dragging over this cell */}
      {isAnyDragging && isOver && (
        <div className="text-[10px] text-[#4f46e5] px-1 py-0.5 font-medium">
          {window === 'MORNING' ? t('plan.prep.windowMorning') : t('plan.prep.windowEvening')}
        </div>
      )}
    </div>
  )
}

// ── Public component ───────────────────────────────────────────────────────

interface PrepLaneRowProps {
  dayIndex: number
  slots: TemplatePrepSlot[]
  recipeNames: Record<string, string>
  /** True while any prep-slot chip is being dragged (drives drop-zone styling). */
  isAnyDragging: boolean
  onAddClick: (dayIndex: number, window: 'MORNING' | 'EVENING') => void
  onDelete: (slotId: string) => void
}

/**
 * Renders the "Előkészítés" row for a single day in the TemplateGrid.
 * Slots are split into MORNING and EVENING sub-cells.
 * Each sub-cell is a droppable zone; each chip is a draggable.
 */
export function PrepLaneRow({
  dayIndex,
  slots,
  recipeNames,
  isAnyDragging,
  onAddClick,
  onDelete,
}: PrepLaneRowProps) {
  const { t } = useTranslation()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const morningSlots = slots.filter(s => s.scheduledWindow === 'MORNING')
  const eveningSlots = slots.filter(s => s.scheduledWindow === 'EVENING')

  function handleDelete(slotId: string) {
    setContextMenu(null)
    onDelete(slotId)
  }

  return (
    <div className="flex items-start gap-0 min-h-[44px] border-t border-[#e5e7eb] bg-[#fafaf8]">
      {/* Row label */}
      <div className="w-24 shrink-0 px-3 py-2 self-center">
        <span className="text-xs font-medium text-[#6b7280]">
          {t('plan.prep.rowLabel')}
        </span>
      </div>

      {/* Two window sub-rows stacked vertically — gives each window the full row
          width so chips don't get squeezed on narrow viewports. */}
      <div className="flex-1 flex flex-col gap-1 px-2 py-2 min-w-0">
        {(['MORNING', 'EVENING'] as const).map(win => (
          <div key={win} className="flex items-start gap-2 min-w-0">
            <span
              className="w-10 shrink-0 pt-1 text-[10px] uppercase tracking-wide text-[#9ca3af]"
              aria-hidden
            >
              {win === 'MORNING' ? t('plan.prep.windowMorning') : t('plan.prep.windowEvening')}
            </span>
            <PrepDropCell
              dayIndex={dayIndex}
              window={win}
              slots={win === 'MORNING' ? morningSlots : eveningSlots}
              recipeNames={recipeNames}
              isAnyDragging={isAnyDragging}
              onAddClick={onAddClick}
              onContextMenu={setContextMenu}
              t={t}
            />
          </div>
        ))}
      </div>

      {/* Context menu (right-click / long-press) */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setContextMenu(null)}
            onContextMenu={e => { e.preventDefault(); setContextMenu(null) }}
          />
          <div
            className="fixed z-50 min-w-[140px] rounded-[10px] border border-[#e5e7eb] bg-white shadow-lg py-1 text-sm"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => handleDelete(contextMenu.slotId)}
              className="
                w-full text-left px-4 py-2 text-red-500
                hover:bg-[#f3f4f6] focus:outline-none
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4f46e5]
              "
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t('plan.prep.actions.delete')}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              disabled
              title={t('plan.prep.actions.split')}
              className="
                w-full text-left px-4 py-2 text-[#9ca3af]
                opacity-50 cursor-not-allowed flex items-center gap-2
                focus:outline-none
              "
            >
              <Scissors className="h-3.5 w-3.5" aria-hidden />
              {t('plan.prep.actions.split')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
