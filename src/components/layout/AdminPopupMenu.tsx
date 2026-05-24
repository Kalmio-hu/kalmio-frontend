/**
 * AdminPopupMenu — low-emphasis admin affordance.
 *
 * Renders only when `isAdmin === true`. A single icon button opens a popover
 * that lists all admin-only destinations. Non-admin users never see the trigger
 * or the menu.
 *
 * Accessibility: keyboard-reachable, aria-labelled, role="menu" / role="menuitem".
 * KALMIO-304
 */
import { useRef, useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { ShieldCheck, Users, Vault, ClipboardList, Store, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

interface AdminPopupMenuProps {
  /** Called when the user navigates — callers may close an outer overflow panel. */
  onNavigate?: () => void
  /**
   * visual variant:
   * - "sidebar"  → dark background, appears above the trigger (sidebar footer)
   * - "overflow" → dark background, inline in MobileNav overflow list
   */
  variant?: 'sidebar' | 'overflow'
}

const ADMIN_ITEMS = [
  { to: '/app/admin/users', icon: Users, labelKey: 'admin.users' },
  { to: '/app/admin/ip-vault', icon: Vault, labelKey: 'admin.ipVault' },
  { to: '/app/admin/content-review', icon: ClipboardList, labelKey: 'admin.contentReview' },
  { to: '/app/admin/retail/products', icon: Store, labelKey: 'admin.retailProducts' },
  { to: '/app/admin/retail/providers', icon: Truck, labelKey: 'admin.retailProviders' },
] as const

export function AdminPopupMenu({ onNavigate, variant = 'sidebar' }: AdminPopupMenuProps) {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Keyboard & outside-click dismissal
  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: PointerEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (!isAdmin) return null

  const isSidebar = variant === 'sidebar'

  const itemClass = (isActive: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors w-full',
      isActive ? 'text-[#F28C28]' : 'text-white/80 hover:text-white hover:bg-white/5'
    )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('admin.popupTriggerAria')}
        title={t('admin.popupLabel')}
        className={cn(
          'flex items-center gap-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          isSidebar
            ? 'p-2 text-white/50 hover:text-white hover:bg-white/10'
            : 'px-5 py-3 text-white/80 hover:text-white hover:bg-white/5 w-full text-sm font-medium'
        )}
      >
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
        {!isSidebar && <span>{t('admin.popupLabel')}</span>}
      </button>

      {open && (
        <>
          {/* Dismiss overlay */}
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />

          <div
            ref={menuRef}
            role="menu"
            aria-label={t('admin.popupLabel')}
            className={cn(
              'absolute z-50 min-w-[200px] rounded-[12px] border border-white/10 bg-[#111111] shadow-xl py-1',
              isSidebar
                ? 'bottom-full mb-2 left-0'
                : 'bottom-full mb-2 left-4 right-4'
            )}
          >
            {ADMIN_ITEMS.map(({ to, icon: Icon, labelKey }) => (
              <NavLink
                key={to}
                to={to}
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onNavigate?.()
                }}
                className={({ isActive }) => itemClass(isActive)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {t(labelKey)}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
