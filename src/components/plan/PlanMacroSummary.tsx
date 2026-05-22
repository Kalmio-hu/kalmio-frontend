/**
 * PlanMacroSummary — weekly average donuts for a plan template.
 *
 * One donut per macro (kcal, protein, fat, carbs). Each shows the daily
 * average vs the per-day target; overshoots get a darker secondary ring.
 *
 * The per-day breakdown lives on each DayCard header in TemplateGrid — this
 * card focuses only on the weekly average so the eye lands on it.
 */
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TargetDonut } from '@/components/ui/target-donut'
import type { MacroTargets, MacroTotals } from '@/lib/planMacros'

interface PlanMacroSummaryProps {
  /** Averaged across the plan length. */
  weekly: MacroTotals
  /** Aggregate targets across all plan members. Any field may be null. */
  targets: MacroTargets
}

export function PlanMacroSummary({ weekly, targets }: PlanMacroSummaryProps) {
  const { t } = useTranslation()

  const noTargets =
    targets.kcal == null && targets.protein == null &&
    targets.fat == null && targets.carbs == null

  return (
    <section
      aria-label={t('plan.detail.macros.sectionAria')}
      className="rounded-[16px] border border-[#e5e7eb] bg-white overflow-hidden mb-5"
    >
      <div className="px-4 py-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            {t('plan.detail.macros.weeklyTitle')}
          </h2>
          {noTargets && (
            <Link to="/app/profile" className="text-xs text-[#4f46e5] hover:underline">
              {t('plan.detail.macros.setTargetsCta')}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TargetDonut
            label={t('plan.detail.macros.kcalLabel')}
            actual={weekly.kcal}
            target={targets.kcal}
            unit="kcal"
            colorClass="stroke-[#4f46e5]"
            trackClass="stroke-[#eef2ff]"
          />
          <TargetDonut
            label={t('plan.detail.macros.proteinLabel')}
            actual={weekly.protein}
            target={targets.protein}
            unit="g"
            colorClass="stroke-[#F28C28]"
            trackClass="stroke-[#fff4e6]"
          />
          <TargetDonut
            label={t('plan.detail.macros.fatLabel')}
            actual={weekly.fat}
            target={targets.fat}
            unit="g"
            colorClass="stroke-[#4F7942]"
            trackClass="stroke-[#eaf3df]"
          />
          <TargetDonut
            label={t('plan.detail.macros.carbsLabel')}
            actual={weekly.carbs}
            target={targets.carbs}
            unit="g"
            colorClass="stroke-[#1A1A1A]"
            trackClass="stroke-[#f3f4f6]"
          />
        </div>
      </div>
    </section>
  )
}
