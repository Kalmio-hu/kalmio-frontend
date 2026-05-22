/**
 * TargetDonut — single-macro donut showing actual / target progress.
 *
 * • Filled arc rotates clockwise from 12 o'clock; arc length = min(actual/target, 1).
 * • If actual exceeds target, a thinner outer ring traces the overshoot (capped at
 *   2× target). The overflow ring uses a darker shade of the same color so it
 *   reads as "above target" without screaming alarm-red.
 * • Center shows the actual value with its unit; below the unit a small "/ N"
 *   reference to the target keeps the user oriented.
 *
 * Reuses the visual language of {@link MacroRing} (calorie-distribution chart)
 * so the plan view feels consistent with the rest of the app.
 */

interface TargetDonutProps {
  /** Macro label (e.g. "Fehérje"). Rendered above the donut. */
  label: string
  /** Current value (any unit — caller chooses). */
  actual: number
  /** Target value; pass null when the user hasn't set a target. */
  target: number | null
  /** Unit string shown in center, e.g. "g" or "kcal". */
  unit: string
  /** Tailwind color for the fill arc — e.g. "stroke-[#F28C28]". */
  colorClass: string
  /** Lighter color for the unfilled track — e.g. "stroke-[#fff4e6]". */
  trackClass: string
  size?: number
  /** Decimals shown on the central value. Default 0. */
  decimals?: number
}

export function TargetDonut({
  label,
  actual,
  target,
  unit,
  colorClass,
  trackClass,
  size = 96,
  decimals = 0,
}: TargetDonutProps) {
  const hasTarget = target != null && target > 0
  const ratio = hasTarget ? actual / target! : 0
  const primaryFill = Math.max(0, Math.min(1, ratio))
  const overflow = hasTarget && ratio > 1 ? Math.min(1, ratio - 1) : 0

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const stroke = size * 0.1
  const outerR = r + stroke * 0.85
  const outerStroke = stroke * 0.45
  const circumference = 2 * Math.PI * r
  const outerCircumference = 2 * Math.PI * outerR

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-[11px] uppercase tracking-wide text-[#6b7280] font-medium">{label}</p>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${actual.toFixed(decimals)} ${unit}${hasTarget ? ` of ${target} ${unit}` : ''}`}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className={trackClass}
          strokeWidth={stroke}
        />
        {/* Primary fill — only renders when there is a target to compare against */}
        {hasTarget && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className={colorClass}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * primaryFill} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {/* Overflow ring (rendered slightly outside the main arc) */}
        {overflow > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={outerR}
            fill="none"
            className={colorClass}
            strokeWidth={outerStroke}
            strokeLinecap="round"
            strokeDasharray={`${outerCircumference * overflow} ${outerCircumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.55}
          />
        )}
        {/* Center text */}
        <text
          x={cx}
          y={cy + 2}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight={700}
          fill="#1A1A1A"
          fontFamily="Montserrat, sans-serif"
        >
          {actual.toFixed(decimals)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.18}
          textAnchor="middle"
          fontSize={size * 0.11}
          fill="#6b7280"
          fontFamily="Inter, sans-serif"
        >
          {hasTarget ? `/ ${Math.round(target!)} ${unit}` : unit}
        </text>
      </svg>
    </div>
  )
}
