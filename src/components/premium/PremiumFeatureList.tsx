/**
 * PremiumFeatureList — "what you get with premium" panel for the Founding Member
 * buy pages (FoundingMember.tsx and GuestFoundingMember.tsx).
 *
 * The buy pages sell on price + scarcity; this component enumerates the concrete
 * AI features that premium unlocks, phrased as user benefits in the assistant
 * tone. The feature set mirrors the backend controllers carrying @RequiresPremium.
 *
 * Pure presentational — no data fetching, no state. Copy lives under the
 * `premium.features.*` i18n namespace (HU primary, EN fallback).
 *
 * Palette matches the dark buy-page shell (#111 background, #F28C28 accent).
 */
import {
  Link2,
  ReceiptText,
  ChefHat,
  HelpCircle,
  CalendarCheck,
  MessagesSquare,
  HeartHandshake,
  Camera,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** The eight premium AI features, in pitch order. Each maps to a @RequiresPremium controller. */
const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: 'recipeImport', icon: Link2 },
  { key: 'receiptScan', icon: ReceiptText },
  { key: 'cookMode', icon: ChefHat },
  { key: 'rationale', icon: HelpCircle },
  { key: 'weeklyRecap', icon: CalendarCheck },
  { key: 'conversationalEdit', icon: MessagesSquare },
  { key: 'cravingsCoach', icon: HeartHandshake },
  { key: 'photoLog', icon: Camera },
]

interface PremiumFeatureListProps {
  className?: string
}

export function PremiumFeatureList({ className }: PremiumFeatureListProps) {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('premium.features.ariaLabel')}
      className={className}
    >
      <h2 className="text-white text-lg font-semibold mb-1">
        {t('premium.features.title')}
      </h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        {t('premium.features.subtitle')}
      </p>

      <ul className="space-y-4">
        {FEATURES.map(({ key, icon: Icon }) => (
          <li key={key} className="flex items-start gap-3">
            <span className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-[#F28C28]/15 text-[#F28C28]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium leading-snug">
                {t(`premium.features.items.${key}.title`)}
              </p>
              <p className="text-white/55 text-sm leading-relaxed mt-0.5">
                {t(`premium.features.items.${key}.description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Free vs. premium summary — sets expectations about what stays free. */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-1.5">
            {t('premium.features.comparison.freeLabel')}
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            {t('premium.features.comparison.freeSummary')}
          </p>
        </div>
        <div className="rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/[0.06] px-4 py-3">
          <p className="text-[#F28C28] text-xs uppercase tracking-widest font-semibold mb-1.5">
            {t('premium.features.comparison.premiumLabel')}
          </p>
          <p className="text-white/80 text-sm leading-relaxed">
            {t('premium.features.comparison.premiumSummary')}
          </p>
        </div>
      </div>
    </section>
  )
}
