/**
 * TasteSwipe — KALMIO-156 / E9.5
 *
 * A full Tinder-style swipe deck for taste-rating ingredients and recipes.
 * Drag the top card in any of four directions; the card follows the finger,
 * rotates with the horizontal travel, and a colour-tinted label fades in to
 * communicate the action that release will commit:
 *
 *   ← left  → "Nem ízlik"   (HATE)   red
 *   → right → "Imádom"      (LOVE)   green / kalmio green
 *   ↑ up    → "Megeszem"   (OK)     amber
 *   ↓ down  → "Kihagyom"   (skip card, no signal)
 *
 * On release past the threshold the card flies off in the same direction
 * with momentum; below the threshold it springs back to centre. Two ghost
 * cards peek behind the active one so the deck has visual depth.
 *
 * Photos: when `card.imageUrl` is set the card is full-bleed image with a
 * legibility gradient at the bottom. Without a photo we draw a warm
 * gradient panel with a large category-appropriate glyph and a single
 * uppercase initial as the visual anchor — works fine until photo
 * generation catches up.
 *
 * Keyboard: ←/→/↑/↓ (also j/u/l/s) for hate/ok/love/skip.
 *
 * Backend dependency: POST /api/users/me/taste-signals (KALMIO-153).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  AnimatePresence,
  type PanInfo,
} from 'framer-motion'
import {
  Heart, X, ThumbsUp, ChevronDown, Sparkles,
  Carrot, UtensilsCrossed, Drumstick, Wheat, Droplet, Flame,
  type LucideIcon,
} from 'lucide-react'
import { capture } from '@/lib/analytics'
import { tasteSignalsService } from '@/services/tasteSignals'
import type { TasteCard, TasteSignalSource, TasteSignalValue } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────

export interface TasteSwipeProps {
  cards: TasteCard[]
  source?: TasteSignalSource
  onSignal?: (cardId: string, signal: TasteSignalValue) => void
  onComplete?: () => void
  onSkipAll?: () => void
}

type Direction = 'left' | 'right' | 'up' | 'down'

// ── Tuning ─────────────────────────────────────────────────────────────────

/** Pixels of drag travel needed to commit. */
const COMMIT_PX = 110
/** Pixels of travel at which the overlay label reaches full opacity. */
const LABEL_FULL_PX = 80
/** Maximum tilt (degrees) at the edge of the drag range. */
const MAX_TILT = 18
/** Off-screen distance the card flies to on commit. */
const FLY_OFF_DISTANCE = 800
/** Off-screen flight duration (seconds). */
const FLY_OFF_DURATION = 0.32

// ── Visual helpers ─────────────────────────────────────────────────────────

function fallbackGradient(card: TasteCard): string {
  // Stable hue per card so re-renders don't flicker. Use the first 6 chars of
  // the id as a 24-bit number; map to hue. Warm for ingredients (15–55deg),
  // cool-green for recipes (95–165deg). Keeps everything on-brand-ish.
  const hash = parseInt((card.id || card.name).slice(0, 6).replace(/[^0-9a-f]/g, ''), 16) || 0
  const isIng = card.targetType === 'INGREDIENT'
  const hue = isIng ? 15 + (hash % 40) : 95 + (hash % 70)
  return `linear-gradient(135deg, hsl(${hue}, 70%, 78%) 0%, hsl(${hue + 25}, 65%, 60%) 100%)`
}

function initialFor(name: string): string {
  const ch = [...(name || '').trim()][0]
  return ch ? ch.toLocaleUpperCase('hu-HU') : '?'
}

/**
 * KALMIO-432: pick a category-appropriate glyph for the no-photo fallback.
 * Recipe cards always get the utensils icon; ingredient cards branch on the
 * server-provided IngredientCategory enum. If the category is missing or
 * unknown we fall back to Carrot — a safer "vegetable" generic than a
 * meat icon.
 */
function iconForCard(card: TasteCard): LucideIcon {
  if (card.targetType === 'RECIPE') return UtensilsCrossed
  switch (card.category) {
    case 'PROTEIN': return Drumstick
    case 'CARB':    return Wheat
    case 'FAT':     return Droplet
    case 'VEGGIE':  return Carrot
    case 'SPICE':   return Flame
    default:        return Carrot
  }
}

/**
 * Direction values we track during the drag. The single-direction guard
 * (KALMIO-432) picks at most one of these so the overlay labels and colour
 * tints never compete on a diagonal drag.
 */
type DirectionMatch = 'left' | 'right' | 'up' | 'down' | 'none'

/**
 * Returns the dominant drag direction based on (dx, dy), or 'none' when
 * neither axis has moved enough to register. Symmetric break-tie on the
 * horizontal axis to keep the experience predictable.
 */
function dominantDirection(dx: number, dy: number): DirectionMatch {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ax < 8 && ay < 8) return 'none'
  if (ax >= ay) return dx > 0 ? 'right' : 'left'
  return dy < 0 ? 'up' : 'down'
}

// ── Active card (the one you can drag) ─────────────────────────────────────

interface ActiveCardProps {
  card: TasteCard
  onCommit: (direction: Direction) => void
  disabled?: boolean
  labels: Record<Direction, string>
  hint: { ingredient: string; recipe: string }
}

function ActiveCard({ card, onCommit, disabled, labels, hint }: ActiveCardProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimationControls()

  // Rotation tracks horizontal travel for that satisfying Tinder tilt.
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_TILT, 0, MAX_TILT])

  // KALMIO-432: pick a single dominant direction so a diagonal drag never
  // shows two overlay labels at once. Each label / tint reads its opacity
  // from this single source.
  const loveOpacity = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'right') return 0
    return Math.min(1, Math.max(0, xv / LABEL_FULL_PX))
  })
  const hateOpacity = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'left') return 0
    return Math.min(1, Math.max(0, -xv / LABEL_FULL_PX))
  })
  const okOpacity = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'up') return 0
    return Math.min(1, Math.max(0, -yv / LABEL_FULL_PX))
  })
  const skipOpacity = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'down') return 0
    return Math.min(1, Math.max(0, yv / LABEL_FULL_PX))
  })

  // Tints follow the same dominant-axis rule, capped at lower max opacity so
  // they read as a subtle overlay rather than blocking the card content.
  const tintRight = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'right') return 0
    return Math.min(0.4, Math.max(0, (xv / LABEL_FULL_PX) * 0.4))
  })
  const tintLeft = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'left') return 0
    return Math.min(0.4, Math.max(0, (-xv / LABEL_FULL_PX) * 0.4))
  })
  const tintUp = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'up') return 0
    return Math.min(0.35, Math.max(0, (-yv / LABEL_FULL_PX) * 0.35))
  })
  const tintDown = useTransform<number, number>([x, y], ([xv, yv]) => {
    if (dominantDirection(xv, yv) !== 'down') return 0
    return Math.min(0.35, Math.max(0, (yv / LABEL_FULL_PX) * 0.35))
  })

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (disabled) return
    const dx = info.offset.x
    const dy = info.offset.y
    const vx = info.velocity.x
    const vy = info.velocity.y
    // Either travel OR a sharp flick should commit.
    const horizontalWins = Math.abs(dx) >= Math.abs(dy)
    const goRight = (dx > COMMIT_PX || vx > 800) && horizontalWins
    const goLeft = (dx < -COMMIT_PX || vx < -800) && horizontalWins
    const goUp = (dy < -COMMIT_PX || vy < -800) && !horizontalWins
    const goDown = (dy > COMMIT_PX || vy > 800) && !horizontalWins

    if (goRight) {
      void controls.start({
        x: FLY_OFF_DISTANCE, y: dy, rotate: MAX_TILT, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onCommit('right')
    } else if (goLeft) {
      void controls.start({
        x: -FLY_OFF_DISTANCE, y: dy, rotate: -MAX_TILT, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onCommit('left')
    } else if (goUp) {
      void controls.start({
        x: dx, y: -FLY_OFF_DISTANCE, rotate: 0, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onCommit('up')
    } else if (goDown) {
      void controls.start({
        x: dx, y: FLY_OFF_DISTANCE, rotate: 0, opacity: 0,
        transition: { duration: FLY_OFF_DURATION, ease: 'easeOut' },
      })
      onCommit('down')
    } else {
      // Spring back to centre.
      void controls.start({
        x: 0, y: 0, rotate: 0,
        transition: { type: 'spring', stiffness: 320, damping: 28 },
      })
    }
  }

  const categoryLabel =
    card.targetType === 'INGREDIENT' ? hint.ingredient : hint.recipe

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      drag={disabled ? false : true}
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate, touchAction: 'none' }}
      aria-label={card.name}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_18px_40px_-15px_rgba(26,26,26,0.45),0_8px_18px_-12px_rgba(26,26,26,0.25)] bg-white">

        {/* ── Visual layer: photo or fallback gradient ──────────────────── */}
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // KALMIO-432: pick a category-appropriate glyph (chicken leg for
          // PROTEIN, wheat for CARB, oil drop for FAT, carrot for VEGGIE,
          // flame for SPICE, utensils-crossed for recipes).
          (() => {
            const Icon = iconForCard(card)
            return (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: fallbackGradient(card) }}
              >
                <div className="flex flex-col items-center gap-3 opacity-90">
                  <Icon className="w-16 h-16 text-white/85" strokeWidth={1.4} />
                  <span className="text-7xl font-black text-white/90 tracking-tight">
                    {initialFor(card.name)}
                  </span>
                </div>
              </div>
            )
          })()
        )}

        {/* ── Bottom legibility gradient ──────────────────────────────── */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.78) 100%)',
          }}
        />

        {/* ── Title block ─────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 p-5 pb-6 text-white">
          <span className="inline-block text-[10px] font-mono uppercase tracking-widest opacity-80 mb-1.5">
            {categoryLabel}
          </span>
          <p className="text-2xl font-semibold leading-tight drop-shadow-sm">
            {card.name}
          </p>
          {card.subtitle && (
            <p className="text-sm opacity-85 mt-1 drop-shadow-sm">{card.subtitle}</p>
          )}
        </div>

        {/* ── Colour tint overlays (active during drag) ───────────────── */}
        <motion.div aria-hidden style={{ opacity: tintRight }} className="absolute inset-0 pointer-events-none bg-[#4F7942]/55 mix-blend-multiply" />
        <motion.div aria-hidden style={{ opacity: tintLeft }} className="absolute inset-0 pointer-events-none bg-red-600/50 mix-blend-multiply" />
        <motion.div aria-hidden style={{ opacity: tintUp }} className="absolute inset-0 pointer-events-none bg-[#F28C28]/50 mix-blend-multiply" />
        <motion.div aria-hidden style={{ opacity: tintDown }} className="absolute inset-0 pointer-events-none bg-stone-900/40 mix-blend-multiply" />

        {/* ── Big overlay labels — fade in as user drags ──────────────── */}
        <motion.div
          aria-hidden
          style={{ opacity: loveOpacity }}
          className="absolute top-8 left-6 -rotate-[18deg] flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-[#4F7942] bg-[#4F7942]/15 text-[#1f3a1d] backdrop-blur-sm"
        >
          <Heart className="w-6 h-6 fill-[#4F7942] text-[#4F7942]" />
          <span className="text-2xl font-black uppercase tracking-wider">{labels.right}</span>
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: hateOpacity }}
          className="absolute top-8 right-6 rotate-[18deg] flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-red-600 bg-red-600/15 text-red-900 backdrop-blur-sm"
        >
          <X className="w-6 h-6 text-red-700" strokeWidth={3} />
          <span className="text-2xl font-black uppercase tracking-wider">{labels.left}</span>
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: okOpacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl border-[3px] border-[#F28C28] bg-[#F28C28]/20 text-[#8a4a06] backdrop-blur-sm"
        >
          <ThumbsUp className="w-6 h-6 text-[#F28C28]" />
          <span className="text-2xl font-black uppercase tracking-wider">{labels.up}</span>
        </motion.div>

        <motion.div
          aria-hidden
          style={{ opacity: skipOpacity }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl border-[3px] border-stone-700 bg-stone-900/30 text-white backdrop-blur-sm"
        >
          <ChevronDown className="w-6 h-6 text-white" />
          <span className="text-xl font-black uppercase tracking-wider">{labels.down}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Ghost card (the ones peeking behind) ───────────────────────────────────

function GhostCard({ card, depth }: { card: TasteCard; depth: 1 | 2 }) {
  // Two slots: directly behind (depth 1, slightly smaller and offset) and
  // furthest back (depth 2, smaller still).
  const scale = depth === 1 ? 0.96 : 0.92
  const yOff = depth === 1 ? 10 : 22
  const opacity = depth === 1 ? 0.85 : 0.55
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `translateY(${yOff}px) scale(${scale})`,
        opacity,
      }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-md bg-white">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0" style={{ background: fallbackGradient(card) }} />
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export function TasteSwipe({
  cards,
  source = 'ONBOARDING',
  onSignal,
  onComplete,
  onSkipAll,
}: TasteSwipeProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cardKeyRef = useRef(0) // bumps when we advance so Framer remounts the active card

  const current = cards[index] ?? null
  const total = cards.length
  const done = index >= total

  // ── Submit a signal and advance ──────────────────────────────────────
  const submit = useCallback(
    async (signal: TasteSignalValue) => {
      if (!current || submitting) return
      setError(null)
      setSubmitting(true)
      try {
        await tasteSignalsService.submitSignal({
          targetType: current.targetType,
          targetId: current.id,
          signal,
          source,
        })
        capture('taste_signal_submitted', {
          targetType: current.targetType,
          targetId: current.id,
          signal,
          source,
          deckPosition: index,
        })
        onSignal?.(current.id, signal)
        cardKeyRef.current += 1
        setIndex((i) => i + 1)
      } catch {
        setError(t('taste.errorSubmit'))
      } finally {
        setSubmitting(false)
      }
    },
    [current, submitting, source, index, onSignal, t],
  )

  const skipCard = useCallback(() => {
    if (!current || submitting) return
    capture('taste_card_skipped', {
      targetType: current.targetType,
      targetId: current.id,
      deckPosition: index,
    })
    cardKeyRef.current += 1
    setIndex((i) => i + 1)
  }, [current, submitting, index])

  // ── Map a swipe direction to a signal ────────────────────────────────
  const commitDirection = useCallback(
    (dir: Direction) => {
      switch (dir) {
        case 'right': void submit('LOVE'); break
        case 'left':  void submit('HATE'); break
        case 'up':    void submit('OK');   break
        case 'down':  skipCard(); break
      }
    },
    [submit, skipCard],
  )

  // ── Keyboard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (done) return
    function onKey(e: KeyboardEvent) {
      if (submitting) return
      switch (e.key) {
        case 'ArrowRight': case 'l': case 'L': e.preventDefault(); void submit('LOVE'); break
        case 'ArrowLeft':  case 'j': case 'J': e.preventDefault(); void submit('HATE'); break
        case 'ArrowUp':    case 'u': case 'U': e.preventDefault(); void submit('OK');   break
        case 'ArrowDown':  case 's': case 'S': case 'Escape':
          e.preventDefault(); skipCard(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, submitting, submit, skipCard])

  // ── onComplete when deck is exhausted ────────────────────────────────
  useEffect(() => {
    if (done) onComplete?.()
  }, [done, onComplete])

  // ── Render: done state ───────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4F7942]/15">
          <Sparkles className="w-8 h-8 text-[#4F7942]" />
        </div>
        <p className="text-lg font-semibold text-stone-800">{t('taste.done')}</p>
        <p className="text-sm text-stone-500 max-w-xs">{t('taste.doneSubtitle')}</p>
      </div>
    )
  }

  // ── Render: active deck ──────────────────────────────────────────────
  const labels: Record<Direction, string> = {
    left: t('taste.hate'),
    right: t('taste.love'),
    up: t('taste.ok'),
    down: t('taste.skip'),
  }
  const hint = {
    ingredient: t('taste.cardIngredient'),
    recipe: t('taste.cardRecipe'),
  }
  const next1 = cards[index + 1]
  const next2 = cards[index + 2]
  const progress = index / total

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">

      {/* Progress + counter */}
      <div className="w-full flex items-center gap-3">
        <div
          className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={t('taste.progress', { current: index + 1, total })}
        >
          <motion.div
            className="h-full bg-[#F28C28] rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>
        <span className="text-xs text-stone-500 font-mono tabular-nums shrink-0">
          {index + 1} / {total}
        </span>
      </div>

      {/* Card stack */}
      <div className="relative w-full aspect-[3/4] max-h-[520px]">
        {next2 && <GhostCard key={`g2-${next2.id}`} card={next2} depth={2} />}
        {next1 && <GhostCard key={`g1-${next1.id}`} card={next1} depth={1} />}
        <AnimatePresence mode="wait">
          <ActiveCard
            key={`active-${cardKeyRef.current}-${current.id}`}
            card={current}
            onCommit={commitDirection}
            disabled={submitting}
            labels={labels}
            hint={hint}
          />
        </AnimatePresence>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Action buttons — tap-friendly alternative to swiping */}
      <div className="flex w-full items-center justify-between gap-2 px-2" role="group" aria-label={t('taste.actionsLabel')}>
        <button
          type="button"
          onClick={() => void submit('HATE')}
          disabled={submitting}
          aria-label={t('taste.hate')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-600 shadow-sm hover:border-red-400 hover:bg-red-50 active:scale-95 transition disabled:opacity-40"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => skipCard()}
          disabled={submitting}
          aria-label={t('taste.skipCard')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-stone-200 text-stone-500 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:scale-95 transition disabled:opacity-40"
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => void submit('OK')}
          disabled={submitting}
          aria-label={t('taste.ok')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-[#F28C28]/40 text-[#F28C28] shadow-sm hover:border-[#F28C28] hover:bg-[#F28C28]/5 active:scale-95 transition disabled:opacity-40"
        >
          <ThumbsUp className="w-7 h-7" />
        </button>
        <button
          type="button"
          onClick={() => void submit('LOVE')}
          disabled={submitting}
          aria-label={t('taste.love')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-[#4F7942]/40 text-[#4F7942] shadow-sm hover:border-[#4F7942] hover:bg-[#4F7942]/5 active:scale-95 transition disabled:opacity-40"
        >
          <Heart className="w-7 h-7 fill-[#4F7942]" />
        </button>
      </div>

      {/* Hint copy + skip-all */}
      <p className="text-[11px] text-stone-400 text-center leading-snug px-4">
        {t('taste.swipeHint')}
      </p>

      {onSkipAll && (
        <button
          type="button"
          onClick={onSkipAll}
          disabled={submitting}
          className="text-xs text-stone-400 underline underline-offset-2 hover:text-stone-600 transition disabled:opacity-40"
        >
          {t('taste.skipAll')}
        </button>
      )}
    </div>
  )
}
