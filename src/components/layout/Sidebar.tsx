import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, ChefHat, ShoppingCart, Leaf, Store, LogOut, Settings, ShieldCheck, MessageSquarePlus, Vault, ChevronRight, Refrigerator, ClipboardList, Users, SlidersHorizontal, CalendarClock, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAuthStore } from '@/store/auth'
import { FeedbackPanel } from '@/components/FeedbackPanel'
import { feedbackService } from '@/services/feedback'
import { usersService } from '@/services/users'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { usePoints } from '@/hooks/usePoints'

export function Sidebar() {
  const { t } = useTranslation()
  const signOut = useAuthStore((s) => s.signOut)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { data: points } = usePoints()

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

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/app/recipes', icon: ChefHat, label: t('nav.recipes') },
    { to: '/app/ingredients', icon: Leaf, label: t('nav.ingredients') },
    { to: '/app/shopping-list', icon: ShoppingCart, label: t('nav.shoppingList') },
    { to: '/app/fridge', icon: Refrigerator, label: t('nav.fridge') },
    { to: '/app/retail-products', icon: Store, label: t('nav.retail') },
    { to: '/app/family', icon: Users, label: t('nav.family') },
    { to: '/app/preferences', icon: SlidersHorizontal, label: t('nav.preferences') },
    { to: '/app/schedules', icon: CalendarClock, label: t('nav.schedules') },
    { to: '/app/calendar', icon: CalendarDays, label: t('nav.calendar') },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-[#1A1A1A] text-white shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <Link to="/" className="hover:opacity-80 transition-opacity flex flex-col gap-1">
          <img src="/assets/images/logo.png" alt="Kalmio" className="h-9 object-contain object-left" />
          <span className="text-[10px] text-white/40 tracking-wide leading-none">{t('auth.tagline')}</span>
        </Link>
      </div>

      {/* User profile chip */}
      <NavLink
        to="/app/profile"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-4 py-3 border-b border-white/10 transition-colors',
            isActive ? 'bg-white/10' : 'hover:bg-white/5'
          )
        }
      >
        <UserAvatar
          firstName={me?.firstName}
          lastName={me?.lastName}
          email={me?.email}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate leading-tight">
            {me?.firstName
              ? [me.firstName, me.lastName].filter(Boolean).join(' ')
              : (me?.email ?? t('profile.title'))}
          </p>
          {me?.firstName && (
            <p className="text-[11px] text-white/40 truncate leading-tight">{me.email}</p>
          )}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-white/30 shrink-0" />
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#F28C28] text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <NavLink
              to="/app/admin/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#F28C28] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t('nav.admin')}
            </NavLink>
            <NavLink
              to="/app/admin/ip-vault"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#F28C28] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Vault className="h-4 w-4 shrink-0" />
              {t('nav.ipVault')}
            </NavLink>
            <NavLink
              to="/app/admin/content-review"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#F28C28] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              {t('nav.contentReview')}
            </NavLink>
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs text-white/40 truncate">{t('common.version')}</p>
          {points !== undefined && (
            <span
              aria-label={t('points.total', { count: points.total })}
              className="shrink-0 text-[10px] font-semibold font-mono tabular-nums text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded-full leading-none"
            >
              {points.total} pt
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFeedbackOpen(true)}
            title={t('feedback.buttonTitle')}
            className="relative p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[1rem] px-0.5 rounded-full bg-[#F28C28] text-[9px] font-bold text-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <NavLink
            to="/app/settings"
            title={t('nav.settings')}
            className={({ isActive }) =>
              cn(
                'p-2 rounded-lg transition-colors',
                isActive ? 'text-[#F28C28]' : 'text-white/50 hover:text-white hover:bg-white/10'
              )
            }
          >
            <Settings className="h-4 w-4" />
          </NavLink>
          <LanguageSwitcher />
          <button
            onClick={signOut}
            title={t('common.signOut')}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FeedbackPanel open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </aside>
  )
}
