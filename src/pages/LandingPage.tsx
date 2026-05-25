import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { useAuthStore } from '@/store/auth'
import { ArrowRight, CheckCircle2, XCircle, Clock, Leaf, ShoppingCart } from 'lucide-react'
import { getLatestPostsForLanding, type BlogCategory } from '@/data/blog'
import { FoundingMemberPromo } from '@/pages/landing/FoundingMemberPromo'

const categoryColor: Record<BlogCategory, string> = {
  Roadmap: 'bg-[#F28C28]/15 text-[#F28C28]',
  Feature: 'bg-[#4F7942]/15 text-[#4F7942]',
  Nutrition: 'bg-blue-500/15 text-blue-600',
  News: 'bg-purple-500/15 text-purple-600',
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

function BlogPreviewSection() {
  const { t, i18n } = useTranslation()
  const isHu = i18n.language === 'hu'
  const latestPosts = getLatestPostsForLanding(2)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isHu ? 'hu-HU' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  if (latestPosts.length === 0) return null

  return (
    <section className="bg-[#F9F7F2] py-20 sm:py-24 px-6 border-t border-[#1A1A1A]/8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex items-baseline justify-between mb-10"
        >
          <div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {t('blog.preview.title')}
            </h2>
            <p className="text-[#1A1A1A]/50 text-sm mt-1">{t('blog.preview.subtitle')}</p>
          </div>
          <Link
            to="/blog"
            className="text-[#F28C28] text-sm font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity whitespace-nowrap ml-4"
          >
            {t('blog.seeAll')} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {latestPosts.map((post) => (
            <motion.article key={post.slug} variants={fadeUp}>
              <Link
                to={`/blog/${post.slug}`}
                className="block bg-white rounded-3xl p-7 border border-[#1A1A1A]/8 hover:border-[#1A1A1A]/18 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColor[post.category]}`}>
                    {t(`blog.categories.${post.category}`)}
                  </span>
                  <span className="text-[#1A1A1A]/40 text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('blog.minRead', { min: post.readingTimeMin })}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-lg text-[#1A1A1A] leading-snug mb-2 group-hover:text-[#F28C28] transition-colors">
                  {isHu ? post.titleHu : post.titleEn}
                </h3>
                <p className="text-[#1A1A1A]/55 text-sm leading-relaxed line-clamp-2 mb-4">
                  {isHu ? post.excerptHu : post.excerptEn}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]/8">
                  <time className="text-[#1A1A1A]/40 text-xs">{formatDate(post.date)}</time>
                  <span className="text-[#F28C28] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('blog.readMore')} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const painPoints = [
    {
      icon: <Leaf className="h-6 w-6" />,
      problem: t('landing.pain.myth1.problem'),
      solution: t('landing.pain.myth1.solution'),
    },
    {
      icon: <ShoppingCart className="h-6 w-6" />,
      problem: t('landing.pain.myth2.problem'),
      solution: t('landing.pain.myth2.solution'),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      problem: t('landing.pain.myth3.problem'),
      solution: t('landing.pain.myth3.solution'),
    },
  ]

  const steps = [
    { num: '01', title: t('landing.steps.step1.title'), desc: t('landing.steps.step1.desc') },
    { num: '02', title: t('landing.steps.step2.title'), desc: t('landing.steps.step2.desc') },
    { num: '03', title: t('landing.steps.step3.title'), desc: t('landing.steps.step3.desc') },
  ]

  return (
    <div className="w-full min-h-screen bg-[#F9F7F2] overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#1A1A1A] shadow-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img
              src={scrolled ? '/assets/images/logo.png' : '/assets/images/logo-dark.png'}
              alt="Kalmio"
              className="h-10 object-contain object-left"
            />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/blog"
              className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-white/60 hover:text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {t('blog.nav')}
            </Link>
            <Link
              to="/app/plans"
              className="inline-flex items-center gap-1.5 bg-[#F28C28] text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              {user ? t('landing.nav.ctaLoggedIn') : t('landing.nav.cta')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center text-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/assets/hero_anim.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        <div className="relative z-10 text-white px-6 max-w-3xl mx-auto">
          {/* KALMIO-405 — cumulative animation delays (was 0.2 → 0.65s) left
              the hero blank for ~1.2s on cold load, which read as a broken
              page. Render content immediately; the fade-in (no y-shift, no
              delay) is still elegant but never leaves a void. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-[#F28C28] font-semibold text-sm uppercase tracking-widest mb-4"
          >
            {t('landing.hero.label')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6"
          >
            {t('landing.hero.headline')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/80 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            {t('landing.hero.subheadline')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/app/plans"
              className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-lg px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              {user ? t('landing.hero.ctaLoggedIn') : t('landing.hero.cta')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Pain Points ── */}
      <section className="bg-[#1A1A1A] py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white">
              {t('landing.pain.title')}
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {painPoints.map(({ icon, problem, solution }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white/5 border border-white/10 rounded-3xl p-8"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-[#F28C28]"
                  style={{ background: 'rgba(242,140,40,0.12)' }}
                >
                  {icon}
                </div>
                <div className="flex items-start gap-2 mb-3">
                  <XCircle className="h-4 w-4 text-red-400/70 shrink-0 mt-0.5" />
                  <p className="text-white/40 text-sm line-through leading-snug">{problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4F7942] shrink-0 mt-0.5" />
                  <p className="text-white font-medium leading-snug">{solution}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOMO Strip ── */}
      <section className="bg-[#F28C28] py-16 sm:py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="font-headline font-bold text-white text-xl sm:text-2xl leading-relaxed mb-8">
            {t('landing.fomo.text')}
          </p>
          <Link
            to="/app/plans"
            className="inline-flex items-center gap-2 bg-white text-[#F28C28] font-bold text-base px-8 py-4 rounded-full hover:bg-white/90 transition-colors"
          >
            {user ? t('landing.hero.ctaLoggedIn') : t('landing.hero.cta')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-[#F9F7F2] py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-[#1A1A1A]">
              {t('landing.steps.title')}
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {steps.map(({ num, title, desc }) => (
              <motion.div key={num} variants={fadeUp}>
                <div className="font-headline text-7xl font-bold leading-none mb-3 select-none"
                  style={{ color: 'rgba(242,140,40,0.18)' }}
                >
                  {num}
                </div>
                <h3 className="font-headline font-bold text-xl text-[#1A1A1A] mb-2">{title}</h3>
                <p className="text-[#1A1A1A]/60 leading-relaxed text-sm">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Blog Preview ── */}
      <BlogPreviewSection />

      {/* ── Founding Member Promo ── */}
      <FoundingMemberPromo />

      {/* ── Final CTA ── */}
      <section className="bg-[#1A1A1A] py-20 sm:py-28 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white mb-4">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-white/60 text-lg mb-10">
            {t('landing.finalCta.subtitle')}
          </p>
          <Link
            to="/app/plans"
            className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-lg px-10 py-4 rounded-full transition-colors"
          >
            {user ? t('landing.finalCta.buttonLoggedIn') : t('landing.finalCta.button')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <LegalFooter variant="dark" />
    </div>
  )
}
