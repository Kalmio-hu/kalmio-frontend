import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { PlanGlanceDto } from '@/types'

interface PlanGlanceModuleProps {
  glance: PlanGlanceDto | null
}

function formatShortDate(isoDate: string, locale: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString(locale === 'hu' ? 'hu-HU' : 'en-GB', {
    month: 'numeric',
    day: 'numeric',
  })
}

export function PlanGlanceModule({ glance }: PlanGlanceModuleProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  if (!glance) return null

  const progressPct = glance.totalDays > 0
    ? Math.round(((glance.totalDays - glance.daysRemaining) / glance.totalDays) * 100)
    : 0

  const startLabel = formatShortDate(glance.startDate, i18n.language)
  const endLabel = formatShortDate(glance.endDate, i18n.language)

  return (
    <button
      type="button"
      onClick={() => navigate('/app/plans')}
      className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 rounded-[16px]"
      aria-label={t('dashboard.planGlance.viewFull')}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-headline font-bold text-[#1A1A1A]">
              {t('dashboard.planGlance.title')}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
              <span>{t('dashboard.planGlance.viewFull')}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </div>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            {startLabel} – {endLabel}
          </p>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[#e5e4e7] overflow-hidden" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-[#F28C28] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2">
            {t('dashboard.planGlance.daysRemaining_other', { count: glance.daysRemaining })}
          </p>
        </CardContent>
      </Card>
    </button>
  )
}
