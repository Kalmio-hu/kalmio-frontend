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
import { Knob } from '@/components/ui/knob'
import { toast } from '@/components/ui/toast'
import { usersService, type UpdateProfileRequest, type DietaryPreferences, type BodyDataRequest } from '@/services/users'
import type { BiologicalSex, ActivityLevel } from '@/types'
import { formatLocalDate } from '@/lib/utils'
import type { DietaryRestrictionKey, MealType } from '@/types'

interface FormValues {
  firstName: string
  lastName: string
  username: string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// Dietary marker groups shown in profile
type MarkerGroup = { label: string; key: string; items: { key: DietaryRestrictionKey; label: string; description: string }[] }

const EMPTY_DIETARY: DietaryPreferences = {
  vegetarian: false, vegan: false, pescatarian: false,
  glutenFree: false, dairyFree: false, lactoseFree: false, milkProteinFree: false,
  eggFree: false, nutFree: false, peanutFree: false, soyFree: false,
  fishFree: false, shellfishFree: false, sesameFree: false,
  halal: false, kosher: false,
  keto: false, lowGi: false, lowFodmap: false, paleo: false,
}

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK']
const MEAL_COLOR: Record<MealType, string> = {
  BREAKFAST: '#F28C28', MORNING_SNACK: '#e8a23a',
  LUNCH: '#4F7942', AFTERNOON_SNACK: '#7a9e5c',
  DINNER: '#1A1A1A', SNACK: '#6b7280',
}

function equalMealKcals(meals: string[], total: number): Record<string, number> {
  if (meals.length === 0) return {}
  const share = Math.floor(total / meals.length)
  const result: Record<string, number> = {}
  meals.forEach((m, i) => { result[m] = i === 0 ? total - share * (meals.length - 1) : share })
  return result
}

function distributeMealKcal(
  key: string, newVal: number,
  current: Record<string, number>,
  meals: string[], total: number,
): Record<string, number> {
  const others = meals.filter(m => m !== key)
  if (others.length === 0) return { ...current, [key]: total }
  const clamped = Math.min(total, Math.max(0, newVal))
  const remaining = total - clamped
  const sumOthers = others.reduce((s, m) => s + (current[m] ?? 0), 0)
  const next: Record<string, number> = { ...current, [key]: clamped }
  if (sumOthers === 0) {
    const share = Math.floor(remaining / others.length)
    others.forEach((m, i) => { next[m] = i === others.length - 1 ? remaining - share * (others.length - 1) : share })
  } else {
    let allocated = 0
    others.forEach((m, i) => {
      if (i === others.length - 1) { next[m] = Math.max(0, remaining - allocated) }
      else { const v = Math.max(0, Math.round(((current[m] ?? 0) / sumOthers) * remaining)); next[m] = v; allocated += v }
    })
  }
  return next
}

export function Profile() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  })

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        username: user.username ?? '',
      })
    }
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (body: UpdateProfileRequest) => usersService.updateProfile(body),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      toast({ title: t('profile.saveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('profile.saveError'), variant: 'destructive' })
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      firstName: values.firstName.trim() || null,
      lastName: values.lastName.trim() || null,
      username: values.username.trim() || null,
    })
  }

  // ── Dietary preferences ────────────────────────────────────────────────────
  const [dietary, setDietary] = useState<DietaryPreferences>(EMPTY_DIETARY)
  const [dietarySaving, setDietarySaving] = useState(false)

  useEffect(() => {
    if (user?.dietaryPreferences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDietary({ ...EMPTY_DIETARY, ...user.dietaryPreferences })
    }
  }, [user])

  function toggleDietary(key: DietaryRestrictionKey) {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function saveDietary() {
    setDietarySaving(true)
    try {
      const updated = await usersService.updateSettings({ dietaryPreferences: dietary })
      qc.setQueryData(['me'], updated)
      toast({ title: t('profile.dietarySaveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.dietarySaveError'), variant: 'destructive' })
    } finally {
      setDietarySaving(false)
    }
  }

  // ── Meal preferences ──────────────────────────────────────────────────────
  const [mealKcalTarget, setMealKcalTarget] = useState<number>(
    user?.mealPlanPreferences?.kcalTarget ?? 2000
  )
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>(
    (user?.mealPlanPreferences?.selectedMealTypes as MealType[] | undefined)
      ?.filter(m => MEAL_ORDER.includes(m))
      ?? ['BREAKFAST', 'LUNCH', 'DINNER']
  )
  const [mealKcals, setMealKcals] = useState<Record<string, number>>(
    user?.mealPlanPreferences?.mealCalorieTargets
      ?? equalMealKcals(['BREAKFAST', 'LUNCH', 'DINNER'], 2000)
  )
  const [proteinTarget, setProteinTarget] = useState<string>(
    user?.mealPlanPreferences?.proteinTarget != null
      ? String(user.mealPlanPreferences.proteinTarget) : ''
  )
  const [mealPrefSaving, setMealPrefSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      const prefs = user.mealPlanPreferences
      const kcal = prefs?.kcalTarget ?? 2000
      setMealKcalTarget(kcal)
      const meals = (prefs?.selectedMealTypes as MealType[] | undefined)
        ?.filter(m => MEAL_ORDER.includes(m))
        ?? ['BREAKFAST', 'LUNCH', 'DINNER']
      setSelectedMeals(meals)
      setMealKcals(prefs?.mealCalorieTargets ?? equalMealKcals(meals, kcal))
      setProteinTarget(prefs?.proteinTarget != null ? String(prefs.proteinTarget) : '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function saveMealPreferences() {
    setMealPrefSaving(true)
    try {
      const updated = await usersService.updateSettings({
        mealPlanPreferences: {
          kcalTarget: mealKcalTarget,
          selectedMealTypes: selectedMeals,
          mealCalorieTargets: mealKcals,
          proteinTarget: proteinTarget.trim() ? Number(proteinTarget) : undefined,
        },
      })
      qc.setQueryData(['me'], updated)
      qc.setQueryData(['user-settings'], updated)
      toast({ title: t('profile.mealPrefSaved'), variant: 'success' })
    } catch {
      toast({ title: t('profile.mealPrefError'), variant: 'destructive' })
    } finally {
      setMealPrefSaving(false)
    }
  }

  // ── Body data ─────────────────────────────────────────────────────────────
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
      toast({ title: t('profile.bodyData.clearSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.bodyData.clearError'), variant: 'destructive' })
    } finally {
      setBodyDataSaving(false)
    }
  }

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadAvatar(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: t('profile.avatarUploadError'), variant: 'destructive' })
      return
    }
    if (file.size > MAX_SIZE) {
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  const memberSince = user?.createdAt
    ? formatLocalDate(user.createdAt, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const markerGroups: MarkerGroup[] = [
    {
      label: t('dietary.groups.lifestyle'),
      key: 'lifestyle',
      items: [
        { key: 'vegetarian', label: t('dietary.vegetarian'), description: t('dietary.vegetarianDesc') },
        { key: 'vegan', label: t('dietary.vegan'), description: t('dietary.veganDesc') },
        { key: 'pescatarian', label: t('dietary.pescatarian'), description: t('dietary.pescatarianDesc') },
      ],
    },
    {
      label: t('dietary.groups.allergens'),
      key: 'allergens',
      items: [
        { key: 'glutenFree', label: t('dietary.glutenFree'), description: t('dietary.glutenFreeDesc') },
        { key: 'dairyFree', label: t('dietary.dairyFree'), description: t('dietary.dairyFreeDesc') },
        { key: 'lactoseFree', label: t('dietary.lactoseFree'), description: t('dietary.lactoseFreeDesc') },
        { key: 'eggFree', label: t('dietary.eggFree'), description: t('dietary.eggFreeDesc') },
        { key: 'nutFree', label: t('dietary.nutFree'), description: t('dietary.nutFreeDesc') },
        { key: 'peanutFree', label: t('dietary.peanutFree'), description: t('dietary.peanutFreeDesc') },
        { key: 'soyFree', label: t('dietary.soyFree'), description: t('dietary.soyFreeDesc') },
        { key: 'fishFree', label: t('dietary.fishFree'), description: t('dietary.fishFreeDesc') },
        { key: 'shellfishFree', label: t('dietary.shellfishFree'), description: t('dietary.shellfishFreeDesc') },
        { key: 'sesameFree', label: t('dietary.sesameFree'), description: t('dietary.sesameFreeDesc') },
      ],
    },
    {
      label: t('dietary.groups.religious'),
      key: 'religious',
      items: [
        { key: 'halal', label: t('dietary.halal'), description: t('dietary.halalDesc') },
        { key: 'kosher', label: t('dietary.kosher'), description: t('dietary.kosherDesc') },
      ],
    },
    {
      label: t('dietary.groups.metabolic'),
      key: 'metabolic',
      items: [
        { key: 'keto', label: t('dietary.keto'), description: t('dietary.ketoDesc') },
        { key: 'lowGi', label: t('dietary.lowGi'), description: t('dietary.lowGiDesc') },
        { key: 'lowFodmap', label: t('dietary.lowFodmap'), description: t('dietary.lowFodmapDesc') },
        { key: 'paleo', label: t('dietary.paleo'), description: t('dietary.paleoDesc') },
      ],
    },
  ]

  return (
    <div>
      <Header
        title={t('profile.title')}
        subtitle={t('profile.subtitle')}
      />

      <div className="max-w-lg space-y-6">
        {/* Avatar card */}
        <Card>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-4">
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
                accept={ACCEPTED.join(',')}
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
          </CardContent>
        </Card>

        {/* Edit form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-5 space-y-4">
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
            </CardContent>
          </Card>

          <Button type="submit" disabled={mutation.isPending} className="mt-4">
            {mutation.isPending ? `${t('common.save')}…` : t('common.save')}
          </Button>
        </form>

        {/* Dietary preferences */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.dietaryTitle')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('profile.dietaryHint')}</p>
            </div>

            {markerGroups.map(group => (
              <div key={group.key}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map(item => {
                    const active = dietary[item.key]
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleDietary(item.key)}
                        className={[
                          'w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                          active
                            ? 'border-[#E8956D] bg-[#FFF5F0]'
                            : 'border-gray-200 bg-white hover:border-gray-300',
                        ].join(' ')}
                      >
                        {/* Checkbox */}
                        <span className={[
                          'mt-0.5 flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors',
                          active ? 'bg-[#E8956D] border-[#E8956D]' : 'border-gray-300',
                        ].join(' ')}>
                          {active && (
                            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="1,5 4,9 11,1" />
                            </svg>
                          )}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-gray-900">{item.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{item.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <Button
              type="button"
              onClick={saveDietary}
              disabled={dietarySaving}
              className="w-full"
            >
              {dietarySaving ? `${t('common.save')}…` : t('profile.dietarySave')}
            </Button>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              {t('profile.allergyDisclaimer')}
            </p>
          </CardContent>
        </Card>

        {/* Meal preferences */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('profile.mealPrefs.title')}</h2>
              <p className="text-xs text-gray-500 mt-1">{t('profile.mealPrefs.subtitle')}</p>
            </div>

            {/* Calorie target */}
            <div>
              <Label htmlFor="kcal-target">{t('profile.mealPrefs.kcalTarget')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="kcal-target"
                  type="number"
                  min={500}
                  max={6000}
                  value={mealKcalTarget}
                  onChange={e => setMealKcalTarget(Number(e.target.value))}
                  onBlur={() => {
                    const clamped = Math.max(500, Math.min(6000, mealKcalTarget))
                    setMealKcalTarget(clamped)
                    const total = selectedMeals.reduce((s, m) => s + (mealKcals[m] ?? 0), 0)
                    if (total > 0) {
                      const scaled: Record<string, number> = {}
                      let alloc = 0
                      selectedMeals.forEach((m, i) => {
                        if (i === selectedMeals.length - 1) scaled[m] = Math.max(0, clamped - alloc)
                        else { const v = Math.round(((mealKcals[m] ?? 0) / total) * clamped); scaled[m] = v; alloc += v }
                      })
                      setMealKcals(scaled)
                    }
                  }}
                  className="w-28"
                />
                <span className="text-sm text-gray-500">kcal</span>
              </div>
            </div>

            {/* Meal type toggles */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {t('profile.mealPrefs.meals')}
              </p>
              <div className="flex flex-wrap gap-2">
                {MEAL_ORDER.map(meal => {
                  const active = selectedMeals.includes(meal)
                  return (
                    <button
                      key={meal}
                      type="button"
                      onClick={() => {
                        setSelectedMeals(prev => {
                          if (prev.includes(meal)) {
                            if (prev.length === 1) return prev
                            const next = prev.filter(m => m !== meal)
                            setMealKcals(equalMealKcals(next, mealKcalTarget))
                            return next
                          } else {
                            const next = [...prev, meal].sort((a, b) => MEAL_ORDER.indexOf(a) - MEAL_ORDER.indexOf(b))
                            setMealKcals(equalMealKcals(next, mealKcalTarget))
                            return next
                          }
                        })
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        active ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                      style={active ? { background: MEAL_COLOR[meal] } : undefined}
                    >
                      {t(`mealPlan.meals.${meal}`)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Per-meal calorie knobs */}
            {selectedMeals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  {t('profile.mealPrefs.mealCalories')}
                </p>
                <div className="flex flex-wrap gap-5 justify-start">
                  {selectedMeals.map(meal => (
                    <Knob
                      key={meal}
                      value={mealKcals[meal] ?? 0}
                      min={0}
                      max={mealKcalTarget || 2000}
                      onChange={v => setMealKcals(prev => distributeMealKcal(meal, v, prev, selectedMeals, mealKcalTarget || 2000))}
                      label={t(`mealPlan.meals.${meal}`)}
                      color={MEAL_COLOR[meal]}
                      size={80}
                      formatValue={v => `${v}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Protein target */}
            <div>
              <Label htmlFor="protein-target">{t('profile.mealPrefs.proteinTarget')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="protein-target"
                  type="number"
                  min={0}
                  max={500}
                  value={proteinTarget}
                  onChange={e => setProteinTarget(e.target.value)}
                  placeholder={t('common.optional')}
                  className="w-28"
                />
                <span className="text-sm text-gray-500">g / nap</span>
              </div>
            </div>

            <Button type="button" onClick={saveMealPreferences} disabled={mealPrefSaving} className="w-full">
              {mealPrefSaving ? `${t('common.save')}…` : t('profile.mealPrefs.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Body data */}
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
      </div>
    </div>
  )
}
