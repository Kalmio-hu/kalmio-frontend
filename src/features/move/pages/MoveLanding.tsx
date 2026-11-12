/**
 * Public Kalmio Move landing (D8 rule 9, D9 rule 9: gym first). Served at
 * www.kalmio.hu/move and as the root of move.kalmio.hu; from the Move host
 * every link out goes to the main site, where the app and sign-in live.
 * ProtectedRoute carries the visitor through sign-in into /app/move/start.
 */
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight, BatteryMedium, CalendarRange, Dumbbell, Images, ListPlus, PencilLine, RefreshCw, ShieldCheck, Timer,
  TrendingUp, Weight, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { isMoveHost, mainOrigin, MOVE_ORIGIN } from '@/lib/hosts'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { MoveWordmark } from '../components/MoveWordmark'
import { MOVE_ACCENT, MOVE_START } from '../lib/constants'
import '../move.css'

const IMG = '/assets/move'
const WRAP = 'max-w-6xl mx-auto px-5 sm:px-8'
const H2 = 'font-headline text-3xl sm:text-4xl font-bold leading-tight'

/** In-app link on the main site, a full link to it from move.kalmio.hu. */
function SiteLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const origin = mainOrigin()
  return origin ? <a href={`${origin}${to}`} className={className}>{children}</a> : <Link to={to} className={className}>{children}</Link>
}

function Cta({ label, className }: { label: string; className?: string }) {
  return (
    <SiteLink
      to={MOVE_START}
      className={cn('inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-[12px] bg-[#2A9D8F] hover:bg-[#21867A] text-white font-semibold text-base transition-colors', className)}
    >
      {label}
      <ArrowRight className="h-5 w-5" aria-hidden />
    </SiteLink>
  )
}

function Still({ name, alt, className }: { name: string; alt: string; className?: string }) {
  return <img src={`${IMG}/${name}.jpg`} alt={alt} width={512} height={768} loading="lazy" className={cn('w-full aspect-[2/3] object-cover bg-[#ECE9E2]', className)} />
}

/** Title, description and canonical of the landing; restored when the visitor moves on inside the app. */
function useLandingMeta(title: string, description: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const before = { title: document.title, description: meta?.content ?? null }
    document.title = title
    if (meta) meta.content = description
    const canonical = document.createElement('link')
    canonical.rel = 'canonical'
    canonical.href = isMoveHost() ? `${MOVE_ORIGIN}/` : `${window.location.origin}/move`
    document.head.appendChild(canonical)
    return () => {
      document.title = before.title
      if (meta && before.description !== null) meta.content = before.description
      canonical.remove()
    }
  }, [title, description])
}

export function MoveLanding() {
  const { t, i18n } = useTranslation('move')
  useLandingMeta(t('landing.meta.title'), t('landing.meta.description'))

  const lifts: [string, string][] = [
    ['squat', '4 × 8 · 60 kg'],
    ['bench', '4 × 8 · 50 kg'],
    ['row', '3 × 10 · 40 kg'],
    ['deadlift', '3 × 5 · 80 kg'],
  ]
  const gymItems: [string, LucideIcon][] = [
    ['dose', Dumbbell], ['loads', Weight], ['learn', TrendingUp], ['rest', Timer], ['demo', Images], ['manual', ListPlus],
  ]
  const planItems: [string, LucideIcon][] = [
    ['fit', CalendarRange], ['miss', RefreshCw], ['tired', BatteryMedium], ['fix', PencilLine],
  ]
  // Monday 2026-11-09 … Sunday: weekday names come from the locale, the sessions are a sample week.
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' })
  const week: ([string, number] | null)[] = [['gym', 45], null, ['football', 30], ['gym', 45], null, ['gym', 45], ['mobility', 15]]
  const more = ['home', 'football', 'mobility', 'family', 'supported']
  const steps = ['one', 'two', 'three']

  return (
    <div
      className="move-shell min-h-screen w-full flex flex-col bg-[#F9F7F2] text-[#1A1A1A]"
      style={{ ['--move-accent' as string]: MOVE_ACCENT }}
      data-space="move"
    >
      <header className="sticky top-0 z-30 bg-[#1A1A1A] border-b border-white/10">
        <div className={cn(WRAP, 'h-16 flex items-center justify-between gap-3')}>
          <MoveWordmark dark />
          <nav className="flex items-center gap-1 sm:gap-3">
            <SiteLink to="/" className="hidden sm:inline-flex items-center px-3 text-sm font-medium text-white/70 hover:text-white">
              {t('landing.nav.nutrition')}
            </SiteLink>
            <LanguageSwitcher />
            <Cta label={t('landing.nav.cta')} className="px-4 text-sm [&_svg]:hidden" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#1A1A1A] text-white">
          <img
            src={`${IMG}/hero.jpg`}
            srcSet={`${IMG}/hero-768.jpg 768w, ${IMG}/hero.jpg 1536w`}
            sizes="100vw"
            alt=""
            width={1536}
            height={1024}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center]"
          />
          {/* the left stays dark for the headline; on a phone the picture is dimmed top and bottom */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#1A1A1A]/85 via-[#1A1A1A]/60 to-[#1A1A1A]/85 md:bg-gradient-to-r md:from-[#1A1A1A] md:via-[#1A1A1A]/80 md:to-[#1A1A1A]/5" />
          <div className={cn(WRAP, 'flex items-center min-h-[600px] lg:min-h-[700px] py-16 sm:py-20')}>
            <div className="space-y-6 max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2A9D8F]">{t('landing.hero.eyebrow')}</p>
              <h1 className="font-headline text-4xl sm:text-6xl font-bold leading-[1.05]">
                {t('landing.hero.title')}
                <span className="block text-[#2A9D8F]">{t('landing.hero.tagline')}</span>
              </h1>
              <p className="text-lg text-white/80">{t('landing.hero.lead')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Cta label={t('landing.hero.cta')} />
                <a href="#how" className="inline-flex items-center min-h-12 px-5 rounded-[12px] border border-white/25 bg-[#1A1A1A]/40 text-white/90 font-semibold hover:bg-white/10 transition-colors">
                  {t('landing.hero.how')}
                </a>
              </div>
              <p className="text-sm text-white/55">{t('landing.hero.hint')}</p>
            </div>
          </div>
          <p className="absolute bottom-2 right-3 text-[11px] text-white/40">{t('landing.hero.imageNote')}</p>
        </section>

        {/* Gym first */}
        <section className="py-16 sm:py-24">
          <div className={cn(WRAP, 'space-y-10')}>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="max-w-2xl space-y-3">
                <h2 className={H2}>{t('landing.gym.title')}</h2>
                <p className="text-lg text-gray-700">{t('landing.gym.lead')}</p>
              </div>
              <div className="max-w-md w-full mx-auto lg:mx-0 lg:justify-self-end">
                <div className="grid grid-cols-2 gap-3">
                  {(['start', 'end'] as const).map((phase) => (
                    <figure key={phase} className="relative">
                      <Still name={`squat-${phase}`} alt={`${t('landing.hero.card.squat')} – ${t(`landing.hero.${phase}`)}`} className="rounded-[16px]" />
                      <figcaption className="absolute top-2 left-2 px-2 py-1 rounded-full bg-[#1A1A1A]/80 text-xs font-semibold text-white">
                        {t(`landing.hero.${phase}`)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                <div className="relative -mt-14 mx-4 sm:mx-8 rounded-[20px] bg-white text-[#1A1A1A] shadow-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-headline font-bold text-lg leading-tight">{t('landing.hero.card.title')}</p>
                      <p className="text-sm text-gray-600">{t('landing.hero.card.meta')}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#2A9D8F]/12 text-xs font-semibold text-[#21867A]">{t('landing.hero.card.today')}</span>
                  </div>
                  <ul className="divide-y divide-[#e5e4e7]">
                    {lifts.map(([key, dose]) => (
                      <li key={key} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span className="font-medium">{t(`landing.hero.card.${key}`)}</span>
                        <span className="shrink-0 tabular-nums text-gray-600">{dose}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F9F7F2] text-sm font-medium text-gray-700">
                    <Timer className="h-4 w-4 text-[#2A9D8F]" aria-hidden />
                    {t('landing.hero.card.rest')}
                  </p>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">{t('landing.aiNote')}</p>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gymItems.map(([key, Icon]) => (
                <li key={key} className="bg-white rounded-[16px] border border-[#e5e4e7] p-5 space-y-2">
                  <Icon className="h-6 w-6 text-[#2A9D8F]" aria-hidden />
                  <h3 className="font-headline font-bold text-lg">{t(`landing.gym.items.${key}.title`)}</h3>
                  <p className="text-base text-gray-700">{t(`landing.gym.items.${key}.body`)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['deadlift', 'bench', 'pulldown', 'row'].map((key) => (
                  <li key={key}>
                    <figure className="bg-white rounded-[16px] border border-[#e5e4e7] overflow-hidden">
                      <Still name={key} alt={t(`landing.gym.captions.${key}`)} />
                      <figcaption className="px-3 py-2 text-sm font-medium">{t(`landing.gym.captions.${key}`)}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-500">{t('landing.aiNote')}</p>
            </div>
          </div>
        </section>

        {/* The week */}
        <section className="bg-white border-y border-[#e5e4e7] py-16 sm:py-24">
          <div className={cn(WRAP, 'grid lg:grid-cols-2 gap-12 items-center')}>
            <div className="space-y-6">
              <h2 className={H2}>{t('landing.plan.title')}</h2>
              <ul className="space-y-5">
                {planItems.map(([key, Icon]) => (
                  <li key={key} className="flex gap-4">
                    <span className="shrink-0 h-10 w-10 rounded-full bg-[#2A9D8F]/12 inline-flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#21867A]" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-headline font-bold text-lg">{t(`landing.plan.items.${key}.title`)}</h3>
                      <p className="text-base text-gray-700">{t(`landing.plan.items.${key}.body`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <ol className="rounded-[20px] border border-[#e5e4e7] bg-[#F9F7F2] divide-y divide-[#e5e4e7] overflow-hidden" aria-hidden>
              {week.map((session, i) => (
                <li key={i} className="flex items-center gap-4 px-4 py-3">
                  <span className="w-10 shrink-0 text-sm font-semibold text-gray-600 first-letter:uppercase">
                    {weekday.format(new Date(Date.UTC(2026, 10, 9 + i)))}
                  </span>
                  {session ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e5e4e7] text-sm font-medium">
                      <span className={cn('h-2 w-2 rounded-full', session[0] === 'gym' ? 'bg-[#2A9D8F]' : 'bg-[#F28C28]')} />
                      {t(`landing.plan.week.${session[0]}`)} · {t('landing.plan.week.minutes', { count: session[1] })}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">{t('landing.plan.week.rest')}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Everything else */}
        <section className="py-16 sm:py-24">
          <div className={cn(WRAP, 'space-y-10')}>
            <div className="max-w-2xl space-y-3">
              <h2 className={H2}>{t('landing.more.title')}</h2>
              <p className="text-lg text-gray-700">{t('landing.more.lead')}</p>
            </div>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {more.map((key) => (
                <li key={key} className="bg-white rounded-[16px] border border-[#e5e4e7] overflow-hidden">
                  <Still name={key} alt="" />
                  <div className="p-3 space-y-1">
                    <h3 className="font-headline font-bold">{t(`landing.more.items.${key}.title`)}</h3>
                    <p className="text-sm text-gray-700">{t(`landing.more.items.${key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-base text-gray-700">{t('landing.more.endurance')}</p>
          </div>
        </section>

        {/* One account with nutrition */}
        <section className="bg-[#2A9D8F] text-white py-14 sm:py-20">
          <div className={cn(WRAP, 'max-w-3xl space-y-4')}>
            <h2 className={H2}>{t('landing.nutrition.title')}</h2>
            <p className="text-lg text-white/90">{t('landing.nutrition.body')}</p>
            <SiteLink to="/" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4 decoration-white/50 hover:decoration-white">
              {t('landing.nutrition.link')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </SiteLink>
          </div>
        </section>

        {/* How it starts */}
        <section id="how" className="bg-[#1A1A1A] text-white py-16 sm:py-24 scroll-mt-16">
          <div className={cn(WRAP, 'space-y-10')}>
            <h2 className={H2}>{t('landing.how.title')}</h2>
            <ol className="grid gap-6 md:grid-cols-3">
              {steps.map((key, i) => (
                <li key={key} className="space-y-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2A9D8F] font-headline font-bold">{i + 1}</span>
                  <h3 className="font-headline font-bold text-xl">{t(`landing.how.steps.${key}.title`)}</h3>
                  <p className="text-base text-white/70">{t(`landing.how.steps.${key}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Safety and the closing call */}
        <section className="py-16 sm:py-24">
          <div className={cn(WRAP, 'max-w-3xl space-y-10')}>
            <div className="rounded-[16px] border border-[#2A9D8F]/40 bg-[#2A9D8F]/[0.06] p-5 space-y-2">
              <h2 className="flex items-center gap-2 font-headline text-xl font-bold">
                <ShieldCheck className="h-6 w-6 text-[#2A9D8F]" aria-hidden />
                {t('landing.safety.title')}
              </h2>
              <p className="text-base text-gray-700">{t('landing.safety.body')}</p>
            </div>
            <div className="text-center space-y-5">
              <h2 className={H2}>{t('landing.final.title')}</h2>
              <Cta label={t('landing.final.cta')} />
              <p className="text-sm text-gray-500">{t('landing.hero.hint')}</p>
            </div>
          </div>
        </section>
      </main>

      <LegalFooter variant="light" />
    </div>
  )
}
