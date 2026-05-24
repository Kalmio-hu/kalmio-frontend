/**
 * MiniTutorialPlanner — KALMIO-166 / E9.7
 *
 * Tutorial 1: "Így néz ki egy heted."
 *
 * Animated 4-frame preview that shows a week of meals reshuffling itself and
 * highlights what changes when a meal is replaced. Auto-advances every 2 s;
 * the user can skip the whole sequence via the "Értem" button.
 *
 * Frames:
 *   0 — A weekly meal grid is shown (static, initial state)
 *   1 — One meal card is highlighted, about to be replaced
 *   2 — The card animates out; a new recipe slides in
 *   3 — The diff row lights up green: change confirmed
 *
 * No real data. All content is frozen example copy wired through i18n.
 *
 * Mobile-first: 375 px base width; scales up to max-w-sm naturally.
 * Respects prefers-reduced-motion (framer-motion handles it internally).
 *
 * Usage:
 *   <MiniTutorialPlanner onSkip={handleSkip} />
 */

import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTutorialPlayback } from './useTutorialPlayback'
import { TutorialControls } from './TutorialControls'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MiniTutorialPlannerProps {
  /** Called when the user presses "Értem" or the sequence finishes. */
  onSkip: () => void
  className?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_FRAMES = 4
const FRAME_DURATION_MS = 4000

// ─── Colours ─────────────────────────────────────────────────────────────────

const C = {
  bg:       '#F5EDD8',  // warm cream — matches onboarding palette
  card:     '#FFFFFF',
  cardBorder: '#E8DFC8',
  highlight: '#F28C28', // Kalmio amber highlight
  replaced:  '#EF4444', // outgoing recipe
  added:     '#4F7942', // incoming recipe (forest green)
  label:     '#5C3D1E', // dark brown labels
  labelFaint:'#8B6040',
  dayBg:     '#FAF3E5',
} as const

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE_OUT: Easing = 'easeOut'

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

const slideOut: Variants = {
  visible: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -30, transition: { duration: 0.3, ease: 'easeIn' } },
}

const slideIn: Variants = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT, delay: 0.1 } },
}

const glowPulse: Variants = {
  rest:   { boxShadow: '0 0 0 0 rgba(242,140,40,0)' },
  pulse:  {
    boxShadow: ['0 0 0 0 rgba(242,140,40,0)', '0 0 0 6px rgba(242,140,40,0.35)', '0 0 0 0 rgba(242,140,40,0)'],
    transition: { duration: 1.0, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Frozen example data ──────────────────────────────────────────────────────

const DAYS = ['H', 'K', 'Sze', 'Cs', 'P'] as const   // Hétfő…Péntek
const OLD_RECIPE = 'Zöldbabos csirkemell'
const NEW_RECIPE = 'Serpenyős lazac'
const REPLACE_DAY_IDX = 2  // Wednesday slot is replaced

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Five-column weekly grid — frame 0 and frame 1 */
function WeekGrid({
  highlightDay,
  replacedDay,
  newRecipeName,
}: {
  highlightDay: number | null
  replacedDay: number | null
  newRecipeName: string | null
}) {
  return (
    <div className="flex gap-1 w-full" aria-hidden="true">
      {DAYS.map((day, i) => {
        const isHighlighted = highlightDay === i
        const isReplaced    = replacedDay === i

        return (
          <motion.div
            key={day}
            className="flex-1 rounded-lg overflow-hidden"
            animate={isHighlighted ? 'pulse' : 'rest'}
            variants={glowPulse}
            style={{ border: `1.5px solid ${isHighlighted ? C.highlight : C.cardBorder}` }}
          >
            {/* Day label */}
            <div
              className="text-center py-0.5 text-[10px] font-semibold"
              style={{ background: C.dayBg, color: C.labelFaint }}
            >
              {day}
            </div>

            {/* Meal card */}
            <div
              className="relative min-h-[52px] px-1 py-1 text-[9px] leading-[1.3] flex flex-col justify-center items-center text-center gap-0.5"
              style={{ background: C.card, color: C.label }}
            >
              <AnimatePresence mode="wait">
                {isReplaced && newRecipeName ? (
                  /* New recipe slides in */
                  <motion.span
                    key="new"
                    variants={slideIn}
                    initial="hidden"
                    animate="visible"
                    style={{ color: C.added, fontWeight: 600 }}
                  >
                    {newRecipeName}
                  </motion.span>
                ) : (
                  /* Original recipe — slides out if replaced */
                  <motion.span
                    key="old"
                    variants={slideOut}
                    initial="visible"
                    animate="visible"
                    exit="exit"
                    style={{
                      color: isHighlighted ? C.highlight : C.label,
                      fontWeight: isHighlighted ? 600 : 400,
                    }}
                  >
                    {i === REPLACE_DAY_IDX ? OLD_RECIPE : `Reggeli ${i + 1}`}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/** Diff row shown in frame 3 */
function DiffRow() {
  return (
    <motion.div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
      style={{ background: '#F0FAF0', border: `1.5px solid ${C.added}` }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
      aria-hidden="true"
    >
      <span style={{ color: C.replaced, textDecoration: 'line-through', flexShrink: 0 }}>
        {OLD_RECIPE}
      </span>
      <span style={{ color: C.labelFaint, flexShrink: 0 }}>→</span>
      <span style={{ color: C.added, fontWeight: 600 }}>
        {NEW_RECIPE}
      </span>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MiniTutorialPlanner({ onSkip, className = '' }: MiniTutorialPlannerProps) {
  const { t } = useTranslation()
  const playback = useTutorialPlayback({
    totalFrames: TOTAL_FRAMES,
    frameDurationMs: FRAME_DURATION_MS,
    onComplete: onSkip,
  })
  const { frame } = playback

  const highlightDay = frame === 1 ? REPLACE_DAY_IDX : null
  const replacedDay  = frame >= 2 ? REPLACE_DAY_IDX : null
  const newRecipe    = frame >= 2 ? NEW_RECIPE : null

  return (
    <div
      className={`flex flex-col gap-4 w-full max-w-sm mx-auto select-none ${className}`}
      role="img"
      aria-label={t('onboarding.miniTutorial.planner.ariaLabel')}
      data-testid="mini-tutorial-planner"
      data-frame={frame}
    >
      {/* Illustration area */}
      <motion.div
        className="rounded-2xl p-4 flex flex-col gap-3"
        style={{ background: C.bg }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <WeekGrid
          highlightDay={highlightDay}
          replacedDay={replacedDay}
          newRecipeName={newRecipe}
        />

        <AnimatePresence>
          {frame === 3 && <DiffRow key="diff-row" />}
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
          {t(`onboarding.miniTutorial.planner.frame${frame}` as const)}
        </motion.p>
      </AnimatePresence>

      <TutorialControls playback={playback} totalFrames={TOTAL_FRAMES} />

      {/* Caption line — permanent */}
      <p className="text-center text-xs font-medium text-[#5C3D1E]/60 -mt-2">
        {t('onboarding.miniTutorial.planner.caption')}
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
        {t('onboarding.miniTutorial.planner.skip')}
      </button>

      {/* Screen-reader live region */}
      <span className="sr-only" aria-live="polite">
        {t(`onboarding.miniTutorial.planner.frame${frame}` as const)}
      </span>
    </div>
  )
}
