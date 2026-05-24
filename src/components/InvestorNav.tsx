import { Link, useLocation } from 'react-router-dom'

const ITEMS: Array<{ to: string; label: string }> = [
  { to: '/vault', label: 'Vault' },
  { to: '/valuation', label: 'Valuation' },
  { to: '/timeline', label: 'Bridge' },
]

interface Props {
  token: string
  variant?: 'floating' | 'inline'
}

/**
 * Cross-link nav for the three investor-token pages (/vault, /valuation, /timeline).
 * Threads the token through each link so the visitor stays authorised when hopping
 * between pages. `floating` lays the nav over an iframe; `inline` drops it into
 * normal flow (used by the Vault page header).
 */
export function InvestorNav({ token, variant = 'floating' }: Props) {
  const { pathname } = useLocation()

  const wrapperClass =
    variant === 'floating'
      ? 'fixed bottom-4 right-4 z-[100] flex gap-1 rounded-full bg-white/90 backdrop-blur-md border border-black/10 p-1 shadow-lg'
      : 'inline-flex gap-1 rounded-full bg-black/[0.04] border border-black/[0.06] p-1'

  return (
    <nav className={wrapperClass}>
      {ITEMS.map(item => {
        const active = pathname === item.to
        return (
          <Link
            key={item.to}
            to={`${item.to}?token=${encodeURIComponent(token)}`}
            className={
              'px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ' +
              (active
                ? 'bg-[#F28C28] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/70')
            }
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
