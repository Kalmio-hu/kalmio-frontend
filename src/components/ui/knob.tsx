import { useRef, useCallback } from 'react'
import { hapticLight, hapticSelection } from '@/lib/haptics'

interface KnobProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label: string
  color?: string
  size?: number
  disabled?: boolean
  /** Format the center label — defaults to the raw value */
  formatValue?: (v: number) => string
}

const START_ANGLE = 225  // degrees — bottom-left
const END_ANGLE = 315    // degrees — bottom-right (270° sweep)
const SWEEP = 270

export function Knob({
  value,
  min,
  max,
  onChange,
  label,
  color = '#F28C28',
  size = 80,
  disabled = false,
  formatValue,
}: KnobProps) {
  const dragging = useRef(false)
  const startY = useRef(0)
  const startValue = useRef(0)
  const ref = useRef<SVGSVGElement>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  const fraction = max > min ? (value - min) / (max - min) : 0
  const angle = START_ANGLE + fraction * SWEEP

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36
  const strokeW = size * 0.09

  function polarToXY(deg: number, radius: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToXY(startDeg, r)
    const e = polarToXY(endDeg, r)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    startY.current = e.clientY
    startValue.current = value
    hapticLight()
  }, [disabled, value])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dy = startY.current - e.clientY  // up = increase
    const range = max - min
    const delta = (dy / 150) * range
    const next = clamp(Math.round(startValue.current + delta))
    if (next !== valueRef.current) hapticSelection()
    onChange(next)
    // clamp closes over min/max, both of which are already in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, onChange])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  // Keyboard support
  const step = Math.max(1, Math.round((max - min) / 100))
  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { hapticSelection(); onChange(clamp(value + step)) }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { hapticSelection(); onChange(clamp(value - step)) }
    // clamp closes over min/max, both of which are already in the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, value, step, onChange])

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-ns-resize'} touch-none`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKey}
        tabIndex={disabled ? -1 : 0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        {/* Track background */}
        <path
          d={describeArc(START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {fraction > 0 && (
          <path
            d={describeArc(START_ANGLE, START_ANGLE + fraction * SWEEP)}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Thumb dot */}
        <circle
          cx={polarToXY(angle, r).x}
          cy={polarToXY(angle, r).y}
          r={strokeW * 0.65}
          fill={fraction > 0 ? color : '#d1d5db'}
        />
        {/* Center value */}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.18}
          fontWeight="700"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fill="#1A1A1A"
        >
          {formatValue ? formatValue(value) : value}
        </text>
      </svg>
      <span className="text-[11px] font-medium text-gray-500 text-center leading-tight max-w-[72px]">
        {label}
      </span>
    </div>
  )
}
