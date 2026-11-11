import { SpaceSwitcher } from './SpaceSwitcher'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-[#1A1A1A]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* "Étrend | Mozgás" — renders only when both spaces are active (D8 rule 3) */}
        <SpaceSwitcher />
        {actions}
      </div>
    </div>
  )
}
