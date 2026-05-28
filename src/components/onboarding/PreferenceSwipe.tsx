/**
 * PreferenceSwipe — KALMIO-435
 *
 * Recipe preference card stack.  Swipe right = like (LOVE), left = pass (HATE).
 * Two-direction only — simpler and more deliberate than TasteSwipe (which covers
 * four directions and handles both ingredients and recipes for a broader taste
 * profile).  This step is specifically about recipe types: "would you want this
 * in your weekly plan?"
 *
 * Signal persistence:
 *   POST /api/users/me/taste-signals
 *   body: { targetType: 'RECIPE', targetId, signal: 'LOVE' | 'HATE', source: 'ONBOARDING' }
 *
 * Cards come from GET /api/recipes with a small curated set.  Up to MAX_CARDS
 * shown; deck is shuffled once on mount.
 *
 * Keyboard: → / l = like, ← / j = pass, Escape = skip all.
 *
 * onComplete fires when the deck is exhausted or the user taps "Átugrom".
 * It never blocks navigation — if the backend is down we swallow errors and
 * advance anyway.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X } from 'lucide-react'
// KALMIO-454: swap inner card to the enriched RecipePreferenceCard.
// Deck logic (shuffle, index, submit, keyboard) is unchanged.
import { RecipePreferenceCard } from './RecipePreferenceCard'
import type { PreferenceCardData } from './PreferenceCard'
import { tasteSignalsService } from '@/services/tasteSignals'
import { capture } from '@/lib/analytics'
import { hapticLight, hapticSuccess, hapticMedium } from '@/lib/haptics'

// ── Config ─────────────────────────────────────────────────────────────────

/** Maximum number of cards we show in the preference deck. */
const MAX_CARDS = 10

// ── Ghost card (peeking behind the active card) ───────────────────────────

function GhostCard({ card, depth }: { card: PreferenceCardData; depth: 1 | 2 }) {
  const scale = depth === 1 ? 0.96 : 0.92
  const yOff = depth === 1 ? 10 : 22
  const opacity = depth === 1 ? 0.82 : 0.52
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `translateY(${yOff}px) scale(${scale})`,
        opacity,
      }}
    >
      <div className="w-full h-full rounded-3xl overflow-hidden shadow-md bg-white">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, hsl(${120 + ((parseInt(card.id.slice(0, 4), 16) || 0) % 60)}, 65%, 72%) 0%, hsl(${140 + ((parseInt(card.id.slice(0, 4), 16) || 0) % 60)}, 58%, 56%) 100%)`,
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Props ───────────────────────────────────────────────────────────────────

export interface PreferenceSwipeProps {
  /** Recipe cards to show. Parent is responsible for fetching and slicing to MAX_CARDS. */
  cards: PreferenceCardData[]
  onComplete: () => void
}

// ── Component ───────────────────────────────────────────────────────────────

export function PreferenceSwipe({ cards: rawCards, onComplete }: PreferenceSwipeProps) {
  const { t } = useTranslation()

  // Shuffle once and cap at MAX_CARDS.
  const [deck] = useState<PreferenceCardData[]>(() =>
    [...rawCards]
      .sort(() => Math.random() - 0.5)
      .slice(0, MAX_CARDS),
  )

  const [index, setIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  // Bump this counter each time we advance so AnimatePresence remounts the active card.
  const [cardKey, setCardKey] = useState(0)

  const total = deck.length
  const current = deck[index] ?? null
  const done = index >= total || total === 0

  // ── Submit signal and advance ───────────────────────────────────────────
  const submit = useCallback(
    async (signal: 'LOVE' | 'HATE') => {
      if (!current || submitting) return
      signal === 'LOVE' ? hapticSuccess() : hapticMedium()
      setSubmitting(true)
      try {
        await tasteSignalsService.submitSignal({
          targetType: 'RECIPE',
          targetId: current.id,
          signal,
          source: 'ONBOARDING',
        })
        capture('preference_signal_submitted', {
          recipeId: current.id,
          signal,
          deckPosition: index,
        })
      } catch {
        // Network issues must not block onboarding progress.
        console.warn('[PreferenceSwipe] signal submit failed — advancing anyway')
      } finally {
        setSubmitting(false)
        setCardKey((k) => k + 1)
        setIndex((i) => i + 1)
      }
    },
    [current, submitting, index],
  )

  // ── Keyboard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (done) return
    function onKey(e: KeyboardEvent) {
      if (submitting) return
      switch (e.key) {
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault()
          void submit('LOVE')
          break
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault()
          void submit('HATE')
          break
        case 'Escape':
          e.preventDefault()
          onComplete()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, submitting, submit, onComplete])

  // ── Auto-advance when deck is exhausted ─────────────────────────────────
  useEffect(() => {
    if (done) onComplete()
  }, [done, onComplete])

  // ── Render: done (brief flash before parent advances) ───────────────────
  if (done) return null

  const progress = index / total
  const next1 = deck[index + 1]
  const next2 = deck[index + 2]

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">

      {/* Progress bar + counter */}
      <div className="w-full flex items-center gap-3">
        <div
          className="flex-1 h-1.5 rounded-full bg-stone-200 overflow-hidden"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={t('onboarding.preferences.progressLabel', { current: index + 1, total })}
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
          <RecipePreferenceCard
            key={`pref-${cardKey}-${current.id}`}
            card={current}
            disabled={submitting}
            onLike={() => void submit('LOVE')}
            onPass={() => void submit('HATE')}
            likeLabel={t('onboarding.preferences.likeLabel')}
            passLabel={t('onboarding.preferences.passLabel')}
          />
        </AnimatePresence>
      </div>

      {/* Tap buttons */}
      <div
        className="flex w-full items-center justify-center gap-6"
        role="group"
        aria-label={t('onboarding.preferences.actionsLabel')}
      >
        <button
          type="button"
          onClick={() => void submit('HATE')}
          disabled={submitting}
          aria-label={t('onboarding.preferences.passLabel')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-red-200 text-red-600 shadow-sm hover:border-red-400 hover:bg-red-50 active:scale-95 transition disabled:opacity-40"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => void submit('LOVE')}
          disabled={submitting}
          aria-label={t('onboarding.preferences.likeLabel')}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-white border-2 border-[#4F7942]/40 text-[#4F7942] shadow-sm hover:border-[#4F7942] hover:bg-[#4F7942]/5 active:scale-95 transition disabled:opacity-40"
        >
          <Heart className="w-7 h-7 fill-[#4F7942]" />
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[11px] text-stone-400 text-center leading-snug px-4">
        {t('onboarding.preferences.swipeHint')}
      </p>

      {/* Skip all */}
      <button
        type="button"
        onClick={() => { hapticLight(); onComplete() }}
        disabled={submitting}
        className="text-xs text-stone-400 underline underline-offset-2 hover:text-stone-600 transition disabled:opacity-40"
      >
        {t('onboarding.preferences.skipAll')}
      </button>
    </div>
  )
}
