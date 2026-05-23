import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Settings,
  ChefHat,
  Store,
  MessageSquarePlus,
  MoreHorizontal,
  Globe,
  Users,
  ShieldCheck,
  Vault,
  ClipboardList,
  SlidersHorizontal,
  CalendarClock,
  CalendarDays,
  NotebookPen,
  Sprout,
  Star,
  Trees,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { feedbackService } from '@/services/feedback'
import { usersService } from '@/services/users'

// Overflow routes — for checking active state of the "Több" trigger
const OVERFLOW_ROUTES = [
  '/app/settings',
  '/app/shopping-list',
  '/app/retail-products',
  '/app/family',
  '/app/preferences',
  '/app/plans',
  '/app/schedules',
  '/app/calendar',
  '/app/grooming',
  '/app/founding-member',
  '/app/grove',
  '/app/admin',
]

export function MobileNav() {
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['feedback', 'unread', isAdmin],
    queryFn: isAdmin ? feedbackService.getAdminUnreadCount : feedbackService.getUnreadCount,
    refetchInterval: 30_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const { data: stageData } = useQuery({
    queryKey: ['me', 'stage'],
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
  })

  const isGraduated =
    stageData?.currentStage === 'FIATAL' || stageData?.currentStage === 'TERMO'

  // Close overflow when clicking outside
  useEffect(() => {
    if (!overflowOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [overflowOpen])

  // Primary slots: Home, Recipes (promoted from overflow), Shop, + Több
  const primaryItems = [
    { to: '/app', icon: LayoutDashboard, label: t('nav.home') },
    { to: '/app/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/app/shopping-list', icon: ShoppingCart, label: t('nav.shop') },
  ]

  const current = i18n.language?.startsWith('en') ? 'en' : 'hu'
  function toggleLanguage() {
    i18n.changeLanguage(current === 'hu' ? 'en' : 'hu')
  }

  // "Több" trigger is highlighted when the current route is inside overflow
  const overflowIsActive = OVERFLOW_ROUTES.some((r) =>
    r === '/app'
      ? location.pathname === '/app'
      : location.pathname.startsWith(r)
  )

  const navItemClass = (isActive: boolean) =>
    cn(
      'flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-colors',
      isActive ? 'text-[#F28C28]' : 'text-white/60'
    )

  const overflowItemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors',
      isActive ? 'text-[#F28C28]' : 'text-white/80 hover:text-white hover:bg-white/5'
    )

  return (
    <>
      {/* Overflow panel — rendered above the nav bar */}
      {overflowOpen && (
        <div
          ref={overflowRef}
          role="menu"
          aria-label={t('nav.more')}
          className="fixed bottom-16 right-0 left-0 z-50 md:hidden bg-[#1A1A1A] border-t border-white/10 shadow-lg"
        >
          <div className="flex flex-col py-1">
            {/* Hűtő ritmusa */}
            <NavLink
              to="/app/grooming"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <Sprout className="h-5 w-5 shrink-0" />
              {t('nav.grooming')}
            </NavLink>

            {/* Tervek */}
            <NavLink
              to="/app/plans"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <NotebookPen className="h-5 w-5 shrink-0" />
              {t('nav.plans')}
            </NavLink>

            {/* Ütemezések */}
            <NavLink
              to="/app/schedules"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <CalendarClock className="h-5 w-5 shrink-0" />
              {t('nav.schedules')}
            </NavLink>

            {/* Naptár */}
            <NavLink
              to="/app/calendar"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <CalendarDays className="h-5 w-5 shrink-0" />
              {t('nav.calendar')}
            </NavLink>

            {/* Beállításaim */}
            <NavLink
              to="/app/preferences"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <SlidersHorizontal className="h-5 w-5 shrink-0" />
              {t('nav.preferences')}
            </NavLink>

            {/* Beállítások */}
            <NavLink
              to="/app/settings"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {t('nav.settings')}
            </NavLink>

            {/* Család */}
            <NavLink
              to="/app/family"
              role="menuitem"
              onClick={() => setOverflowOpen(false)}
              className={({ isActive }) => overflowItemClass(isActive)}
            >
              <Users className="h-5 w-5 shrink-0" />
              {t('nav.family')}
            </NavLink>

            {/* Grove — graduated users only */}
            {isGraduated && (
              <NavLink
                to="/app/grove"
                role="menuitem"
                onClick={() => setOverflowOpen(false)}
                className={({ isActive }) => overflowItemClass(isActive)}
              >
                <Trees className="h-5 w-5 shrink-0" />
                {t('nav.grove')}
              </NavLink>
            )}

            {/* Founding Member — for non-founding-member users */}
            {!me?.foundingMember && (
              <NavLink
                to="/app/founding-member"
                role="menuitem"
                onClick={() => setOverflowOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors',
                    isActive ? 'text-amber-400' : 'text-amber-400/70 hover:text-amber-400 hover:bg-white/5'
                  )
                }
              >
                <Star className="h-5 w-5 shrink-0" />
                {t('nav.foundingMember')}
              </NavLink>
            )}

            {/* Retail Products — admin only */}
            {isAdmin && (
              <NavLink
                to="/app/retail-products"
                role="menuitem"
                onClick={() => setOverflowOpen(false)}
                className={({ isActive }) => overflowItemClass(isActive)}
              >
                <Store className="h-5 w-5 shrink-0" />
                {t('nav.retail')}
              </NavLink>
            )}

            {isAdmin && (
              <>
                <div className="my-1 border-t border-white/10" role="separator" />
                <NavLink
                  to="/app/admin/users"
                  role="menuitem"
                  onClick={() => setOverflowOpen(false)}
                  className={({ isActive }) => overflowItemClass(isActive)}
                >
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  {t('nav.admin')}
                </NavLink>
                <NavLink
                  to="/app/admin/ip-vault"
                  role="menuitem"
                  onClick={() => setOverflowOpen(false)}
                  className={({ isActive }) => overflowItemClass(isActive)}
                >
                  <Vault className="h-5 w-5 shrink-0" />
                  {t('nav.ipVault')}
                </NavLink>
                <NavLink
                  to="/app/admin/content-review"
                  role="menuitem"
                  onClick={() => setOverflowOpen(false)}
                  className={({ isActive }) => overflowItemClass(isActive)}
                >
                  <ClipboardList className="h-5 w-5 shrink-0" />
                  {t('nav.contentReview')}
                </NavLink>
                <div className="my-1 border-t border-white/10" role="separator" />
              </>
            )}

            {/* Visszajelzés */}
            <button
              role="menuitem"
              onClick={() => {
                setOverflowOpen(false)
                setFeedbackOpen(true)
              }}
              className="relative flex items-center gap-3 px-5 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left w-full"
            >
              <MessageSquarePlus className="h-5 w-5 shrink-0" />
              {t('nav.feedback')}
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-[#F28C28] text-[10px] font-bold text-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Language switcher */}
            <button
              role="menuitem"
              onClick={toggleLanguage}
              className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors text-left w-full"
              aria-label={current === 'hu' ? 'Switch to English' : 'Váltás magyarra'}
            >
              <Globe className="h-5 w-5 shrink-0" />
              <span>{current === 'hu' ? 'Magyar' : 'English'}</span>
              <span className="ml-auto text-xs text-white/40 font-bold tracking-wide">
                {current.toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1A1A1A] border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {primaryItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className={({ isActive }) => navItemClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate w-full text-center leading-tight">{label}</span>
            </NavLink>
          ))}

          {/* Több / More trigger */}
          <button
            ref={triggerRef}
            onClick={() => setOverflowOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={overflowOpen}
            aria-label={t('nav.more')}
            className={navItemClass(overflowIsActive || overflowOpen)}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0" />
            <span className="truncate w-full text-center leading-tight">{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      <FeedbackPanel open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
