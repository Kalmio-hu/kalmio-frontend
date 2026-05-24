/**
 * MiniTutorialGrooming — KALMIO-166 / E9.7
 *
 * Tutorial 2: "Mielőtt új hetet tervezel, gyorsan átnézzük a hűtődet."
 *
 * Animated 4-frame preview of the pre-plan fridge-grooming ritual:
 *   0 — Fridge item list shown (static, initial state)
 *   1 — First item: "Tartsd meg" (keep) decision
 *   2 — Second item: "Dobd ki" (throw out) decision, item fades red
 *   3 — Plan recomputes: groomed ingredients light up in a mini-plan preview
 *
 * No real data — all copy wired through i18n, frozen example items.
 * Mobile-first, respects prefers-reduced-motion.
 *
 * Usage:
 *   <MiniTutorialGrooming onSkip={handleSkip} />
 */

import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useTutorialPlayback } from './useTutorialPlayback'
import { TutorialControls } from './TutorialControls'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MiniTutorialGroomingProps {
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
  keep:       '#4F7942',  // forest green = keep
  toss:       '#EF4444',  // red = throw out
  expired:    '#F28C28',  // amber = mark expired
  label:      '#5C3D1E',
  labelFaint: '#8B6040',
  planBg:     '#F0FAF0',
  planBorder: '#4F7942',
} as const

const EASE_OUT: Easing = 'easeOut'

// ─── Frozen example fridge items ─────────────────────────────────────────────

type ItemDecision = 'keep' | 'toss' | 'expired' | null

interface FridgeItem {
  id: string
  name: string
  qty: string
  decision: ItemDecision
}

const BASE_ITEMS: Omit<FridgeItem, 'decision'>[] = [
  { id: 'csirke',   name: 'Csirkemell', qty: '400 g' },
  { id: 'brokkoli', name: 'Brokkoli',   qty: '1 fej' },
  { id: 'joghurt',  name: 'Joghurt',    qty: '200 g' },
]

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2 } },
}

const tossOut: Variants = {
  visible: { opacity: 1, x: 0,  scale: 1 },
  exit:    { opacity: 0, x: 30, scale: 0.92, transition: { duration: 0.35, ease: 'easeIn' } },
}

// ─── Fridge item row ──────────────────────────────────────────────────────────

function ItemRow({ item, decision }: { item: Omit<FridgeItem, 'decision'>; decision: ItemDecision }) {
  const borderColor =
    decision === 'keep'    ? C.keep    :
    decision === 'toss'    ? C.toss    :
    decision === 'expired' ? C.expired :
    C.cardBorder

  const badgeLabel = decision === 'keep' ? 'Megtartva' : decision === 'toss' ? 'Kidobva' : null

  return (
    <AnimatePresence mode="wait">
      {decision !== 'toss' ? (
        <motion.div
          key={`item-${item.id}`}
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{
            background: C.card,
            border: `1.5px solid ${borderColor}`,
          }}
          variants={fadeSlideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold" style={{ color: C.label }}>
              {item.name}
            </span>
            <span className="text-[10px]" style={{ color: C.labelFaint }}>
              {item.qty}
            </span>
          </div>
          <AnimatePresence>
            {badgeLabel && (
              <motion.span
                key={`badge-${item.id}-${decision}`}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: decision === 'keep' ? '#F0FAF0' : '#FEF2F2',
                  color: decision === 'keep' ? C.keep : C.toss,
                  border: `1px solid ${decision === 'keep' ? C.keep : C.toss}`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE_OUT } }}
                exit={{ opacity: 0 }}
              >
                {badgeLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          key={`item-${item.id}-toss`}
          className="flex items-center justify-between rounded-lg px-3 py-2 pointer-events-none"
          style={{
            background: '#FFF5F5',
            border: `1.5px solid ${C.toss}`,
            opacity: 0.5,
          }}
          variants={tossOut}
          initial="visible"
          animate="visible"
          exit="exit"
          layout
        >
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold line-through" style={{ color: C.toss }}>
              {item.name}
            </span>
            <span className="text-[10px]" style={{ color: C.labelFaint }}>
              {item.qty}
            </span>
          </div>
          <span className="text-[10px] font-semibold" style={{ color: C.toss }}>
            Kidobva
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Mini-plan recompute preview ─────────────────────────────────────────────

function MiniPlanPreview() {
  const entries = ['Csirkemell-saláta', 'Brokkolis rizzsel']
  return (
    <motion.div
      className="rounded-lg px-3 py-2 flex flex-col gap-1"
      style={{ background: C.planBg, border: `1.5px solid ${C.planBorder}` }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
      aria-hidden="true"
    >
      <span className="text-[10px] font-semibold" style={{ color: C.keep }}>
        Terv frissítve
      </span>
      {entries.map(e => (
        <span key={e} className="text-[11px]" style={{ color: C.label }}>
          {e}
        </span>
      ))}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MiniTutorialGrooming({ onSkip, className = '' }: MiniTutorialGroomingProps) {
  const { t } = useTranslation()
  const playback = useTutorialPlayback({
    totalFrames: TOTAL_FRAMES,
    frameDurationMs: FRAME_DURATION_MS,
    onComplete: onSkip,
  })
  const { frame } = playback

  // Derive per-item decisions from current frame
  const decisions: Record<string, ItemDecision> = {
    csirke:   frame >= 1 ? 'keep' : null,
    brokkoli: frame >= 1 ? 'keep' : null,
    joghurt:  frame >= 2 ? 'toss' : null,
  }

  return (
    <div
      className={`flex flex-col gap-4 w-full max-w-sm mx-auto select-none ${className}`}
      role="img"
      aria-label={t('onboarding.miniTutorial.grooming.ariaLabel')}
      data-testid="mini-tutorial-grooming"
      data-frame={frame}
    >
      {/* Illustration area */}
      <motion.div
        className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: C.bg }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
      >
        {/* Fridge items */}
        <div className="flex flex-col gap-1.5">
          {BASE_ITEMS.map(item => (
            <ItemRow key={item.id} item={item} decision={decisions[item.id] ?? null} />
          ))}
        </div>

        {/* Plan recompute preview — frame 3 only */}
        <AnimatePresence>
          {frame === 3 && <MiniPlanPreview key="plan-preview" />}
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
          {t(`onboarding.miniTutorial.grooming.frame${frame}` as const)}
        </motion.p>
      </AnimatePresence>

      <TutorialControls playback={playback} totalFrames={TOTAL_FRAMES} />

      {/* Caption */}
      <p className="text-center text-xs font-medium text-[#5C3D1E]/60 -mt-2">
        {t('onboarding.miniTutorial.grooming.caption')}
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
        {t('onboarding.miniTutorial.grooming.skip')}
      </button>

      <span className="sr-only" aria-live="polite">
        {t(`onboarding.miniTutorial.grooming.frame${frame}` as const)}
      </span>
    </div>
  )
}
