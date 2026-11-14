/**
 * ChargeSchedule — what a Kalmio Prémium subscription charges and when, shown in the
 * checkout before the payment: today's first fee, the renewal amount with the day of the
 * next charge, who charges the card, the name on the bank statement, the reminder before a
 * yearly renewal and how to cancel. Barion requires this for token (recurring) payment
 * (docs/product/payments-subscriptions.md §5). Sits on the dark checkout surface.
 */

import { useTranslation } from 'react-i18next'
import { RENEWAL_REMINDER_DAYS } from '@/lib/billingProducts'
import type { SubscriptionPlanCode } from '@/types'

interface ChargeScheduleProps {
  plan: SubscriptionPlanCode
  priceHuf: number
  /** The day of the first renewal charge, already formatted for the reader. */
  nextCharge: string
}

export function ChargeSchedule({ plan, priceHuf, nextCharge }: ChargeScheduleProps) {
  const { t } = useTranslation()
  const amount = t('premiumPage.checkout.schedule.amount', { price: priceHuf })
  const reminderDays = RENEWAL_REMINDER_DAYS[plan]

  return (
    <section
      aria-labelledby="charge-schedule-title"
      className="bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 mb-8"
    >
      <h2 id="charge-schedule-title" className="text-white text-sm font-semibold mb-3">
        {t('premiumPage.checkout.schedule.title')}
      </h2>
      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-white/70 text-sm">
            {t('premiumPage.checkout.schedule.today')}
            <span className="block text-white/45 text-xs">{t(`premiumPage.checkout.schedule.todayNote.${plan}`)}</span>
          </dt>
          <dd className="text-white text-sm font-semibold whitespace-nowrap">{amount}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-white/70 text-sm">
            {t(`premiumPage.checkout.schedule.then.${plan}`)}
            <span className="block text-white/45 text-xs">
              {t('premiumPage.checkout.schedule.nextCharge', { date: nextCharge })}
            </span>
          </dt>
          <dd className="text-white text-sm font-semibold whitespace-nowrap">{amount}</dd>
        </div>
      </dl>
      <ul className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-white/55 text-xs leading-relaxed list-disc pl-4">
        <li>{t('premiumPage.checkout.schedule.charge')}</li>
        <li>{t('premiumPage.checkout.schedule.statement')}</li>
        {reminderDays > 0 && <li>{t('premiumPage.checkout.schedule.reminder', { days: reminderDays })}</li>}
        <li>{t('premiumPage.checkout.schedule.cancel')}</li>
      </ul>
    </section>
  )
}
