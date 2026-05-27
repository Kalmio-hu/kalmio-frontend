/**
 * CookTimer — analogue circular clock face for a single kitchen timer (KALMIO-408).
 *
 * Layout: 200×200 SVG viewBox.
 *   - Gray arc:  0 → minSeconds
 *   - Green arc: minSeconds → maxSeconds
 *   - Red arc:   maxSeconds → 60 min cap (shown only if elapsed > maxSeconds)
 *   - Minute hand rotates based on elapsedSeconds % 3600
 *
 * Interactions:
 *   - Tap (click) = toggle pause / resume
 *   - Long-press (>600 ms) = reset
 *
 * The component is full-width and dismissible via the `onClose` prop.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import {
  useCookTimersStore,
  timerPhase,
} from '@/store/cookTimers'

// ── SVG arc helpers ──────────────────────────────────────────────────────────

const CX = 100
const CY = 100
const R = 78
// CIRCUMFERENCE is referenced in comments / could be used for dash-array — kept for reference
// const CIRCUMFERENCE = 2 * Math.PI * R

/**
 * Converts a fraction (0–1) of the clock face into an SVG arc path.
 * Arcs are drawn clockwise starting from 12 o'clock (top, -90°).
 */
function arcPath(startFraction: number, endFraction: number): string {
  if (endFraction <= startFraction) return ''
  const clampedEnd = Math.min(endFraction, 1)

  const toRad = (f: number) => (f * 2 * Math.PI) - Math.PI / 2
  const sx = CX + R * Math.cos(toRad(startFraction))
  const sy = CY + R * Math.sin(toRad(startFraction))
  const ex = CX + R * Math.cos(toRad(clampedEnd))
  const ey = CY + R * Math.sin(toRad(clampedEnd))
  const largeArc = (clampedEnd - startFraction) > 0.5 ? 1 : 0

  return `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey}`
}

// ── Minute hand ──────────────────────────────────────────────────────────────

function minuteHandTransform(elapsedSeconds: number): string {
  const deg = (elapsedSeconds % 3600) / 3600 * 360
  return `rotate(${deg}, ${CX}, ${CY})`
}

// ── Phase colours ────────────────────────────────────────────────────────────

const COLOR_GRAY = '#9ca3af'     // warm gray — still cooking
const COLOR_GREEN = '#4F7942'    // olive green — ready zone
const COLOR_RED = '#C0522B'      // terracotta red — past

// ── Formatted time display ───────────────────────────────────────────────────

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  timerId: string
  onClose: () => void
}

export function CookTimer({ timerId, onClose }: Props) {
  const { t } = useTranslation()
  const timer = useCookTimersStore(s => s.timers[timerId])
  const pauseTimer = useCookTimersStore(s => s.pauseTimer)
  const resumeTimer = useCookTimersStore(s => s.resumeTimer)
  const resetTimer = useCookTimersStore(s => s.resetTimer)
  const clearPulse = useCookTimersStore(s => s.clearPulse)

  // Long-press detection
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const handlePressStart = useCallback(() => {
    didLongPress.current = false
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true
      resetTimer(timerId)
    }, 600)
  }, [timerId, resetTimer])

  const handlePressEnd = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    if (!didLongPress.current && timer) {
      if (timer.running) pauseTimer(timerId)
      else resumeTimer(timerId)
    }
  }, [timer, timerId, pauseTimer, resumeTimer])

  // Clear pulse animation after 1 second
  useEffect(() => {
    if (!timer?.pulse) return
    const t = setTimeout(() => clearPulse(timerId), 1000)
    return () => clearTimeout(t)
  }, [timer?.pulse, timerId, clearPulse])

  if (!timer) return null

  const phase = timerPhase(timer)
  const maxClockSeconds = 60 * 60

  const minFraction = timer.window.minSeconds / maxClockSeconds
  const maxFraction = timer.window.maxSeconds / maxClockSeconds
  const elapsedFraction = Math.min(timer.elapsedSeconds / maxClockSeconds, 1)

  // Arc extents
  const grayEnd = Math.min(elapsedFraction, minFraction)
  const greenEnd = phase === 'cooking'
    ? 0  // not yet reached
    : Math.min(elapsedFraction, maxFraction)
  const redEnd = phase === 'past' ? elapsedFraction : 0

  // Minute hand colour tracks phase
  const handColor = phase === 'cooking' ? COLOR_GRAY : phase === 'ready' ? COLOR_GREEN : COLOR_RED

  // Pulse ring colour
  const pulseColor = timer.pulse === 'soft' ? COLOR_GREEN : timer.pulse === 'hard' ? COLOR_RED : 'transparent'

  const remaining = Math.max(0, timer.window.minSeconds - timer.elapsedSeconds)
  const overdue = timer.elapsedSeconds > timer.window.maxSeconds
    ? timer.elapsedSeconds - timer.window.maxSeconds
    : 0

  return (
    <div className="w-full bg-white border-b border-[#EDEAE2] px-4 py-4">
      {/* Title row — recipe name precedes the step label so simultaneously
          running timers from different dishes are unambiguous at a glance. */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#1A1A1A] truncate">
          {timer.recipeName ? `${timer.recipeName} – ${timer.stepLabel}` : timer.stepLabel}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="p-1 rounded text-[#6b7280] hover:bg-[#F9F7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Clock SVG */}
      <div className="flex flex-col items-center gap-3">
        <div
          role="button"
          aria-label={timer.running ? t('cook.timer.pause') : t('cook.timer.resume')}
          tabIndex={0}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') handlePressStart() }}
          onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') handlePressEnd() }}
          className="cursor-pointer select-none focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 200 200"
            width="200"
            height="200"
            aria-hidden="true"
            className="block mx-auto"
          >
            {/* Pulse ring */}
            {timer.pulse && (
              <circle
                cx={CX}
                cy={CY}
                r={R + 8}
                fill="none"
                stroke={pulseColor}
                strokeWidth="4"
                opacity="0.6"
                className="animate-ping"
              />
            )}

            {/* Track ring */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />

            {/* Gray arc: cooking zone (0 → min or elapsed, whichever is smaller) */}
            {grayEnd > 0 && (
              <path
                d={arcPath(0, grayEnd)}
                fill="none"
                stroke={COLOR_GRAY}
                strokeWidth="10"
                strokeLinecap="round"
              />
            )}

            {/* Green arc: ready zone (min → max, only shown as elapsed advances) */}
            {phase !== 'cooking' && greenEnd > minFraction && (
              <path
                d={arcPath(minFraction, greenEnd)}
                fill="none"
                stroke={COLOR_GREEN}
                strokeWidth="10"
                strokeLinecap="round"
              />
            )}

            {/* Red arc: past zone (max → elapsed) */}
            {phase === 'past' && redEnd > maxFraction && (
              <path
                d={arcPath(maxFraction, redEnd)}
                fill="none"
                stroke={COLOR_RED}
                strokeWidth="10"
                strokeLinecap="round"
              />
            )}

            {/* Zone markers: tick at min and max */}
            <TickMark fraction={minFraction} color={COLOR_GREEN} />
            <TickMark fraction={maxFraction} color={COLOR_RED} />

            {/* Minute hand */}
            <line
              x1={CX}
              y1={CY}
              x2={CX}
              y2={CY - R + 14}
              stroke={handColor}
              strokeWidth="3"
              strokeLinecap="round"
              transform={minuteHandTransform(timer.elapsedSeconds)}
            />

            {/* Center dot */}
            <circle cx={CX} cy={CY} r={4} fill={handColor} />

            {/* Elapsed time text */}
            <text
              x={CX}
              y={CY + 22}
              textAnchor="middle"
              fontSize="13"
              fontFamily="system-ui, sans-serif"
              fill="#6b7280"
            >
              {fmtSeconds(timer.elapsedSeconds)}
            </text>
          </svg>
        </div>

        {/* Phase label + time hint */}
        <div className="text-center space-y-0.5">
          {phase === 'cooking' && remaining > 0 && (
            <p className="text-sm text-[#6b7280]">
              {t('cook.timer.remainingUntilMin', { time: fmtSeconds(remaining) })}
            </p>
          )}
          {phase === 'ready' && (
            <p className="text-sm font-semibold text-[#4F7942]">
              {t('cook.timer.readyZone')}
            </p>
          )}
          {phase === 'past' && (
            <p className="text-sm font-semibold text-[#C0522B]">
              {t('cook.timer.pastZone', { time: fmtSeconds(overdue) })}
            </p>
          )}

          {/* Pause/resume hint */}
          <p className="text-[11px] text-[#9ca3af]">
            {timer.running
              ? t('cook.timer.tapToPause')
              : t('cook.timer.tapToResume')}
            {' · '}
            {t('cook.timer.longPressToReset')}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── TickMark ─────────────────────────────────────────────────────────────────

function TickMark({ fraction, color }: { fraction: number; color: string }) {
  if (fraction <= 0 || fraction >= 1) return null
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  const innerR = R - 8
  const outerR = R + 4
  const x1 = CX + innerR * Math.cos(angle)
  const y1 = CY + innerR * Math.sin(angle)
  const x2 = CX + outerR * Math.cos(angle)
  const y2 = CY + outerR * Math.sin(angle)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
}
