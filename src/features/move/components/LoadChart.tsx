/**
 * "Terhelés az elmúlt hetekben" (PRD §8.5): load, fitness, fatigue and form
 * as one small inline SVG, shown only when `loadChartAvailable`. Each series
 * has its own dash pattern and a text legend — colour is never the only signal.
 */
import { useMoveT } from '../lib/register'
import { polylinePoints } from '../lib/progressMath'
import { dayMonthLabel } from '../lib/dates'
import type { LoadPointDto } from '../types'

const W = 320
const H = 120

const SERIES: { key: keyof Pick<LoadPointDto, 'load' | 'fitness' | 'fatigue' | 'form'>; color: string; dash?: string; width: number }[] = [
  { key: 'load', color: '#9CA3AF', dash: '2 3', width: 1.5 },
  { key: 'fitness', color: '#2A9D8F', width: 2.5 },
  { key: 'fatigue', color: '#B45309', dash: '6 3', width: 2 },
  { key: 'form', color: '#1A1A1A', dash: '1 4', width: 2 },
]

export function LoadChart({ points }: { points: LoadPointDto[] }) {
  const { t, i18n } = useMoveT()
  if (points.length < 2) return <p className="text-sm text-gray-500">{t('progress.load.locked')}</p>

  // One shared scale so the four lines are comparable; form may go negative.
  const all = points.flatMap((p) => [p.load, p.fitness, p.fatigue, p.form])
  const min = Math.min(...all)
  const max = Math.max(...all)
  const normalise = (v: number) => (max - min === 0 ? 0.5 : (v - min) / (max - min))

  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={t('progress.load.chartLabel')}>
        <line x1="4" y1={H - 4} x2={W - 4} y2={H - 4} stroke="#e5e4e7" strokeWidth="1" />
        {SERIES.map((s) => {
          const pts = polylinePoints(points.map((p) => normalise(p[s.key])), W, H)
          return pts ? <polyline key={s.key} points={pts} fill="none" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" /> : null
        })}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <span>
          {dayMonthLabel(points[0].date, i18n.language)} – {dayMonthLabel(points[points.length - 1].date, i18n.language)}
        </span>
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1">
            <svg width="22" height="8" aria-hidden>
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} strokeLinecap="round" />
            </svg>
            {t(`progress.load.${s.key}`)}
          </span>
        ))}
      </figcaption>
      <p className="text-sm text-gray-500">{t('progress.load.hint')}</p>
    </figure>
  )
}
