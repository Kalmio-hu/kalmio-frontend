import { useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowLeft, Clock } from 'lucide-react'
import { marked } from 'marked'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { useAuthStore } from '@/store/auth'
import { getPost, type BlogCategory } from '@/data/blog'

const categoryColor: Record<BlogCategory, string> = {
  Roadmap: 'bg-[#F28C28]/15 text-[#F28C28]',
  Feature: 'bg-[#4F7942]/15 text-[#4F7942]',
  Nutrition: 'bg-blue-500/15 text-blue-600',
  News: 'bg-purple-500/15 text-purple-600',
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const post = slug ? getPost(slug) : undefined

  const isHu = i18n.language === 'hu'

  const html = useMemo(() => {
    if (!post) return ''
    const md = isHu ? post.contentHu : post.contentEn
    return marked.parse(md) as string
  }, [post, isHu])

  if (!post) return <Navigate to="/blog" replace />

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isHu ? 'hu-HU' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const title = isHu ? post.titleHu : post.titleEn

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

      {/* Article header */}
      <section className="bg-[#1A1A1A] pb-16 pt-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('blog.backToBlog')}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColor[post.category]}`}>
                {t(`blog.categories.${post.category}`)}
              </span>
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('blog.minRead', { min: post.readingTimeMin })}
              </span>
              <time className="text-white/40 text-xs">{formatDate(post.date)}</time>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              {title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Article body */}
      <section className="py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </motion.div>
      </section>

      {/* Back link */}
      <div className="pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[#F28C28] font-semibold text-sm hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('blog.backToBlog')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <LegalFooter variant="dark" />
    </div>
  )
}
