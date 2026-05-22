import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { useAuthStore } from '@/store/auth'
import { posts, type BlogCategory } from '@/data/blog'

const CATEGORIES: BlogCategory[] = ['Roadmap', 'Feature', 'Nutrition', 'News']

const categoryColor: Record<BlogCategory, string> = {
  Roadmap: 'bg-[#F28C28]/15 text-[#F28C28]',
  Feature: 'bg-[#4F7942]/15 text-[#4F7942]',
  Nutrition: 'bg-blue-500/15 text-blue-600',
  News: 'bg-purple-500/15 text-purple-600',
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
}

export function BlogIndex() {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [activeCategory, setActiveCategory] = useState<BlogCategory | 'all'>('all')

  const isHu = i18n.language === 'hu'

  const filtered = posts
    .filter((p) => activeCategory === 'all' || p.category === activeCategory)
    .sort((a, b) => b.date.localeCompare(a.date))

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isHu ? 'hu-HU' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <div className="w-full min-h-screen bg-[#F9F7F2] overflow-x-hidden">
      {/* Nav */}
      <nav className="bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/assets/images/logo.png" alt="Kalmio" className="h-10 object-contain object-left" />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
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

      {/* Hero */}
      <section className="bg-[#1A1A1A] pb-16 pt-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[#F28C28] font-semibold text-sm uppercase tracking-widest mb-3"
          >
            Kalmio Blog
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-headline text-4xl sm:text-5xl font-bold text-white mb-4"
          >
            {t('blog.indexTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-white/60 text-lg max-w-xl"
          >
            {t('blog.indexSubtitle')}
          </motion.p>
        </div>
      </section>

      {/* Category filter */}
      <div className="border-b border-[#1A1A1A]/10 bg-[#F9F7F2] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#1A1A1A] text-white'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
            }`}
          >
            {t('blog.categories.all')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
              }`}
            >
              {t(`blog.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <p className="text-[#1A1A1A]/40 text-center py-20">{t('blog.empty')}</p>
          ) : (
            <motion.div
              key={activeCategory}
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((post) => (
                <motion.article key={post.slug} variants={fadeUp}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="block bg-white rounded-3xl p-7 border border-[#1A1A1A]/8 hover:border-[#1A1A1A]/20 hover:shadow-md transition-all h-full group"
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
                    <h2 className="font-headline font-bold text-lg text-[#1A1A1A] leading-snug mb-3 group-hover:text-[#F28C28] transition-colors">
                      {isHu ? post.titleHu : post.titleEn}
                    </h2>
                    <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4 line-clamp-3">
                      {isHu ? post.excerptHu : post.excerptEn}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1A1A1A]/8">
                      <time className="text-[#1A1A1A]/40 text-xs">{formatDate(post.date)}</time>
                      <span className="text-[#F28C28] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        {t('blog.readMore')} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <LegalFooter variant="dark" />
    </div>
  )
}
