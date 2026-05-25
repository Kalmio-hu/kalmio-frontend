/**
 * MemberChip — a small colored circle with initials, used in plan rows.
 *
 * Props:
 *  - name: display name (used for initials + aria-label)
 *  - color: tailwind bg class (e.g. "bg-violet-400") — caller assigns per-member
 *  - hasAllergenWarning: shows a warning indicator (BE4 safety check, stubbed for now)
 *  - onClick: optional tap handler (e.g. reveal portion size)
 */
import { useTranslation } from 'react-i18next'

interface MemberChipProps {
  name: string
  colorClass: string
  hasAllergenWarning?: boolean
  onClick?: () => void
  size?: 'sm' | 'md'
}

// Unicode-aware: match the first letter of each whitespace-separated token.
// Default \w / \b are ASCII-only, so "Én" → "N", "Ági" → "G", "Örs" → "R".
// We split on whitespace and grab the first letter of up to the first two
// tokens, which keeps the chip's two-letter ceiling.
function initials(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  const letters: string[] = []
  for (const tok of tokens) {
    // Codepoint iteration handles surrogate pairs cleanly; we just need the
    // first user-perceived character per token.
    const first = [...tok][0]
    if (first) letters.push(first.toLocaleUpperCase('hu-HU'))
  }
  return letters.join('')
}

export function MemberChip({ name, colorClass, hasAllergenWarning = false, onClick, size = 'sm' }: MemberChipProps) {
  const { t } = useTranslation()
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'

  return (
    <button
      type="button"
      aria-label={name}
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-full font-semibold text-white
        select-none shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#4f46e5]
        ${dim} ${colorClass} ${onClick ? 'cursor-pointer hover:opacity-80 active:opacity-70' : 'cursor-default'}
      `}
    >
      {initials(name)}
      {hasAllergenWarning && (
        <span
          aria-label={t('plan.member.allergenWarningAria')}
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white"
        />
      )}
    </button>
  )
}

/** Overflow chip "+N" */
export function OverflowChip({ count, size = 'sm' }: { count: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'
  return (
    <span
      className={`
        flex items-center justify-center rounded-full font-semibold text-[#4f46e5]
        bg-[#ede9fe] shrink-0 ${dim}
      `}
    >
      +{count}
    </span>
  )
}
