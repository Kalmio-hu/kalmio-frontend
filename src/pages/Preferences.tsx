import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Knob } from '@/components/ui/knob'
import { toast } from '@/components/ui/toast'
import { ForbiddenIngredientsPicker } from '@/components/ForbiddenIngredientsPicker'
import { usersService, type DietaryPreferences } from '@/services/users'
import type { DietaryRestrictionKey, MealType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type MarkerGroup = {
  label: string
  key: string
  items: { key: DietaryRestrictionKey; label: string; description: string }[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export function Preferences() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  })

  // ── Card 1: Dietary preferences ───────────────────────────────────────────

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
      qc.invalidateQueries({ queryKey: ['me'] })
      toast({ title: t('profile.dietarySaveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('profile.dietarySaveError'), variant: 'destructive' })
    } finally {
      setDietarySaving(false)
    }
  }

  // ── Card 2: Meal types & calorie split ────────────────────────────────────

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
      qc.invalidateQueries({ queryKey: ['me'] })
      toast({ title: t('profile.mealPrefSaved'), variant: 'success' })
    } catch {
      toast({ title: t('profile.mealPrefError'), variant: 'destructive' })
    } finally {
      setMealPrefSaving(false)
    }
  }

  // ── Card 3: Prep preferences ──────────────────────────────────────────────

  const [prefersFreezing, setPrefersFreezing] = useState<boolean>(
    user?.prefersFreezing ?? false
  )
  const [preferredPrepDayOfWeek, setPreferredPrepDayOfWeek] = useState<string>(
    user?.preferredPrepDayOfWeek?.toString() ?? ''
  )
  const [prepPrefSaving, setPrepPrefSaving] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) {
      setPrefersFreezing(user.prefersFreezing ?? false)
      setPreferredPrepDayOfWeek(user.preferredPrepDayOfWeek?.toString() ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function savePrepPreferences() {
    setPrepPrefSaving(true)
    try {
      const updated = await usersService.updateSettings({
        prefersFreezing,
        preferredPrepDayOfWeek: preferredPrepDayOfWeek
          ? parseInt(preferredPrepDayOfWeek, 10)
          : null,
      })
      qc.setQueryData(['me'], updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast({ title: t('settings.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('settings.saveError'), variant: 'destructive' })
    } finally {
      setPrepPrefSaving(false)
    }
  }

  // ── Card 4: Forbidden ingredients ─────────────────────────────────────────

  const [forbiddenIngredientIds, setForbiddenIngredientIds] = useState<string[]>([])
  const forbiddenPrefilled = useRef(false)
  const [forbiddenSaving, setForbiddenSaving] = useState(false)

  useEffect(() => {
    if (user && !forbiddenPrefilled.current) {
      forbiddenPrefilled.current = true
      const saved = user.mealPlanPreferences?.forbiddenIngredientIds
      if (saved && saved.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForbiddenIngredientIds(saved)
      }
    }
  }, [user])

  async function saveForbiddenIngredients() {
    setForbiddenSaving(true)
    try {
      const updated = await usersService.updateSettings({
        mealPlanPreferences: {
          forbiddenIngredientIds: forbiddenIngredientIds.length > 0 ? forbiddenIngredientIds : undefined,
        },
      })
      qc.setQueryData(['me'], updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast({ title: t('settings.saveSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('settings.saveError'), variant: 'destructive' })
    } finally {
      setForbiddenSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

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
        title={t('preferences.page.title')}
        subtitle={t('preferences.page.subtitle')}
      />

      <div className="max-w-lg space-y-6">

        {/* Card 1: Dietary preferences */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('preferences.page.dietary.title')}</h2>
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

        {/* Card 2: Meal types & calorie split */}
        <Card>
          <CardContent className="pt-5 space-y-5">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('preferences.page.mealTypes.title')}</h2>
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

        {/* Card 3: Prep preferences */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('preferences.page.prep.title')}</h2>
              <p className="text-xs text-gray-400 mt-1">{t('settings.prepPrefs.subtitle')}</p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] cursor-pointer">
              <input
                type="checkbox"
                checked={prefersFreezing}
                onChange={e => setPrefersFreezing(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#4F7942]"
              />
              {t('settings.prepPrefs.prefersFreezing')}
            </label>
            <p className="text-[10px] text-gray-400 -mt-2 ml-6">{t('settings.prepPrefs.prefersFreezingHint')}</p>

            <div>
              <Label htmlFor="prep-day">{t('settings.prepPrefs.preferredPrepDayOfWeek')}</Label>
              <Select
                id="prep-day"
                value={preferredPrepDayOfWeek}
                onChange={e => setPreferredPrepDayOfWeek(e.target.value)}
                className="mt-1"
              >
                <option value="">{t('settings.prepPrefs.noPreference')}</option>
                <option value="1">{t('common.weekdays.monday')}</option>
                <option value="2">{t('common.weekdays.tuesday')}</option>
                <option value="3">{t('common.weekdays.wednesday')}</option>
                <option value="4">{t('common.weekdays.thursday')}</option>
                <option value="5">{t('common.weekdays.friday')}</option>
                <option value="6">{t('common.weekdays.saturday')}</option>
                <option value="7">{t('common.weekdays.sunday')}</option>
              </Select>
              <p className="text-[10px] text-gray-400 mt-1">{t('settings.prepPrefs.preferredPrepDayOfWeekHint')}</p>
            </div>

            <Button type="button" onClick={savePrepPreferences} disabled={prepPrefSaving} className="w-full">
              {prepPrefSaving ? `${t('common.save')}…` : t('common.save')}
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Forbidden ingredients */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('preferences.page.forbidden.title')}</h2>
              <p className="text-xs text-gray-400 mt-1">{t('plan.forbiddenIngredients.hint')}</p>
            </div>

            <ForbiddenIngredientsPicker
              value={forbiddenIngredientIds}
              onChange={setForbiddenIngredientIds}
            />

            <Button type="button" onClick={saveForbiddenIngredients} disabled={forbiddenSaving} className="w-full">
              {forbiddenSaving ? `${t('common.save')}…` : t('common.save')}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
