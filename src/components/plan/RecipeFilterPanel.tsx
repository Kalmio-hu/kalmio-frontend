/**
 * RecipeFilterPanel — collapsible panel that lets the user constrain the
 * recipe candidate set before the solver runs.
 *
 * Three sections:
 *   Forrás   — "Saját receptjeim" checkbox (ownOnly)
 *   Stílus   — RecipeTag multi-select (QUICK, CHEAP, MEALPREP, HIGH_PROTEIN,
 *              HEALTHY, VEGETARIAN, VEGAN, COMFORT, KID_FRIENDLY)
 *   Konyha   — cultural-tag multi-select (hard-coded "Magyar" for now;
 *              follow-up ticket will fetch distinct values from the API)
 *
 * When the filter narrows the candidate set below the solver minimum the
 * backend returns a 422. The caller passes `narrowError` which is displayed
 * inline next to the panel heading.
 *
 * KALMIO-353
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { RecipeFilter } from '@/types'

// ── Style tags surfaced in this panel ────────────────────────────────────────

const STYLE_TAGS = [
  'QUICK',
  'CHEAP',
  'MEALPREP',
  'HIGH_PROTEIN',
  'HEALTHY',
  'VEGETARIAN',
  'VEGAN',
  'COMFORT',
  'KID_FRIENDLY',
] as const

// Hard-coded cultural-tag values. A follow-up ticket will fetch distinct
// values from GET /api/recipes?fields=culturalTags and replace this list.
const CULTURAL_TAGS = ['Magyar'] as const

// ── Helpers ──────────────────────────────────────────────────────────────────

function isFilterEmpty(f: RecipeFilter): boolean {
  return !f.ownOnly && (!f.tags || f.tags.length === 0) && (!f.culturalTags || f.culturalTags.length === 0)
}

// ── Component ────────────────────────────────────────────────────────────────

export interface RecipeFilterPanelProps {
  value: RecipeFilter
  onChange: (next: RecipeFilter) => void
  /** Non-empty string = backend returned 422 because filter is too narrow. */
  narrowError?: string | null
  /** When true the panel cannot be interacted with (e.g. solve is in progress). */
  disabled?: boolean
}

export function RecipeFilterPanel({
  value,
  onChange,
  narrowError,
  disabled = false,
}: RecipeFilterPanelProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const hasAnyFilter = !isFilterEmpty(value)

  function toggleTag(tag: string) {
    const current = new Set(value.tags ?? [])
    if (current.has(tag)) current.delete(tag)
    else current.add(tag)
    onChange({ ...value, tags: Array.from(current) })
  }

  function toggleCulturalTag(tag: string) {
    const current = new Set(value.culturalTags ?? [])
    if (current.has(tag)) current.delete(tag)
    else current.add(tag)
    onChange({ ...value, culturalTags: Array.from(current) })
  }

  function clearAll() {
    onChange({ ownOnly: false, tags: [], culturalTags: [] })
  }

  return (
    <div
      className={`
        rounded-[12px] border transition-colors
        ${hasAnyFilter
          ? 'border-[#4f46e5] bg-[#f5f3ff]'
          : 'border-[#e5e7eb] bg-white'}
      `}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        disabled={disabled}
        className="
          w-full flex items-center justify-between
          px-4 py-3 text-left rounded-[12px]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
          disabled:opacity-60
        "
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {t('plan.recipeFilter.title')}
          </span>
          {hasAnyFilter && (
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#4f46e5] text-white shrink-0">
              {t('plan.recipeFilter.activeIndicator')}
            </span>
          )}
          {narrowError && (
            <span
              role="alert"
              className="text-[11px] text-red-600 truncate"
            >
              {narrowError}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#6b7280] shrink-0" aria-hidden />
          : <ChevronDown className="w-4 h-4 text-[#6b7280] shrink-0" aria-hidden />
        }
      </button>

      {/* Panel body */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4">

          {/* ── Forrás section ──────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[11px] uppercase tracking-wide text-[#9ca3af] font-medium mb-1">
              {t('plan.recipeFilter.source.label')}
            </legend>
            <label className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors
              ${value.ownOnly
                ? 'border-[#4f46e5] bg-[#eef2ff]'
                : 'border-[#e5e7eb] bg-white hover:border-[#4f46e5]/50'}
              ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
            `}>
              <input
                type="checkbox"
                checked={!!value.ownOnly}
                disabled={disabled}
                onChange={e => onChange({ ...value, ownOnly: e.target.checked })}
                className="w-4 h-4 accent-[#4f46e5] rounded shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {t('plan.recipeFilter.source.ownOnly')}
                </span>
                <span className="text-xs text-[#6b7280]">
                  {t('plan.recipeFilter.source.ownOnlyHint')}
                </span>
              </div>
            </label>
          </fieldset>

          {/* ── Stílus section ──────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[11px] uppercase tracking-wide text-[#9ca3af] font-medium mb-1">
              {t('plan.recipeFilter.style.label')}
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('plan.recipeFilter.style.label')}>
              {STYLE_TAGS.map(tag => {
                const active = (value.tags ?? []).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${active
                        ? 'bg-[#4f46e5] text-white border-transparent'
                        : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#4f46e5] hover:text-[#4f46e5]'}
                    `}
                  >
                    {t(`plan.recipeFilter.style.tags.${tag}`, tag)}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* ── Konyha section ──────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[11px] uppercase tracking-wide text-[#9ca3af] font-medium mb-1">
              {t('plan.recipeFilter.cuisine.label')}
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('plan.recipeFilter.cuisine.label')}>
              {CULTURAL_TAGS.map(tag => {
                const active = (value.culturalTags ?? []).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={active}
                    disabled={disabled}
                    onClick={() => toggleCulturalTag(tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${active
                        ? 'bg-[#4f46e5] text-white border-transparent'
                        : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:border-[#4f46e5] hover:text-[#4f46e5]'}
                    `}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Clear button — only shown when any selection is active */}
          {hasAnyFilter && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearAll}
                disabled={disabled}
                className="text-xs text-[#6b7280] hover:text-[#1A1A1A] underline disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
              >
                {t('plan.recipeFilter.clearAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
