/**
 * Body of one start-flow screen (PRD §7.1). The frame (MoveStart) owns the
 * step rail, navigation, the POST and the register; this component renders the
 * six screens from `StartFlowState` and dispatches reducer actions.
 */
import { useState, type Dispatch } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { useMoveT } from '../lib/register'
import { MOVE_ACCENT } from '../lib/constants'
import { ModalityPicture, pictureKeyFor } from '../lib/modalityPictures'
import { buildWeekView, intensityKey } from '../lib/weekView'
import { todayIso, weekdayLabel, weekdayName } from '../lib/dates'
import {
  fillsSingleRole,
  MINUTE_OPTIONS,
  START_EQUIPMENT,
  type StartFlowAction,
  type StartFlowState,
} from '../lib/startFlow'
import type { StartStep } from '../lib/startSteps'
import { HealthQuestions } from './HealthQuestions'
import type { CreateFixedClassRequest, ModalityDto, StartFlowResponse } from '../types'

export interface StartMemberOption {
  userId: string
  displayName: string
}

interface StartStepBodyProps {
  step: StartStep
  state: StartFlowState
  dispatch: Dispatch<StartFlowAction>
  modalities: ModalityDto[] | undefined
  modalitiesLoading: boolean
  members?: StartMemberOption[]
  result?: StartFlowResponse | null
  resultPending?: boolean
  resultError?: boolean
}

const FIXED_DURATIONS = [30, 45, 60, 90] as const

function choiceClass(selected: boolean, extra?: string) {
  return cn(
    'min-h-12 px-4 rounded-[12px] border text-base font-medium transition-colors text-left',
    selected ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#e5e4e7] bg-white text-[#1A1A1A] hover:bg-[#2A9D8F]/10',
    extra,
  )
}

export function StartStepBody({ step, state, dispatch, modalities, modalitiesLoading, members, result, resultPending, resultError }: StartStepBodyProps) {
  const { t, i18n } = useMoveT(state.register)
  const locale = i18n.language

  if (step === 'forWhom') {
    return (
      <div className="space-y-4">
        <div className="space-y-3" role="radiogroup" aria-label={t('start.steps.forWhom')}>
          <button type="button" role="radio" aria-checked={state.forWhom === 'SELF'} className={choiceClass(state.forWhom === 'SELF', 'w-full')} onClick={() => dispatch({ type: 'forWhom', value: 'SELF' })}>
            {t('start.forWhom.self')}
          </button>
          <button type="button" role="radio" aria-checked={state.forWhom === 'OTHER'} className={choiceClass(state.forWhom === 'OTHER', 'w-full')} onClick={() => dispatch({ type: 'forWhom', value: 'OTHER' })}>
            {t('start.forWhom.other')}
          </button>
        </div>
        <p className="text-sm text-gray-500">{t('start.forWhom.hint')}</p>
        {state.forWhom === 'OTHER' && (
          <div className="space-y-3 rounded-[12px] bg-[#F9F7F2] p-4">
            <p className="text-base text-gray-700">{t('start.forWhom.helperNote')}</p>
            {members && members.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="move-start-member">{t('start.forWhom.memberLabel')}</Label>
                <Select
                  id="move-start-member"
                  value={state.forUserId ?? ''}
                  onChange={(e) => dispatch({ type: 'forWhom', value: 'OTHER', forUserId: e.target.value || null })}
                  className="h-12"
                >
                  <option value="">{t('start.forWhom.memberNone')}</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}
                    </option>
                  ))}
                </Select>
                <p className="text-sm text-gray-500">{t('start.forWhom.memberHint')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (step === 'modalities') {
    return <ModalityGrid state={state} dispatch={dispatch} modalities={modalities} loading={modalitiesLoading} />
  }

  if (step === 'schedule') {
    return <ScheduleStep state={state} dispatch={dispatch} modalities={modalities} />
  }

  if (step === 'equipment') {
    return (
      <div className="space-y-3">
        <p className="text-base text-gray-700">{t('start.equipment.hint')}</p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label={t('start.steps.equipment')}>
          {START_EQUIPMENT.map((code) => {
            const selected = state.equipment.includes(code)
            return (
              <li key={code}>
                <button type="button" role="checkbox" aria-checked={selected} className={choiceClass(selected, 'w-full flex items-center gap-2')} onClick={() => dispatch({ type: 'toggleEquipment', code })}>
                  {selected && <Check className="h-4 w-4 shrink-0" aria-hidden />}
                  {t(`start.equipment.items.${code}`)}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (step === 'health') {
    return (
      <HealthQuestions
        answers={state.answers}
        skipped={state.healthSkipped}
        register={state.register}
        onAnswer={(index, value) => dispatch({ type: 'answer', index, value })}
        onSkip={() => dispatch({ type: 'skipHealth' })}
        onUnskip={() => dispatch({ type: 'unskipHealth' })}
      />
    )
  }

  // ── result ────────────────────────────────────────────────────────────────
  if (resultPending || (!result && !resultError)) {
    return (
      <div className="flex items-center gap-3 py-6" role="status" aria-live="polite">
        <Spinner className="border-[#2A9D8F]" />
        <span className="text-base text-gray-700">{t('start.result.building')}</span>
      </div>
    )
  }
  if (resultError || !result) {
    return <p className="text-base text-gray-700">{t('start.result.failed')}</p>
  }

  const view = buildWeekView(result.week, todayIso())
  const first = result.firstSession
  const track = result.screening.track

  return (
    <div className="space-y-5" aria-live="polite">
      <p className="font-headline text-xl font-bold text-[#1A1A1A]">{t('start.result.ready')}</p>
      {track === 'A' && <p className="text-base text-[#1A1A1A] move-body">{result.screening.line || t('start.result.trackA')}</p>}
      {track === 'B' && <p className="text-base text-[#1A1A1A] move-body">{result.screening.line || t('start.result.trackB')}</p>}
      {result.screening.hrTargetsOff && <p className="text-sm text-gray-600">{t('start.result.hrOff')}</p>}

      <section aria-label={t('start.result.weekTitle')} className="rounded-[12px] border border-[#e5e4e7] overflow-hidden">
        <ul className="divide-y divide-[#e5e4e7]">
          {view.days.map((d) => (
            <li key={d.date} className={cn('flex items-start gap-3 px-4 py-3', d.isToday && 'bg-[#2A9D8F]/8')}>
              <span className="w-12 shrink-0 text-sm font-semibold text-gray-600 capitalize">{weekdayLabel(d.date, locale)}</span>
              {d.restDay ? (
                <span className="text-sm text-gray-500">{t('today.restDay')}</span>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {d.sessions.map((s) => (
                    <li key={s.id} className="inline-flex items-center gap-2 rounded-[10px] border border-[#e5e4e7] bg-white px-3 py-1.5 text-sm text-[#1A1A1A]">
                      <ModalityPicture pictureKey={pictureKeyFor({ code: s.modalityCode })} className="h-6 w-6 text-[#2A9D8F]" />
                      {s.modalityName} · {t('common.minutes', { count: s.durationMin })} · {t(`week.intensity.${intensityKey(s.intensity)}`)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-base text-[#1A1A1A] move-body" style={{ color: MOVE_ACCENT }}>
        {first ? t('start.result.firstToday', { modality: first.modalityName, minutes: first.durationMin }) : t('start.result.noFirst')}
      </p>
    </div>
  )
}

// ── Screen 2: modality grid ──────────────────────────────────────────────────

function ModalityGrid({ state, dispatch, modalities, loading }: { state: StartFlowState; dispatch: Dispatch<StartFlowAction>; modalities: ModalityDto[] | undefined; loading: boolean }) {
  const { t } = useMoveT(state.register)
  if (loading) {
    return (
      <div className="flex justify-center py-8" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  if (!modalities || modalities.length === 0) return <p className="text-base text-gray-700">{t('start.modalities.empty')}</p>

  const ordered = [...modalities.filter((m) => !m.entryOnly), ...modalities.filter((m) => m.entryOnly)]
  const rolesByCode = Object.fromEntries(modalities.map((m) => [m.code, m.roles]))
  const singleRole = fillsSingleRole(state.modalities, rolesByCode)
  const pickedRoles = new Set(state.modalities.flatMap((c) => rolesByCode[c] ?? []))
  const suggestStrength = singleRole && !pickedRoles.has('STRENGTH') && modalities.some((m) => m.code === 'STRENGTH_BODYWEIGHT')
  const recommendedActive = state.modalities.length > 0 && state.modalities.every((c) => ['WALK', 'STRENGTH_BODYWEIGHT', 'MOBILITY', 'SUPPORTED_EXERCISE'].includes(c))

  return (
    <div className="space-y-4">
      <p className="text-base text-gray-700">{t('start.modalities.hint')}</p>
      <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => dispatch({ type: 'recommend' })}>
        {t('start.modalities.recommend')}
      </Button>
      {recommendedActive && <p className="text-sm text-gray-600">{t('start.modalities.recommended')}</p>}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label={t('start.steps.modalities')}>
        {ordered.map((m) => {
          const selected = state.modalities.includes(m.code)
          const rank = state.modalities.indexOf(m.code) + 1
          return (
            <li key={m.code}>
              <button
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => dispatch({ type: 'toggleModality', code: m.code })}
                className={cn(
                  'w-full h-full min-h-28 rounded-[16px] border-2 bg-white p-3 flex flex-col items-start gap-2 text-left transition-colors',
                  selected ? 'border-[#2A9D8F] bg-[#2A9D8F]/8' : 'border-[#e5e4e7] hover:border-[#2A9D8F]/60',
                )}
              >
                {m.imageUrl ? (
                  <img src={m.imageUrl} alt="" className="h-12 w-12 rounded-[10px] object-cover" loading="lazy" />
                ) : (
                  <ModalityPicture pictureKey={pictureKeyFor(m)} className="h-12 w-12" />
                )}
                <span className="flex items-center justify-between w-full gap-2">
                  <span className="font-semibold text-[#1A1A1A]">{m.name}</span>
                  {selected && (
                    <span className="inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: MOVE_ACCENT }} aria-hidden>
                      {rank}
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="text-sm text-gray-500" role="status">
        {state.modalities.length > 0 ? t('start.modalities.picked', { count: state.modalities.length }) : ''}
      </p>
      {suggestStrength && (
        <div className="rounded-[12px] bg-[#F9F7F2] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-base text-[#1A1A1A] flex-1">{t('start.modalities.singleRole')}</p>
          <Button type="button" size="lg" className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]" onClick={() => dispatch({ type: 'toggleModality', code: 'STRENGTH_BODYWEIGHT' })}>
            {t('start.modalities.singleRoleAdd')}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Screen 3: days, minutes, fixed classes ───────────────────────────────────

function ScheduleStep({ state, dispatch, modalities }: { state: StartFlowState; dispatch: Dispatch<StartFlowAction>; modalities: ModalityDto[] | undefined }) {
  const { t, i18n } = useMoveT(state.register)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<CreateFixedClassRequest>({ modalityCode: '', weekday: 1, startTime: '18:00', durationMin: 60, label: '' })
  const classOptions = modalities ? [...modalities.filter((m) => m.entryOnly), ...modalities.filter((m) => !m.entryOnly)] : []
  const draftValid = draft.modalityCode !== '' && /^\d{2}:\d{2}$/.test(draft.startTime)

  return (
    <div className="space-y-6">
      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-[#1A1A1A]">{t('start.schedule.days')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('start.schedule.days')}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={state.daysPerWeek === n} className={choiceClass(state.daysPerWeek === n, 'min-w-12 text-center')} onClick={() => dispatch({ type: 'days', value: n })}>
              {n}
              <span className="sr-only"> {t('start.schedule.daysValue', { count: n })}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-base font-medium text-[#1A1A1A]">{t('start.schedule.minutes')}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('start.schedule.minutes')}>
          {MINUTE_OPTIONS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={state.minutes === m} className={choiceClass(state.minutes === m)} onClick={() => dispatch({ type: 'minutes', value: m })}>
              {t('common.minutes', { count: m })}
            </button>
          ))}
        </div>
      </fieldset>

      <section className="space-y-3" aria-labelledby="move-start-fixed">
        <h3 id="move-start-fixed" className="text-base font-medium text-[#1A1A1A]">
          {t('start.schedule.fixedTitle')}
        </h3>
        <p className="text-sm text-gray-600">{t('start.schedule.fixedHint')}</p>
        {state.fixedClasses.length > 0 && (
          <ul className="space-y-2">
            {state.fixedClasses.map((fc, i) => (
              <li key={`${fc.modalityCode}-${fc.weekday}-${fc.startTime}-${i}`} className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e4e7] bg-white px-4 py-2">
                <span className="text-sm text-[#1A1A1A]">
                  {t('start.schedule.fixedLine', {
                    name: fc.label || modalities?.find((m) => m.code === fc.modalityCode)?.name || fc.modalityCode,
                    weekday: weekdayName(fc.weekday, i18n.language, 'short'),
                    time: fc.startTime,
                    minutes: fc.durationMin,
                  })}
                </span>
                <Button type="button" variant="ghost" size="sm" className="min-h-12" onClick={() => dispatch({ type: 'removeFixedClass', index: i })}>
                  {t('start.schedule.fixedRemove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {!adding ? (
          <Button type="button" variant="secondary" size="lg" onClick={() => setAdding(true)}>
            {t('start.schedule.fixedAdd')}
          </Button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[12px] bg-[#F9F7F2] p-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="move-fixed-modality">{t('start.schedule.fixedName')}</Label>
              <Select id="move-fixed-modality" className="h-12" value={draft.modalityCode} onChange={(e) => setDraft({ ...draft, modalityCode: e.target.value })}>
                <option value="">—</option>
                {classOptions.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-fixed-weekday">{t('start.schedule.fixedWeekday')}</Label>
              <Select id="move-fixed-weekday" className="h-12" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {weekdayName(d, i18n.language)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-fixed-time">{t('start.schedule.fixedTime')}</Label>
              <Input id="move-fixed-time" type="time" className="h-12" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="move-fixed-duration">{t('start.schedule.fixedDuration')}</Label>
              <Select id="move-fixed-duration" className="h-12" value={draft.durationMin} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })}>
                {FIXED_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {t('common.minutes', { count: d })}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                size="lg"
                className="bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]"
                disabled={!draftValid}
                onClick={() => {
                  dispatch({ type: 'addFixedClass', value: { ...draft, label: draft.label || undefined } })
                  setAdding(false)
                  setDraft({ modalityCode: '', weekday: 1, startTime: '18:00', durationMin: 60, label: '' })
                }}
              >
                {t('start.schedule.fixedSave')}
              </Button>
              <Button type="button" size="lg" variant="ghost" onClick={() => setAdding(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
        <p className="text-sm text-gray-500">{t('start.schedule.fixedLater')}</p>
      </section>
    </div>
  )
}
