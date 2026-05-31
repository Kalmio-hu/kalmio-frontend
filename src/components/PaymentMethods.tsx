/**
 * PaymentMethods — the accepted-payment-method banner required for Barion approval.
 *
 * Uses Barion's official "smart payment banner" (dark, transparent-background variant),
 * shipped verbatim from Barion's brand pack. It must NOT be placed on a white/rounded
 * tile — the transparent banner is designed to sit directly on a dark surface, per
 * Barion's brand guidelines. Shown on the homepage and on the payment page.
 *
 * Usage:
 *   <PaymentMethods />              // centered
 *   <PaymentMethods align="start" />
 */

import { useTranslation } from 'react-i18next'
import banner from '@/assets/payment/barion-smart-banner-dark.svg'

export function PaymentMethods({ align = 'center' }: { align?: 'center' | 'start' }) {
  const { t } = useTranslation()
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <p className="text-white/40 text-[11px] uppercase tracking-widest mb-2.5">
        {t('payments.acceptedLabel')}
      </p>
      <img
        src={banner}
        alt={t('payments.acceptedLabel')}
        loading="lazy"
        className={`h-9 w-auto max-w-full ${align === 'center' ? 'mx-auto' : ''}`}
      />
    </div>
  )
}
