/**
 * ChargeSchedule stories — the "what you pay and when" block of the Prémium checkout,
 * with the recurring-payment acceptance that follows it, on the checkout's dark surface.
 */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useTranslation } from 'react-i18next'
import { chargeDateLabel, nextChargeDate } from '@/lib/billingProducts'
import type { SubscriptionPlanCode } from '@/types'
import { ChargeSchedule } from './ChargeSchedule'

function CheckoutExcerpt({ plan, priceHuf }: { plan: SubscriptionPlanCode; priceHuf: number }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('hu') ? 'hu' : 'en'
  const nextCharge = chargeDateLabel(nextChargeDate(plan, new Date(2026, 10, 14)), lang)
  return (
    <div className="bg-[#111] px-6 py-8">
      <div className="max-w-md mx-auto">
        <ChargeSchedule plan={plan} priceHuf={priceHuf} nextCharge={nextCharge} />
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#F28C28]" />
          <span className="text-white/70 text-sm leading-relaxed">
            {t(`premiumPage.checkout.acceptRecurring.${plan}`, { price: priceHuf, date: nextCharge })}
          </span>
        </label>
      </div>
    </div>
  )
}

const meta = {
  title: 'Premium/ChargeSchedule',
  component: CheckoutExcerpt,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CheckoutExcerpt>

export default meta
type Story = StoryObj<typeof meta>

export const Yearly: Story = { args: { plan: 'YEARLY', priceHuf: 14990 } }
export const Monthly: Story = { args: { plan: 'MONTHLY', priceHuf: 1990 } }
