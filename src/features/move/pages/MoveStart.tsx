/**
 * Start flow (PRD §7.1): six screens from zero to a first session, outside both
 * shells and outside OnboardingGate's nutrition logic. The health answers live
 * in the reducer state only and leave the client once, inside the POST body.
 */
import { useReducer, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { familyService } from '@/services/family'
import { MoveBareLayout } from '../shell/MoveBareLayout'
import { useMoveStatus } from '../lib/useMoveStatus'
import { useMoveT } from '../lib/register'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { MOVE_ACCENT, MOVE_HOME, MOVE_SESSION } from '../lib/constants'
import { StartStepBody, type StartMemberOption } from '../components/StartStepBody'
import { START_STEPS, type StartStep } from '../lib/startSteps'
import {
  buildStartPayload,
  canAdvance,
  initialStartState,
  isUnderEighteen,
  nextStep,
  previousStep,
  startFlowReducer,
  SUBMIT_AFTER_STEP,
} from '../lib/startFlow'
import type { StartFlowResponse } from '../types'

const ACCENT_BUTTON = 'bg-[#2A9D8F] hover:bg-[#21867A] focus-visible:ring-[#2A9D8F]'

export function MoveStart() {
  const { t: tn } = useTranslation('move')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { status, isLoading, setLastSpace } = useMoveStatus()
  const [state, dispatch] = useReducer(startFlowReducer, undefined, initialStartState)
  const { t } = useMoveT(state.register)
  const [step, setStep] = useState<StartStep>('forWhom')
  const [result, setResult] = useState<StartFlowResponse | null>(null)

  const me = useQuery({ queryKey: USERS_ME_QUERY_KEY, queryFn: usersService.getMe, staleTime: 60_000, enabled: status.enabled })
  const modalities = useQuery({ queryKey: moveKeys.modalities, queryFn: moveService.getModalities, staleTime: 10 * 60_000, enabled: status.enabled })
  const family = useQuery({
    queryKey: ['family', 'mine'],
    queryFn: familyService.getMine,
    staleTime: 60_000,
    enabled: status.enabled && state.forWhom === 'OTHER',
  })
  const members: StartMemberOption[] =
    family.data?.members.filter((m) => m.userId !== me.data?.id).map((m) => ({ userId: m.userId, displayName: m.displayName })) ?? []

  const start = useMutation({
    mutationFn: () => moveService.start(buildStartPayload(state)),
    onSuccess: (res) => {
      setResult(res)
      qc.setQueryData(moveKeys.status, { ...status, spaceActive: true, register: res.profile.register, lastSpace: 'MOVE' })
      void qc.invalidateQueries({ queryKey: moveKeys.status })
      void qc.invalidateQueries({ queryKey: moveKeys.today })
      void qc.invalidateQueries({ queryKey: moveKeys.week() })
      void qc.invalidateQueries({ queryKey: moveKeys.profile })
      void setLastSpace('MOVE')
    },
    onError: () => toast({ title: tn('common.error'), variant: 'destructive' }),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9F7F2]" role="status">
        <Spinner className="border-[#2A9D8F]" />
      </div>
    )
  }
  if (!status.enabled) return <Navigate to="/app" replace />

  // A member under 18 never gets this flow (PRD §7.9).
  if (isUnderEighteen(me.data)) {
    return (
      <MoveBareLayout onBack={() => navigate(-1)} backLabel={t('start.exit')}>
        <div className="space-y-4">
          <h1 className="font-headline text-2xl font-bold text-[#1A1A1A]">{t('start.underage.title')}</h1>
          <p className="text-base text-gray-700 move-body">{t('start.underage.body')}</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/app')}>
            {t('start.underage.back')}
          </Button>
        </div>
      </MoveBareLayout>
    )
  }

  if (status.spaceActive && !result) {
    return (
      <MoveBareLayout>
        <div className="space-y-4">
          <h1 className="font-headline text-2xl font-bold text-[#1A1A1A]">{t('start.alreadyActive')}</h1>
          <Button size="lg" className={ACCENT_BUTTON} onClick={() => navigate(MOVE_HOME)}>
            {t('start.goToToday')}
          </Button>
        </div>
      </MoveBareLayout>
    )
  }

  const stepIndex = START_STEPS.indexOf(step)
  const isResult = step === 'result'
  const advance = () => {
    if (!canAdvance(step, state)) return
    const next = nextStep(step)
    if (!next) return
    if (step === SUBMIT_AFTER_STEP) start.mutate()
    setStep(next)
  }
  const back = () => {
    const prev = previousStep(step)
    if (prev) setStep(prev)
    else navigate(-1)
  }
  const finish = () => navigate(result?.firstSession ? MOVE_SESSION(result.firstSession.id) : MOVE_HOME, { replace: true })

  return (
    <MoveBareLayout onBack={isResult ? undefined : back} backLabel={stepIndex === 0 ? t('start.exit') : t('start.back')} large={state.register === 'FORMAL'}>
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="font-headline text-2xl font-bold text-[#1A1A1A]">{t('start.title')}</h1>
          <p className="text-base text-gray-600">{t('start.subtitle')}</p>
        </header>

        {/* Step rail — colour plus position plus text, never colour alone */}
        <ol className="flex items-center gap-2" aria-label={t('start.title')}>
          {START_STEPS.map((key, i) => (
            <li key={key} className="flex-1">
              <div className="h-1.5 rounded-full" style={{ backgroundColor: i <= stepIndex ? MOVE_ACCENT : '#e5e4e7' }} aria-hidden />
              <span className="sr-only">
                {i + 1}. {t(`start.steps.${key}`)}
                {i === stepIndex ? ` (${t('start.stepOf', { index: i + 1, total: START_STEPS.length })})` : ''}
              </span>
            </li>
          ))}
        </ol>

        <section aria-live="polite" className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-4">
          <h2 className="font-headline text-lg font-bold text-[#1A1A1A]">{t(`start.steps.${step}`)}</h2>
          <StartStepBody
            step={step}
            state={state}
            dispatch={dispatch}
            modalities={modalities.data}
            modalitiesLoading={modalities.isPending}
            members={members}
            result={result}
            resultPending={start.isPending}
            resultError={start.isError}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            {!isResult ? (
              <Button size="lg" className={ACCENT_BUTTON} onClick={advance} disabled={!canAdvance(step, state)}>
                {t('start.next')}
              </Button>
            ) : start.isError ? (
              <Button size="lg" className={ACCENT_BUTTON} onClick={() => start.mutate()} disabled={start.isPending}>
                {tn('common.retry')}
              </Button>
            ) : (
              <>
                <Button size="lg" className={ACCENT_BUTTON} onClick={finish} disabled={!result}>
                  {t('start.cta')}
                </Button>
                <Button size="lg" variant="ghost" onClick={() => navigate(MOVE_HOME, { replace: true })} disabled={!result}>
                  {t('start.later')}
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </MoveBareLayout>
  )
}
