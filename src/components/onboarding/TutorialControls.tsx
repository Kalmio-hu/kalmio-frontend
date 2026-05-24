/**
 * TutorialControls — shared Back / Pause / Next + clickable progress dots row
 * for the onboarding mini tutorials.
 *
 * The dots are interactive: clicking jumps to that frame and pauses
 * auto-advance, so the user can re-read a specific frame.
 */

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { TutorialPlayback } from './useTutorialPlayback'

interface TutorialControlsProps {
  playback: TutorialPlayback
  totalFrames: number
  /** Tailwind text/border accent for the active dot + button focus ring. */
  accentClassName?: string
}

export function TutorialControls({
  playback,
  totalFrames,
  accentClassName = 'text-[#5C3D1E]',
}: TutorialControlsProps) {
  const { t } = useTranslation()
  const { frame, isPlaying, isFirstFrame, isLastFrame, next, prev, jumpTo, togglePlay } = playback

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <ControlButton
          onClick={prev}
          disabled={isFirstFrame}
          aria-label={t('onboarding.miniTutorial.controls.backAria')}
          accentClassName={accentClassName}
        >
          <ChevronLeftIcon />
        </ControlButton>

        <ControlButton
          onClick={togglePlay}
          aria-label={isPlaying
            ? t('onboarding.miniTutorial.controls.pauseAria')
            : t('onboarding.miniTutorial.controls.playAria')}
          accentClassName={accentClassName}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </ControlButton>

        <ControlButton
          onClick={next}
          aria-label={isLastFrame
            ? t('onboarding.miniTutorial.controls.finishAria')
            : t('onboarding.miniTutorial.controls.nextAria')}
          accentClassName={accentClassName}
        >
          <ChevronRightIcon />
        </ControlButton>
      </div>

      <div className="flex gap-1.5 justify-center">
        {Array.from({ length: totalFrames }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => jumpTo(i)}
            aria-label={t('onboarding.miniTutorial.controls.jumpAria', { n: i + 1 })}
            aria-current={i === frame ? 'step' : undefined}
            className="
              p-1 -m-1 rounded-full
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]
            "
          >
            <motion.span
              className="block rounded-full"
              animate={{
                width:      i === frame ? 16 : 6,
                background: i === frame ? '#5C3D1E' : '#D4C4A8',
              }}
              transition={{ duration: 0.25 }}
              style={{ height: 6 }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Bits ─────────────────────────────────────────────────────────────────────

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  accentClassName: string
}

function ControlButton({ accentClassName, className = '', children, ...rest }: ControlButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'inline-flex items-center justify-center',
        'w-9 h-9 rounded-full',
        'border border-[#5C3D1E]/20',
        'bg-white/60 hover:bg-white',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] focus-visible:ring-offset-2',
        'transition-colors',
        accentClassName,
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5l12 7-12 7V5z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  )
}
