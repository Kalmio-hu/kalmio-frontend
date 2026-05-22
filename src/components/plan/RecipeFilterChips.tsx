/**
 * RecipeFilterChips — compact horizontal chip row for dietary + tag filters.
 *
 * Two collapsible groups: dietary preferences and trait tags. Each chip is a
 * toggle; the set is owned by the caller.
 */
import { useTranslation } from 'react-i18next'
import type { DietaryRestrictionKey, RecipeTag } from '@/types'
import {
  FILTERABLE_DIETARY,
  FILTERABLE_TAGS,
  type RecipeFilterState,
} from './recipeFilters'

interface RecipeFilterChipsProps {
  state: RecipeFilterState
  onChange: (next: RecipeFilterState) => void
  /** When true, render in compact mode (smaller chips, dense spacing). */
  compact?: boolean
}

export function RecipeFilterChips({ state, onChange, compact = false }: RecipeFilterChipsProps) {
  const { t } = useTranslation()

  const pad = compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  const gap = compact ? 'gap-1' : 'gap-1.5'

  function toggleDietary(key: DietaryRestrictionKey) {
    const next = new Set(state.dietary)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ ...state, dietary: next })
  }

  function toggleTag(tag: RecipeTag) {
    const next = new Set(state.tags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange({ ...state, tags: next })
  }

  const anyDietary = state.dietary.size > 0
  const anyTag = state.tags.size > 0
  const showClear = anyDietary || anyTag

  return (
    <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {/* Tag chips */}
      <div className={`flex flex-wrap items-center ${gap}`}>
        <span className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium mr-1">
          {t('plan.detail.cell.filters.tagsLabel')}
        </span>
        {FILTERABLE_TAGS.map(tag => {
          const active = state.tags.has(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={active}
              className={`
                ${pad} rounded-full font-medium transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                ${active
                  ? 'bg-[#4f46e5] text-white border-transparent'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#4f46e5] hover:text-[#4f46e5]'}
              `}
            >
              {t(`recipes.tags.${tag}`, { defaultValue: tag })}
            </button>
          )
        })}
      </div>

      {/* Dietary chips */}
      <div className={`flex flex-wrap items-center ${gap}`}>
        <span className="text-[10px] uppercase tracking-wide text-[#9ca3af] font-medium mr-1">
          {t('plan.detail.cell.filters.dietaryLabel')}
        </span>
        {FILTERABLE_DIETARY.map(key => {
          const active = state.dietary.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDietary(key)}
              aria-pressed={active}
              className={`
                ${pad} rounded-full font-medium transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                ${active
                  ? 'bg-[#4F7942] text-white border-transparent'
                  : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:border-[#4F7942] hover:text-[#4F7942]'}
              `}
            >
              {t(`recipes.dietary.${key}`, { defaultValue: key })}
            </button>
          )
        })}
        {showClear && (
          <button
            type="button"
            onClick={() => onChange({ ...state, dietary: new Set(), tags: new Set() })}
            className="text-[11px] text-[#6b7280] hover:text-[#1A1A1A] underline ml-1"
          >
            {t('plan.detail.cell.filters.clear')}
          </button>
        )}
      </div>
    </div>
  )
}
