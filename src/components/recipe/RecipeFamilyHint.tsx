/**
 * RecipeFamilyHint — small, reusable visual indicator that a recipe is part of
 * a family. Drop next to any recipe-name rendering site to give the user the
 * family context they need (which variant, which diet tier).
 *
 * Returns null when familyId is not set so callers don't need to gate it
 * themselves; just splat it in:
 *
 *   <p>{recipeName}</p>
 *   <RecipeFamilyHint recipe={recipe} />
 *
 * For interactive swap behaviour (popover, "swap to this variant" button),
 * use {@link VariantsChip} instead.
 */
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { DietTierBadge } from '@/components/recipe/DietTierBadge'
import type { DietTier } from '@/types'

export interface RecipeFamilyHintProps {
  /** When null, the component renders nothing — caller doesn't need to gate. */
  familyId: string | null | undefined
  variantLabel: string | null | undefined
  dietTier?: DietTier | null
  /** Compact mode: render ONLY the diet-tier badge (drops the variant label). */
  compact?: boolean
  /** Render only the family icon + variant label, skip the diet-tier badge. */
  noTierBadge?: boolean
  className?: string
}

export function RecipeFamilyHint({
  familyId,
  variantLabel,
  dietTier,
  compact = false,
  noTierBadge = false,
  className,
}: RecipeFamilyHintProps) {
  const { t } = useTranslation()
  if (!familyId) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {!compact && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F7942]">
          <Layers className="h-3 w-3" aria-hidden />
          {variantLabel ?? t('recipeFamily.variants')}
        </span>
      )}
      {!noTierBadge && dietTier && <DietTierBadge tier={dietTier} />}
    </span>
  )
}
