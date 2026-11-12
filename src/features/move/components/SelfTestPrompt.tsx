/**
 * 30-second chair stand (PRD §7.8): every four weeks, chair against a wall,
 * one number → `POST /api/move/self-test`. After saving, the card stays and
 * answers the three questions a tester has: was that good (praise), where do I
 * start from (baseline, or "Négy hete 8-szor állt fel, ma 11-szer"), and how
 * does it compare (healthy adults of the same age band, Tveter et al. 2014).
 * Without a known age the card asks for it in place (`PATCH /api/users/me/body-data`).
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { useMoveT } from '../lib/register'
import { timesWord } from '../lib/progressMath'
import { SelfTestEdit } from './SelfTestEdit'
import type { SelfTestDto } from '../types'

interface SelfTestPromptProps {
  due: boolean
  latest: SelfTestDto | null
  previous: SelfTestDto | null
}

const DISMISS_PREFIX = 'kalmio_move_selftest_later_'

export function SelfTestPrompt({ due, latest, previous }: SelfTestPromptProps) {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [value, setValue] = useState('')
  const [later, setLater] = useState(() => {
    try {
      return sessionStorage.getItem(`${DISMISS_PREFIX}${latest?.date ?? 'first'}`) === '1'
    } catch {
      return false
    }
  })

  const save = useMutation({
    mutationFn: (v: number) => moveService.addSelfTest({ kind: 'SIT_TO_STAND_30S', value: v }),
    onSuccess: () => {
      setValue('')
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.progress })
      void qc.invalidateQueries({ queryKey: moveKeys.selfTests })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })

  if (!due || later) {
    return latest ? <SelfTestResult latest={latest} previous={previous} /> : null
  }

  const n = Number(value)
  const valid = value !== '' && Number.isInteger(n) && n >= 0 && n <= 60

  return (
    <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3" aria-labelledby="move-selftest-title">
      <h2 id="move-selftest-title" className="font-headline text-lg font-bold text-[#1A1A1A]">
        {t('today.selfTest.title')}
      </h2>
      <p className="text-base text-gray-700 move-body">{t('today.selfTest.how')}</p>
      <form
        className="flex flex-col sm:flex-row sm:items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save.mutate(n)
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="move-selftest-value">{t('today.selfTest.input')}</Label>
          <Input
            id="move-selftest-value"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 text-lg w-32"
          />
        </div>
        <Button type="submit" size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={!valid || save.isPending}>
          {t('today.selfTest.save')}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          onClick={() => {
            try {
              sessionStorage.setItem(`${DISMISS_PREFIX}${latest?.date ?? 'first'}`, '1')
            } catch {
              // best effort
            }
            setLater(true)
          }}
        >
          {t('today.selfTest.later')}
        </Button>
      </form>
    </article>
  )
}

// ── Result ───────────────────────────────────────────────────────────────────

function SelfTestResult({ latest, previous }: { latest: SelfTestDto; previous: SelfTestDto | null }) {
  const { t, i18n } = useMoveT()
  const c = latest.comparison ?? null
  const headline = !previous
    ? t('today.selfTest.result.baselineHeadline')
    : latest.value > previous.value
      ? t('today.selfTest.result.betterHeadline')
      : latest.value === previous.value
        ? t('today.selfTest.result.sameHeadline')
        : t('today.selfTest.result.lowerHeadline')

  return (
    <article className="move-block bg-white rounded-[16px] border border-[#e5e4e7] shadow-sm p-5 space-y-3" aria-labelledby="move-selftest-result">
      <h2 id="move-selftest-result" className="text-sm font-semibold text-gray-500">
        {t('today.selfTest.title')}
      </h2>
      <div className="flex items-baseline gap-3">
        <p className="font-headline text-4xl font-bold tabular-nums" style={{ color: '#2A9D8F' }}>
          {latest.value}
        </p>
        <p className="text-base text-gray-700">{t('today.selfTest.result.unit')}</p>
        <span className="ml-auto">
          <SelfTestEdit test={latest} />
        </span>
      </div>
      <p className="text-lg font-semibold text-[#1A1A1A]">{headline}</p>
      <p className="text-base text-[#1A1A1A] move-body">
        {previous
          ? t('today.selfTest.progressLine', {
              weeks: Math.max(1, Math.round((Date.parse(latest.date) - Date.parse(previous.date)) / (7 * 86_400_000))),
              previous: timesWord(previous.value, i18n.language),
              latest: timesWord(latest.value, i18n.language),
            })
          : t('today.selfTest.result.baselineLine')}
      </p>
      {c ? (
        <div className="rounded-[12px] bg-[#F9F7F2] p-3 space-y-1">
          <p className="text-base text-[#1A1A1A]">
            {t('today.selfTest.result.reference', {
              from: c.ageFrom,
              to: c.ageTo,
              group: t(`today.selfTest.result.group.${c.sex ?? 'ANY'}`),
              mean: c.referenceMean,
            })}{' '}
            <span className="font-semibold">{t(`today.selfTest.result.position.${c.position}`)}</span>
          </p>
          <p className="text-xs text-gray-500">{t('today.selfTest.result.source')}</p>
        </div>
      ) : (
        <AgeForComparison />
      )}
    </article>
  )
}

/** Asks for the age (and optionally the sex) the comparison needs; the same body data the nutrition settings use. */
function AgeForComparison() {
  const { t } = useMoveT()
  const qc = useQueryClient()
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | null>(null)
  const n = Number(age)
  const valid = age !== '' && Number.isInteger(n) && n >= 18 && n <= 120
  const save = useMutation({
    mutationFn: () => usersService.patchBodyData({ ageYears: n, ...(sex ? { biologicalSex: sex } : {}) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.progress })
      void qc.invalidateQueries({ queryKey: moveKeys.selfTests })
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  })
  const chip = (on: boolean) =>
    cn(
      'min-h-12 px-4 rounded-[12px] border text-base font-medium transition-colors',
      on ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    )
  return (
    <form
      className="rounded-[12px] bg-[#F9F7F2] p-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) save.mutate()
      }}
    >
      <p className="text-base text-[#1A1A1A]">{t('today.selfTest.result.askAge')}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="move-selftest-age">{t('today.selfTest.result.age')}</Label>
          <Input id="move-selftest-age" type="number" inputMode="numeric" min={18} max={120} value={age} onChange={(e) => setAge(e.target.value)} className="h-12 text-lg w-24 bg-white" />
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('today.selfTest.result.sex')}>
          {(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={sex === v} className={chip(sex === v)} onClick={() => setSex(sex === v ? null : v)}>
              {t(`today.selfTest.result.sexOption.${v}`)}
            </button>
          ))}
        </div>
        <Button type="submit" size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" disabled={!valid || save.isPending}>
          {t('today.selfTest.result.compare')}
        </Button>
      </div>
    </form>
  )
}
