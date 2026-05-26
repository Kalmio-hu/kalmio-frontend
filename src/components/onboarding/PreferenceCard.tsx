/**
 * PreferenceCard — KALMIO-435
 *
 * Single card in the recipe preference swipe deck.
 * Draggable via framer-motion.  Right = like (LOVE), left = pass (HATE).
 * Shows recipe image when available, warm gradient fallback otherwise.
 *
 * Overlay labels fade in as the user drags:
 *   → right: "Tetszik"  (green)   [KALMIO-454: was "Megvan"]
 *   ← left:  "Inkább nem"  (red)
 *
 * Keyboard: → / l = like, ← / j = pass.
 * (Parent wires the keydown listener — this component handles only drag.)
 *
 * KALMIO-454: PreferenceCardData extended with optional macros, ingredients,
 * prepSummary fields. The visual card rendering is delegated to
 * RecipePreferenceCard which replaces the inner card body. The drag/swipe
 * logic in this file is unchanged.
 */

import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion'
import { Check, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PreferenceCardData {
  id: string
  name: string
  /** Short 1-line description e.g. "30 perc · 420 kcal" */
  subtitle?: string | null
  imageUrl?: string | null
  // ── KALMIO-454: enriched fields ──────────────────────────────────────────
  /** Macros per serving. Present when the recipe has macro data. */
  macros?: { kcal: number; proteinG: number; fatG: number; carbsG: number } | null
  /** Up to 5 ingredient names in Hungarian for the ingredients blurb. */
  ingredientNames?: string[] | null
  /** First step of the recipe, used as a prep preview line. */
  prepSummary?: string | null
  /** Total prep + cook minutes. */
  totalMinutes?: number | null
}

export interface PreferenceCardProps {
  card: PreferenceCardData
  disabled?: boolean
  onLike: () => void
  onPass: () => void
  /** i18n label displayed in the like overlay badge */
  likeLabel: string
  /** i18n label displayed in the pass overlay badge */
  passLabel: string
}

// ── Tuning ─────────────────────────────────────────────────────────────────

const COMMIT_PX = 110
const LABEL_FULL_PX = 80
const MAX_TILT = 16
const FLY_OFF_DISTANCE = 800
const FLY_OFF_DURATION = 0.30

// ── Stable fallback gradient per card ──────────────────────────────────────

function fallbackGradient(cardId: string): string {
  const hash = parseInt((cardId || '').slice(0, 6).replace(/[^0-9a-f]/g, ''), 16) || 0
  const hue = 95 + (hash % 70) // warm-green spectrum — recipe-oriented
  return `linear-gradient(135deg, hsl(${hue}, 68%, 75%) 0%, hsl(${hue + 22}, 62%, 58%) 100%)`
}

// ── Component ───────────────────────────────────────────────────────────────

export function PreferenceCard({
  card,
  disabled,
  onLike,
  onPass,
  likeLabel,
  passLabel,
}: PreferenceCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimationControls()

  const rotate = useTransform(x, [-300, 0, 300], [-MAX_TILT, 0, MAX_TILT])

  const likeOpacity = useTransform<number, number>(
    [x, y],
    ([xv]) => {
      if (xv <= 0) return 0
      return Math.min(1, xv / LABEL_FULL_PX)
    },
  )
  const passOpacity = useTransform<number, number>(
    [x, y],
    ([xv]) => {
      if (xv >= 0) return 0
      return Math.min(1, -xv / LABEL_FULL_PX)
    },
  )
  const tintRight = useTransform<number, number>([x, y], ([xv]) =>
    Math.min(0.38, Math.max(0, (xv / LABEL_FULL_PX) * 0.38)),
  )
  const tintLeft = useTransform<number, number>([x, y], ([xv]) =>
    Math.min(0.38, Math.max(0, (-xv / LABEL_FULL_PX) * 0.38)),
  )

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (disabled) return
    const dx = info.offset.x
    const vx = info.velocity.x

    const goRight = dx > COMMIT_PX || vx > 800
    const goLeft = dx < -COMMIT_PX || vx < -800

    if (goRight) {
      void controls.start({
        x: FLY_OFF_DISTANCE,
        y: info.offset.y,
        rotate: MAX_TILT,
        opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onLike()
    } else if (goLeft) {
      void controls.start({
        x: -FLY_OFF_DISTANCE,
        y: info.offset.y,
        rotate: -MAX_TILT,
        opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onPass()
    } else {
      void controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 26 },
      })
    }
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      drag={disabled ? false : 'x'}
      dragElastic={0.55}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate, touchAction: 'none' }}
      aria-label={card.name}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_18px_40px_-15px_rgba(26,26,26,0.42),0_8px_18px_-12px_rgba(26,26,26,0.22)] bg-white">

        {/* ── Visual: photo or gradient fallback ──────────────────────── */}
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: fallbackGradient(card.id) }}
          />
        )}

        {/* ── Bottom gradient for text legibility ─────────────────────── */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.52) 58%, rgba(0,0,0,0.76) 100%)',
          }}
        />

        {/* ── Card text ────────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-5 pb-6 text-white">
          <p className="text-2xl font-semibold leading-tight drop-shadow-sm">{card.name}</p>
          {card.subtitle && (
            <p className="text-sm opacity-80 mt-1 drop-shadow-sm">{card.subtitle}</p>
          )}
        </div>

        {/* ── Colour tints during drag ─────────────────────────────────── */}
        <motion.div
          aria-hidden
          style={{ opacity: tintRight }}
          className="absolute inset-0 pointer-events-none bg-[#4F7942]/55 mix-blend-multiply"
        />
        <motion.div
          aria-hidden
          style={{ opacity: tintLeft }}
          className="absolute inset-0 pointer-events-none bg-red-600/50 mix-blend-multiply"
        />

        {/* ── Overlay labels ───────────────────────────────────────────── */}
        <motion.div
          aria-hidden
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-6 -rotate-[16deg] flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-[#4F7942] bg-[#4F7942]/15 text-[#1f3a1d] backdrop-blur-sm"
        >
          <Check className="w-6 h-6 text-[#4F7942]" strokeWidth={2.5} />
          <span className="text-2xl font-black uppercase tracking-wider">{likeLabel}</span>
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: passOpacity }}
          className="absolute top-8 right-6 rotate-[16deg] flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-red-600 bg-red-600/15 text-red-900 backdrop-blur-sm"
        >
          <X className="w-6 h-6 text-red-700" strokeWidth={3} />
          <span className="text-2xl font-black uppercase tracking-wider">{passLabel}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
