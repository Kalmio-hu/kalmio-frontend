/**
 * MacroDonutChart — KALMIO-454
 *
 * SVG donut chart visualising kcal/protein/fat/carbs per serving.
 * Each segment is sized proportionally to its caloric contribution
 * (protein 4 kcal/g, fat 9 kcal/g, carbs 4 kcal/g).
 *
 * A subtle "vs. app average" radial indicator highlights when a macro
 * is noticeably above or below the fleet average:
 *   - protein high → chart peaks top (label floats high)
 *   - protein low  → label floats low
 *   - balanced     → label centred
 *
 * The chart is purely decorative / supplemental — keyboard users
 * receive the same data via the aria-label on the containing element.
 *
 * App-wide macro averages — computed from /api/recipes responses on
 * 2026-05-26 (50 recipes sampled); refresh by re-running the inline
 * script in docs/dev-team/scripts/compute-macro-averages.md.
 */

import { useId } from 'react'
import { APP_AVG_MACROS } from './macroAverages'

// ── Colours matching Kalmio palette ────────────────────────────────────────

const COLOURS = {
  protein: '#4F7942',  // kalmio green
  fat:     '#F28C28',  // amber
  carbs:   '#7B9CC2',  // soft blue
  // kcal is the total — not drawn as its own segment; we show it as centre text
} as const

const TRACK_COLOUR = 'rgba(255,255,255,0.18)'

// ── Types ──────────────────────────────────────────────────────────────────

export interface MacroValues {
  kcal:    number
  proteinG: number
  fatG:    number
  carbsG:  number
}

interface MacroDonutChartProps {
  macros: MacroValues
  /** Size of the SVG square in px. Defaults to 100. */
  size?: number
  /** Stroke width of the donut ring. Defaults to 11. */
  strokeWidth?: number
  /** When true, renders a dark-background version for use on photos. */
  dark?: boolean
}

// ── SVG donut helpers ──────────────────────────────────────────────────────

/** Converts a fraction [0,1] to an SVG arc path on a circle of given radius. */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  // Convert degrees → radians, start at top (−90°)
  const start = ((startAngle - 90) * Math.PI) / 180
  const end   = ((endAngle   - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(start)
  const y1 = cy + r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy + r * Math.sin(end)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

// ── Component ───────────────────────────────────────────────────────────────

export function MacroDonutChart({
  macros,
  size = 100,
  strokeWidth = 11,
  dark = false,
}: MacroDonutChartProps) {
  const id = useId()

  const cx = size / 2
  const cy = size / 2
  const r  = (size - strokeWidth) / 2

  // Caloric contribution of each macro
  const proteinKcal = macros.proteinG * 4
  const fatKcal     = macros.fatG     * 9
  const carbsKcal   = macros.carbsG   * 4
  const totalKcal   = proteinKcal + fatKcal + carbsKcal

  // Avoid div-by-zero when macros are all zero (skeleton state)
  const safe = totalKcal > 0 ? totalKcal : 1

  const proteinFrac = proteinKcal / safe
  const fatFrac     = fatKcal     / safe
  const carbsFrac   = carbsKcal   / safe

  // Segment angles (degrees), starting at top
  const pEnd = proteinFrac * 360
  const fEnd = pEnd + fatFrac * 360
  const cEnd = fEnd + carbsFrac * 360 // should ≈ 360

  // Gap between segments (degrees)
  const GAP = 3
  const segments = [
    { colour: COLOURS.protein, start: GAP / 2,        end: pEnd - GAP / 2 },
    { colour: COLOURS.fat,     start: pEnd + GAP / 2,  end: fEnd - GAP / 2 },
    { colour: COLOURS.carbs,   start: fEnd + GAP / 2,  end: cEnd - GAP / 2 },
  ].filter((s) => s.end - s.start > 1) // skip segments too small to draw

  // ── vs. app average: how does protein compare? ────────────────────────────
  // Protein ratio vs. average ratio — drives a small badge position nudge.
  const avgProteinFrac = (APP_AVG_MACROS.proteinG * 4) /
    (APP_AVG_MACROS.proteinG * 4 + APP_AVG_MACROS.fatG * 9 + APP_AVG_MACROS.carbsG * 4)

  // positive = above average, negative = below
  const proteinDelta = proteinFrac - avgProteinFrac
  // Clamp to [-1, 1] then map to a y-offset: above average → centre text higher
  const yNudge = Math.max(-8, Math.min(8, -proteinDelta * 40))

  const textColour = dark ? 'rgba(255,255,255,0.92)' : 'rgba(26,26,26,0.88)'
  const subColour  = dark ? 'rgba(255,255,255,0.62)' : 'rgba(26,26,26,0.52)'
  const trackColour = dark ? TRACK_COLOUR : 'rgba(0,0,0,0.08)'

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        {/* Drop shadow for the ring on photo backgrounds */}
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={trackColour}
        strokeWidth={strokeWidth}
      />

      {/* Macro segments */}
      <g filter={`url(#${id}-shadow)`}>
        {segments.map((seg) => (
          <path
            key={seg.colour}
            d={describeArc(cx, cy, r, seg.start, seg.end)}
            fill="none"
            stroke={seg.colour}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Centre: kcal value, nudged by protein-vs-average delta */}
      <text
        x={cx}
        y={cy + yNudge - 3}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.18}
        fontWeight="700"
        fill={textColour}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(macros.kcal)}
      </text>
      <text
        x={cx}
        y={cy + yNudge + size * 0.12}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.11}
        fill={subColour}
      >
        kcal
      </text>
    </svg>
  )
}
