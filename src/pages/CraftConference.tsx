/**
 * CraftConference — /craft
 *
 * Public landing page for Craft Conference 2026 networking.
 * Goal: convert conference attendees into Founding Members via Barion checkout.
 * Flow: unauthenticated → /auth?next=/app/founding-member, authenticated → /app/founding-member.
 */

import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Zap, ShieldCheck, Users, ArrowRight, Check, Sparkles } from 'lucide-react'
import { foundingMemberService } from '@/services/foundingMember'
import { useAuthStore } from '@/store/auth'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import craftHero from '@/assets/craft-hero.png'

const ORANGE = '#F28C28'
const ORANGE_DARK = '#D97316'

function OrangeCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 font-bold text-sm sm:text-lg px-6 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg w-full sm:w-auto justify-center whitespace-nowrap"
      style={{ backgroundColor: ORANGE, color: '#111111' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = ORANGE_DARK)}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = ORANGE)}
    >
      {label}
      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
    </button>
  )
}

export function CraftConference() {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const navigate = useNavigate()

  const { data: availability } = useQuery({
    queryKey: ['founding-member', 'availability'],
    queryFn: foundingMemberService.getAvailability,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  })

  const isSoldOut = availability ? availability.remaining === 0 : false
  const remaining = availability?.remaining ?? null
  const soldPct = availability ? Math.round((availability.soldCount / availability.cap) * 100) : 0

  function handleCta() {
    navigate(session ? '/app/founding-member' : '/auth?next=/app/founding-member')
  }

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])

  const freeItems: string[] = t('craft.free.freeItems', { returnObjects: true }) as string[]
  const premiumItems: string[] = t('craft.free.premiumItems', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen w-full bg-[#111111] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 bg-[#111111]/80 backdrop-blur-sm border-b border-white/5">
        <Link to="/">
          <img src="/assets/images/logo.png" alt="Kalmio" className="h-8 object-contain" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs font-semibold uppercase tracking-widest hidden sm:block" style={{ color: ORANGE }}>
            {t('craft.navTag')}
          </span>
          <LanguageSwitcher />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
      >
        <motion.div className="absolute inset-0 w-full h-full" style={{ y: imgY }}>
          <img
            src={craftHero}
            alt=""
            role="presentation"
            className="w-full h-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-transparent to-[#111111]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/40 to-transparent" />
        </motion.div>

        <div className="relative z-10 w-full max-w-2xl mx-auto px-5 sm:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-5"
            style={{ color: ORANGE }}
          >
            {t('craft.hero.eyebrow')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-5"
          >
            {t('craft.hero.headline')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg sm:text-2xl text-white/70 leading-relaxed mb-8 max-w-lg mx-auto"
          >
            {t('craft.hero.sub')}
          </motion.p>

          {remaining !== null && !isSoldOut && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mb-8"
            >
              <p className="text-sm text-white/50 mb-3">
                <Trans
                  i18nKey="craft.hero.scarcity"
                  values={{ remaining }}
                  components={{ strong: <span className="text-white font-bold text-base" /> }}
                />
              </p>
              <div className="w-40 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${soldPct}%`, backgroundColor: ORANGE }}
                />
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            {isSoldOut ? (
              <p className="text-white/40 text-lg font-semibold">{t('craft.hero.soldOut')}</p>
            ) : (
              <OrangeCta label={t('craft.hero.cta')} onClick={handleCta} />
            )}
            <p className="text-xs text-white/30 text-center leading-relaxed">{t('craft.hero.ctaHint')}</p>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/25" />
        </motion.div>
      </section>

      {/* ── What is Kalmio ── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 bg-[#111111]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: ORANGE }}>
              {t('craft.what.eyebrow')}
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
              {t('craft.what.headline')}
            </h2>
            <p
              className="text-white/60 text-base sm:text-lg leading-relaxed max-w-xl mb-4"
              dangerouslySetInnerHTML={{ __html: t('craft.what.body') }}
            />
            <p className="text-white/30 text-sm italic">{t('craft.what.aiNote')}</p>
          </motion.div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-12 sm:py-16 px-5 sm:px-8 bg-[#0E0E0E] border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {([
            { icon: <Zap className="h-5 w-5" />, key: 'f1' },
            { icon: <ShieldCheck className="h-5 w-5" />, key: 'f2' },
            { icon: <Users className="h-5 w-5" />, key: 'f3' },
          ] as const).map(({ icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="rounded-2xl p-5 sm:p-6 border border-white/8 bg-white/[0.02]"
            >
              <div className="mb-4" style={{ color: ORANGE }}>{icon}</div>
              <h3 className="font-bold text-base sm:text-lg mb-2">{t(`craft.features.${key}.title`)}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{t(`craft.features.${key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Free vs Premium ── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: ORANGE }}>
              {t('craft.free.eyebrow')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-5 max-w-2xl">
              {t('craft.free.headline')}
            </h2>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl mb-10">
              {t('craft.free.body')}
            </p>

            {/* Free / Premium split table */}
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-6 text-white/40">
              {t('craft.free.splitTitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-10">
              {/* Free column */}
              <div className="rounded-2xl p-5 sm:p-6 border border-white/10 bg-white/[0.02]">
                <p className="font-bold text-sm uppercase tracking-widest text-white/50 mb-4">
                  {t('craft.free.free')}
                </p>
                <ul className="space-y-3">
                  {freeItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-white/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium column */}
              <div className="rounded-2xl p-5 sm:p-6 border border-white/10 bg-white/[0.02] relative overflow-hidden">
                {/* "not yet available" ribbon */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/8 rounded-full px-2.5 py-1">
                  <Sparkles className="h-3 w-3" style={{ color: ORANGE }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ORANGE }}>
                    Early access
                  </span>
                </div>
                <p className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: ORANGE }}>
                  {t('craft.free.premium')}
                </p>
                <ul className="space-y-3 mb-5">
                  {premiumItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/70">
                      <Sparkles className="h-4 w-4 shrink-0 mt-0.5" style={{ color: ORANGE }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p
                  className="text-xs text-white/40 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('craft.free.premiumNote') }}
                />
              </div>
            </div>

            {/* Pricing comparison */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-5 text-white/40">
                {t('craft.free.pricing.title')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Monthly */}
                <div className="rounded-xl p-5 border border-white/8 bg-white/[0.02] text-center">
                  <p className="text-xl font-bold text-white mb-1">{t('craft.free.pricing.monthly')}</p>
                  <p className="text-xs text-white/40">{t('craft.free.pricing.monthlyHint')}</p>
                </div>
                {/* Yearly */}
                <div className="rounded-xl p-5 border border-white/8 bg-white/[0.02] text-center">
                  <p className="text-xl font-bold text-white mb-1">{t('craft.free.pricing.yearly')}</p>
                  <p className="text-xs text-white/40">{t('craft.free.pricing.yearlyHint')}</p>
                </div>
                {/* Founding — highlighted */}
                <div className="rounded-xl p-5 border text-center relative" style={{ borderColor: `${ORANGE}60`, backgroundColor: `${ORANGE}10` }}>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ backgroundColor: ORANGE, color: '#111' }}>
                    {t('craft.free.pricing.foundingBadge')}
                  </div>
                  <p className="text-xl font-bold mb-1" style={{ color: ORANGE }}>{t('craft.free.pricing.founding')}</p>
                  <p className="text-xs text-white/50">{t('craft.free.pricing.foundingHint')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mission / North Karelia ── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 bg-[#0A0A0A] border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: ORANGE }}>
              {t('craft.mission.eyebrow')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight mb-8">
              {t('craft.mission.headline')}
            </h2>

            <p
              className="text-white/70 text-base sm:text-lg leading-relaxed mb-5"
              dangerouslySetInnerHTML={{ __html: t('craft.mission.body') }}
            />
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-5">
              {t('craft.mission.hungaryBody')}
            </p>
            <p
              className="text-white/60 text-base sm:text-lg leading-relaxed mb-10"
              dangerouslySetInnerHTML={{ __html: t('craft.mission.kalmioBody') }}
            />

            {/* Three pillars */}
            <div className="grid grid-cols-3 gap-3 max-w-xs">
              {(['pillar1', 'pillar2', 'pillar3'] as const).map((p, i) => (
                <div
                  key={p}
                  className="rounded-xl p-3 text-center text-xs font-semibold border"
                  style={
                    i === 0
                      ? { borderColor: `${ORANGE}60`, backgroundColor: `${ORANGE}12`, color: ORANGE }
                      : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {i !== 0 && <span className="block text-[10px] opacity-50 mb-0.5">Soon</span>}
                  {t(`craft.mission.${p}`)}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Founding Member pitch ── */}
      <section className="py-20 sm:py-28 px-5 sm:px-8 bg-[#111111]">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: ORANGE }}>
              {t('craft.pitch.eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6 whitespace-pre-line">
              {t('craft.pitch.headline')}
            </h2>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10">
              {t('craft.pitch.body')}
            </p>

            {/* Price */}
            {availability && (
              <div
                className="inline-block rounded-2xl border px-8 sm:px-10 py-6 sm:py-8 mb-8"
                style={{ borderColor: `${ORANGE}40`, backgroundColor: `${ORANGE}08` }}
              >
                <p className="text-4xl sm:text-5xl font-extrabold mb-1" style={{ color: ORANGE }}>
                  {availability.price.toLocaleString('hu-HU')} {availability.currency}
                </p>
                <p className="text-white/40 text-sm">{t('craft.pitch.priceHint')}</p>
              </div>
            )}

            {/* Scarcity */}
            {remaining !== null && !isSoldOut && (
              <div className="mb-8">
                <p className="text-white/50 text-sm mb-3">
                  <Trans
                    i18nKey="craft.pitch.scarcity"
                    values={{ remaining }}
                    components={{ strong: <span className="text-white font-semibold" /> }}
                  />
                </p>
                <div
                  role="progressbar"
                  aria-valuenow={availability?.soldCount ?? 0}
                  aria-valuemin={0}
                  aria-valuemax={availability?.cap ?? 100}
                  className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${soldPct}%`, backgroundColor: ORANGE }}
                  />
                </div>
              </div>
            )}

            {isSoldOut ? (
              <p className="text-white/40 text-lg font-semibold">{t('craft.pitch.soldOut')}</p>
            ) : (
              <OrangeCta label={t('craft.pitch.cta')} onClick={handleCta} />
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 sm:py-12 px-5 border-t border-white/5 text-center">
        <Link to="/" className="inline-flex justify-center mb-3">
          <img src="/assets/images/logo.png" alt="Kalmio" className="h-7 object-contain" />
        </Link>
        <p className="text-white/30 text-xs mb-4">hello@kalmio.hu · kalmio.hu</p>
        <div className="flex items-center justify-center gap-4 text-xs text-white/20">
          <Link to="/privacy" className="hover:text-white/40 transition-colors">{t('footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-white/40 transition-colors">{t('footer.terms')}</Link>
        </div>
      </footer>
    </div>
  )
}
