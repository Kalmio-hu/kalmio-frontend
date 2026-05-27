/**
 * GraduationReveal — KALMIO-143 / E6.4
 *
 * Full-screen modal shown exactly once when the user's stage reaches TERMO
 * (graduation). Displays the DiofaWidget in its full fruiting-canopy state,
 * the canonical graduation copy, a "Download certificate" button that opens
 * the bilingual PDF, a "View grove" placeholder button (wired up in KALMIO-144
 * E6.5), and a dismiss button.
 *
 * Non-repeat guarantee: on dismiss, writes `kalmio:graduationRevealShown` to
 * localStorage via markGraduationRevealShown(). The parent controls rendering
 * via a `showGraduationReveal` flag derived from the `GET /api/users/me/stage`
 * query result.
 *
 * Trigger: parent detects `currentStage === 'TERMO'` and
 * `!hasGraduationRevealBeenShown()`. See MealPlan.tsx.
 *
 * Accessibility: focus-trapped modal with role="dialog". Dismiss via the
 * close button or Escape key. All interactive elements are keyboard-reachable.
 *
 * Mobile-first: designed at 375px, scales naturally.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type Variants, type Easing } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Download, TreePine, X } from 'lucide-react'
import { DiofaWidget } from '@/components/diofa/DiofaWidget'
import { markGraduationRevealShown } from '@/lib/firstPlanReveal'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraduationRevealProps {
  /** Called after the user dismisses the reveal. Parent should hide the modal. */
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
    transition: { type: 'spring', stiffness: 240, damping: 24, delay: 0.12 },
  },
  exit: {
    opacity: 0, y: 28, scale: 0.96,
    transition: { duration: 0.22, ease: EASE_IN },
  },
}

// The TERMO DiofaWidget "fully fruits" after a short delay so the panel
// entrance animation completes before the tree blooms.
const TREE_BLOOM_DELAY_MS = 750

// ─── Component ────────────────────────────────────────────────────────────────

export function GraduationReveal({ onDismiss }: GraduationRevealProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id ?? null)
  const dismissRef = useRef<HTMLButtonElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDismiss = useCallback(() => {
    markGraduationRevealShown(userId)
    onDismiss()
  }, [onDismiss, userId])

  // Delay TERMO widget render so the entrance animation plays first.
  const [treeReady, setTreeReady] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setTreeReady(true), TREE_BLOOM_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  // Focus the primary action button once the panel is visible.
  useEffect(() => {
    const id = window.setTimeout(() => dismissRef.current?.focus(), 450)
    return () => window.clearTimeout(id)
  }, [])

  // Keyboard: Escape closes the modal.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleDismiss])

  async function handleDownloadCertificate() {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      // Use the Axios instance so the Bearer-token interceptor fires.
      // window.open would bypass the interceptor and return a 401.
      const res = await api.get('/api/users/me/graduation-certificate.pdf', {
        responseType: 'blob',
      })
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = 'kalmio-tanusitvany.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="graduation-reveal-backdrop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 px-4 pb-4 sm:pb-0"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={t('onboarding.graduation.ariaLabel')}
        onClick={e => {
          if (e.target === e.currentTarget) handleDismiss()
        }}
      >
        {/* Panel */}
        <motion.div
          key="graduation-reveal-panel"
          className="relative w-full max-w-sm bg-[#F5EDD8] rounded-2xl overflow-hidden shadow-2xl"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Close button — top-right, keyboard accessible */}
          <button
            type="button"
            onClick={handleDismiss}
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

          {/* DiofaWidget — blooms from FIATAL → TERMO after delay */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={treeReady ? 'termo' : 'fiatal'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                <DiofaWidget
                  stage={treeReady ? 'TERMO' : 'FIATAL'}
                  moisture="OK"
                  className="rounded-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Stage caption — fades in with the TERMO frame */}
            <AnimatePresence>
              {treeReady && (
                <motion.p
                  key="termo-caption"
                  className="absolute bottom-3 left-0 right-0 text-center text-xs font-medium text-[#3d2008]/75 px-4"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.4 } }}
                  exit={{ opacity: 0 }}
                >
                  {t('onboarding.graduation.treeCaption')}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Copy block */}
          <div className="px-6 pt-4 pb-6 text-center space-y-2">
            <h2 className="font-headline font-bold text-lg text-[#1A1A1A] leading-snug">
              {t('onboarding.graduation.title')}
            </h2>
            <p className="text-sm text-[#3d2008]/80 leading-relaxed">
              {t('onboarding.graduation.body')}
            </p>
          </div>

          {/* Action buttons */}
          <div className="px-6 pb-6 space-y-2.5">
            {/* Primary: Download certificate */}
            <button
              ref={dismissRef}
              type="button"
              disabled={isDownloading}
              aria-busy={isDownloading}
              onClick={handleDownloadCertificate}
              className="
                w-full flex items-center justify-center gap-2
                rounded-xl bg-[#4F7942] text-white
                px-6 py-3 text-sm font-semibold
                hover:bg-[#3e6133]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isDownloading
                ? t('onboarding.graduation.downloadingCertificate')
                : t('onboarding.graduation.downloadCertificate')}
            </button>

            {/* Secondary: View grove — KALMIO-144 */}
            <button
              type="button"
              onClick={() => { markGraduationRevealShown(userId); navigate('/app/grove') }}
              className="
                w-full flex items-center justify-center gap-2
                rounded-xl bg-transparent border border-[#4F7942]/50 text-[#3d2008]
                px-6 py-3 text-sm font-medium
                hover:bg-[#e8d9b8]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#4F7942] focus-visible:ring-offset-2
                transition-colors
              "
              aria-label={t('onboarding.graduation.viewGroveAriaLabel')}
            >
              <TreePine className="h-4 w-4 text-[#4F7942]" aria-hidden="true" />
              {t('onboarding.graduation.viewGrove')}
            </button>

            {/* Tertiary: plain dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              className="
                w-full text-center text-xs text-[#3d2008]/55
                hover:text-[#3d2008]/80
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#4F7942] focus-visible:ring-offset-1
                py-1 transition-colors
              "
            >
              {t('onboarding.graduation.dismiss')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
