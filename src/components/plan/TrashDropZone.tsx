/**
 * TrashDropZone — appears only while a cell drag is in progress. Dropping on
 * it deletes the source cell. Renders as a fixed pill at the bottom-center of
 * the viewport so it is reachable on any screen size.
 */
import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { Trash2 } from 'lucide-react'

export const TRASH_DROP_ID = 'trash'

interface TrashDropZoneProps {
  visible: boolean
}

export function TrashDropZone({ visible }: TrashDropZoneProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: TRASH_DROP_ID })

  if (!visible) return null

  return (
    <div
      ref={setNodeRef}
      role="button"
      aria-label={t('plan.detail.trash.aria')}
      className={`
        fixed left-1/2 -translate-x-1/2 bottom-6 z-50
        flex items-center gap-2 px-5 py-3 rounded-full
        text-sm font-semibold shadow-xl transition-all
        ${isOver
          ? 'bg-[#b91c1c] text-white scale-110 ring-4 ring-red-200'
          : 'bg-white text-[#b91c1c] ring-2 ring-[#b91c1c]/30'}
      `}
    >
      <Trash2 className="w-4 h-4" aria-hidden />
      {isOver ? t('plan.detail.trash.dropToDelete') : t('plan.detail.trash.label')}
    </div>
  )
}
