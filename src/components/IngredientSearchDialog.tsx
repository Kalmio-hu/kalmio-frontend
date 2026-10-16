import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ingredientsService } from '@/services/ingredients'
import type { Ingredient } from '@/types'

const CATEGORY_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange',
  CARB: 'black',
  FAT: 'gray',
  VEGGIE: 'green',
  SPICE: 'gray',
}

interface IngredientSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (ingredient: Ingredient) => void
  excludeIds?: string[]
}

export function IngredientSearchDialog({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
}: IngredientSearchDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
    staleTime: 30_000,
  })

  const filtered = ingredients.filter(ing => {
    if (excludeIds.includes(ing.id)) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      ing.name.toLowerCase().includes(q) ||
      (ing.aliases ?? []).some(a => a.toLowerCase().includes(q))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ingredients.chooseIngredient')}</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('ingredients.searchByName')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">{t('ingredients.noResults')}</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto space-y-1 -mx-1">
            {filtered.map(ing => (
              <li key={ing.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(ing); onOpenChange(false); setQuery('') }}
                  className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9F7F2] flex items-center justify-between gap-3 transition-colors"
                >
                  <span className="font-medium text-sm text-[#1A1A1A]">{ing.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">
                      {ing.macros.kcal.toFixed(0)} kcal
                    </span>
                    <Badge variant={CATEGORY_COLOR[ing.category] ?? 'gray'}>
                      {t(`ingredientCategory.${ing.category}`, ing.category)}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
