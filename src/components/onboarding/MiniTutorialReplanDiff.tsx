/**
 * MiniTutorialReplanDiff — KALMIO-166 / E9.7
 *
 * Tutorial 3: "Ha közbeszól az élet, újrarendezem."
 *
 * Animated 4-frame preview: the user marks a meal as skipped, the system
 * narrates the rest-of-week recomputation.
 *
 * Frames:
 *   0 — Week plan shown normally
 *   1 — One meal is tapped "Kihagyom" — card dims and shows a skip badge
 *   2 — System "thinking" indicator plays; rest-of-week meals shuffle
 *   3 — Diff narrative appears: "Szerdára áthelyeztem a lazacot"
 *
 * No real data; all copy wired through i18n, frozen example content.
 * Mobile-first, respects prefers-reduced-motion.
 *
 * Usage:
 *   <MiniTutorialReplanDiff onSkip={handleSkip} />
 */

import { useTutorialPlayback } from './useTutorialPlayback'
import { TutorialControls } from './TutorialControls'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MiniTutorialReplanDiffProps {
  onSkip: () => void
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_FRAMES = 4
const FRAME_DURATION_MS = 4000

// ─── Colours ─────────────────────────────────────────────────────────────────

const C = {
  bg:         '#F5EDD8',
  card:       '#FFFFFF',
  cardBorder: '#E8DFC8',
  skipped:    '#9CA3AF',  // grey — skipped meal
  skipBadge:  '#6B7280',
  highlight:  '#F28C28',  // amber
  added:      '#4F7942',  // green — new assignment
  replaced:   '#EF4444',  // red — old recipe in diff
  label:      '#5C3D1E',
  labelFaint: '#8B6040',
  thinking:   '#D4C4A8',
} as const

const EASE_OUT: Easing = 'easeOut'

// ─── Frozen example data ──────────────────────────────────────────────────────

const DAYS = ['H', 'K', 'Sze', 'Cs', 'P'] as const
const SKIP_DAY_IDX = 1   // Tuesday is skipped

const ORIGINAL_MEALS = [
  'Zabpehely',
  'Serpenyős lazac',   // ← this gets skipped
  'Csirkemell',
  'Tojásrántotta',
  'Joghurtos müzli',
]

const RESHUFFLED_MEALS = [
  'Zabpehely',
  '',                  // skipped — empty
  'Serpenyős lazac',   // moved from Tuesday to Wednesday
  'Csirkemell',
  'Tojásrántotta',
]

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

// ─── Meal card ────────────────────────────────────────────────────────────────

function MealCard({
  day,
  meal,
  skipped,
  isNew,
}: {
  day: string
  meal: string
  skipped: boolean
  isNew: boolean
}) {
  return (
    <div className="flex-1 rounded-lg overflow-hidden" style={{ border: `1.5px solid ${skipped ? C.skipped : isNew ? C.added : C.cardBorder}` }}>
      <div
        className="text-center py-0.5 text-[10px] font-semibold"
        style={{ background: '#FAF3E5', color: C.labelFaint }}
      >
        {day}
      </div>
      <div
        className="min-h-[52px] px-1 py-1 text-[9px] leading-[1.3] flex flex-col justify-center items-center text-center gap-0.5"
        style={{
          background: skipped ? '#F9FAFB' : C.card,
          opacity: skipped ? 0.6 : 1,
        }}
      >
        {skipped ? (
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
            style={{ background: '#E5E7EB', color: C.skipBadge }}
          >
            Kihagyva
          </span>
        ) : meal ? (
          <AnimatePresence mode="wait">
            <motion.span
              key={meal}
              initial={isNew ? { opacity: 0, x: 10 } : { opacity: 1 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
              style={{ color: isNew ? C.added : C.label, fontWeight: isNew ? 600 : 400 }}
            >
              {meal}
            </motion.span>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  )
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <motion.div
      className="flex items-center justify-center gap-1.5 py-2"
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-hidden="true"
    >
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{ background: C.thinking }}
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
}

// ─── Diff narrative ───────────────────────────────────────────────────────────

function DiffNarrative() {
  return (
    <motion.div
      className="rounded-lg px-3 py-2 flex flex-col gap-1"
      style={{ background: '#F0FAF0', border: `1.5px solid ${C.added}` }}
      variants={fadeSlideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: C.added }}>
          Kedd:
        </span>
        <span
          className="text-[11px] line-through"
          style={{ color: C.replaced }}
        >
          Serpenyős lazac
        </span>
        <span className="text-[11px]" style={{ color: C.labelFaint }}>→</span>
        <span className="text-[11px] font-semibold" style={{ color: C.skipBadge }}>
          kihagyva
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold" style={{ color: C.added }}>
          Szerda:
        </span>
        <span className="text-[11px]" style={{ color: C.label }}>
          Csirkemell
        </span>
        <span className="text-[11px]" style={{ color: C.labelFaint }}>→</span>
        <span className="text-[11px] font-semibold" style={{ color: C.added }}>
          Serpenyős lazac
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MiniTutorialReplanDiff({ onSkip, className = '' }: MiniTutorialReplanDiffProps) {
  const { t } = useTranslation()
  const playback = useTutorialPlayback({
    totalFrames: TOTAL_FRAMES,
    frameDurationMs: FRAME_DURATION_MS,
    onComplete: onSkip,
  })
  const { frame } = playback

  // Determine which meal list to show
  const meals = frame >= 2 ? RESHUFFLED_MEALS : ORIGINAL_MEALS

  return (
    <div
      className={`flex flex-col gap-4 w-full max-w-sm mx-auto select-none ${className}`}
      role="img"
      aria-label={t('onboarding.miniTutorial.replanDiff.ariaLabel')}
      data-testid="mini-tutorial-replan-diff"
      data-frame={frame}
    >
      {/* Illustration area */}
      <motion.div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: C.bg }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
      >
        {/* Week grid */}
        <div className="flex gap-1 w-full" aria-hidden="true">
          {DAYS.map((day, i) => (
            <MealCard
              key={day}
              day={day}
              meal={meals[i] ?? ''}
              skipped={frame >= 1 && i === SKIP_DAY_IDX}
              isNew={frame >= 2 && i !== SKIP_DAY_IDX && meals[i] !== ORIGINAL_MEALS[i]}
            />
          ))}
        </div>

        {/* Thinking dots — frame 2 */}
        <AnimatePresence>
          {frame === 2 && <ThinkingDots key="thinking" />}
        </AnimatePresence>

        {/* Diff narrative — frame 3 */}
        <AnimatePresence>
          {frame === 3 && <DiffNarrative key="diff-narrative" />}
        </AnimatePresence>
      </motion.div>

      {/* Frame label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`frame-label-${frame}`}
          className="text-center text-sm text-[#5C3D1E]/80 leading-snug px-2 min-h-[2.5rem] flex items-center justify-center"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
          exit={{ opacity: 0 }}
        >
          {t(`onboarding.miniTutorial.replanDiff.frame${frame}` as const)}
        </motion.p>
      </AnimatePresence>

      <TutorialControls playback={playback} totalFrames={TOTAL_FRAMES} />

      {/* Caption */}
      <p className="text-center text-xs font-medium text-[#5C3D1E]/60 -mt-2">
        {t('onboarding.miniTutorial.replanDiff.caption')}
      </p>

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="
          self-center text-sm font-semibold text-[#4F7942]
          rounded-lg px-5 py-2
          border border-[#4F7942]/30
          hover:bg-[#4F7942]/8
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
          transition-colors
        "
      >
        {t('onboarding.miniTutorial.replanDiff.skip')}
      </button>

      <span className="sr-only" aria-live="polite">
        {t(`onboarding.miniTutorial.replanDiff.frame${frame}` as const)}
      </span>
    </div>
  )
}
