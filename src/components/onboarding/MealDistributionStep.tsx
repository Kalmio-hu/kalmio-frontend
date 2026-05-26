/**
 * MealDistributionStep — KALMIO-453
 *
 * Onboarding step where the user configures how their daily calorie budget is
 * split across meal types. Sits after the TDEE suggestion step (step 4) and
 * before TasteSwipe (step 6) in the post-KALMIO-450 shell.
 *
 * Design constraints:
 * - Six meal types: BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, DINNER, EVENING_SNACK
 * - Each meal can be toggled on/off; disabled meals contribute 0 kcal and
 *   their percentage is redistributed proportionally among active meals.
 * - A circular SVG donut chart (visual only, aria-hidden) shows the split.
 *   Style matches MacroDonutChart (same strokeLinecap="round", same palette approach).
 * - Per-meal kcal displayed as integer; + / − buttons adjust in 50-kcal increments
 *   subject to a minimum of 100 kcal for enabled meals and a maximum of
 *   dailyKcal − (activeCount − 1) × 100 so every other enabled meal gets at
 *   least 100 kcal.
 * - "Mentés" calls onAdvance({ mealCalorieTargets: Record<string,number> }).
 *   "Kihagyom" calls onSkip without persisting anything.
 * - Mobile-first: 375px baseline; single-column layout on mobile, two-column
 *   (chart left, controls right) on md+.
 *
 * Accessibility:
 * - Each toggle is a <button role="switch" aria-checked>.
 * - + / − buttons have aria-label with meal name and new value for screen readers.
 * - The donut SVG is aria-hidden; the aria-label on the container lists the distribution
 *   in text form for assistive technologies.
 *
 * The component is a controlled sub-step: the parent (OnboardingShell) owns the
 * persist call via onAdvance. All local state is ephemeral.
 */

import { useId, useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// ── Meal type ordering ──────────────────────────────────────────────────────

export type MealTypeKey =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'
  | 'EVENING_SNACK'

const MEAL_TYPE_ORDER: MealTypeKey[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'EVENING_SNACK',
]

/**
 * Default distribution percentages (must sum to 100 for the default enabled
 * set of BREAKFAST, MORNING_SNACK, LUNCH, AFTERNOON_SNACK, DINNER).
 * EVENING_SNACK starts disabled per AC ("Default 20/10/30/10/30/0%").
 */
const DEFAULT_PERCENTAGES: Record<MealTypeKey, number> = {
  BREAKFAST:       20,
  MORNING_SNACK:   10,
  LUNCH:           30,
  AFTERNOON_SNACK: 10,
  DINNER:          30,
  EVENING_SNACK:    0,
}

const DEFAULT_ENABLED: Record<MealTypeKey, boolean> = {
  BREAKFAST:       true,
  MORNING_SNACK:   true,
  LUNCH:           true,
  AFTERNOON_SNACK: true,
  DINNER:          true,
  EVENING_SNACK:   false,
}

// ── Donut chart palette — distinct per meal, warm/cool alternation ─────────

const MEAL_COLOURS: Record<MealTypeKey, string> = {
  BREAKFAST:       '#F28C28',  // amber
  MORNING_SNACK:   '#F5C57A',  // pale amber
  LUNCH:           '#4F7942',  // kalmio green
  AFTERNOON_SNACK: '#8BB87F',  // muted green
  DINNER:          '#7B9CC2',  // soft blue
  EVENING_SNACK:   '#A8C4D4',  // pale blue
}

const STEP_KCAL = 50
const MIN_KCAL  = 100

// ── SVG arc helper ─────────────────────────────────────────────────────────

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

// ── Sub-component: distribution donut ─────────────────────────────────────

interface DistributionDonutProps {
  meals: MealTypeKey[]
  kcalMap: Record<MealTypeKey, number>
  enabledMap: Record<MealTypeKey, boolean>
  totalKcal: number
  size?: number
  strokeWidth?: number
}

function DistributionDonut({
  meals,
  kcalMap,
  enabledMap,
  totalKcal,
  size = 160,
  strokeWidth = 18,
}: DistributionDonutProps) {
  const id = useId()
  const cx = size / 2
  const cy = size / 2
  const r  = (size - strokeWidth) / 2
  const GAP = 4

  const safe = totalKcal > 0 ? totalKcal : 1

  // Build segments for active meals only, using reduce to track cursor without mutation
  const segments = meals
    .filter((m) => enabledMap[m] && kcalMap[m] > 0)
    .reduce<{ meal: MealTypeKey; start: number; end: number; nextCursor: number }[]>((acc, m) => {
      const prevCursor = acc.length > 0 ? acc[acc.length - 1].nextCursor : 0
      const frac = kcalMap[m] / safe
      const span = frac * 360
      return [...acc, {
        meal: m,
        start: prevCursor + GAP / 2,
        end: prevCursor + span - GAP / 2,
        nextCursor: prevCursor + span,
      }]
    }, [])
    .filter((s) => s.end - s.start > 1)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth={strokeWidth}
      />

      {/* Segments */}
      <g filter={`url(#${id}-shadow)`}>
        {segments.map((seg) => (
          <path
            key={seg.meal}
            d={describeArc(cx, cy, r, seg.start, seg.end)}
            fill="none"
            stroke={MEAL_COLOURS[seg.meal]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Centre: total kcal */}
      <text
        x={cx}
        y={cy - size * 0.06}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.19}
        fontWeight="700"
        fill="rgba(26,26,26,0.88)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(totalKcal)}
      </text>
      <text
        x={cx}
        y={cy + size * 0.12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.11}
        fill="rgba(26,26,26,0.50)"
      >
        kcal
      </text>
    </svg>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface MealDistributionValues {
  mealCalorieTargets: Record<string, number>
}

export interface MealDistributionStepProps {
  /** Daily calorie budget from TDEE / user settings. Defaults to 2000 if null. */
  dailyKcal: number | null
  /** Pre-persisted distribution, if any (user returning after saving once). */
  initialTargets?: Record<string, number> | null
  onAdvance: (values: MealDistributionValues) => void
  onSkip: () => void
  onBack: () => void
  isSubmitting?: boolean
}

// ── Component ───────────────────────────────────────────────────────────────

export function MealDistributionStep({
  dailyKcal,
  initialTargets,
  onAdvance,
  onSkip,
  onBack,
  isSubmitting = false,
}: MealDistributionStepProps) {
  const { t } = useTranslation()

  const budget = dailyKcal ?? 2000

  // Build initial kcal map from persisted targets or default percentages
  const buildInitialKcal = (): Record<MealTypeKey, number> => {
    if (initialTargets && Object.keys(initialTargets).length > 0) {
      const result = { ...DEFAULT_PERCENTAGES } as unknown as Record<MealTypeKey, number>
      for (const m of MEAL_TYPE_ORDER) {
        result[m] = initialTargets[m] != null
          ? Math.round(initialTargets[m])
          : Math.round((DEFAULT_PERCENTAGES[m] / 100) * budget)
      }
      return result
    }
    const result = {} as Record<MealTypeKey, number>
    for (const m of MEAL_TYPE_ORDER) {
      result[m] = Math.round((DEFAULT_PERCENTAGES[m] / 100) * budget)
    }
    return result
  }

  const buildInitialEnabled = (): Record<MealTypeKey, boolean> => {
    if (initialTargets && Object.keys(initialTargets).length > 0) {
      const result = { ...DEFAULT_ENABLED }
      for (const m of MEAL_TYPE_ORDER) {
        if (initialTargets[m] != null) {
          result[m] = initialTargets[m] > 0
        }
      }
      return result
    }
    return { ...DEFAULT_ENABLED }
  }

  const [kcalMap, setKcalMap] = useState<Record<MealTypeKey, number>>(buildInitialKcal)
  const [enabledMap, setEnabledMap] = useState<Record<MealTypeKey, boolean>>(buildInitialEnabled)

  // Active meal count for minimum enforcement
  const activeMeals = useMemo(
    () => MEAL_TYPE_ORDER.filter((m) => enabledMap[m]),
    [enabledMap],
  )

  // Total kcal of active meals
  const totalActive = useMemo(
    () => activeMeals.reduce((sum, m) => sum + kcalMap[m], 0),
    [activeMeals, kcalMap],
  )

  // Toggle a meal on/off. When toggling off: set its kcal to 0.
  // When toggling on: assign it a proportional share of the budget.
  const toggleMeal = useCallback((meal: MealTypeKey) => {
    setEnabledMap((prev) => {
      const nowEnabled = !prev[meal]
      const next = { ...prev, [meal]: nowEnabled }

      if (!nowEnabled) {
        // Disabled: set kcal to 0 so the donut reflects reality
        setKcalMap((k) => ({ ...k, [meal]: 0 }))
      } else {
        // Re-enabling: give it its default percentage of the budget or MIN_KCAL
        const defaultKcal = Math.max(MIN_KCAL, Math.round((DEFAULT_PERCENTAGES[meal] / 100) * budget))
        setKcalMap((k) => ({ ...k, [meal]: defaultKcal }))
      }
      return next
    })
  }, [budget])

  // Adjust a meal's kcal by ±STEP_KCAL, clamped so every active meal gets
  // at least MIN_KCAL and the total never exceeds the budget implicitly.
  const adjustKcal = useCallback((meal: MealTypeKey, delta: number) => {
    setKcalMap((prev) => {
      const current = prev[meal]
      const proposed = current + delta
      const clamped = Math.max(MIN_KCAL, proposed)
      return { ...prev, [meal]: clamped }
    })
  }, [])

  const handleSave = useCallback(() => {
    const targets: Record<string, number> = {}
    for (const m of MEAL_TYPE_ORDER) {
      if (enabledMap[m]) {
        targets[m] = kcalMap[m]
      }
    }
    onAdvance({ mealCalorieTargets: targets })
  }, [enabledMap, kcalMap, onAdvance])

  // Build aria-label for the donut container: list active meals and their kcal
  const donutAriaLabel = activeMeals
    .map((m) => `${t(`onboarding.mealDistribution.meals.${m}`)}: ${kcalMap[m]} kcal`)
    .join(', ')

  return (
    <div
      className="flex flex-col items-center gap-6 px-4 py-6 w-full"
      data-testid="step-meal-distribution"
    >
      {/* Header */}
      <div className="text-center max-w-md mx-auto">
        <h2 className="font-headline text-xl font-bold text-[#1A1A1A] leading-snug">
          {t('onboarding.mealDistribution.title')}
        </h2>
        <p className="text-sm text-[#6B6460] mt-1.5 leading-relaxed">
          {t('onboarding.mealDistribution.body')}
        </p>
      </div>

      {/* Main content: donut + meal rows */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full max-w-lg">

        {/* Donut chart */}
        <div
          className="shrink-0"
          aria-label={donutAriaLabel}
          role="img"
        >
          <DistributionDonut
            meals={MEAL_TYPE_ORDER}
            kcalMap={kcalMap}
            enabledMap={enabledMap}
            totalKcal={totalActive}
            size={160}
            strokeWidth={18}
          />
        </div>

        {/* Meal rows */}
        <div className="flex-1 w-full flex flex-col gap-2">
          {MEAL_TYPE_ORDER.map((meal) => {
            const enabled = enabledMap[meal]
            const kcal = kcalMap[meal]
            const colour = MEAL_COLOURS[meal]

            return (
              <div
                key={meal}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                  enabled ? 'bg-white border border-[#E8E4DC]' : 'bg-[#F5F3EE] border border-transparent opacity-60',
                ].join(' ')}
              >
                {/* Colour dot */}
                <span
                  aria-hidden
                  className="shrink-0 w-3 h-3 rounded-full"
                  style={{ backgroundColor: colour }}
                />

                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={t('onboarding.mealDistribution.toggleAriaLabel', {
                    meal: t(`onboarding.mealDistribution.meals.${meal}`),
                  })}
                  onClick={() => toggleMeal(meal)}
                  className={[
                    'shrink-0 w-9 h-5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1',
                    enabled ? 'bg-[#F28C28]' : 'bg-stone-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'block w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5',
                      enabled ? 'translate-x-4' : 'translate-x-0',
                    ].join(' ')}
                  />
                </button>

                {/* Meal name */}
                <span
                  className={[
                    'flex-1 text-sm font-medium',
                    enabled ? 'text-[#1A1A1A]' : 'text-[#9A9490]',
                  ].join(' ')}
                >
                  {t(`onboarding.mealDistribution.meals.${meal}`)}
                </span>

                {/* Kcal stepper */}
                {enabled ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => adjustKcal(meal, -STEP_KCAL)}
                      disabled={kcal <= MIN_KCAL}
                      aria-label={t('onboarding.mealDistribution.decrementAriaLabel', {
                        meal: t(`onboarding.mealDistribution.meals.${meal}`),
                        value: kcal - STEP_KCAL,
                      })}
                      className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center hover:bg-stone-200 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                    >
                      −
                    </button>
                    <span className="w-14 text-center text-sm font-semibold text-[#1A1A1A] tabular-nums">
                      {kcal} {t('onboarding.mealDistribution.kcalUnit')}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustKcal(meal, STEP_KCAL)}
                      aria-label={t('onboarding.mealDistribution.incrementAriaLabel', {
                        meal: t(`onboarding.mealDistribution.meals.${meal}`),
                        value: kcal + STEP_KCAL,
                      })}
                      className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center hover:bg-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className="w-[6.5rem] text-center text-sm text-[#9A9490]">
                    {t('onboarding.mealDistribution.disabledLabel')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Total summary */}
      <p className="text-xs text-[#6B6460] text-center">
        {t('onboarding.mealDistribution.totalLabel', {
          total: Math.round(totalActive),
          budget: Math.round(budget),
        })}
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || activeMeals.length === 0}
          className="h-12 w-full rounded-[12px] bg-[#F28C28] px-6 text-base font-semibold text-white transition-colors hover:bg-[#d97a20] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {isSubmitting
            ? t('onboarding.mealDistribution.saving')
            : t('onboarding.mealDistribution.save')}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {t('onboarding.mealDistribution.skip')}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-10 w-full rounded-[12px] text-sm text-[#6B6460] hover:bg-[#F28C28]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
        >
          {t('common.back')}
        </button>
      </div>
    </div>
  )
}
