/**
 * MarkShoppedToast — confirmation banner shown after "Mark all shopped" succeeds.
 *
 * Displays how many items were added to the fridge and provides a link to
 * open the Fridge page in review mode.
 *
 * KALMIO-312
 */
import { CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface MarkShoppedToastProps {
  /** Number of fridge items upserted by the mark-shopped call. */
  fridgeItemsAdded: number
}

export function MarkShoppedToast({ fridgeItemsAdded }: MarkShoppedToastProps) {
  const { t } = useTranslation()

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-[#4f7942]"
    >
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {t('cart.markShoppedToast.message', { count: fridgeItemsAdded })}
        </span>
      </div>
      <Link
        to="/app/fridge?review=shopping"
        className="shrink-0 font-semibold underline underline-offset-2 hover:text-[#3d6132] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942] rounded"
      >
        {t('cart.markShoppedToast.reviewLink')}
      </Link>
    </div>
  )
}
