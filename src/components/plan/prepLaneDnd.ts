/**
 * Drag-and-drop id helpers for the template prep lane.
 *
 * Draggable chips:  `prep-slot:{slotId}`
 * Droppable cells:  `prep-cell:{dayIndex}:{window}`
 */

export function prepSlotDragId(slotId: string): string {
  return `prep-slot:${slotId}`
}

export function prepCellDropId(dayIndex: number, window: 'MORNING' | 'EVENING'): string {
  return `prep-cell:${dayIndex}:${window}`
}

export function parsePrepCellDropId(id: string): { dayIndex: number; scheduledWindow: 'MORNING' | 'EVENING' } | null {
  if (!id.startsWith('prep-cell:')) return null
  const parts = id.split(':')
  if (parts.length !== 3) return null
  const dayIndex = Number(parts[1])
  const scheduledWindow = parts[2] as 'MORNING' | 'EVENING'
  if (isNaN(dayIndex) || (scheduledWindow !== 'MORNING' && scheduledWindow !== 'EVENING')) return null
  return { dayIndex, scheduledWindow }
}

export function parsePrepSlotDragId(id: string): string | null {
  if (!id.startsWith('prep-slot:')) return null
  return id.slice('prep-slot:'.length)
}
