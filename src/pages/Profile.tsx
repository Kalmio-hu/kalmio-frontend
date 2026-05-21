import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { toast } from '@/components/ui/toast'
import {
  usersService,
  type UpdateProfileRequest,
  type BodyDataRequest,
  type UpdateGoalRequest,
} from '@/services/users'
import type { BiologicalSex, ActivityLevel, Goal, HealthFeedbackItem } from '@/types'
import { formatLocalDate } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────

interface IdentityFormValues {
  firstName: string
  lastName: string
  username: string
}

const ACCEPTED_AVATAR = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

// Goal taxonomy — ordered for display
const GOAL_OPTIONS: Goal[] = [
  'MAINTAIN',
  'MILD_LOSS',
  'AGGRESSIVE_LOSS',
  'RECOMPOSITION',
  'CLEAN_BULK',
  'DIRTY_BULK',
]

/** Default %BW/week change for each goal (positive = gain, negative = loss, 0 = neutral). */
const GOAL_PCT_BW_PER_WEEK: Record<Goal, number> = {
  MAINTAIN: 0,
  MILD_LOSS: -0.5,
  AGGRESSIVE_LOSS: -1.0,
  RECOMPOSITION: 0,
  CLEAN_BULK: 0.25,
  DIRTY_BULK: 0.5,
}

/** i18n key suffix for each goal option label. */
const GOAL_I18N_KEY: Record<Goal, string> = {
  MAINTAIN: 'maintain',
  MILD_LOSS: 'mildLoss',
  AGGRESSIVE_LOSS: 'aggressiveLoss',
  RECOMPOSITION: 'recomposition',
  CLEAN_BULK: 'cleanBulk',
  DIRTY_BULK: 'dirtyBulk',
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Compute the kg/week change for a goal given the user's weight. */
function weeklyKgChange(goal: Goal, weightKg: number | null): number | null {
  if (weightKg == null) return null
  const pct = GOAL_PCT_BW_PER_WEEK[goal]
  if (pct === 0) return 0
  return (pct / 100) * weightKg
}

// ── Sub-components ────────────────────────────────────────────────────────

interface HealthFeedbackBannerProps {
  items: HealthFeedbackItem[]
}

function HealthFeedbackBanner({ items }: HealthFeedbackBannerProps) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <div className="space-y-2 mt-3" role="alert">
      {items.map((item, idx) => {
        const isStrong = item.severity === 'STRONG_WARN'
        return (
          <div
            key={idx}
            className={[
              'flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-snug',
              isStrong
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-amber-300 bg-amber-50 text-amber-800',
            ].join(' ')}
          >
            {/* Icon */}
            <span
              aria-hidden="true"
              className={[
                'mt-0.5 flex-shrink-0 h-4 w-4',
                isStrong ? 'text-red-600' : 'text-amber-600',
              ].join(' ')}
            >
              {isStrong ? (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span>
              {t(item.messageKey, item.params as Record<string, string>)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function Profile() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()

  // ── Data fetches ─────────────────────────────────────────────────────────
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 30_000,
  })

  const { data: targets, isLoading: targetsLoading } = useQuery({
    queryKey: ['me', 'targets'],
    queryFn: usersService.getTargets,
    staleTime: 30_000,
  })

  const { data: feedbackItems = [] } = useQuery({
    queryKey: ['me', 'goal-feedback'],
    queryFn: usersService.getGoalFeedback,
    staleTime: 30_000,
  })

  // ── Identity card ─────────────────────────────────────────────────────────
  const { register, handleSubmit, reset } = useForm<IdentityFormValues>()

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        username: user.username ?? '',
      })
    }
  }, [user, reset])

  const identityMutation = useMutation({
    mutationFn: (body: UpdateProfileRequest) => usersService.updateProfile(body),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      toast({ title: t('profile.saveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('profile.saveError'), variant: 'destructive' })
    },
  })

  const onIdentitySubmit = (values: IdentityFormValues) => {
    identityMutation.mutate({
      firstName: values.firstName.trim() || null,
      lastName: values.lastName.trim() || null,
      username: values.username.trim() || null,
    })
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadAvatar(file: File) {
    if (!ACCEPTED_AVATAR.includes(file.type) || file.size > MAX_AVATAR_SIZE) {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const updated = await usersService.uploadAvatar(file)
      qc.setQueryData(['me'], updated)
      toast({ title: t('profile.avatarUploadSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadAvatar(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadAvatar(file)
  }

  // ── Body data card ────────────────────────────────────────────────────────
  const [weightKg, setWeightKg] = useState<string>('')
  const [heightCm, setHeightCm] = useState<string>('')
  const [ageYears, setAgeYears] = useState<string>('')
  const [biologicalSex, setBiologicalSex] = useState<BiologicalSex | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')
  const [bodyDataSaving, setBodyDataSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setWeightKg(user.weightKg != null ? String(user.weightKg) : '')
      setHeightCm(user.heightCm != null ? String(user.heightCm) : '')
      setAgeYears(user.ageYears != null ? String(user.ageYears) : '')
      setBiologicalSex(user.biologicalSex ?? '')
      setActivityLevel(user.activityLevel ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveBodyData() {
    setBodyDataSaving(true)
    try {
      const payload: BodyDataRequest = {
        weightKg: weightKg.trim() ? Number(weightKg) : null,
        heightCm: heightCm.trim() ? Number(heightCm) : null,
        ageYears: ageYears.trim() ? Number(ageYears) : null,
        biologicalSex: biologicalSex || null,
        activityLevel: activityLevel || null,
      }
      const updated = await usersService.patchBodyData(payload)
      qc.setQueryData(['me'], updated)
      // Re-fetch targets as body data changed
      await qc.invalidateQueries({ queryKey: ['me', 'targets'] })
      await qc.invalidateQueries({ queryKey: ['me', 'goal-feedback'] })
      toast({ title: t('profile.bodyData.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.bodyData.saveError'), variant: 'destructive' })
    } finally {
      setBodyDataSaving(false)
    }
  }

  async function clearBodyData() {
    setBodyDataSaving(true)
    try {
      const updated = await usersService.deleteBodyData()
      qc.setQueryData(['me'], updated)
      setWeightKg('')
      setHeightCm('')
      setAgeYears('')
      setBiologicalSex('')
      setActivityLevel('')
      await qc.invalidateQueries({ queryKey: ['me', 'targets'] })
      await qc.invalidateQueries({ queryKey: ['me', 'goal-feedback'] })
      toast({ title: t('profile.bodyData.clearSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.bodyData.clearError'), variant: 'destructive' })
    } finally {
      setBodyDataSaving(false)
    }
  }

  // ── Goal card ─────────────────────────────────────────────────────────────
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [goalSaving, setGoalSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setSelectedGoal(user.goal ?? null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveGoal(goal: Goal | null) {
    if (goal === null) return
    setGoalSaving(true)
    try {
      const payload: UpdateGoalRequest = { goal }
      const updated = await usersService.updateGoal(payload)
      qc.setQueryData(['me'], updated)
      await qc.invalidateQueries({ queryKey: ['me', 'targets'] })
      await qc.invalidateQueries({ queryKey: ['me', 'goal-feedback'] })
      toast({ title: t('profile.goal.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.goal.saveError'), variant: 'destructive' })
    } finally {
      setGoalSaving(false)
    }
  }

  // ── Speciális overrides ───────────────────────────────────────────────────
  const [specialisOpen, setSpecialisOpen] = useState(false)
  const [kcalOverride, setKcalOverride] = useState<string>('')
  const [proteinOverride, setProteinOverride] = useState<string>('')
  const [carbsOverride, setCarbsOverride] = useState<string>('')
  const [fatOverride, setFatOverride] = useState<string>('')
  const [specialisSaving, setSpecialisSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setKcalOverride(user.mealPlanPreferences?.kcalTarget != null ? String(user.mealPlanPreferences.kcalTarget) : '')
      setProteinOverride(user.mealPlanPreferences?.proteinTarget != null ? String(user.mealPlanPreferences.proteinTarget) : '')
      setCarbsOverride(user.carbsTargetG != null ? String(user.carbsTargetG) : '')
      setFatOverride(user.fatTargetG != null ? String(user.fatTargetG) : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveSpecialis() {
    setSpecialisSaving(true)
    try {
      const updated = await usersService.updateSettings({
        carbsTargetG: carbsOverride.trim() ? Number(carbsOverride) : null,
        fatTargetG: fatOverride.trim() ? Number(fatOverride) : null,
        mealPlanPreferences: {
          ...user?.mealPlanPreferences,
          kcalTarget: kcalOverride.trim() ? Number(kcalOverride) : undefined,
          proteinTarget: proteinOverride.trim() ? Number(proteinOverride) : undefined,
        },
      })
      qc.setQueryData(['me'], updated)
      await qc.invalidateQueries({ queryKey: ['me', 'targets'] })
      toast({ title: t('profile.specialis.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.specialis.saveError'), variant: 'destructive' })
    } finally {
      setSpecialisSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  const memberSince = user?.createdAt
    ? formatLocalDate(user.createdAt, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const weightForCalc = weightKg.trim() ? Number(weightKg) : (user?.weightKg ?? null)

  return (
    <div>
      <Header
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="max-w-lg space-y-6">

        {/* ── Card 1: Identity ─────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-6 pb-5">
            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-5">
              <div
                role="button"
                tabIndex={0}
                aria-label={t('profile.avatarUploadHint')}
                className={[
                  'relative shrink-0 rounded-full cursor-pointer group',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#E8956D]',
                  dragOver ? 'ring-2 ring-[#E8956D]' : '',
                ].join(' ')}
                onClick={() => !uploading && fileInputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <UserAvatar
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  email={user?.email}
                  avatarUrl={user?.avatarUrl}
                  size="lg"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {uploading
                    ? <Spinner className="text-white h-5 w-5" />
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                  }
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_AVATAR.join(',')}
                className="hidden"
                onChange={onFileChange}
              />

              <div className="min-w-0">
                <p className="font-semibold text-[#1A1A1A] truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                {memberSince && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t('profile.memberSince', { date: memberSince })}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{t('profile.avatarUploadHint')}</p>
              </div>
            </div>

            {/* Identity form */}
            <form onSubmit={handleSubmit(onIdentitySubmit)}>
              <div className="space-y-4">
                <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.personalInfo')}</h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t('profile.firstName')}</Label>
                    <Input
                      {...register('firstName')}
                      placeholder={t('profile.firstNamePlaceholder')}
                      maxLength={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t('profile.lastName')}</Label>
                    <Input
                      {...register('lastName')}
                      placeholder={t('profile.lastNamePlaceholder')}
                      maxLength={100}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>{t('profile.email')}</Label>
                  <Input
                    value={user?.email ?? ''}
                    readOnly
                    disabled
                    className="mt-1 bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor="username">{t('profile.username')}</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                    <Input
                      id="username"
                      {...register('username')}
                      placeholder={t('profile.usernamePlaceholder')}
                      maxLength={50}
                      className="pl-7"
                      autoComplete="username"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t('profile.usernameHint')}</p>
                </div>
              </div>

              <Button type="submit" disabled={identityMutation.isPending} className="mt-4">
                {identityMutation.isPending ? `${t('common.save')}…` : t('common.save')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Card 2: Body data ─────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.bodyData.title')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('profile.bodyData.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="body-weight">{t('profile.bodyData.weightKg')}</Label>
                <Input
                  id="body-weight"
                  type="number"
                  min={20}
                  max={300}
                  step={0.1}
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  placeholder={t('common.optional')}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="body-height">{t('profile.bodyData.heightCm')}</Label>
                <Input
                  id="body-height"
                  type="number"
                  min={100}
                  max={250}
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  placeholder={t('common.optional')}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="body-age">{t('profile.bodyData.ageYears')}</Label>
              <Input
                id="body-age"
                type="number"
                min={10}
                max={120}
                value={ageYears}
                onChange={e => setAgeYears(e.target.value)}
                placeholder={t('common.optional')}
                className="mt-1 w-28"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-[#1A1A1A] mb-2">{t('profile.bodyData.biologicalSex')}</p>
              <div className="space-y-2">
                {(['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'] as BiologicalSex[]).map(sex => (
                  <label key={sex} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="biological-sex"
                      value={sex}
                      checked={biologicalSex === sex}
                      onChange={() => setBiologicalSex(sex)}
                      className="h-4 w-4 accent-[#E8956D]"
                    />
                    <span className="text-sm text-gray-800">
                      {t(`profile.bodyData.sex${sex.split('_').map((w, i) => i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="activity-level">{t('profile.bodyData.activityLevel')}</Label>
              <select
                id="activity-level"
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value as ActivityLevel | '')}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#E8956D]/40"
              >
                <option value="">{t('common.optional')}</option>
                <option value="SEDENTARY">{t('profile.bodyData.activitySedentary')}</option>
                <option value="LIGHT">{t('profile.bodyData.activityLight')}</option>
                <option value="MODERATE">{t('profile.bodyData.activityModerate')}</option>
                <option value="ACTIVE">{t('profile.bodyData.activityActive')}</option>
                <option value="VERY_ACTIVE">{t('profile.bodyData.activityVeryActive')}</option>
              </select>
            </div>

            {/* TDEE read-only display */}
            <div className="rounded-lg bg-[#F9F7F2] border border-[#e5e4e7] px-3.5 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {t('profile.bodyData.tdee')}
              </p>
              {targetsLoading ? (
                <Spinner className="h-4 w-4 text-gray-400" />
              ) : targets != null ? (
                <p className="text-lg font-semibold text-[#1A1A1A]">
                  {targets.tdeeKcal.toLocaleString()} {t('profile.targets.unit_kcal')}
                </p>
              ) : (
                <p className="text-sm text-gray-400">{t('profile.bodyData.tdeeIncomplete')}</p>
              )}
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              {t('profile.bodyData.privacy')}
            </p>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={saveBodyData}
                disabled={bodyDataSaving}
                className="flex-1"
              >
                {bodyDataSaving ? t('profile.bodyData.saving') : t('profile.bodyData.save')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={clearBodyData}
                disabled={bodyDataSaving}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200"
              >
                {bodyDataSaving ? t('profile.bodyData.clearing') : t('profile.bodyData.clearAll')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Card 3: Goal ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.goal.title')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('profile.goal.subtitle')}</p>
            </div>

            {/* 6-option goal radio */}
            <div className="space-y-2" role="radiogroup" aria-label={t('profile.goal.title')}>
              {GOAL_OPTIONS.map(goal => {
                const active = selectedGoal === goal
                const kgPerWeek = weeklyKgChange(goal, weightForCalc)
                return (
                  <label
                    key={goal}
                    className={[
                      'flex items-start gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors',
                      active
                        ? 'border-[#E8956D] bg-[#FFF5F0]'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="goal"
                      value={goal}
                      checked={active}
                      onChange={() => {
                        setSelectedGoal(goal)
                        saveGoal(goal)
                      }}
                      disabled={goalSaving}
                      className="mt-0.5 h-4 w-4 accent-[#E8956D] flex-shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {t(`profile.goal.${GOAL_I18N_KEY[goal]}`)}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {t(`profile.goal.${GOAL_I18N_KEY[goal]}Desc`)}
                      </span>
                      {kgPerWeek != null && kgPerWeek !== 0 && (
                        <span className="block text-xs text-[#E8956D] mt-0.5">
                          {t('profile.goal.weeklyChangeLabel', {
                            kg: Math.abs(kgPerWeek).toFixed(1),
                          })}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Health-feedback banner */}
            <HealthFeedbackBanner items={feedbackItems} />

            {/* Computed targets (read-only) */}
            {selectedGoal == null ? (
              <p className="text-sm text-gray-400">{t('profile.goal.noGoalHint')}</p>
            ) : targetsLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : targets != null ? (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {t('profile.targets.title')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'kcal', value: targets.targetKcal, unit: t('profile.targets.unit_kcal') },
                    { key: 'protein', value: targets.proteinG, unit: t('profile.targets.unit_g') },
                    { key: 'carbs', value: targets.carbsG, unit: t('profile.targets.unit_g') },
                    { key: 'fat', value: targets.fatG, unit: t('profile.targets.unit_g') },
                  ] as const).map(({ key, value, unit }) => (
                    <div key={key} className="rounded-lg bg-[#F9F7F2] border border-[#e5e4e7] px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {t(`profile.targets.${key}`)}
                      </p>
                      <p className="text-base font-semibold text-[#1A1A1A] mt-0.5">
                        {value.toLocaleString()} <span className="text-xs font-normal text-gray-500">{unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t('profile.bodyData.tdeeIncomplete')}</p>
            )}

            {/* ▶ Speciális collapsible */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSpecialisOpen(v => !v)}
                className="w-full flex items-center justify-between px-3.5 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-gray-50 transition-colors"
                aria-expanded={specialisOpen}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={['transition-transform duration-200', specialisOpen ? 'rotate-90' : ''].join(' ')}
                    aria-hidden="true"
                  >
                    ▶
                  </span>
                  {t('profile.specialis.label')}
                </span>
              </button>

              {specialisOpen && (
                <div className="border-t border-gray-100 px-3.5 pb-4 pt-3 space-y-4">
                  <p className="text-xs text-gray-500">{t('profile.specialis.hint')}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="kcal-override">{t('profile.specialis.kcalOverride')}</Label>
                      <Input
                        id="kcal-override"
                        type="number"
                        min={500}
                        max={6000}
                        value={kcalOverride}
                        onChange={e => setKcalOverride(e.target.value)}
                        placeholder={targets?.targetKcal ? String(targets.targetKcal) : t('common.optional')}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein-override">{t('profile.specialis.proteinOverride')}</Label>
                      <Input
                        id="protein-override"
                        type="number"
                        min={0}
                        max={500}
                        value={proteinOverride}
                        onChange={e => setProteinOverride(e.target.value)}
                        placeholder={targets?.proteinG ? String(targets.proteinG) : t('common.optional')}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs-override">{t('profile.specialis.carbsOverride')}</Label>
                      <Input
                        id="carbs-override"
                        type="number"
                        min={0}
                        max={2000}
                        value={carbsOverride}
                        onChange={e => setCarbsOverride(e.target.value)}
                        placeholder={targets?.carbsG ? String(targets.carbsG) : t('common.optional')}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat-override">{t('profile.specialis.fatOverride')}</Label>
                      <Input
                        id="fat-override"
                        type="number"
                        min={0}
                        max={1000}
                        value={fatOverride}
                        onChange={e => setFatOverride(e.target.value)}
                        placeholder={targets?.fatG ? String(targets.fatG) : t('common.optional')}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={saveSpecialis}
                    disabled={specialisSaving}
                    className="w-full"
                  >
                    {specialisSaving ? t('profile.specialis.saving') : t('profile.specialis.save')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
