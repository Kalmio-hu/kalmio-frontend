/**
 * Self-test history (PRD §7.8): chair-stand counts over time as a table, plus
 * a tiny inline SVG line once there are three or more results.
 */
import { useMoveT } from '../lib/register'
import { polylinePoints } from '../lib/progressMath'
import { dayMonthLabel } from '../lib/dates'
import type { SelfTestDto } from '../types'

export function SelfTestHistory({ tests }: { tests: SelfTestDto[] }) {
  const { t, i18n } = useMoveT()
  const sorted = tests.slice().sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length === 0) return <p className="text-sm text-gray-500">{t('progress.selfTests.empty')}</p>

  const chair = sorted.filter((s) => s.kind === 'SIT_TO_STAND_30S')
  const line = chair.length >= 3 ? polylinePoints(chair.map((s) => s.value), 320, 80) : null

  return (
    <div className="space-y-3">
      {line && (
        <figure>
          <svg viewBox="0 0 320 80" className="w-full h-auto" role="img" aria-label={t('progress.selfTests.chartLabel')}>
            <polyline points={line} fill="none" stroke="#2A9D8F" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {line.split(' ').map((p, i) => {
              const [x, y] = p.split(',')
              return <circle key={i} cx={x} cy={y} r="3.5" fill="#2A9D8F" />
            })}
          </svg>
          <figcaption className="text-xs text-gray-500">
            {dayMonthLabel(chair[0].date, i18n.language)} – {dayMonthLabel(chair[chair.length - 1].date, i18n.language)}
          </figcaption>
        </figure>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th scope="col" className="py-1 font-medium">{t('progress.selfTests.date')}</th>
            <th scope="col" className="py-1 font-medium">
              <span className="sr-only">{t('progress.selfTests.title')}</span>
            </th>
            <th scope="col" className="py-1 font-medium text-right">{t('progress.selfTests.value')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted
            .slice()
            .reverse()
            .map((s) => (
              <tr key={s.id} className="border-t border-[#e5e4e7]">
                <td className="py-2 text-[#1A1A1A]">{dayMonthLabel(s.date, i18n.language)}</td>
                <td className="py-2 text-gray-600">{t(`progress.selfTests.kind.${s.kind}`)}</td>
                <td className="py-2 text-right font-semibold text-[#1A1A1A] tabular-nums">{s.value}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
