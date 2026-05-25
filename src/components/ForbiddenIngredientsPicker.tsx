import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { X, Search } from 'lucide-react'
import { ingredientsService } from '@/services/ingredients'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { getIngredientName, getIngredientAliases, getIngredientSearchHaystack, type SupportedLocale } from '@/lib/i18nIngredient'
import type { Ingredient } from '@/types'

interface ForbiddenIngredientsPickerProps {
  /** Currently excluded ingredient IDs. */
  value: string[]
  onChange: (ids: string[]) => void
  className?: string
}

/**
 * Inline multi-select picker for forbidden ingredients.
 *
 * Pattern:
 *  - Text input filters the ingredient list as the user types.
 *  - Clicking an item adds it to the selection and shows it as a removable chip.
 *  - The dropdown closes when the user clicks outside or presses Escape.
 */
export function ForbiddenIngredientsPicker({
  value,
  onChange,
  className,
}: ForbiddenIngredientsPickerProps) {
  const { t, i18n } = useTranslation()
  const lang: SupportedLocale = (i18n.language?.startsWith('hu') ? 'hu' : 'en')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const selectedIngredients = ingredients.filter(i => value.includes(i.id))

  // KALMIO-429: filter against the full multilingual haystack (HU + EN names
  // + aliases) so users typing the other-language name still find the
  // ingredient. Display always uses the user's locale.
  const filteredIngredients = ingredients.filter(ing => {
    if (value.includes(ing.id)) return false
    if (!query.trim()) return true
    return getIngredientSearchHaystack(ing).includes(query.toLowerCase())
  })

  function select(ing: Ingredient) {
    onChange([...value, ing.id])
    setQuery('')
    inputRef.current?.focus()
  }

  function remove(id: string) {
    onChange(value.filter(v => v !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {/* Selected chips */}
      {selectedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="list" aria-label={t('plan.forbiddenIngredients.label')}>
          {selectedIngredients.map(ing => {
            const displayName = getIngredientName(ing, lang)
            return (
              <span
                key={ing.id}
                role="listitem"
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
              >
                {displayName}
                <button
                  type="button"
                  onClick={() => remove(ing.id)}
                  aria-label={t('plan.forbiddenIngredients.removeAria', { name: displayName, defaultValue: `${displayName} eltávolítása` })}
                  className="ml-0.5 rounded-full text-red-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t('plan.forbiddenIngredients.placeholder')}
          className={cn(
            'w-full rounded-[10px] border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-[#1A1A1A]',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-[#4F7942]/40 focus:border-[#4F7942]',
            'transition-colors',
          )}
        />
      </div>

      {/* Dropdown list */}
      {open && (
        <div
          className="rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden"
          role="listbox"
          aria-label={t('plan.forbiddenIngredients.label')}
        >
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner className="h-4 w-4" />
            </div>
          ) : filteredIngredients.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400">
              {query.trim()
                ? t('ingredients.noResults')
                : t('plan.forbiddenIngredients.empty')}
            </p>
          ) : (
            <ul className="max-h-52 overflow-y-auto divide-y divide-gray-50">
              {filteredIngredients.slice(0, 40).map(ing => {
                const displayName = getIngredientName(ing, lang)
                // Secondary aliases: use the other-locale list so HU users see
                // English alternatives as a parenthetical hint, and vice-versa.
                const otherLang: SupportedLocale = lang === 'hu' ? 'en' : 'hu'
                const otherAliases = getIngredientAliases(ing, otherLang)
                const otherName = ing.translations?.[otherLang]?.name
                const secondaryParts = [otherName, ...(otherAliases ?? [])]
                  .filter((s): s is string => !!s && s !== displayName)
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => select(ing)}
                      className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F9F7F2] transition-colors focus-visible:outline-none focus-visible:bg-[#F9F7F2]"
                    >
                      {displayName}
                      {secondaryParts.length > 0 && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          ({secondaryParts.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Hint */}
      <p className="text-[10px] text-gray-400 leading-snug">
        {t('plan.forbiddenIngredients.hint')}
      </p>
    </div>
  )
}
