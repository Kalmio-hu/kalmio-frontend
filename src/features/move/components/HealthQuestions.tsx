/**
 * The ten yes/no health questions on one screen (PRD §7.1 step 5). Formal
 * register on the supported track through `useMoveT(register)`. The answers
 * live only in the parent's memory — this component never stores anything.
 */
import { cn } from '@/lib/utils'
import { useMoveT } from '../lib/register'
import { HEALTH_QUESTION_IDS } from '../lib/startFlow'
import type { Register } from '../types'

interface HealthQuestionsProps {
  answers: (boolean | null)[]
  onAnswer: (index: number, value: boolean) => void
  skipped?: boolean
  onSkip?: () => void
  onUnskip?: () => void
  register?: Register | null
  /** Hide the intro line (the settings dialog has its own). */
  compact?: boolean
}

export function HealthQuestions({ answers, onAnswer, skipped, onSkip, onUnskip, register, compact }: HealthQuestionsProps) {
  const { t } = useMoveT(register)
  const remaining = answers.filter((a) => a === null).length

  const chip = (selected: boolean) =>
    cn(
      'min-h-12 min-w-[5.5rem] px-4 rounded-[12px] border text-base font-medium transition-colors',
      selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )

  if (skipped) {
    return (
      <div className="space-y-3">
        <p className="text-base text-gray-700">{t('start.health.skipped')}</p>
        {onUnskip && (
          <button type="button" onClick={onUnskip} className="text-base underline underline-offset-4 text-[#1A1A1A] px-2 rounded-lg">
            {t('start.health.answerAfterAll')}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && <p className="text-base text-gray-700">{t('start.health.intro')}</p>}
      <ol className="space-y-4">
        {HEALTH_QUESTION_IDS.map((id, i) => {
          const value = answers[i]
          const legendId = `move-health-${id}`
          return (
            <li key={id}>
              <fieldset aria-describedby={legendId} className="space-y-2">
                <legend id={legendId} className="text-base text-[#1A1A1A] move-body">
                  {i + 1}. {t(`start.health.q.${id}`)}
                </legend>
                <div className="flex gap-2" role="radiogroup" aria-label={t(`start.health.q.${id}`)}>
                  <button type="button" role="radio" aria-checked={value === true} className={chip(value === true)} onClick={() => onAnswer(i, true)}>
                    {t('start.health.yes')}
                  </button>
                  <button type="button" role="radio" aria-checked={value === false} className={chip(value === false)} onClick={() => onAnswer(i, false)}>
                    {t('start.health.no')}
                  </button>
                </div>
              </fieldset>
            </li>
          )
        })}
      </ol>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500" role="status" aria-live="polite">
          {remaining > 0 ? t('start.health.remaining', { count: remaining }) : ''}
        </span>
        {onSkip && (
          <button type="button" onClick={onSkip} className="text-base underline underline-offset-4 text-gray-600 hover:text-[#1A1A1A] px-2 rounded-lg">
            {t('start.health.skip')}
          </button>
        )}
      </div>
    </div>
  )
}
