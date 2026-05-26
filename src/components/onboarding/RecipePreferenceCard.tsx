/**
 * RecipePreferenceCard — KALMIO-454
 *
 * Rich visual card for the recipe preference swipe deck.
 * Replaces the plain PreferenceCard inner body with:
 *
 *   - Full-bleed photo background (warm gradient fallback when no image)
 *   - Donut chart showing kcal/protein/fat/carbs per serving, with position
 *     that reflects protein balance vs. app-wide average (MacroDonutChart)
 *   - Macro legend (P / F / C grams)
 *   - Ingredient count / top ingredients blurb (if space allows)
 *   - Prep time + first-step preview (if space allows)
 *   - Drag overlays: "Tetszik" (green) / "Inkább nem" (red)
 *
 * The drag/swipe mechanics (x motion value, commitDrag, animation controls)
 * are kept here — this component is a full drop-in replacement for
 * PreferenceCard inside PreferenceSwipe.
 *
 * Props are a strict superset of the original PreferenceCardProps so
 * PreferenceSwipe can pass through unchanged.
 */

import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion'
import { Heart, X, Clock, ChefHat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MacroDonutChart } from './MacroDonutChart'
import type { PreferenceCardData } from './PreferenceCard'

// ── Re-export the data type so consumers can import from here ──────────────
export type { PreferenceCardData }

// ── Props ──────────────────────────────────────────────────────────────────

export interface RecipePreferenceCardProps {
  card: PreferenceCardData
  disabled?: boolean
  onLike: () => void
  onPass: () => void
  /** i18n label displayed in the like overlay badge */
  likeLabel: string
  /** i18n label displayed in the pass overlay badge */
  passLabel: string
}

// ── Tuning — kept identical to original PreferenceCard ─────────────────────

const COMMIT_PX       = 110
const LABEL_FULL_PX   = 80
const MAX_TILT        = 16
const FLY_OFF_DISTANCE = 800
const FLY_OFF_DURATION = 0.30

// ── Stable fallback gradient per card ──────────────────────────────────────

function fallbackGradient(cardId: string): string {
  const hash = parseInt((cardId || '').slice(0, 6).replace(/[^0-9a-f]/g, ''), 16) || 0
  const hue = 95 + (hash % 70)
  return `linear-gradient(145deg, hsl(${hue}, 60%, 62%) 0%, hsl(${hue + 30}, 55%, 44%) 100%)`
}

// ── Macro legend row ────────────────────────────────────────────────────────

interface MacroLegendProps {
  proteinG: number
  fatG: number
  carbsG: number
}

function MacroLegend({ proteinG, fatG, carbsG }: MacroLegendProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 mt-1" aria-label={t('onboarding.preferences.macroLegendAriaLabel')}>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
        <span className="inline-block w-2 h-2 rounded-full bg-[#4F7942]" aria-hidden />
        <span>{Math.round(proteinG)}g P</span>
      </span>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
        <span className="inline-block w-2 h-2 rounded-full bg-[#F28C28]" aria-hidden />
        <span>{Math.round(fatG)}g F</span>
      </span>
      <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
        <span className="inline-block w-2 h-2 rounded-full bg-[#7B9CC2]" aria-hidden />
        <span>{Math.round(carbsG)}g C</span>
      </span>
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function RecipePreferenceCard({
  card,
  disabled,
  onLike,
  onPass,
  likeLabel,
  passLabel,
}: RecipePreferenceCardProps) {
  const { t } = useTranslation()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimationControls()

  const rotate = useTransform(x, [-300, 0, 300], [-MAX_TILT, 0, MAX_TILT])

  const likeOpacity = useTransform<number, number>(
    [x, y],
    ([xv]) => (xv <= 0 ? 0 : Math.min(1, xv / LABEL_FULL_PX)),
  )
  const passOpacity = useTransform<number, number>(
    [x, y],
    ([xv]) => (xv >= 0 ? 0 : Math.min(1, -xv / LABEL_FULL_PX)),
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

    if (dx > COMMIT_PX || vx > 800) {
      void controls.start({
        x: FLY_OFF_DISTANCE, y: info.offset.y, rotate: MAX_TILT, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onLike()
    } else if (dx < -COMMIT_PX || vx < -800) {
      void controls.start({
        x: -FLY_OFF_DISTANCE, y: info.offset.y, rotate: -MAX_TILT, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onPass()
    } else {
      void controls.start({
        x: 0, y: 0, rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 26 },
      })
    }
  }

  const hasMacros = card.macros != null &&
    (card.macros.kcal > 0 || card.macros.proteinG > 0)

  const ariaDescription = hasMacros && card.macros
    ? t('onboarding.preferences.cardAriaDesc', {
        name: card.name,
        kcal: Math.round(card.macros.kcal),
        protein: Math.round(card.macros.proteinG),
        fat: Math.round(card.macros.fatG),
        carbs: Math.round(card.macros.carbsG),
      })
    : card.name

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      drag={disabled ? false : 'x'}
      dragElastic={0.55}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate, touchAction: 'none' }}
      aria-label={ariaDescription}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_18px_40px_-15px_rgba(26,26,26,0.50),0_8px_18px_-12px_rgba(26,26,26,0.28)] bg-white">

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

        {/* ── Legibility gradients ─────────────────────────────────────── */}
        {/* Top gradient: darkens the photo so like/pass labels are readable */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1/4 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Bottom gradient: darkens for text + macro strip */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.82) 100%)',
          }}
        />

        {/* ── Macro donut chart — top-right corner ────────────────────── */}
        {hasMacros && card.macros && (
          <div
            className="absolute top-4 right-4 rounded-2xl p-1.5"
            style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)' }}
          >
            <MacroDonutChart
              macros={card.macros}
              size={80}
              strokeWidth={9}
              dark
            />
          </div>
        )}

        {/* ── Bottom content ───────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-3 text-white">

          {/* Recipe name */}
          <p className="text-xl font-semibold leading-tight drop-shadow-sm line-clamp-2">
            {card.name}
          </p>

          {/* Macro legend (protein / fat / carbs) */}
          {hasMacros && card.macros && (
            <MacroLegend
              proteinG={card.macros.proteinG}
              fatG={card.macros.fatG}
              carbsG={card.macros.carbsG}
            />
          )}

          {/* Prep time + ingredient blurb row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {card.totalMinutes != null && card.totalMinutes > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-white/80">
                <Clock className="w-3 h-3" aria-hidden />
                {card.totalMinutes} perc
              </span>
            )}
            {card.ingredientNames && card.ingredientNames.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-white/80">
                <ChefHat className="w-3 h-3" aria-hidden />
                {card.ingredientNames.slice(0, 3).join(', ')}
                {card.ingredientNames.length > 3 && (
                  <span className="opacity-70">
                    {' '}+{card.ingredientNames.length - 3}
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Prep preview (first step, truncated) */}
          {card.prepSummary && (
            <p className="mt-1.5 text-[11px] text-white/70 leading-snug line-clamp-1">
              {card.prepSummary}
            </p>
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

        {/* ── Overlay labels — fade in as user drags ───────────────────── */}
        <motion.div
          aria-hidden
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-6 -rotate-[16deg] flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-[#4F7942] bg-[#4F7942]/15 text-[#1f3a1d] backdrop-blur-sm"
        >
          <Heart className="w-6 h-6 fill-[#4F7942] text-[#4F7942]" />
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
