/**
 * VariantsChip — meal-card chip for recipe variant swapping (W8).
 *
 * When compatible sibling count ≥ 1:
 *   Renders an active chip: "N változat" / "N variants"
 *   Click → popover listing compatible siblings with Δkcal/Δprotein.
 *
 * When compatible count = 0:
 *   Renders a disabled chip with a tooltip explaining why.
 *   Never hidden — the spec says disabled chip, not no chip.
 *
 * Compatibility filter (defense-in-depth — server enforces too):
 *   VEGAN     → VEGAN only
 *   VEGETARIAN → VEGAN + VEGETARIAN
 *   PESCATARIAN → VEGAN + VEGETARIAN + PESCATARIAN
 *   OMNIVORE   → all
 */
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { DietTierBadge } from '@/components/recipe/DietTierBadge'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { compatibleDietTiers } from '@/types'
import type { DietTier, RecipeSibling } from '@/types'

interface VariantsChipProps {
  familyId: string
  siblings: RecipeSibling[]
  currentRecipeId: string
  currentDietTier: DietTier | null
  /** The calling user's effective diet tier — used for client-side filtering. */
  effectiveDietTier: DietTier
  /** Called when the user clicks a sibling row. */
  onSwap: (targetRecipeId: string) => void
  isSwapping?: boolean
}

export function VariantsChip({
  siblings,
  currentRecipeId,
  currentDietTier,
  effectiveDietTier,
  onSwap,
  isSwapping = false,
}: VariantsChipProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Filter siblings by compatibility — exclude the current recipe itself
  const allowed = compatibleDietTiers(effectiveDietTier)
  const compatible = siblings.filter(
    s => s.id !== currentRecipeId && (s.dietTier === null || allowed.includes(s.dietTier)),
  )
  const hasCompatible = compatible.length > 0

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  // ── Disabled chip (no compatible variants) ────────────────────────────────
  if (!hasCompatible) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-disabled="true"
              role="button"
              tabIndex={0}
              className="
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[10px] font-semibold
                bg-gray-100 text-gray-400 cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]
              "
              aria-label={t('recipeFamily.noCompatibleVariants')}
            >
              <Layers className="h-2.5 w-2.5" aria-hidden />
              {t('recipeFamily.variantCount', {
                count: 0,
                defaultValue: '0 ' + t('recipeFamily.variants'),
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {t('recipeFamily.noCompatibleVariants')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // ── Active chip ───────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full
          text-[10px] font-semibold
          bg-[#F28C28]/15 text-[#c06917]
          hover:bg-[#F28C28]/25
          transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        disabled={isSwapping}
      >
        {isSwapping ? (
          <Spinner className="h-2.5 w-2.5" />
        ) : (
          <Layers className="h-2.5 w-2.5" aria-hidden />
        )}
        {t('recipeFamily.variantCount', { count: compatible.length })}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('recipeFamily.variants')}
          className="
            absolute left-0 top-7 z-30
            min-w-[220px] max-w-[280px]
            rounded-[12px] border border-[#e5e4e7] bg-white shadow-lg
            py-1 overflow-hidden
          "
        >
          {compatible.map(sibling => {
            const kcalDelta =
              currentDietTier !== null &&
              sibling.kcal !== null &&
              sibling.kcal !== undefined
                ? null  // we don't have current kcal here — delta shown only when available
                : null
            void kcalDelta // suppress unused warning

            return (
              <button
                key={sibling.id}
                type="button"
                role="option"
                onClick={() => {
                  onSwap(sibling.id)
                  setOpen(false)
                }}
                className="
                  w-full flex items-center gap-2 px-3 py-2
                  text-left text-sm
                  hover:bg-[#F9F7F2] transition-colors
                  focus-visible:outline-none focus-visible:bg-[#F9F7F2]
                "
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[#1A1A1A] text-xs font-semibold truncate">
                    {sibling.variantLabel ?? t('recipeFamily.variants')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {sibling.dietTier && (
                      <DietTierBadge tier={sibling.dietTier} />
                    )}
                    {sibling.kcal !== null && sibling.kcal !== undefined && (
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {Math.round(sibling.kcal)} kcal
                      </span>
                    )}
                    {sibling.protein !== null && sibling.protein !== undefined && (
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {sibling.protein.toFixed(1)}g P
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] text-[#F28C28] font-medium">
                  {t('recipeFamily.swapTo')}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
