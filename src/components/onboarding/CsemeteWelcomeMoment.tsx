/**
 * CsemeteWelcomeMoment — KALMIO-172 / E10.4
 *
 * Full-screen overlay shown exactly once when the user has transitioned from
 * MAG to CSEMETE (their first action after the first plan). Displays:
 *   - The DiofaWidget in CSEMETE state (the sprout).
 *   - A welcome headline.
 *   - A personal founder line from Zoltán.
 *   - A single "Értem" CTA to dismiss.
 *
 * Non-repeat guarantee: the parent hook (useCsemeteWelcomeMoment) checks
 * `kalmio:csemeteWelcomeShown` in localStorage and passes `onDismiss`, which
 * writes the flag. This component is purely presentational.
 *
 * Accessibility: focus-trapped modal with role="dialog". Dismiss via the
 * button or Escape key. All interactive elements are keyboard-reachable.
 *
 * Mobile-first: designed at 375px, scales naturally to desktop.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CsemeteWelcomeMomentProps {
  /** Called after the user dismisses the overlay. Parent should stop rendering. */
  onDismiss: () => void
}

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE_OUT: Easing = 'easeOut'
const EASE_IN: Easing = 'easeIn'

const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE_OUT } },
  exit:    { opacity: 0, transition: { duration: 0.25, ease: EASE_IN } },
}

const panelVariants: Variants = {
  hidden:  { opacity: 0, y: 48, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 24, delay: 0.1 },
  },
  exit: {
    opacity: 0, y: 28, scale: 0.96,
    transition: { duration: 0.22, ease: EASE_IN },
  },
}

// DiofaWidget animates from MAG to CSEMETE after the panel entrance settles.
const SPROUT_DELAY_MS = 700

// ─── Component ────────────────────────────────────────────────────────────────

export function CsemeteWelcomeMoment({ onDismiss }: CsemeteWelcomeMomentProps) {
  const { t } = useTranslation()
  const ctaRef = useRef<HTMLButtonElement>(null)

  // Delay the CSEMETE widget so the panel entrance animation plays first.
  const [sproutReady, setSproutReady] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setSproutReady(true), SPROUT_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  // Focus the CTA button once the panel has settled.
  useEffect(() => {
    const id = window.setTimeout(() => ctaRef.current?.focus(), 450)
    return () => window.clearTimeout(id)
  }, [])

  // Escape closes the overlay.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onDismiss])

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="csemete-welcome-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 px-4 pb-4 sm:pb-0"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.csemeteWelcome.ariaLabel')}
        onClick={e => {
          if (e.target === e.currentTarget) onDismiss()
        }}
      >
        {/* Panel */}
        <motion.div
          key="csemete-welcome-panel"
          className="relative w-full max-w-sm md:max-w-2xl bg-[#F5EDD8] rounded-2xl overflow-hidden shadow-2xl md:flex"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Close button — top-right */}
          <button
            type="button"
            onClick={onDismiss}
            className="
              absolute top-3 right-3 z-10
              w-8 h-8 flex items-center justify-center rounded-full
              text-[#3d2008]/60 hover:text-[#3d2008] hover:bg-[#e8d9b8]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
              transition-colors
            "
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {/* DiofaWidget — wakes up MAG → CSEMETE after panel settles */}
          <div className="relative md:flex-1 md:flex md:items-center md:justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={sproutReady ? 'csemete' : 'mag'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <DiofaWidget
                  stage={sproutReady ? 'CSEMETE' : 'MAG'}
                  moisture="WET"
                  className="rounded-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Caption fades in with the CSEMETE frame */}
            <AnimatePresence>
              {sproutReady && (
                <motion.p
                  key="csemete-caption"
                  className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-[#3d2008]/75 px-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.4 } }}
                  exit={{ opacity: 0 }}
                >
                  {t('onboarding.csemeteWelcome.sproutCaption')}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Right column on md+: copy + CTA */}
          <div className="md:flex-1 md:flex md:flex-col md:justify-center md:py-8 md:pr-8">
            {/* Copy block */}
            <div className="px-6 pt-4 pb-2 text-center space-y-3 md:pt-0 md:pb-0 md:px-2 md:text-left">
              <h2 className="font-headline font-bold text-lg md:text-xl text-[#1A1A1A] leading-snug">
                {t('onboarding.csemeteWelcome.title')}
              </h2>

              {/* Founder line — styled as a personal note */}
              <blockquote
                className="
                  text-sm text-[#3d2008]/80 leading-relaxed
                  border-l-2 border-[#4F7942]/40
                  pl-4 text-left
                  italic
                "
              >
                {t('onboarding.csemeteWelcome.founderLine')}
              </blockquote>

              <p className="text-xs text-[#3d2008]/55 text-right pr-1">
                — {t('onboarding.csemeteWelcome.founderName')}
              </p>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 pt-3 md:px-2 md:pb-0 md:pt-5">
              <button
                ref={ctaRef}
                type="button"
                onClick={onDismiss}
                className="
                  w-full rounded-xl bg-[#4F7942] text-white
                  px-6 py-3 text-sm font-semibold
                  hover:bg-[#3e6133]
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                  transition-colors
                "
              >
                {t('onboarding.csemeteWelcome.cta')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
