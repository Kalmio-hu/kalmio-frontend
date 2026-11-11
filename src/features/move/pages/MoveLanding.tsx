/**
 * Public landing at /move (D8 rule 9): what Move is, "heti háromszor 15 perc,
 * otthon", safety first, one button into /app/move/start. ProtectedRoute
 * carries the visitor through sign-in and back to the start flow.
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Home, Timer, MessageSquareText, ShieldCheck } from 'lucide-react'
import { MoveBareLayout } from '../shell/MoveBareLayout'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MOVE_ACCENT, MOVE_START } from '../lib/constants'

export function MoveLanding() {
  const { t } = useTranslation('move')
  const points = [
    { icon: Home, text: t('landing.points.home') },
    { icon: Timer, text: t('landing.points.short') },
    { icon: MessageSquareText, text: t('landing.points.plain') },
  ]
  return (
    <MoveBareLayout actions={<span className="[&_button]:text-gray-500 [&_button:hover]:text-[#1A1A1A] [&_button]:hover:bg-black/5"><LanguageSwitcher /></span>}>
      <article className="space-y-10">
        <header className="space-y-4">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold text-[#1A1A1A] leading-tight">{t('landing.title')}</h1>
          <p className="text-xl sm:text-2xl font-semibold" style={{ color: MOVE_ACCENT }}>
            {t('landing.tagline')}
          </p>
          <p className="text-lg text-gray-700 max-w-2xl">{t('landing.lead')}</p>
          <Link
            to={MOVE_START}
            className="inline-flex items-center gap-2 min-h-12 px-6 rounded-[12px] text-white font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: MOVE_ACCENT }}
          >
            {t('landing.cta')}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <p className="text-sm text-gray-500">{t('landing.signInHint')}</p>
        </header>

        <section aria-labelledby="move-landing-what" className="space-y-3">
          <h2 id="move-landing-what" className="font-headline text-2xl font-bold text-[#1A1A1A]">
            {t('landing.what.title')}
          </h2>
          <p className="text-base text-gray-700 max-w-2xl">{t('landing.what.body')}</p>
          <ul className="grid gap-3 sm:grid-cols-3 pt-2">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="bg-white rounded-[16px] border border-[#e5e4e7] p-4 flex items-start gap-3">
                <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden style={{ color: MOVE_ACCENT }} />
                <span className="text-base text-[#1A1A1A]">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="move-landing-safety"
          className="rounded-[16px] border p-5 space-y-3"
          style={{ borderColor: `${MOVE_ACCENT}66`, backgroundColor: `${MOVE_ACCENT}0f` }}
        >
          <h2 id="move-landing-safety" className="flex items-center gap-2 font-headline text-2xl font-bold text-[#1A1A1A]">
            <ShieldCheck className="h-6 w-6" aria-hidden style={{ color: MOVE_ACCENT }} />
            {t('landing.safety.title')}
          </h2>
          <p className="text-base text-gray-700">{t('landing.safety.body')}</p>
          <p className="text-sm text-gray-600">{t('brand.reviewedLine')}</p>
        </section>

        <div>
          <Link
            to={MOVE_START}
            className="inline-flex items-center gap-2 min-h-12 px-6 rounded-[12px] text-white font-semibold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: MOVE_ACCENT }}
          >
            {t('landing.cta')}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </article>
    </MoveBareLayout>
  )
}
