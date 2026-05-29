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
 * - A circular SVG donut chart shows the split with draggable spoke handles
 *   at segment boundaries.
 * - Per-meal kcal displayed as integer; +/− buttons adjust in 50-kcal increments
 *   with proportional redistribution so the total always equals dailyKcal.
 * - "Mentés" calls onAdvance({ mealCalorieTargets: Record<string,number> }).
 *   "Kihagyom" calls onSkip without persisting anything.
 * - Mobile-first: 375px baseline; single-column layout on mobile, two-column
 *   (chart left, controls right) on md+.
 *
 * Accessibility:
 * - Each toggle is a <button role="switch" aria-checked>.
 * - +/− buttons have aria-label with meal name and new value for screen readers.
 * - The donut SVG is aria-hidden; the aria-label on the container lists the
 *   distribution in text form for assistive technologies.
 * - Drag handles are aria-hidden.
 *
 * The component is a controlled sub-step: the parent (OnboardingShell) owns the
 * persist call via onAdvance. All local state is ephemeral.
 */

import { useId, useState, useCallback, useMemo, useRef } from 'react'
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

// ── Proportional redistribution helpers ─────────────────────────────────────

/**
 * Distribute `totalDelta` proportionally across `others` by their current kcal
 * weight.  Each meal in `others` must stay ≥ MIN_KCAL.
 *
 * Returns a new partial map with the updated values for the `others` meals.
 * The caller is responsible for applying the result to the full kcalMap.
 *
 * Algorithm:
 *  1. Attempt proportional distribution.
 *  2. Any meal that would drop below MIN_KCAL is clamped; its residual is
 *     re-distributed to the remaining unclamped meals.
 *  3. After one pass we stop (convergence is guaranteed because each clamping
 *     step reduces the set of unclamped meals until all are ≥ MIN_KCAL or the
 *     delta is exhausted).
 *  4. Due to integer rounding the total may be off by ±1; the remainder is
 *     added to / subtracted from the largest unclamped meal to stay exact.
 */
function distributeProportionally(
  others: MealTypeKey[],
  currentMap: Record<MealTypeKey, number>,
  totalDelta: number,
): Partial<Record<MealTypeKey, number>> {
  if (others.length === 0 || totalDelta === 0) return {}

  const result: Partial<Record<MealTypeKey, number>> = {}
  let remaining = [...others]
  let remainingDelta = totalDelta

  // Iterate until all delta is distributed or every meal is clamped.
  while (Math.abs(remainingDelta) > 0 && remaining.length > 0) {
    const totalWeight = remaining.reduce((s, m) => s + (result[m] ?? currentMap[m]), 0)
    if (totalWeight <= 0) break

    let actualDistributed = 0
    const clamped: MealTypeKey[] = []
    const unclamped: MealTypeKey[] = []

    for (const m of remaining) {
      const cur = result[m] ?? currentMap[m]
      const weight = cur / totalWeight
      const proposed = Math.round(cur + remainingDelta * weight)
      if (proposed < MIN_KCAL) {
        result[m] = MIN_KCAL
        actualDistributed += MIN_KCAL - cur
        clamped.push(m)
      } else {
        result[m] = proposed
        actualDistributed += proposed - cur
        unclamped.push(m)
      }
    }

    remainingDelta -= actualDistributed
    remaining = unclamped

    // If after clamping there's nothing left to distribute, stop.
    if (remaining.length === 0) break

    // Rounding deadlock: unclamped meals exist but every proposed change rounded
    // to zero (|remainingDelta| too small to move any meal by ≥ 0.5 kcal).
    // Force the residual onto the largest unclamped meal and exit.
    if (actualDistributed === 0 && remaining.length > 0) {
      const largest = remaining.reduce((a, b) =>
        (result[a] ?? currentMap[a]) >= (result[b] ?? currentMap[b]) ? a : b
      )
      const cur = result[largest] ?? currentMap[largest]
      const adjusted = cur + remainingDelta
      if (adjusted >= MIN_KCAL) result[largest] = adjusted
      break
    }
  }

  // Fix integer rounding drift: add residual to the largest unclamped meal.
  const totalAfter = others.reduce((s, m) => s + (result[m] ?? currentMap[m]), 0)
  const expectedAfter = others.reduce((s, m) => s + currentMap[m], 0) + totalDelta
  const drift = expectedAfter - totalAfter
  if (drift !== 0 && remaining.length > 0) {
    const largest = remaining.reduce((a, b) =>
      (result[a] ?? currentMap[a]) >= (result[b] ?? currentMap[b]) ? a : b
    )
    const cur = result[largest] ?? currentMap[largest]
    const adjusted = cur + drift
    if (adjusted >= MIN_KCAL) {
      result[largest] = adjusted
    }
  }

  return result
}

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

// ── Pointer angle helper ────────────────────────────────────────────────────

/** Returns the angle in degrees (0 = top, clockwise) for a pointer event relative to SVG centre. */
function pointerAngleDeg(
  e: React.PointerEvent<SVGSVGElement>,
  svgRef: React.RefObject<SVGSVGElement | null>,
): number {
  const svg = svgRef.current
  if (!svg) return 0
  const rect = svg.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  // atan2 returns angle from positive x-axis; we want 0 = top (negative y), clockwise.
  const rad = Math.atan2(dy, dx) + Math.PI / 2
  const deg = (rad * 180) / Math.PI
  return ((deg % 360) + 360) % 360
}

// ── Sub-component: distribution donut ─────────────────────────────────────

interface DragState {
  /** Index into the `boundaries` array — the boundary between meals[index-1] and meals[index]. */
  boundaryIndex: number
  /** The two active meals on each side of the boundary. */
  mealBefore: MealTypeKey
  mealAfter: MealTypeKey
  /** Angle in degrees at pointer-down. */
  startAngleDeg: number
  /** Cumulative kcal delta applied so far in this drag. */
  appliedDeltaKcal: number
}

interface DistributionDonutProps {
  meals: MealTypeKey[]
  kcalMap: Record<MealTypeKey, number>
  enabledMap: Record<MealTypeKey, boolean>
  totalKcal: number
  size?: number
  strokeWidth?: number
  onDragAdjust: (mealBefore: MealTypeKey, mealAfter: MealTypeKey, deltaKcal: number) => void
}

function DistributionDonut({
  meals,
  kcalMap,
  enabledMap,
  totalKcal,
  size = 160,
  strokeWidth = 18,
  onDragAdjust,
}: DistributionDonutProps) {
  const id = useId()
  const cx = size / 2
  const cy = size / 2
  const r  = (size - strokeWidth) / 2
  const GAP = 4
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const safe = totalKcal > 0 ? totalKcal : 1

  // Build segments for active meals only.
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

  // Compute boundary points between adjacent segments (on the outer rim).
  // A boundary at angle θ sits between segments[i] and segments[i+1].
  const handleRadius = r + strokeWidth / 2
  const boundaries = segments.map((seg, i) => {
    const nextSeg = segments[(i + 1) % segments.length]
    // The boundary angle is the midpoint between the end of this segment and
    // start of next — i.e. the nextCursor angle of the current segment.
    const angleDeg = seg.nextCursor
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180
    return {
      angleDeg,
      x: cx + handleRadius * Math.cos(toRad(angleDeg)),
      y: cy + handleRadius * Math.sin(toRad(angleDeg)),
      mealBefore: seg.meal,
      mealAfter: nextSeg.meal,
    }
  }).filter((_, i) => segments.length > 1 && i < segments.length - 1 + (segments.length > 1 ? 1 : 0))

  // Only render boundaries between distinct adjacent segments.
  const visibleBoundaries = boundaries.filter(b => b.mealBefore !== b.mealAfter)

  function handlePointerDown(e: React.PointerEvent<SVGCircleElement>, idx: number) {
    e.stopPropagation()
    ;(e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId)
    const b = visibleBoundaries[idx]
    dragRef.current = {
      boundaryIndex: idx,
      mealBefore: b.mealBefore,
      mealAfter: b.mealAfter,
      startAngleDeg: pointerAngleDeg(e as unknown as React.PointerEvent<SVGSVGElement>, svgRef),
      appliedDeltaKcal: 0,
    }
  }

  function handleSvgPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current
    if (!drag) return

    const currentAngleDeg = pointerAngleDeg(e, svgRef)
    let deltaDeg = currentAngleDeg - drag.startAngleDeg
    // Normalise to [-180, 180] so we handle wrap-around at 360/0.
    if (deltaDeg > 180) deltaDeg -= 360
    if (deltaDeg < -180) deltaDeg += 360

    const rawDeltaKcal = Math.round((deltaDeg / 360) * totalKcal)
    const incrementalDelta = rawDeltaKcal - drag.appliedDeltaKcal

    if (incrementalDelta !== 0) {
      onDragAdjust(drag.mealBefore, drag.mealAfter, incrementalDelta)
      drag.appliedDeltaKcal += incrementalDelta
    }
  }

  function handleSvgPointerUp() {
    dragRef.current = null
  }

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      role="presentation"
      style={{ overflow: 'visible', touchAction: 'none' }}
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerCancel={handleSvgPointerUp}
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

      {/* Drag handles at segment boundaries */}
      {visibleBoundaries.map((b, i) => (
        <circle
          key={i}
          cx={b.x}
          cy={b.y}
          r={7}
          fill="white"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={1.5}
          aria-hidden="true"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={(e) => handlePointerDown(e, i)}
        />
      ))}
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

  // Build initial kcal map from persisted targets or default percentages.
  // If persisted targets don't sum to `budget` (can happen when the user's
  // daily kcal target changed since they last saved, or due to the drag-handle
  // inflation bug), rescale them proportionally so the total always equals budget.
  const buildInitialKcal = (): Record<MealTypeKey, number> => {
    if (initialTargets && Object.keys(initialTargets).length > 0) {
      const raw: Record<MealTypeKey, number> = {} as Record<MealTypeKey, number>
      for (const m of MEAL_TYPE_ORDER) {
        raw[m] = initialTargets[m] != null
          ? Math.round(initialTargets[m])
          : Math.round((DEFAULT_PERCENTAGES[m] / 100) * budget)
      }
      const sum = MEAL_TYPE_ORDER.reduce((s, m) => s + raw[m], 0)
      if (sum > 0 && Math.abs(sum - budget) > 1) {
        const scale = budget / sum
        const result = {} as Record<MealTypeKey, number>
        for (const m of MEAL_TYPE_ORDER) {
          result[m] = Math.max(MIN_KCAL, Math.round(raw[m] * scale))
        }
        // Correct rounding/clamping drift: subtract overshoot from the largest
        // meal so the total is exactly budget.
        const overshoot = MEAL_TYPE_ORDER.reduce((s, m) => s + result[m], 0) - budget
        if (overshoot !== 0) {
          const largest = MEAL_TYPE_ORDER.reduce((a, b) => result[a] >= result[b] ? a : b)
          const adjusted = result[largest] - overshoot
          result[largest] = adjusted >= MIN_KCAL ? adjusted : MIN_KCAL
        }
        return result
      }
      return raw
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

  // ── Toggle a meal on/off with proportional redistribution ─────────────────
  // After every toggle the active-meal totals are normalized to sum exactly to
  // `budget`, so drift cannot accumulate across multiple on/off cycles.
  //
  // OFF: zero out the meal, scale remaining active meals proportionally to budget.
  // ON:  seed the new meal with budget/newCount, then normalize all active meals
  //      (including the new one) proportionally to budget.
  const toggleMeal = useCallback((meal: MealTypeKey) => {
    setEnabledMap((prevEnabled) => {
      const isCurrentlyEnabled = prevEnabled[meal]
      const nextEnabled = { ...prevEnabled, [meal]: !isCurrentlyEnabled }
      const newActive = MEAL_TYPE_ORDER.filter((m) => nextEnabled[m])

      setKcalMap((prevKcal) => {
        // Can't disable the last active meal.
        if (isCurrentlyEnabled && newActive.length === 0) return prevKcal

        // Build seed weights: existing meals keep their current kcal;
        // a newly enabled meal starts with an equal share so it doesn't
        // dominate before normalization.
        const seedWeights = { ...prevKcal }
        if (!isCurrentlyEnabled) {
          seedWeights[meal] = Math.round(budget / newActive.length)
        }

        // Normalize all newActive meals to sum exactly to `budget`,
        // preserving their relative proportions.
        const totalWeight = newActive.reduce((s, m) => s + seedWeights[m], 0)
        if (totalWeight <= 0) return prevKcal

        const next = { ...prevKcal }
        let allocated = 0
        newActive.forEach((m, i) => {
          if (i === newActive.length - 1) {
            next[m] = Math.max(MIN_KCAL, budget - allocated)
          } else {
            const v = Math.max(MIN_KCAL, Math.round((seedWeights[m] / totalWeight) * budget))
            next[m] = v
            allocated += v
          }
        })
        // Zero out the disabled meal.
        if (isCurrentlyEnabled) next[meal] = 0

        return next
      })

      return nextEnabled
    })
  }, [budget])

  // ── Adjust a meal's kcal by ±STEP_KCAL with proportional redistribution ───
  // When you increase one meal by delta kcal, subtract that delta
  // proportionally from the other active enabled meals.
  const adjustKcal = useCallback((meal: MealTypeKey, delta: number) => {
    setKcalMap((prev) => {
      const current = prev[meal]
      const newKcal = Math.max(MIN_KCAL, current + delta)
      const actualDelta = newKcal - current
      if (actualDelta === 0) return prev

      const others = MEAL_TYPE_ORDER.filter(
        (m) => m !== meal && enabledMap[m]
      )
      if (others.length === 0) return prev

      const redistribution = distributeProportionally(others, prev, -actualDelta)
      const next = { ...prev, [meal]: newKcal }
      for (const [m, v] of Object.entries(redistribution)) {
        next[m as MealTypeKey] = v
      }
      return next
    })
  }, [enabledMap])

  // ── Drag handle: adjust the boundary between two adjacent meals ───────────
  // Transfer kcal from one side to the other, clamped by MIN_KCAL on both sides.
  // Total kcal is always preserved: the actual transfer is the minimum of what
  // mealBefore can give (when deltaKcal < 0) or what mealAfter can give (when > 0).
  const handleDragAdjust = useCallback((
    mealBefore: MealTypeKey,
    mealAfter: MealTypeKey,
    deltaKcal: number,
  ) => {
    setKcalMap((prev) => {
      if (deltaKcal > 0) {
        // mealBefore grows, mealAfter shrinks — limited by how much mealAfter can give up
        const canGive = prev[mealAfter] - MIN_KCAL
        const actual = Math.min(deltaKcal, canGive)
        if (actual <= 0) return prev
        return { ...prev, [mealBefore]: prev[mealBefore] + actual, [mealAfter]: prev[mealAfter] - actual }
      } else {
        // mealBefore shrinks, mealAfter grows — limited by how much mealBefore can give up
        const canGive = prev[mealBefore] - MIN_KCAL
        const actual = Math.min(-deltaKcal, canGive)
        if (actual <= 0) return prev
        return { ...prev, [mealBefore]: prev[mealBefore] - actual, [mealAfter]: prev[mealAfter] + actual }
      }
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
            onDragAdjust={handleDragAdjust}
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
