/**
 * Visible countdown with a pause control (PRD §17 "moving content has a pause
 * control"). Counts only while `running`; calls `onDone` once at zero. The
 * parent decides what zero means (auto-advance, or just "the rest is over").
 */
import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../../lib/clock'
import { Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMoveT } from '../../lib/register'
import { MOVE_ACCENT } from '../../lib/constants'

interface CountdownProps {
  seconds: number
  /** Parent-level pause; the control below toggles its own pause in addition. */
  running: boolean
  onDone?: () => void
  /** Restart the clock when this changes (e.g. the step index). */
  resetKey?: string | number
  label?: string
  className?: string
  compact?: boolean
}

export function Countdown({ seconds, running, onDone, resetKey, label, className, compact }: CountdownProps) {
  const { t } = useMoveT()
  const [left, setLeft] = useState(seconds)
  const [ownPaused, setOwnPaused] = useState(false)
  // Restart when the duration or the reset key changes (state adjusted during render, not in an effect).
  const [prevReset, setPrevReset] = useState<[number, string | number | undefined]>([seconds, resetKey])
  if (prevReset[0] !== seconds || prevReset[1] !== resetKey) {
    setPrevReset([seconds, resetKey])
    setLeft(seconds)
    setOwnPaused(false)
  }
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const active = running && !ownPaused && left > 0

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(id)
  }, [active])

  useEffect(() => {
    if (left === 0 && seconds > 0) onDoneRef.current?.()
  }, [left, seconds])

  const pct = seconds > 0 ? Math.round(((seconds - left) / seconds) * 100) : 100

  return (
    <div className={cn('flex items-center gap-3', className)} role="timer" aria-live="off" aria-label={label}>
      <div className="flex-1 min-w-0">
        {label && !compact && <p className="text-sm text-gray-600">{label}</p>}
        <p className={cn('font-headline font-bold tabular-nums text-[#1A1A1A]', compact ? 'text-2xl' : 'text-5xl')}>
          {formatClock(left)}
        </p>
        <div className="mt-1 h-2 w-full rounded-full bg-black/8 overflow-hidden" aria-hidden>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: MOVE_ACCENT }} />
        </div>
        {(ownPaused || !running) && <p className="mt-1 text-sm text-gray-600">{t('player.paused')}</p>}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOwnPaused((p) => !p)}
        aria-pressed={ownPaused}
        aria-label={ownPaused ? t('player.resume') : t('player.pause')}
        className="min-h-12 min-w-12 shrink-0"
      >
        {ownPaused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
        <span className="hidden sm:inline">{ownPaused ? t('player.resume') : t('player.pause')}</span>
      </Button>
    </div>
  )
}
