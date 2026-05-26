/**
 * FounderFarewellModal — KALMIO-456
 *
 * Shown exactly once when the user navigates away from the plan view after
 * their first plan has been generated and viewed. Displays a personal note
 * from the founder and surfaces the feedback form inline (desktop) or via a
 * CTA that opens the side panel (mobile).
 *
 * Non-repeat guarantee: localStorage key `kalmio:founderFarewellShown`.
 *
 * Layout:
 *   - Mobile (< md): message card → CTA opens the FeedbackPanel slide-over.
 *   - Desktop (md+): split panel — founder note on the left, feedback form
 *     rendered inline on the right, mirroring the CsemeteWelcomeMoment pattern.
 *
 * Accessibility: focus-trapped modal, role="dialog". Dismiss via Close button
 * or Escape key. Keyboard-reachable.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, MessageSquarePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { feedbackService } from '@/services/feedback'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toast'
import { capture } from '@/lib/analytics'
import type { FeedbackType } from '@/types'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FounderFarewellModalProps {
  /** Called after the user dismisses the overlay. Parent should stop rendering. */
  onDismiss: () => void
}

// ─── Animation variants (mirrors CsemeteWelcomeMoment) ───────────────────────

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

// ─── Inline feedback form (desktop right panel + mobile CTA) ─────────────────

type FormState = 'idle' | 'submitting' | 'done'

interface InlineFeedbackFormProps {
  /** Called after the form submits successfully. */
  onSubmitted: () => void
}

function InlineFeedbackForm({ onSubmitted }: InlineFeedbackFormProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const qc = useQueryClient()
  const [type, setType] = useState<FeedbackType>('SUGGESTION')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')

  const mutation = useMutation({
    mutationFn: () => feedbackService.create({
      type,
      title: title.trim(),
      description: description.trim(),
      page: location.pathname,
    }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feedback'] })
      capture('feedback_submitted', { feedback_type: type, page: location.pathname, source: 'founder_farewell_modal' })
      setFormState('done')
      onSubmitted()
    },
    onError: () => {
      setFormState('idle')
      toast({ title: t('feedback.error'), variant: 'destructive' })
    },
    onMutate: () => setFormState('submitting'),
  })

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && formState === 'idle'

  return (
    <div className="flex flex-col gap-3">
      {/* Type selector */}
      <div>
        <p className="text-[11px] text-[#3d2008]/50 uppercase tracking-wide mb-1.5">
          {t('feedback.typeLabel')}
        </p>
        <div className="flex gap-1.5">
          {(['BUG', 'SUGGESTION', 'OTHER'] as FeedbackType[]).map(feedbackType => (
            <button
              key={feedbackType}
              type="button"
              onClick={() => setType(feedbackType)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                type === feedbackType
                  ? 'bg-[#4F7942] text-white'
                  : 'bg-[#3d2008]/10 text-[#3d2008]/70 hover:bg-[#3d2008]/20'
              )}
            >
              {t(`feedback.types.${feedbackType}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-[11px] text-[#3d2008]/50 uppercase tracking-wide mb-1.5 block">
          {t('feedback.titleLabel')} *
        </label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('feedback.titlePlaceholder')}
          maxLength={255}
          disabled={formState !== 'idle'}
          className="w-full bg-white/50 border border-[#3d2008]/20 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#3d2008]/30 focus:outline-none focus:border-[#4F7942] transition-colors disabled:opacity-60"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] text-[#3d2008]/50 uppercase tracking-wide mb-1.5 block">
          {t('feedback.descriptionLabel')} *
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('onboarding.founderFarewell.formPlaceholder')}
          rows={4}
          disabled={formState !== 'idle'}
          className="w-full bg-white/50 border border-[#3d2008]/20 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#3d2008]/30 focus:outline-none focus:border-[#4F7942] transition-colors resize-none disabled:opacity-60"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!canSubmit}
        className="w-full rounded-xl bg-[#4F7942] text-white px-6 py-3 text-sm font-semibold hover:bg-[#3e6133] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] focus-visible:ring-offset-2 transition-colors disabled:opacity-40"
      >
        {formState === 'submitting'
          ? t('feedback.sending')
          : t('onboarding.founderFarewell.cta')}
      </button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FounderFarewellModal({ onDismiss }: FounderFarewellModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const ctaRef = useRef<HTMLButtonElement>(null)

  // Track whether the form has been submitted so we can show a thank-you nudge.
  const [formSubmitted, setFormSubmitted] = useState(false)
  // On mobile, track whether the feedback panel was opened via the secondary CTA.
  const [showMobileForm, setShowMobileForm] = useState(false)

  // Focus the primary CTA once the panel has settled.
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

  function handleNavigateToFeedback() {
    onDismiss()
    navigate('/app/feedback')
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="founder-farewell-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 px-4 pb-4 sm:pb-0"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.founderFarewell.ariaLabel')}
        onClick={e => {
          if (e.target === e.currentTarget) onDismiss()
        }}
      >
        {/* Panel */}
        <motion.div
          key="founder-farewell-panel"
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

          {/* Left column: founder message */}
          <div className="md:flex-1 md:flex md:flex-col md:justify-center md:py-8 md:pl-8 md:pr-4">
            {/* Founder icon */}
            <div className="px-6 pt-6 pb-2 flex items-center gap-3 md:px-0 md:pt-0">
              <div className="w-10 h-10 rounded-full bg-[#4F7942]/20 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="h-5 w-5 text-[#4F7942]" aria-hidden />
              </div>
              <span className="text-xs font-medium text-[#3d2008]/60 uppercase tracking-wide">
                {t('onboarding.founderFarewell.founderRole')}
              </span>
            </div>

            {/* Copy block */}
            <div className="px-6 pt-2 pb-3 text-left space-y-3 md:px-0">
              <h2 className="font-headline font-bold text-lg md:text-xl text-[#1A1A1A] leading-snug">
                {t('onboarding.founderFarewell.title')}
              </h2>

              {/* Founder line — styled as a personal note */}
              <blockquote
                className="
                  text-sm text-[#3d2008]/80 leading-relaxed
                  border-l-2 border-[#4F7942]/40
                  pl-4 italic
                "
              >
                {t('onboarding.founderFarewell.founderLine')}
              </blockquote>

              <p className="text-xs text-[#3d2008]/55 text-right pr-1">
                — {t('onboarding.founderFarewell.founderName')}
              </p>
            </div>

            {/* Mobile: CTA buttons (no inline form on mobile) */}
            <div className="md:hidden px-6 pb-6 pt-1 flex flex-col gap-2">
              {!showMobileForm ? (
                <>
                  <button
                    ref={ctaRef}
                    type="button"
                    onClick={() => setShowMobileForm(true)}
                    className="
                      w-full rounded-xl bg-[#4F7942] text-white
                      px-6 py-3 text-sm font-semibold
                      hover:bg-[#3e6133]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                      transition-colors
                    "
                  >
                    {t('onboarding.founderFarewell.cta')}
                  </button>
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="
                      w-full rounded-xl bg-transparent text-[#3d2008]/60
                      px-6 py-2 text-sm font-medium
                      hover:text-[#3d2008]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                      transition-colors
                    "
                  >
                    {t('onboarding.founderFarewell.skip')}
                  </button>
                </>
              ) : (
                <InlineFeedbackForm
                  onSubmitted={() => {
                    setFormSubmitted(true)
                    window.setTimeout(() => onDismiss(), 1400)
                  }}
                />
              )}
              {formSubmitted && (
                <p className="text-center text-xs text-[#4F7942] font-medium mt-1">
                  {t('onboarding.founderFarewell.thankyou')}
                </p>
              )}
            </div>
          </div>

          {/* Right column on md+: inline feedback form */}
          <div className="hidden md:flex md:flex-1 md:flex-col md:justify-center md:py-8 md:pr-8 md:pl-4 border-l border-[#e8d9b8]/60">
            <p className="text-xs font-semibold text-[#3d2008]/60 uppercase tracking-wide mb-3">
              {t('onboarding.founderFarewell.formHeading')}
            </p>
            {formSubmitted ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-8"
              >
                <p className="text-sm font-semibold text-[#4F7942]">
                  {t('onboarding.founderFarewell.thankyou')}
                </p>
                <p className="text-xs text-[#3d2008]/60 mt-1">
                  {t('onboarding.founderFarewell.thankyouBody')}
                </p>
                <button
                  ref={ctaRef}
                  type="button"
                  onClick={onDismiss}
                  className="
                    mt-4 rounded-xl bg-[#4F7942] text-white
                    px-6 py-2.5 text-sm font-semibold
                    hover:bg-[#3e6133]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                    transition-colors
                  "
                >
                  {t('onboarding.founderFarewell.closeAfterSend')}
                </button>
              </motion.div>
            ) : (
              <>
                <InlineFeedbackForm
                  onSubmitted={() => {
                    setFormSubmitted(true)
                  }}
                />
                {/* Secondary: navigate to feedback page */}
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={handleNavigateToFeedback}
                    className="mt-3 text-xs text-[#4F7942] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] transition-colors"
                  >
                    {t('onboarding.founderFarewell.viewAllFeedback')}
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
