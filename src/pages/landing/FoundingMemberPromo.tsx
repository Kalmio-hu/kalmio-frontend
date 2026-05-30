/**
 * FoundingMemberPromo — KALMIO-20
 *
 * Live counter block for the landing page.
 * Fetches GET /api/founding-member/availability every 30 s (matches Cache-Control max-age=30).
 * Hides when remaining === 0 and shows the sold-out state instead.
 * Gated by VITE_PREMIUM_ENABLED=true — returns null when the flag is absent.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { useAuthStore } from '@/store/auth'

const PREMIUM_ENABLED = import.meta.env.VITE_PREMIUM_ENABLED === 'true'

export function FoundingMemberPromo() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const { data } = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
    refetchInterval: 30_000,
    enabled: PREMIUM_ENABLED,
    // Soft failure: if the endpoint hasn't shipped yet, don't explode.
    retry: false,
  })

  // Feature flag gate — block is invisible unless VITE_PREMIUM_ENABLED=true.
  if (!PREMIUM_ENABLED) return null

  // Don't render the block at all until we have data (avoids layout flash).
  if (!data) return null

  // Guest-first: unauthenticated visitors go straight to the public checkout page
  // (pay first, register after). Logged-in users use the authenticated buy page.
  const ctaTarget = user ? '/app/founding-member' : '/founding-member'
  const isSoldOut = data.remaining === 0

  if (isSoldOut) {
    return (
      <section
        aria-label={t('landing.foundingMember.label')}
        className="bg-[#1A1A1A] py-16 sm:py-20 px-6 border-t border-white/8"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="font-headline font-bold text-white/50 text-xl sm:text-2xl">
            {t('landing.foundingMember.soldOut')}
          </p>
        </motion.div>
      </section>
    )
  }

  return (
    <section
      aria-label={t('landing.foundingMember.label')}
      className="bg-[#1A1A1A] py-16 sm:py-20 px-6 border-t border-white/8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Label chip */}
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
          {t('landing.foundingMember.label')}
        </p>

        {/* Visual centrepiece heading — AC requirement */}
        <h2 className="text-3xl font-semibold text-white mb-4">
          {t('landing.foundingMember.headline')}
        </h2>

        {/* Sub-headline */}
        <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6">
          {t('landing.foundingMember.sub')}
        </p>

        {/* Live counter */}
        <p className="font-headline font-bold text-white text-2xl sm:text-3xl leading-snug mb-8">
          {t('landing.foundingMember.counter', { remaining: data.remaining })}
        </p>

        {/* Progress bar — visual reinforcement of scarcity */}
        <div
          role="progressbar"
          aria-valuenow={data.soldCount}
          aria-valuemin={0}
          aria-valuemax={data.cap}
          aria-label={t('landing.foundingMember.counter', { remaining: data.remaining })}
          className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden"
        >
          <div
            className="h-full bg-[#F28C28] rounded-full transition-all duration-700"
            style={{ width: `${Math.round((data.soldCount / data.cap) * 100)}%` }}
          />
        </div>

        {/* CTA */}
        <Link
          to={ctaTarget}
          className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
        >
          {t('landing.foundingMember.cta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  )
}
