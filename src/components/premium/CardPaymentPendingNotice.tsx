/**
 * CardPaymentPendingNotice — tells the buyer that the card payment of Kalmio Prémium is
 * still awaiting Barion's approval of token (recurring) payment, so the payment step does
 * not start yet (docs/product/payments-subscriptions.md §5). The Premium page shows it while
 * the build carries VITE_PAYMENT_PENDING_APPROVAL=true. Sits on the dark checkout surface.
 */

import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'

export function CardPaymentPendingNotice({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <p
      role="status"
      className={[
        'flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3 text-amber-100/90 text-sm leading-relaxed',
        className,
      ].join(' ')}
    >
      <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
      {t('premiumPage.pendingApproval')}
    </p>
  )
}
