/**
 * PlanTemplateCard — one row in the Plans list (C11 / KALMIO-233).
 *
 * Displays plan name, status badge, default-plan pin, length, meal slots,
 * member chips, last-modified timestamp, and a kebab action menu.
 *
 * Props:
 *  - plan: PlanTemplate from GET /api/plans
 *  - memberNames: map of userId → display name (best-effort; falls back to initials of ID)
 *  - isDefault: marks the plan as the seeded "Sajátom" default (always first)
 *  - onCopy: fires POST /api/plans/{id}/copy
 *  - onArchive: fires DELETE /api/plans/{id}
 */
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, Pin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MemberChip, OverflowChip } from './MemberChip'
import { MEMBER_COLORS } from './memberColors'
import type { PlanTemplate, PlanTemplateStatus } from '@/types'

const MAX_CHIPS = 5

interface PlanTemplateCardProps {
  plan: PlanTemplate
  memberNames: Record<string, string>
  isDefault?: boolean
  onCopy: (id: string) => void
  onArchive: (id: string) => void
}

function statusVariant(status: PlanTemplateStatus): 'green' | 'gray' | 'orange' {
  if (status === 'ACTIVE') return 'green'
  if (status === 'ARCHIVED') return 'orange'
  return 'gray'
}

export function PlanTemplateCard({
  plan,
  memberNames,
  isDefault = false,
  onCopy,
  onArchive,
}: PlanTemplateCardProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Close menu on Escape
  useEffect(() => {
    if (!menuOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  const visibleMembers = plan.memberIds.slice(0, MAX_CHIPS)
  const overflow = plan.memberIds.length - MAX_CHIPS

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage === 'hu' ? 'hu-HU' : 'en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))

  const mealTypeLabel = (mt: string) => t(`plan.mealTypes.${mt}`, mt)

  function handleCardClick(e: React.MouseEvent) {
    // Don't navigate if clicking inside the action menu button/dropdown
    if ((e.target as HTMLElement).closest('[data-plan-menu]')) return
    navigate(`/app/plans/${plan.id}`)
  }

  function handleMenuAction(action: 'open' | 'copy' | 'archive') {
    setMenuOpen(false)
    if (action === 'open') navigate(`/app/plans/${plan.id}`)
    if (action === 'copy') onCopy(plan.id)
    if (action === 'archive') onArchive(plan.id)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
      role="article"
      aria-label={plan.name}
    >
      <CardContent className="flex flex-col gap-3 pt-4 pb-4">
        {/* Header row: name + status + default badge + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-headline font-bold text-[#1A1A1A] text-base leading-tight truncate">
                {plan.name}
              </h3>
              {isDefault && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-600 shrink-0"
                  title={t('plan.list.defaultBadge')}
                >
                  <Pin className="w-2.5 h-2.5" aria-hidden />
                  {t('plan.list.defaultBadge')}
                </span>
              )}
            </div>

            {/* Status + length chip row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={statusVariant(plan.status)}>
                {t(`plan.list.status.${plan.status}`)}
              </Badge>
              <span className="text-xs text-[#6b7280]">
                {t('plan.list.card.lengthDays', { count: plan.lengthDays })}
              </span>
            </div>
          </div>

          {/* Kebab menu */}
          <div
            className="relative shrink-0"
            ref={menuRef}
            data-plan-menu
          >
            <button
              type="button"
              aria-label={t('plan.list.card.menuAria')}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1 rounded hover:bg-[#f3f4f6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] text-[#6b7280]"
            >
              <MoreVertical className="w-4 h-4" aria-hidden />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-7 z-20 min-w-[140px] rounded-lg border border-[#e5e7eb] bg-white shadow-lg py-1"
              >
                <MenuButton label={t('plan.list.card.menu.open')} onClick={() => handleMenuAction('open')} />
                <MenuButton label={t('plan.list.card.menu.copy')} onClick={() => handleMenuAction('copy')} />
                {plan.status !== 'ARCHIVED' && (
                  <MenuButton
                    label={t('plan.list.card.menu.archive')}
                    onClick={() => handleMenuAction('archive')}
                    danger
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Meal slots covered */}
        {plan.mealSlotsCovered.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plan.mealSlotsCovered.map(slot => (
              <span
                key={slot}
                className="px-2 py-0.5 rounded-full text-xs bg-[#f3f4f6] text-[#374151]"
              >
                {mealTypeLabel(slot)}
              </span>
            ))}
          </div>
        )}

        {/* Member chips */}
        {plan.memberIds.length > 0 && (
          <div className="flex items-center gap-1">
            {visibleMembers.map((uid, i) => (
              <MemberChip
                key={uid}
                name={memberNames[uid] ?? uid}
                colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
                size="sm"
              />
            ))}
            {overflow > 0 && <OverflowChip count={overflow} />}
          </div>
        )}

        {/* Last modified */}
        <p className="text-xs text-[#9ca3af]">
          {t('plan.list.card.lastModified', { date: formatDate(plan.updatedAt) })}
        </p>
      </CardContent>
    </Card>
  )
}

interface MenuButtonProps {
  label: string
  onClick: () => void
  danger?: boolean
}

function MenuButton({ label, onClick, danger = false }: MenuButtonProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={e => { e.stopPropagation(); onClick() }}
      className={`
        w-full text-left px-4 py-2 text-sm
        focus:outline-none focus-visible:bg-[#f3f4f6]
        hover:bg-[#f9fafb]
        ${danger ? 'text-red-600' : 'text-[#374151]'}
      `}
    >
      {label}
    </button>
  )
}
