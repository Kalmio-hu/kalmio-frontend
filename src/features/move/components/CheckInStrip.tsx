/**
 * Morning check-in (PRD §7.5) — three one-tap questions plus "Beteg vagyok".
 * Sits at the top of the today block until answered or dismissed. The outcome
 * is shown only when something changes; colour is never the only signal.
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, OctagonX, Thermometer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import type {
  CheckInFeeling,
  CheckInResponse,
  CheckInSleep,
  CheckInSoreness,
  CheckInStateDto,
  ReadinessLight,
} from '../types'

const DISMISS_PREFIX = 'kalmio_move_checkin_dismissed_'

function readDismissed(date: string): boolean {
  try {
    return sessionStorage.getItem(`${DISMISS_PREFIX}${date}`) === '1'
  } catch {
    return false
  }
}

function writeDismissed(date: string) {
  try {
    sessionStorage.setItem(`${DISMISS_PREFIX}${date}`, '1')
  } catch {
    // session storage unavailable — the strip simply reappears on reload
  }
}

const LIGHT_ICON: Record<ReadinessLight, typeof CheckCircle2> = {
  GREEN: CheckCircle2,
  AMBER: AlertTriangle,
  RED: OctagonX,
  ILL: Thermometer,
}

const LIGHT_CLASS: Record<ReadinessLight, string> = {
  GREEN: 'bg-[#4F7942]/10 text-[#2f5a27] border-[#4F7942]/30',
  AMBER: 'bg-[#F59E0B]/10 text-[#8a4b00] border-[#F59E0B]/40',
  RED: 'bg-[#EF4444]/10 text-[#8f1d1d] border-[#EF4444]/40',
  ILL: 'bg-gray-100 text-gray-700 border-gray-300',
}

interface CheckInStripProps {
  date: string
  checkIn: CheckInStateDto
  onChanged?: () => void
}

export function CheckInStrip({ date, checkIn, onChanged }: CheckInStripProps) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [dismissed, setDismissed] = useState(() => readDismissed(date))
  const [feeling, setFeeling] = useState<CheckInFeeling | null>(null)
  const [soreness, setSoreness] = useState<CheckInSoreness | null>(null)
  const [sleep, setSleep] = useState<CheckInSleep | null>(null)
  const [result, setResult] = useState<CheckInResponse | null>(null)
  const [showWhy, setShowWhy] = useState(false)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: moveKeys.all })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
    onChanged?.()
  }

  const submit = useMutation({
    mutationFn: moveService.checkIn,
    onSuccess: (res) => {
      setResult(res)
      if (!res.diff) {
        toast({ title: t('checkin.unchanged'), variant: 'success' })
        invalidate()
      }
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const keepOriginal = useMutation({
    mutationFn: moveService.checkInKeepOriginal,
    onSuccess: () => {
      setResult(null)
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const accept = useMutation({
    mutationFn: (diffId: string) => moveService.acceptReplan(diffId),
    onSuccess: () => {
      setResult(null)
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const sick = useMutation({
    mutationFn: () => moveService.setLifeState({ state: 'SICK' }),
    onSuccess: () => {
      toast({ title: t('today.unwellSet'), variant: 'success' })
      invalidate()
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  const sleepSkipped = checkIn.sleepFromDevice === true
  const complete = feeling !== null && soreness !== null && (sleepSkipped || sleep !== null)

  const maybeSubmit = (next: { feeling?: CheckInFeeling; soreness?: CheckInSoreness; sleep?: CheckInSleep }) => {
    const f = next.feeling ?? feeling
    const s = next.soreness ?? soreness
    const sl = next.sleep ?? sleep
    if (f && s && (sleepSkipped || sl)) {
      submit.mutate({ feeling: f, soreness: s, sleep: sleepSkipped ? undefined : (sl ?? undefined) })
    }
  }

  // One evaluation per day: once answered we only show the outcome card if a diff is open.
  if (!checkIn.due || dismissed) return null
  if (checkIn.answered && !result) return null

  const diff = result?.diff ?? null
  const light = result?.light ?? null

  if (result && diff && light) {
    const Icon = LIGHT_ICON[light]
    return (
      <section
        aria-label={t('checkin.regionLabel')}
        className={cn('move-block rounded-[16px] border p-4 space-y-3', LIGHT_CLASS[light])}
        aria-live="polite"
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-5 w-5 shrink-0" aria-hidden />
          {t(`checkin.light.${light}`)}
        </p>
        <p className="text-base">{diff.narrative}</p>
        {showWhy && diff.reason && <p className="text-sm opacity-80">{diff.reason}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => accept.mutate(diff.id)} disabled={accept.isPending} className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]">
            {t('checkin.ok')}
          </Button>
          <Button variant="secondary" onClick={() => keepOriginal.mutate()} disabled={keepOriginal.isPending}>
            {t('checkin.keepOriginal')}
          </Button>
          {diff.reason && (
            <Button variant="ghost" onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy}>
              {t('checkin.why')}
            </Button>
          )}
        </div>
      </section>
    )
  }

  const chip = (selected: boolean) =>
    cn(
      'min-h-12 px-4 rounded-[12px] border text-sm font-medium transition-colors',
      selected
        ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white'
        : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )

  const question = (
    legend: string,
    options: { value: string; label: string }[],
    selected: string | null,
    onPick: (v: string) => void,
  ) => (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[#1A1A1A]">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected === o.value}
            onClick={() => onPick(o.value)}
            className={chip(selected === o.value)}
          >
            {selected === o.value && <span className="sr-only">{t('settings.demonstrator.chosen')} </span>}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )

  return (
    <section
      aria-label={t('checkin.regionLabel')}
      className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-4 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-headline text-base font-bold text-[#1A1A1A]">{t('checkin.title')}</h2>
        <button
          type="button"
          onClick={() => {
            writeDismissed(date)
            setDismissed(true)
          }}
          className="text-sm text-gray-500 hover:text-[#1A1A1A] px-3 rounded-lg"
        >
          {t('checkin.dismiss')}
        </button>
      </div>

      {question(
        t('checkin.feeling.q'),
        [
          { value: 'GOOD', label: t('checkin.feeling.good') },
          { value: 'AVERAGE', label: t('checkin.feeling.average') },
          { value: 'TIRED', label: t('checkin.feeling.tired') },
        ],
        feeling,
        (v) => {
          setFeeling(v as CheckInFeeling)
          maybeSubmit({ feeling: v as CheckInFeeling })
        },
      )}
      {question(
        t('checkin.soreness.q'),
        [
          { value: 'NONE', label: t('checkin.soreness.none') },
          { value: 'MILD', label: t('checkin.soreness.mild') },
          { value: 'STRONG', label: t('checkin.soreness.strong') },
        ],
        soreness,
        (v) => {
          setSoreness(v as CheckInSoreness)
          maybeSubmit({ soreness: v as CheckInSoreness })
        },
      )}
      {!sleepSkipped &&
        question(
          t('checkin.sleep.q'),
          [
            { value: 'GOOD', label: t('checkin.sleep.good') },
            { value: 'MEDIUM', label: t('checkin.sleep.medium') },
            { value: 'POOR', label: t('checkin.sleep.poor') },
          ],
          sleep,
          (v) => {
            setSleep(v as CheckInSleep)
            maybeSubmit({ sleep: v as CheckInSleep })
          },
        )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => sick.mutate()}
          disabled={sick.isPending}
          className="text-sm underline underline-offset-4 text-gray-600 hover:text-[#1A1A1A] px-2 rounded-lg"
        >
          {t('checkin.sick')}
        </button>
        {submit.isPending && (
          <span className="text-xs text-gray-500" role="status">
            {t('common.loading')}
          </span>
        )}
        {complete && !submit.isPending && !result && (
          <span className="sr-only" role="status">
            {t('checkin.unchanged')}
          </span>
        )}
      </div>
    </section>
  )
}
