/**
 * PreferencesStep — KALMIO-393
 *
 * Onboarding step 2: captures six household/dietary preferences in a single
 * screen and persists them immediately via PATCH /api/users/me/settings on
 * advance.  The same data is editable on Profile/Preferences after onboarding;
 * the backend is the single source of truth.
 *
 * Fields:
 *  1. Household size (1–6 dropdown, default 1)
 *  2. Daily kcal target (preset chips + optional custom input)
 *  3. Dietary restrictions multi-select (20-flag UI, same as Profile/Diet tab)
 *  4. Shopping cadence: 7 days / 14 days / Custom
 *  5. Preferred shopping day (Mon–Sun, default Sunday)
 *  6. Forbidden ingredients typeahead (optional, skip-by-default)
 */

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ForbiddenIngredientsPicker } from '@/components/ForbiddenIngredientsPicker'
import type { DietaryPreferences } from '@/services/users'
import type { DietaryRestrictionKey } from '@/types'

// ── Dietary marker groups (mirrors Profile.tsx) ─────────────────────────────

interface DietaryItem {
  key: DietaryRestrictionKey
  label: string
  description: string
}

interface MarkerGroup {
  label: string
  key: string
  items: DietaryItem[]
}

// ── Preset kcal chips ────────────────────────────────────────────────────────

const KCAL_PRESETS = [1500, 1800, 2000, 2200, 2500] as const

// ── Cadence options ──────────────────────────────────────────────────────────

// KALMIO-426: add a 3-day preset for urban-single users who shop more
// frequently with smaller baskets. David persona feedback — buried in
// "Egyedi" the option felt like power-user territory; surfacing the
// short cycle keeps fresh-food shoppers on the happy path.
const CADENCE_PRESETS = [3, 7, 14] as const

// ── Weekday keys → ISO weekday 1 (Mon) – 7 (Sun) ────────────────────────────

const SHOPPING_DAYS = [
  { key: 'MONDAY', iso: 1 },
  { key: 'TUESDAY', iso: 2 },
  { key: 'WEDNESDAY', iso: 3 },
  { key: 'THURSDAY', iso: 4 },
  { key: 'FRIDAY', iso: 5 },
  { key: 'SATURDAY', iso: 6 },
  { key: 'SUNDAY', iso: 7 },
] as const

// ── Empty dietary preset ─────────────────────────────────────────────────────

const EMPTY_DIETARY: DietaryPreferences = {
  vegetarian: false, vegan: false, pescatarian: false,
  glutenFree: false, dairyFree: false, lactoseFree: false, milkProteinFree: false,
  eggFree: false, nutFree: false, peanutFree: false, soyFree: false,
  fishFree: false, shellfishFree: false, sesameFree: false,
  halal: false, kosher: false,
  keto: false, lowGi: false, lowFodmap: false, paleo: false,
}

// ── PreferencesStepValues ────────────────────────────────────────────────────

export interface PreferencesStepValues {
  householdSize: number
  kcalTarget: number
  dietary: DietaryPreferences
  cadenceDays: number
  shoppingDayOfWeek: number   // ISO 1–7
  forbiddenIngredientIds: string[]
  /** KALMIO-430: optional weekly budget in HUF. Null = no budget cap. */
  budgetMax: number | null
}

const DEFAULT_VALUES: PreferencesStepValues = {
  householdSize: 1,
  kcalTarget: 2000,
  dietary: EMPTY_DIETARY,
  cadenceDays: 7,
  shoppingDayOfWeek: 7,   // Sunday
  forbiddenIngredientIds: [],
  budgetMax: null,
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PreferencesStepProps {
  /** Prefilled values from the server (user may have partially completed). */
  initialValues?: Partial<PreferencesStepValues>
  /** Called when the user advances.  Parent handles the PATCH + navigation. */
  onAdvance: (values: PreferencesStepValues) => void
  /** Called when the user presses "back". */
  onBack: () => void
  /** True while the parent's mutation is in flight. */
  isSubmitting?: boolean
}

// ── Section heading ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-[#6B6460] uppercase tracking-wider mt-4 mb-2">
      {children}
    </p>
  )
}

// ── PreferencesStep ──────────────────────────────────────────────────────────

export function PreferencesStep({
  initialValues,
  onAdvance,
  onBack,
  isSubmitting = false,
}: PreferencesStepProps) {
  const { t } = useTranslation()

  // ── Local state ────────────────────────────────────────────────────────────

  const init: PreferencesStepValues = { ...DEFAULT_VALUES, ...initialValues }

  const [householdSize, setHouseholdSize] = useState(init.householdSize)
  const [kcalPreset, setKcalPreset] = useState<number | 'custom'>(
    KCAL_PRESETS.includes(init.kcalTarget as typeof KCAL_PRESETS[number]) ? init.kcalTarget : 'custom'
  )
  const [kcalCustom, setKcalCustom] = useState(
    KCAL_PRESETS.includes(init.kcalTarget as typeof KCAL_PRESETS[number]) ? '' : String(init.kcalTarget)
  )
  // Caller may pass `dietary: user?.dietaryPreferences ?? undefined` (a fresh
  // user has no preferences yet). Object spread propagates explicit-undefined
  // properties, so a `?? undefined` from upstream overwrites DEFAULT_VALUES.dietary.
  // Guard with one more coalesce — see Maria persona QA report 2026-05-25.
  const [dietary, setDietary] = useState<DietaryPreferences>(init.dietary ?? EMPTY_DIETARY)
  const [cadencePreset, setCadencePreset] = useState<7 | 14 | 'custom'>(
    CADENCE_PRESETS.includes(init.cadenceDays as typeof CADENCE_PRESETS[number]) ? (init.cadenceDays as 7 | 14) : 'custom'
  )
  const [cadenceCustom, setCadenceCustom] = useState(
    CADENCE_PRESETS.includes(init.cadenceDays as typeof CADENCE_PRESETS[number]) ? '' : String(init.cadenceDays)
  )
  const [shoppingDayOfWeek, setShoppingDayOfWeek] = useState(init.shoppingDayOfWeek)
  const [forbiddenIngredientIds, setForbiddenIngredientIds] = useState<string[]>(init.forbiddenIngredientIds)
  // KALMIO-430: optional weekly budget. Empty string ⇒ "no budget cap"; a
  // positive integer ⇒ budgetMax in HUF for the solver's soft constraint.
  const [budgetMax, setBudgetMax] = useState<string>(
    init.budgetMax != null ? String(init.budgetMax) : '',
  )

  // ── Dietary toggle ─────────────────────────────────────────────────────────

  const toggleDietary = useCallback((key: DietaryRestrictionKey) => {
    setDietary(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // ── Validation & derived values ────────────────────────────────────────────

  const resolvedKcal: number = (() => {
    if (kcalPreset !== 'custom') return kcalPreset
    const n = parseInt(kcalCustom, 10)
    return isNaN(n) ? DEFAULT_VALUES.kcalTarget : n
  })()

  const resolvedCadence: number = (() => {
    if (cadencePreset !== 'custom') return cadencePreset
    const n = parseInt(cadenceCustom, 10)
    return isNaN(n) ? 7 : n
  })()

  const kcalError: string | null = (() => {
    if (kcalPreset !== 'custom') return null
    const n = parseInt(kcalCustom, 10)
    if (isNaN(n) || n < 1000 || n > 5000) return t('onboarding.preferencesStep.kcalError')
    return null
  })()

  const cadenceError: string | null = (() => {
    if (cadencePreset !== 'custom') return null
    const n = parseInt(cadenceCustom, 10)
    if (isNaN(n) || n < 1 || n > 14) return t('onboarding.preferencesStep.cadenceError')
    return null
  })()

  const householdError: string | null =
    householdSize < 1 || householdSize > 6 ? t('onboarding.preferencesStep.householdError') : null

  // KALMIO-430: budget is optional. Empty input = no cap. Any value must be
  // a positive integer at or above 1 000 Ft/week (lower is unrealistic for
  // even a single person) and at or below 500 000 Ft/week (sanity ceiling).
  const resolvedBudget: number | null = (() => {
    const trimmed = budgetMax.trim()
    if (trimmed === '') return null
    const n = parseInt(trimmed, 10)
    return isNaN(n) ? null : n
  })()
  const budgetError: string | null = (() => {
    const trimmed = budgetMax.trim()
    if (trimmed === '') return null
    const n = parseInt(trimmed, 10)
    if (isNaN(n) || n < 1000 || n > 500000) return t('onboarding.preferencesStep.budgetError')
    return null
  })()

  const canAdvance = !kcalError && !cadenceError && !householdError && !budgetError

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleAdvance = useCallback(() => {
    if (!canAdvance) return
    onAdvance({
      householdSize,
      kcalTarget: resolvedKcal,
      dietary,
      cadenceDays: resolvedCadence,
      shoppingDayOfWeek,
      forbiddenIngredientIds,
      budgetMax: resolvedBudget,
    })
  }, [canAdvance, householdSize, resolvedKcal, dietary, resolvedCadence, shoppingDayOfWeek, forbiddenIngredientIds, resolvedBudget, onAdvance])

  // ── Dietary marker groups ──────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col gap-1 py-5"
      data-testid="step-preferences"
    >
      {/* Page heading */}
      <div className="text-center px-2 mb-2">
        <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug mb-2">
          {t('onboarding.preferencesStep.title')}
        </h2>
        <p className="text-sm text-[#6B6460] max-w-xs mx-auto leading-relaxed">
          {t('onboarding.preferencesStep.body')}
        </p>
      </div>

      {/* ── 1. Household size ─────────────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.householdLabel')}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button
            key={n}
            type="button"
            aria-pressed={householdSize === n}
            onClick={() => setHouseholdSize(n)}
            className={[
              'h-10 w-10 rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
              householdSize === n
                ? 'border-[#F28C28] bg-[#F28C28] text-white'
                : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
        {householdError && (
          <p className="w-full text-xs text-red-600 mt-1" role="alert">{householdError}</p>
        )}
      </div>

      {/* ── 2. Daily kcal target ──────────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.kcalLabel')}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {KCAL_PRESETS.map(val => (
          <button
            key={val}
            type="button"
            aria-pressed={kcalPreset === val}
            onClick={() => setKcalPreset(val)}
            className={[
              'h-9 px-3 rounded-[10px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
              kcalPreset === val
                ? 'border-[#F28C28] bg-[#F28C28] text-white'
                : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
            ].join(' ')}
          >
            {val}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={kcalPreset === 'custom'}
          onClick={() => setKcalPreset('custom')}
          className={[
            'h-9 px-3 rounded-[10px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
            kcalPreset === 'custom'
              ? 'border-[#F28C28] bg-[#F28C28] text-white'
              : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
          ].join(' ')}
        >
          {t('onboarding.preferencesStep.kcalCustom')}
        </button>
      </div>
      {kcalPreset === 'custom' && (
        <div className="mt-1">
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            max={5000}
            step={50}
            value={kcalCustom}
            onChange={e => setKcalCustom(e.target.value)}
            placeholder="pl. 1700"
            aria-label={t('onboarding.preferencesStep.kcalCustomAriaLabel')}
            className="h-10 w-full max-w-[160px] rounded-[10px] border border-gray-300 px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1 placeholder:text-gray-400"
          />
          {kcalError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{kcalError}</p>
          )}
        </div>
      )}

      {/* ── 3. Dietary restrictions ───────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.dietaryLabel')}</SectionLabel>
      <div className="space-y-3">
        {markerGroups.map(group => (
          <div key={group.key}>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map(item => {
                const active = dietary[item.key]
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    title={item.description}
                    onClick={() => toggleDietary(item.key)}
                    className={[
                      'h-8 px-3 rounded-full border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
                      active
                        ? 'border-[#E8956D] bg-[#FFF5F0] text-[#C0622A]'
                        : 'border-gray-200 bg-white text-[#6B6460] hover:border-[#E8956D]',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. Shopping cadence ───────────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.cadenceLabel')}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {CADENCE_PRESETS.map(val => (
          <button
            key={val}
            type="button"
            aria-pressed={cadencePreset === val}
            onClick={() => setCadencePreset(val)}
            className={[
              'h-9 px-3 rounded-[10px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
              cadencePreset === val
                ? 'border-[#F28C28] bg-[#F28C28] text-white'
                : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
            ].join(' ')}
          >
            {t('onboarding.preferencesStep.cadenceDays', { count: val })}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={cadencePreset === 'custom'}
          onClick={() => setCadencePreset('custom')}
          className={[
            'h-9 px-3 rounded-[10px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
            cadencePreset === 'custom'
              ? 'border-[#F28C28] bg-[#F28C28] text-white'
              : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
          ].join(' ')}
        >
          {t('onboarding.preferencesStep.cadenceCustom')}
        </button>
      </div>
      {cadencePreset === 'custom' && (
        <div className="mt-1">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={14}
            value={cadenceCustom}
            onChange={e => setCadenceCustom(e.target.value)}
            placeholder="pl. 10"
            aria-label={t('onboarding.preferencesStep.cadenceCustomAriaLabel')}
            className="h-10 w-full max-w-[120px] rounded-[10px] border border-gray-300 px-3 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#F28C28] focus:ring-offset-1 placeholder:text-gray-400"
          />
          {cadenceError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{cadenceError}</p>
          )}
        </div>
      )}

      {/* ── 5. Preferred shopping day ─────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.shoppingDayLabel')}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {SHOPPING_DAYS.map(({ key, iso }) => (
          <button
            key={key}
            type="button"
            aria-pressed={shoppingDayOfWeek === iso}
            onClick={() => setShoppingDayOfWeek(iso)}
            className={[
              'h-9 px-3 rounded-[10px] border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2',
              shoppingDayOfWeek === iso
                ? 'border-[#F28C28] bg-[#F28C28] text-white'
                : 'border-gray-300 bg-white text-[#1A1A1A] hover:border-[#F28C28]',
            ].join(' ')}
          >
            {t(`common.weekdays.${key.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* ── 6. Weekly budget (optional) ──────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.budgetLabel')}</SectionLabel>
      <p className="text-xs text-[#6B6460] -mt-1 mb-1">
        {t('onboarding.preferencesStep.budgetHint')}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1000}
          max={500000}
          step={500}
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          aria-label={t('onboarding.preferencesStep.budgetLabel')}
          aria-invalid={budgetError != null}
          aria-describedby={budgetError ? 'budget-error' : undefined}
          placeholder={t('onboarding.preferencesStep.budgetPlaceholder')}
          className="h-10 w-32 rounded-[10px] border border-gray-300 bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F28C28]/40 focus:border-[#F28C28] transition-colors"
        />
        <span className="text-sm text-[#6B6460]">{t('onboarding.preferencesStep.budgetSuffix')}</span>
      </div>
      {budgetError && (
        <p id="budget-error" className="text-xs text-red-600 mt-1">
          {budgetError}
        </p>
      )}

      {/* ── 7. Forbidden ingredients ──────────────────────────────────────── */}
      <SectionLabel>{t('onboarding.preferencesStep.forbiddenLabel')}</SectionLabel>
      <p className="text-xs text-[#6B6460] -mt-1 mb-1">
        {t('onboarding.preferencesStep.forbiddenHint')}
      </p>
      <ForbiddenIngredientsPicker
        value={forbiddenIngredientIds}
        onChange={setForbiddenIngredientIds}
      />

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAdvance}
          disabled={!canAdvance || isSubmitting}
          className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {isSubmitting
            ? t('onboarding.preferencesStep.saving')
            : t('onboarding.preferencesStep.cta')}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
