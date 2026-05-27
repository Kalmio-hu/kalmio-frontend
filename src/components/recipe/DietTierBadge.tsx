/**
 * DietTierBadge — small colored pill indicating a recipe's dietary tier.
 *
 * Used in VariantsChip popover rows (W8) and RecipeDetail variants section (W9).
 *
 * Color mapping is consistent with the existing dietary badge palette
 * in the codebase (greens for plant-based, blues for pescatarian, gray for omnivore).
 */
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { DietTier } from '@/types'

interface DietTierBadgeProps {
  tier: DietTier
  className?: string
}

const TIER_CLASSES: Record<DietTier, string> = {
  VEGAN:        'bg-[#4F7942]/15 text-[#4F7942]',
  VEGETARIAN:   'bg-[#4F7942]/10 text-[#365229]',
  PESCATARIAN:  'bg-blue-50 text-blue-700',
  OMNIVORE:     'bg-gray-100 text-gray-600',
}

export function DietTierBadge({ tier, className }: DietTierBadgeProps) {
  const { t } = useTranslation()

  const label = t(`dietTier.${tier.toLowerCase()}`, {
    defaultValue: tier,
  })

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0',
        TIER_CLASSES[tier],
        className,
      )}
    >
      {label}
    </span>
  )
}
