/**
 * Completion (PRD §7.4): the effort tap 0–10, then — when `askComfort` —
 * "Fájt valami közben?" Nem / Kicsit / Igen; Igen opens the six-region body
 * map. At most two taps after the last step: effort + Kész, or effort +
 * "Nem" (which submits on its own). Igen adds the region tap.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'
import type { BodyRegion, Register } from '../../types'
import type { ComfortAnswer } from '../../lib/completion'
import { EffortScale } from '../EffortScale'
import { BodyMap } from './BodyMap'

interface CompletionScreenProps {
  register: Register
  askComfort: boolean
  busy: boolean
  title?: string
  onSubmit: (effort: number, comfort: ComfortAnswer | null, region: BodyRegion | null) => void
}

const COMFORT: ComfortAnswer[] = ['NO', 'LITTLE', 'YES']

export function CompletionScreen({ register, askComfort, busy, title, onSubmit }: CompletionScreenProps) {
  const { t } = useMoveT(register)
  const [effort, setEffort] = useState<number | null>(null)
  const [comfort, setComfort] = useState<ComfortAnswer | null>(null)
  const [region, setRegion] = useState<BodyRegion | null>(null)

  const pickComfort = (answer: ComfortAnswer) => {
    setComfort(answer)
    if (answer !== 'YES' && effort !== null) onSubmit(effort, answer, null)
  }

  const pickRegion = (r: BodyRegion) => {
    setRegion(r)
    if (effort !== null) onSubmit(effort, 'YES', r)
  }

  return (
    <div className="flex-1 flex flex-col gap-6" aria-live="polite">
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{title ?? t('player.completion.effortQ')}</h1>
        {title && <p className="text-base text-gray-700 mt-1">{t('player.completion.effortQ')}</p>}
      </div>

      <EffortScale value={effort} onChange={setEffort} disabled={busy} />

      {askComfort && effort !== null && (
        <fieldset className="space-y-3">
          <legend className="text-xl font-headline font-bold text-[#1A1A1A]">{t('player.completion.comfortQ')}</legend>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {COMFORT.map((c) => {
              const on = comfort === c
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={busy}
                  onClick={() => pickComfort(c)}
                  className={cn(
                    'min-h-14 rounded-[12px] border text-lg font-semibold transition-colors',
                    on ? 'text-white border-transparent' : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:bg-[#F9F7F2]',
                  )}
                  style={on ? { backgroundColor: MOVE_ACCENT } : undefined}
                >
                  {t(`player.completion.comfort.${c}`)}
                </button>
              )
            })}
          </div>
          {comfort === 'YES' && (
            <div className="space-y-2">
              <p className="text-base font-medium text-[#1A1A1A]">{t('player.completion.whereQ')}</p>
              <BodyMap value={region} onChange={pickRegion} disabled={busy} />
            </div>
          )}
        </fieldset>
      )}

      {!askComfort && (
        <Button
          size="lg"
          className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F] mt-auto"
          disabled={effort === null || busy}
          onClick={() => effort !== null && onSubmit(effort, null, null)}
        >
          {t('player.completion.done')}
        </Button>
      )}
    </div>
  )
}
