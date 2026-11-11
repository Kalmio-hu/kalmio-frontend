/**
 * MoveShell — the Move space's own chrome (movement-prd.md D8, contract §13).
 *
 * Four destinations: Ma, Hét, Gyakorlatok, Haladás. Mobile bottom nav, desktop
 * left rail, a header with the "Kalmio Move" wordmark, the space switcher (both
 * spaces active only), a settings icon and sign-out. Accent #2A9D8F. There is
 * deliberately no link to any nutrition screen here.
 */
import { useEffect } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Sun, CalendarDays, Dumbbell, TrendingUp, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { LegalFooter } from '@/components/layout/LegalFooter'
import { SpaceSwitcher } from '@/components/layout/SpaceSwitcher'
import { Spinner } from '@/components/ui/spinner'
import { useMoveStatus } from '../lib/useMoveStatus'
import { moveService } from '../services/moveService'
import { moveKeys } from '../lib/queryKeys'
import { MOVE_ACCENT, MOVE_HOME, MOVE_START } from '../lib/constants'
import { MoveWordmark } from '../components/MoveWordmark'
import '../move.css'

const DESTINATIONS = [
  { to: MOVE_HOME, icon: Sun, key: 'nav.today', end: true },
  { to: `${MOVE_HOME}/week`, icon: CalendarDays, key: 'nav.week', end: false },
  { to: `${MOVE_HOME}/library`, icon: Dumbbell, key: 'nav.library', end: false },
  { to: `${MOVE_HOME}/progress`, icon: TrendingUp, key: 'nav.progress', end: false },
] as const

export function MoveShell() {
  const { t } = useTranslation('move')
  const signOut = useAuthStore((s) => s.signOut)
  const location = useLocation()
  const { status, isLoading, setLastSpace } = useMoveStatus()

  const { data: profile } = useQuery({
    queryKey: moveKeys.profile,
    queryFn: moveService.getProfile,
    staleTime: 60_000,
    enabled: status.enabled && status.spaceActive,
  })

  // "The application opens in the space used last" (D8 rule 4).
  useEffect(() => {
    if (status.enabled && status.spaceActive && status.lastSpace !== 'MOVE') {
      void setLastSpace('MOVE')
    }
  }, [status.enabled, status.spaceActive, status.lastSpace, setLastSpace])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F9F7F2]" role="status">
        <Spinner className="border-[#2A9D8F]" />
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }
  // Gate off → nothing of Move renders anywhere (D8 invariant).
  if (!status.enabled) return <Navigate to="/app" replace />
  // Enabled but not started → the start flow owns the first screen.
  if (!status.spaceActive) return <Navigate to={MOVE_START} replace state={{ from: location }} />

  const large = profile?.textSize === 'LARGE'

  const railItem = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-3 min-h-12 rounded-[12px] text-sm font-medium transition-colors',
      isActive ? 'text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
    )

  const tabItem = (isActive: boolean) =>
    cn(
      'flex-1 min-w-0 min-h-12 flex flex-col items-center justify-center gap-0.5 py-1 rounded-lg text-xs font-medium transition-colors',
      isActive ? 'text-white' : 'text-white/60',
    )

  return (
    <div
      className={cn('move-shell flex h-screen overflow-hidden w-full', large && 'move-large-text')}
      style={{ ['--move-accent' as string]: MOVE_ACCENT }}
      data-space="move"
    >
      {/* Desktop left rail */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-[#1A1A1A] text-white shrink-0">
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <MoveWordmark dark />
        </div>
        <nav aria-label={t('nav.mainLabel')} className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {DESTINATIONS.map(({ to, icon: Icon, key, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => railItem(isActive)}
              style={({ isActive }) => (isActive ? { backgroundColor: MOVE_ACCENT } : undefined)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <div className="flex items-center gap-1">
            <NavLink
              to={`${MOVE_HOME}/settings`}
              title={t('nav.settings')}
              aria-label={t('nav.settings')}
              className={({ isActive }) =>
                cn(
                  'p-3 rounded-lg transition-colors',
                  isActive ? 'text-[var(--move-accent)]' : 'text-white/50 hover:text-white hover:bg-white/10',
                )
              }
            >
              <Settings className="h-5 w-5" aria-hidden />
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              title={t('nav.signOut')}
              aria-label={t('nav.signOut')}
              className="p-3 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F9F7F2] pb-20 md:pb-0 flex flex-col">
        {/* Header: wordmark (mobile), switcher, settings, sign-out */}
        <header className="sticky top-0 z-30 bg-[#F9F7F2]/95 backdrop-blur border-b border-[#1A1A1A]/8">
          <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
            <div className="md:hidden">
              <MoveWordmark />
            </div>
            <div className="hidden md:block" aria-hidden />
            <div className="flex items-center gap-2">
              <SpaceSwitcher />
              <NavLink
                to={`${MOVE_HOME}/settings`}
                title={t('nav.settings')}
                aria-label={t('nav.settings')}
                className={({ isActive }) =>
                  cn(
                    'md:hidden inline-flex items-center justify-center p-3 rounded-lg transition-colors',
                    isActive ? 'text-[var(--move-accent)]' : 'text-gray-600 hover:bg-black/5',
                  )
                }
              >
                <Settings className="h-5 w-5" aria-hidden />
              </NavLink>
              <button
                type="button"
                onClick={signOut}
                title={t('nav.signOut')}
                aria-label={t('nav.signOut')}
                className="md:hidden inline-flex items-center justify-center p-3 rounded-lg text-gray-600 hover:bg-black/5 transition-colors"
              >
                <LogOut className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl w-full mx-auto px-4 py-6 md:px-8 md:py-8 flex-1 move-body">
          <Outlet />
        </div>
        <LegalFooter variant="light" />
      </main>

      {/* Mobile bottom nav — four destinations, 48 px targets */}
      <nav
        aria-label={t('nav.mainLabel')}
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1A1A1A] border-t border-white/10 safe-area-pb"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {DESTINATIONS.map(({ to, icon: Icon, key, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => tabItem(isActive)}>
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden
                    style={isActive ? { color: MOVE_ACCENT } : undefined}
                  />
                  <span
                    className={cn('truncate w-full text-center leading-tight', isActive && 'underline underline-offset-4')}
                    style={isActive ? { color: MOVE_ACCENT } : undefined}
                  >
                    {t(key)}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
