import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChefHat, ChevronDown, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Search, Clock, X, CheckCircle, SlidersHorizontal, Sparkles, SendHorizonal, Undo2, Upload, Wand2, Layers } from 'lucide-react'
import { DietTierBadge } from '@/components/recipe/DietTierBadge'
import { useForm, useFieldArray, useWatch, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast'
import { IngredientSearchDialog } from '@/components/IngredientSearchDialog'
import { AiRecipeImportModal } from '@/components/recipes/AiRecipeImportModal'
import { recipesService } from '@/services/recipes'
import { ingredientsService } from '@/services/ingredients'
import { aiRecipeImportService } from '@/services/aiRecipeImport'
import { recipeFamiliesService } from '@/services/recipeFamilies'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { formatCurrency, recipePhotoUrl } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { capture } from '@/lib/analytics'
import { DIET_TIER_ORDER, type DietTier } from '@/types'
import type {
  HealthifySuggestion,
  Ingredient,
  Recipe,
  RecipeImportConfirmRequest,
  RecipeImportPreview,
  RecipeImportSource,
  RecipeTag,
  RecipeTranslations,
  Unit,
  DietaryRestrictionKey,
  MealType,
  RecipeFamily,
} from '@/types'

/** Meal-type filter chip order — matches the wizard's MEAL_TYPES constant. */
const RECIPE_MEAL_TYPES: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'SNACK',
]

const IMAGE_ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const DIETARY_GROUPS: { key: string; items: DietaryRestrictionKey[] }[] = [
  { key: 'lifestyle', items: ['vegetarian', 'vegan', 'pescatarian'] },
  { key: 'allergens', items: ['glutenFree', 'dairyFree', 'lactoseFree', 'milkProteinFree', 'eggFree', 'nutFree', 'peanutFree', 'soyFree', 'fishFree', 'shellfishFree', 'sesameFree'] },
  { key: 'religious', items: ['halal', 'kosher'] },
  { key: 'metabolic', items: ['keto', 'lowGi', 'lowFodmap', 'paleo'] },
]

const TAGS: RecipeTag[] = ['QUICK', 'CHEAP', 'MEALPREP', 'HIGH_PROTEIN']
const UNITS: Unit[] = ['G', 'ML', 'PIECE']
const TAG_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  QUICK: 'orange', CHEAP: 'green', MEALPREP: 'gray', HIGH_PROTEIN: 'orange',
  BREAKFAST: 'orange', MORNING_SNACK: 'orange',
  LUNCH: 'green', AFTERNOON_SNACK: 'gray',
  DINNER: 'black', SNACK: 'gray',
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  prepTimeMinutes: z.coerce.number().int().min(1),
  cookTimeMinutes: z.coerce.number().int().min(1),
  servings: z.coerce.number().int().min(1),
  steps: z.string(),
  tags: z.array(z.enum(['QUICK', 'CHEAP', 'MEALPREP', 'HIGH_PROTEIN', 'HEALTHY', 'VEGETARIAN', 'VEGAN', 'COMFORT', 'KID_FRIENDLY', 'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'SNACK'])),
  ingredients: z.array(z.object({
    ingredientId: z.string().min(1),
    ingredientName: z.string(),
    amount: z.coerce.number().min(0.001),
    unit: z.enum(['G', 'ML', 'PIECE']),
  })).min(1, 'Add at least one ingredient'),
  // Prep prefs — drive the batch scheduler & solver. All optional, sensible defaults.
  holdDaysRefrigerated: z.coerce.number().int().min(0).max(14),
  freezableAfterPrep: z.boolean(),
  holdDaysFrozen: z.coerce.number().int().min(0).max(365).nullable(),
  prepLeadTimeHours: z.coerce.number().int().min(0).max(72),
  garnish: z.string().max(500).optional(),
})
export type FormValues = z.infer<typeof schema>

// eslint-disable-next-line react-refresh/only-export-components
export function toRequest(v: FormValues) {
  return {
    name: v.name,
    steps: v.steps.split('\n').map(s => s.trim()).filter(Boolean),
    prepTimeMinutes: v.prepTimeMinutes,
    cookTimeMinutes: v.cookTimeMinutes,
    servings: v.servings,
    tags: v.tags,
    ingredients: v.ingredients.map(i => ({
      ingredientId: i.ingredientId,
      amount: i.amount,
      unit: i.unit,
    })),
    holdDaysRefrigerated: v.holdDaysRefrigerated,
    freezableAfterPrep: v.freezableAfterPrep,
    // When the recipe isn't freezable the frozen hold days are meaningless — send null.
    holdDaysFrozen: v.freezableAfterPrep ? v.holdDaysFrozen : null,
    prepLeadTimeHours: v.prepLeadTimeHours,
    garnish: v.garnish?.trim() || null,
  }
}

function defaultValues(recipe?: Recipe, ingredientMap?: Map<string, string>): FormValues {
  return {
    name: recipe?.name ?? '',
    prepTimeMinutes: recipe?.prepTimeMinutes ?? 15,
    cookTimeMinutes: recipe?.cookTimeMinutes ?? 30,
    servings: recipe?.servings ?? 2,
    steps: recipe?.steps?.join('\n') ?? '',
    tags: (recipe?.tags ?? []) as RecipeTag[],
    ingredients: recipe?.ingredients?.map(i => ({
      ingredientId: i.ingredientId,
      ingredientName: ingredientMap?.get(i.ingredientId) ?? i.ingredientId,
      amount: i.amount,
      unit: i.unit,
    })) ?? [],
    holdDaysRefrigerated: recipe?.holdDaysRefrigerated ?? 0,
    freezableAfterPrep: recipe?.freezableAfterPrep ?? false,
    holdDaysFrozen: recipe?.holdDaysFrozen ?? null,
    prepLeadTimeHours: recipe?.prepLeadTimeHours ?? 0,
    garnish: recipe?.garnish ?? '',
  }
}

interface ImportState {
  recipe: Recipe
  unmatchedLines: string[]
  healthifySuggestions: HealthifySuggestion[]
  source: RecipeImportSource
  sourceUrl: string | null
}

export function Recipes() {
  const qc = useQueryClient()
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const session = useAuthStore((s) => s.session)
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Recipe | null | 'new'>(null)
  const [translationTarget, setTranslationTarget] = useState<Recipe | null>(null)
  const [detailTarget, setDetailTarget] = useState<Recipe | null>(null)
  const [deleteConfirmRecipe, setDeleteConfirmRecipe] = useState<{ id: string; name: string } | null>(null)

  // AI recipe import state — preserved from the former MyRecipes page.
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importState, setImportState] = useState<ImportState | null>(null)
  const [importIngSearchOpen, setImportIngSearchOpen] = useState(false)
  const [resolvingLine, setResolvingLine] = useState<string | null>(null)
  const [enrichingLines, setEnrichingLines] = useState<Set<string>>(new Set())

  const { data: recipes = [], isLoading } = useQuery({ queryKey: ['recipes'], queryFn: recipesService.list })
  const { data: ingredients = [] } = useQuery({ queryKey: ['ingredients'], queryFn: ingredientsService.list, staleTime: 30_000 })
  const { data: user } = useQuery({ queryKey: USERS_ME_QUERY_KEY, queryFn: usersService.getMe })
  const ingredientMap = new Map(ingredients.map(i => [i.id, i.translations?.[lang]?.name ?? i.name]))
  const ingredientConstraintsMap = new Map(ingredients.map(i => [i.id, i.constraints]))

  const [activeRestrictions, setActiveRestrictions] = useState<Set<DietaryRestrictionKey>>(new Set())
  const [showDietaryFilter, setShowDietaryFilter] = useState(false)
  // Optional meal-type filter — chips render above the recipe grid. Empty set
  // means "all meal types" (no filtering). A recipe passes when it has at
  // least one of the selected meal-type tags.
  const [activeMealTypes, setActiveMealTypes] = useState<Set<MealType>>(new Set())
  const restrictionsInitialized = useRef(false)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 24

  useEffect(() => {
    if (user && !restrictionsInitialized.current) {
      restrictionsInitialized.current = true
      if (user.dietaryPreferences) {
        const active = (Object.entries(user.dietaryPreferences) as [DietaryRestrictionKey, boolean][])
          .filter(([, v]) => v)
          .map(([k]) => k)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveRestrictions(new Set(active))
      }
    }
  }, [user])

  // Reset page to 0 when filters change — setState-during-render (React-recommended
  // alternative to a useEffect that would call setPage synchronously).
  const filterKey = `${search}|${[...activeRestrictions].sort().join(',')}|${[...activeMealTypes].sort().join(',')}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(0)
  }

  const createMutation = useMutation({
    mutationFn: recipesService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      setEditTarget(null)
      toast({ title: t('myContent.recipes.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.submitError'), variant: 'destructive' })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toRequest> }) =>
      recipesService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: recipesService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
  const approveMutation = useMutation({
    mutationFn: recipesService.approveTranslation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  })
  const updateTranslationMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: RecipeTranslations }) =>
      recipesService.updateTranslation(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['recipes'] }); setTranslationTarget(null) },
  })
  const submitMutation = useMutation({
    mutationFn: (id: string) => recipesService.submitForReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      toast({ title: t('myContent.recipes.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.submitError'), variant: 'destructive' })
    },
  })
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => recipesService.withdrawFromReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      toast({ title: t('myContent.recipes.withdrawSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.recipes.withdrawError'), variant: 'destructive' })
    },
  })
  const confirmImportMutation = useMutation({
    mutationFn: (body: RecipeImportConfirmRequest) => aiRecipeImportService.confirmImport(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      setImportState(null)
      toast({ title: t('aiImport.preview.saveSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('aiImport.preview.saveError'), variant: 'destructive' })
    },
  })

  function handlePreviewReceived(preview: RecipeImportPreview, source: RecipeImportSource, sourceUrl?: string | null) {
    setImportState({
      recipe: preview.recipe,
      unmatchedLines: preview.unmatchedLines,
      healthifySuggestions: preview.healthifySuggestions,
      source,
      sourceUrl: sourceUrl ?? null,
    })
  }

  function handleResolveLine(line: string) {
    setResolvingLine(line)
    setImportIngSearchOpen(true)
  }

  function handleIngredientResolved(ing: Ingredient) {
    setImportIngSearchOpen(false)
    if (!importState || !resolvingLine) return
    setImportState({
      ...importState,
      recipe: {
        ...importState.recipe,
        ingredients: [
          ...importState.recipe.ingredients,
          { id: crypto.randomUUID(), ingredientId: ing.id, amount: 100, unit: 'G' },
        ],
      },
      unmatchedLines: importState.unmatchedLines.filter(l => l !== resolvingLine),
    })
    setResolvingLine(null)
  }

  function handleDismissLine(line: string) {
    if (!importState) return
    setImportState({
      ...importState,
      unmatchedLines: importState.unmatchedLines.filter(l => l !== line),
    })
  }

  async function handleEnrichLine(line: string) {
    if (!importState || enrichingLines.has(line)) return
    setEnrichingLines(prev => {
      const next = new Set(prev)
      next.add(line)
      return next
    })
    try {
      const created = await ingredientsService.createFromText(line)
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      setImportState(curr => {
        if (!curr) return curr
        return {
          ...curr,
          recipe: {
            ...curr.recipe,
            ingredients: [
              ...curr.recipe.ingredients,
              { id: crypto.randomUUID(), ingredientId: created.id, amount: 100, unit: 'G' },
            ],
          },
          unmatchedLines: curr.unmatchedLines.filter(l => l !== line),
        }
      })
      toast({ title: t('aiImport.preview.enrichSuccess', { name: created.name }), variant: 'success' })
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: { type?: string } } })?.response?.status
      const type = (err as { response?: { data?: { type?: string } } })?.response?.data?.type
      let key = 'aiImport.preview.enrichError'
      if (status === 402) key = 'aiImport.preview.enrichErrorPremium'
      else if (status === 429) {
        key = type === 'urn:kalmio:error:monthly-quota-exceeded'
          ? 'aiImport.preview.enrichErrorMonthly'
          : 'aiImport.preview.enrichErrorRateLimit'
      } else if (status === 503) key = 'aiImport.preview.enrichErrorUnavailable'
      else if (status === 502) key = 'aiImport.preview.enrichErrorParse'
      toast({ title: t(key), variant: 'destructive' })
    } finally {
      setEnrichingLines(prev => {
        const next = new Set(prev)
        next.delete(line)
        return next
      })
    }
  }

  function handleImportSubmit(values: ReturnType<typeof toRequest>) {
    if (!importState) return
    const body: RecipeImportConfirmRequest = {
      ...values,
      culturalTags: importState.recipe.culturalTags?.length
        ? importState.recipe.culturalTags
        : ['USER_IMPORTED'],
      source: importState.source,
      sourceUrl: importState.sourceUrl,
      appliedHealthifyCount: 0,
    }
    confirmImportMutation.mutate(body)
  }

  const activeRestrictionsArr = [...activeRestrictions]
  const filtered = recipes.filter(r => {
    if (search) {
      const displayName = r.translations?.[lang]?.name ?? r.name
      if (!displayName.toLowerCase().includes(search.toLowerCase())) return false
    }
    if (activeRestrictionsArr.length > 0) {
      const passes = r.ingredients.every(ri => {
        const c = ingredientConstraintsMap.get(ri.ingredientId)
        if (!c) return true
        return activeRestrictionsArr.every(key => c[key])
      })
      if (!passes) return false
    }
    // Meal-type filter: recipe passes when it carries at least one of the
    // selected meal-type tags (BREAKFAST/LUNCH/DINNER/…).
    if (activeMealTypes.size > 0) {
      let anyMatch = false
      for (const mt of activeMealTypes) {
        if (r.tags.includes(mt)) { anyMatch = true; break }
      }
      if (!anyMatch) return false
    }
    return true
  })

  // Group filtered recipes by family. Each item in `displayItems` is either a
  // standalone recipe or a family-summary card aggregating all its members.
  // Order is preserved from the filtered list — a family appears where its
  // FIRST member would have appeared, and subsequent members are folded into
  // that family card. The chip on the family card shows the variant count;
  // clicking opens the detail dialog of the representative member (the one
  // whose dietTier is least strict — most likely the "anchor" variant the
  // user thinks of when they search for the dish).
  type DisplayItem =
    | { kind: 'recipe'; recipe: Recipe }
    | { kind: 'family'; familyId: string; familyName: string; members: Recipe[]; representative: Recipe }
  const displayItems: DisplayItem[] = []
  const seenFamilies = new Set<string>()
  for (const r of filtered) {
    if (r.familyId && r.familyName) {
      if (seenFamilies.has(r.familyId)) continue
      seenFamilies.add(r.familyId)
      const members = filtered.filter(x => x.familyId === r.familyId)
      // Representative = the most permissive tier (highest ordinal), so that
      // searching for "zabkása" doesn't surface a niche variant. Fall back to
      // the first member when tiers are missing.
      const representative = [...members].sort((a, b) => {
        const oa = a.dietTier ? ({ VEGAN: 0, VEGETARIAN: 1, PESCATARIAN: 2, OMNIVORE: 3 }[a.dietTier]) : 99
        const ob = b.dietTier ? ({ VEGAN: 0, VEGETARIAN: 1, PESCATARIAN: 2, OMNIVORE: 3 }[b.dietTier]) : 99
        return ob - oa
      })[0] ?? members[0]
      displayItems.push({ kind: 'family', familyId: r.familyId, familyName: r.familyName, members, representative })
    } else {
      displayItems.push({ kind: 'recipe', recipe: r })
    }
  }

  const totalPages = Math.ceil(displayItems.length / PAGE_SIZE)
  const pageItems = displayItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      <Header
        title={t('recipes.title')}
        subtitle={t('recipes.subtitle', { count: recipes.length })}
        actions={session ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setImportModalOpen(true)}>
              <Sparkles className="h-4 w-4" />
              {t('aiImport.openButton')}
            </Button>
            <Button onClick={() => setEditTarget('new')}>
              <Plus className="h-4 w-4" /> {t('recipes.addRecipe')}
            </Button>
          </div>
        ) : undefined}
      />

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder={t('recipes.search')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mb-4">
        {/* Meal-type chips — quick toggle filter row above the dietary chips. */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">
            {t('recipes.mealTypeFilter')}
          </span>
          {RECIPE_MEAL_TYPES.map(mt => {
            const active = activeMealTypes.has(mt)
            return (
              <button
                key={mt}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveMealTypes(prev => {
                  const next = new Set(prev)
                  if (next.has(mt)) next.delete(mt)
                  else next.add(mt)
                  return next
                })}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#4f46e5] hover:text-[#4f46e5]'
                }`}
              >
                {t(`recipes.tags.${mt}`, { defaultValue: mt })}
              </button>
            )
          })}
          {activeMealTypes.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveMealTypes(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 underline ml-1"
            >
              {t('recipes.clearFilters')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDietaryFilter(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeRestrictions.size > 0
                ? 'bg-[#4F7942] text-white border-[#4F7942]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#4F7942]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t('recipes.dietaryFilter')}
            {activeRestrictions.size > 0 && (
              <span className="bg-white/30 rounded-full px-1.5 text-[10px] leading-4">
                {activeRestrictions.size}
              </span>
            )}
          </button>
          {activeRestrictions.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveRestrictions(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {t('recipes.clearFilters')}
            </button>
          )}
        </div>

        {showDietaryFilter && (
          <div className="mt-3 p-3 bg-[#F9F7F2] rounded-[12px] space-y-3">
            {DIETARY_GROUPS.map(group => (
              <div key={group.key}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  {t(`dietary.groups.${group.key}`)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveRestrictions(prev => {
                        const next = new Set(prev)
                        if (next.has(item)) next.delete(item)
                        else next.add(item)
                        return next
                      })}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        activeRestrictions.has(item)
                          ? 'bg-[#4F7942] text-white border-[#4F7942]'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#4F7942]'
                      }`}
                    >
                      {t(`dietary.${item}`)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : displayItems.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-400">{t('recipes.noResults')}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map(item => {
            // Family-summary card — one per family, replacing N individual cards.
            // Click opens the representative member's detail dialog (the most
            // permissive tier, e.g. Omnivore over Vegan), where the "Változatok"
            // section lists every sibling for navigation.
            if (item.kind === 'family') {
              const rep = item.representative
              const photoUrl = recipePhotoUrl(rep)
              // Unique diet tiers across the family — for the badge row. Sorted
              // by strictness (VEGAN first) so reading order is consistent with
              // the "Változatok" section everywhere else.
              const tiers = Array.from(new Set(item.members.map(m => m.dietTier).filter((t): t is DietTier => t != null)))
                .sort((a, b) => DIET_TIER_ORDER[a] - DIET_TIER_ORDER[b])
              return (
                <Card
                  key={`family-${item.familyId}`}
                  className="relative hover:shadow-md transition-shadow overflow-hidden cursor-pointer border-[#4F7942]/30"
                  onClick={() => {
                    setDetailTarget(rep)
                    capture('recipe_family_viewed', { family_id: item.familyId, recipe_id: rep.id })
                  }}
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${photoUrl}')` }} />
                  <div className="absolute inset-0 bg-white/70" />
                  <CardContent className="pt-4 relative">
                    {/* Title row: family name + variant-count chip */}
                    <div className="flex items-start gap-1.5 mb-1">
                      <p className="font-semibold text-sm text-[#1A1A1A] leading-snug flex-1 min-w-0 pr-1">
                        {item.familyName}
                      </p>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4F7942]/15 text-[#4F7942]">
                        <Layers className="h-3 w-3" aria-hidden />
                        {t('recipeFamily.familyCardCount', { count: item.members.length })}
                      </span>
                    </div>
                    {/* Tier badges — one per unique diet tier in the family */}
                    {tiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tiers.map(tier => <DietTierBadge key={tier} tier={tier} />)}
                      </div>
                    )}
                    {/* Family-level macro snapshot: representative's per-serving line —
                        intentionally indicative, not aggregated. The detail dialog shows
                        the full per-variant breakdown when the user clicks through. */}
                    {rep.macros && (() => {
                      const divisor = rep.servings > 0 ? rep.servings : 1
                      const kcal = Number(rep.macros.kcal) / divisor
                      const protein = Number(rep.macros.protein) / divisor
                      return (
                        <div className="flex gap-3 text-xs text-gray-500 mb-2">
                          <span>{t('mealPlan.recipePicker.kcal', { kcal: kcal.toFixed(0) })}</span>
                          <span>{t('mealPlan.recipePicker.protein', { protein: protein.toFixed(0) })}</span>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )
            }
            const r = item.recipe
            const displayName = r.translations?.[lang]?.name ?? r.name
            const photoUrl = recipePhotoUrl(r)
            const isOwner = !!user?.id && r.createdByUserId === user.id
            const canModify = isAdmin || isOwner
            const ownerActionsPending = submitMutation.isPending || withdrawMutation.isPending
            return (
              <Card
                key={r.id}
                className="relative hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                onClick={() => {
                  setDetailTarget(r)
                  capture('recipe_viewed', { recipe_id: r.id })
                }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${photoUrl}')` }}
                />
                <div className="absolute inset-0 bg-white/70" />

                {/* Owner / admin action buttons — top-right overlay */}
                {canModify && (
                  <div
                    className="absolute top-2 right-2 z-10 flex gap-1"
                    onClick={e => e.stopPropagation()}
                  >
                    {r.machineTranslated && (
                      <MtBadgeMenu
                        label={t('recipes.machineTranslated.badge')}
                        tooltip={t('recipes.machineTranslated.tooltip')}
                        approveLabel={t('recipes.machineTranslated.approve')}
                        editLabel={t('recipes.machineTranslated.edit')}
                        approvePending={approveMutation.isPending}
                        onApprove={() => approveMutation.mutate(r.id)}
                        onEdit={() => setTranslationTarget(r)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setEditTarget(r)}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-[#1A1A1A] transition-colors shadow-sm"
                      aria-label={t('recipes.edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmRecipe({ id: r.id, name: displayName })}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shadow-sm"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <CardContent className="pt-4 relative">
                  {/* Name row */}
                  <div className="flex items-start gap-1.5 mb-1">
                    <p className="font-semibold text-sm text-[#1A1A1A] leading-snug flex-1 min-w-0 pr-1">{displayName}</p>
                    {isOwner && r.visibility === 'PUBLIC' && (
                      <Badge variant="green">{t('myContent.status.mine')}</Badge>
                    )}
                    {r.visibility === 'PENDING_REVIEW' && (
                      <Badge variant="amber">{t('myContent.status.pendingReview')}</Badge>
                    )}
                    {r.visibility === 'PRIVATE' && (
                      <Badge variant="gray">{t('myContent.status.private')}</Badge>
                    )}
                    {r.machineTranslated && !isAdmin && (
                      <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                        {t('recipes.machineTranslated.badge')}
                      </span>
                    )}
                  </div>

                  {/* Recipe-family indicator — visible on every card whose recipe belongs to
                      a family. Surfaces the variant label (e.g. "tofuval") + diet-tier badge so
                      the user can identify family members at a glance without opening the detail
                      view. The family name is intentionally not shown here because list endpoints
                      don't carry it (would require an extra JOIN per row); the variant label and
                      tier badge are enough for identification on the catalogue. */}
                  {r.familyId && (
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F7942]">
                        <Layers className="h-3 w-3" aria-hidden />
                        {r.variantLabel ?? t('recipeFamily.variants')}
                      </span>
                      {r.dietTier && <DietTierBadge tier={r.dietTier} />}
                    </div>
                  )}

                  {/* Creator attribution */}
                  {r.createdByUsername && (
                    <p className="text-[11px] text-gray-400 mb-1.5">
                      {t('recipes.createdBy', { username: r.createdByUsername })}
                    </p>
                  )}

                  {/* Tags row */}
                  {(r.tags ?? []).length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {(r.tags ?? []).map(tag => (
                        <Badge key={tag} variant={TAG_COLOR[tag] ?? 'gray'}>
                          {t(`recipes.tags.${tag}`, { defaultValue: tag })}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.prepTimeMinutes + r.cookTimeMinutes}m</span>
                    <span>{t('recipes.servings', { count: r.servings })}</span>
                    {r.estimatedCostPerServing != null && (
                      <span className="text-[#4F7942] font-semibold">{formatCurrency(r.estimatedCostPerServing)}{t('recipes.detail.perServing')}</span>
                    )}
                  </div>

                  {r.macros && (() => {
                    // r.macros is the whole-recipe total — show per-serving on
                    // the card so the user reads it the same way they would on
                    // any nutrition label.
                    const divisor = r.servings > 0 ? r.servings : 1
                    const perServing = {
                      kcal:    Number(r.macros.kcal) / divisor,
                      protein: Number(r.macros.protein) / divisor,
                      fat:     Number(r.macros.fat) / divisor,
                      carbs:   Number(r.macros.carbs) / divisor,
                    }
                    return (
                      <>
                        <div className="grid grid-cols-4 gap-1 text-center">
                          {[
                            { labelKey: 'recipes.detail.kcal', value: perServing.kcal },
                            { labelKey: 'recipes.detail.protein', value: perServing.protein },
                            { labelKey: 'recipes.detail.fat', value: perServing.fat },
                            { labelKey: 'recipes.detail.carbs', value: perServing.carbs },
                          ].map(({ labelKey, value }) => (
                            <div key={labelKey} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                              <span className="sr-only">{t(labelKey)}: {value.toFixed(0)}</span>
                              <p className="text-xs font-bold text-[#1A1A1A]" aria-hidden="true">{value.toFixed(0)}</p>
                              <p className="text-[10px] text-gray-400" aria-hidden="true">{t(labelKey)}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400 text-right">
                          {t('recipes.detail.perServing')}
                        </p>
                      </>
                    )
                  })()}

                  {/* Owner review actions for private / pending recipes */}
                  {isOwner && r.visibility !== 'PUBLIC' && (
                    <div
                      className="mt-3 flex justify-end"
                      onClick={e => e.stopPropagation()}
                    >
                      {r.visibility === 'PRIVATE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={ownerActionsPending}
                          onClick={() => submitMutation.mutate(r.id)}
                        >
                          <SendHorizonal className="h-3.5 w-3.5" />
                          {t('myContent.recipes.submit')}
                        </Button>
                      )}
                      {r.visibility === 'PENDING_REVIEW' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={ownerActionsPending}
                          onClick={() => withdrawMutation.mutate(r.id)}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          {t('myContent.recipes.withdraw')}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 mb-2">
          <button
            type="button"
            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-[#4f46e5] hover:text-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('recipes.pagination.previous')}
          </button>
          <span className="text-sm text-gray-500 tabular-nums">
            {t('recipes.pagination.summary', { current: page + 1, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-[#4f46e5] hover:text-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('recipes.pagination.next')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <RecipeFormDialog
        open={editTarget !== null}
        recipe={editTarget === 'new' ? undefined : editTarget ?? undefined}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          const body = toRequest(values)
          if (editTarget === 'new') createMutation.mutate(body)
          else if (editTarget) updateMutation.mutate({ id: (editTarget as Recipe).id, body })
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
        error={createMutation.error?.message ?? updateMutation.error?.message}
      />

      <RecipeTranslationDialog
        open={translationTarget !== null}
        recipe={translationTarget ?? undefined}
        onOpenChange={open => { if (!open) setTranslationTarget(null) }}
        onSubmit={body => {
          if (translationTarget) updateTranslationMutation.mutate({ id: translationTarget.id, body })
        }}
        isPending={updateTranslationMutation.isPending}
      />

      <RecipeDetailDialog
        open={detailTarget !== null}
        recipe={detailTarget ?? undefined}
        ingredientMap={ingredientMap}
        allRecipes={recipes}
        onSelectVariant={(r) => setDetailTarget(r)}
        onOpenChange={open => { if (!open) setDetailTarget(null) }}
      />

      <AiRecipeImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onPreview={handlePreviewReceived}
      />

      {/* The import preview-edit dialog re-uses RecipeFormDialog. The key forces a fresh
          mount when the import session changes or when ingredient resolution alters the
          ingredient list — without it, react-hook-form keeps stale values. */}
      <RecipeFormDialog
        key={importState
          ? `import-${importState.unmatchedLines.length}-${importState.recipe.ingredients.length}`
          : 'import-closed'}
        open={importState !== null}
        recipe={importState?.recipe}
        ingredientMap={ingredientMap}
        onOpenChange={open => { if (!open) setImportState(null) }}
        onSubmit={values => handleImportSubmit(toRequest(values))}
        isPending={confirmImportMutation.isPending}
        error={confirmImportMutation.error?.message}
        titleOverride={t('aiImport.preview.title')}
        submitLabelOverride={t('aiImport.preview.save')}
        extraSubmitDisabled={(importState?.unmatchedLines.length ?? 0) > 0}
        headerSlot={importState && (
          <ImportPreviewHeader
            unmatchedLines={importState.unmatchedLines}
            healthifySuggestions={importState.healthifySuggestions}
            enrichingLines={enrichingLines}
            onResolveLine={handleResolveLine}
            onEnrichLine={handleEnrichLine}
            onDismissLine={handleDismissLine}
          />
        )}
      />

      <IngredientSearchDialog
        open={importIngSearchOpen}
        onOpenChange={open => {
          setImportIngSearchOpen(open)
          if (!open) setResolvingLine(null)
        }}
        excludeIds={importState?.recipe.ingredients.map(i => i.ingredientId) ?? []}
        onSelect={handleIngredientResolved}
      />

      <ConfirmDialog
        open={deleteConfirmRecipe !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmRecipe(null) }}
        title={t('confirm.delete.recipe.title')}
        description={t('confirm.delete.recipe.body')}
        destructiveLabel={t('confirm.delete.recipe.confirm')}
        cancelLabel={t('confirm.delete.recipe.cancel')}
        onConfirm={() => {
          if (deleteConfirmRecipe) deleteMutation.mutate(deleteConfirmRecipe.id)
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

// ── Import preview header (unmatched-lines banner + healthify accordion) ────

function ImportPreviewHeader({
  unmatchedLines,
  healthifySuggestions,
  enrichingLines,
  onResolveLine,
  onEnrichLine,
  onDismissLine,
}: {
  unmatchedLines: string[]
  healthifySuggestions: HealthifySuggestion[]
  enrichingLines: Set<string>
  onResolveLine: (line: string) => void
  onEnrichLine: (line: string) => void
  onDismissLine: (line: string) => void
}) {
  const { t } = useTranslation()
  const [healthifyOpen, setHealthifyOpen] = useState(false)

  return (
    <div className="space-y-3">
      {unmatchedLines.length > 0 && (
        <div className="rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">
            {t('aiImport.preview.unmatchedTitle', { count: unmatchedLines.length })}
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            {t('aiImport.preview.unmatchedDescription')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {unmatchedLines.map(line => {
              const isEnriching = enrichingLines.has(line)
              return (
                <span
                  key={line}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-amber-300 px-2 py-1 text-xs text-amber-900"
                >
                  <button
                    type="button"
                    onClick={() => onResolveLine(line)}
                    disabled={isEnriching}
                    className="font-medium hover:underline disabled:opacity-50"
                  >
                    {line}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnrichLine(line)}
                    disabled={isEnriching}
                    aria-label={t('aiImport.preview.unmatchedEnrich')}
                    title={t('aiImport.preview.unmatchedEnrich')}
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[#F28C28] hover:bg-amber-100 disabled:opacity-60"
                  >
                    {isEnriching ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <Wand2 className="h-3 w-3" aria-hidden />
                    )}
                    <span className="text-[11px] font-medium">
                      {t('aiImport.preview.unmatchedEnrichShort')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissLine(line)}
                    disabled={isEnriching}
                    aria-label={t('aiImport.preview.unmatchedDismiss')}
                    className="rounded-full p-0.5 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {healthifySuggestions.length > 0 && (
        <div className="rounded-[12px] border border-[#4F7942]/40 bg-[#F1F5EB] text-sm">
          <button
            type="button"
            onClick={() => setHealthifyOpen(o => !o)}
            aria-expanded={healthifyOpen}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="font-medium text-[#365229]">
              {t('aiImport.preview.healthifyTitle', { count: healthifySuggestions.length })}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-[#365229] transition-transform ${healthifyOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>
          {healthifyOpen && (
            <ul className="space-y-2 border-t border-[#4F7942]/30 px-3 py-2.5">
              {healthifySuggestions.map((s, i) => (
                <li key={i} className="space-y-0.5">
                  <p className="text-sm font-medium text-[#1A1A1A]">{s.swap}</p>
                  {s.reason && (
                    <p className="text-xs text-gray-600">{s.reason}</p>
                  )}
                  <p className="text-[11px] text-[#365229]">
                    {t('aiImport.preview.healthifyDelta', {
                      kcal: Math.round(s.kcalDelta),
                      protein: Math.round(s.proteinDelta),
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ── Recipe detail dialog ──────────────────────────────────────────────────

function RecipeDetailDialog({
  open, recipe, ingredientMap, allRecipes, onSelectVariant, onOpenChange,
}: {
  open: boolean
  recipe?: Recipe
  ingredientMap: Map<string, string>
  /** Full recipes catalogue — used to compute family siblings client-side. */
  allRecipes?: Recipe[]
  /** Called when the user clicks a sibling row; parent replaces the dialog target. */
  onSelectVariant?: (recipe: Recipe) => void
  onOpenChange: (o: boolean) => void
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [photoFailed, setPhotoFailed] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPhotoFailed(false) }, [recipe?.id])

  if (!recipe) return null

  const displayName = recipe.translations?.[lang]?.name ?? recipe.name
  const steps = recipe.translations?.[lang]?.steps ?? recipe.steps ?? []
  const photoUrl = recipePhotoUrl(recipe)
  const hasSteps = steps.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug pr-6">{displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cook mode CTA — prominent so the user can launch the kitchen
              experience without scrolling through the whole recipe first. */}
          {hasSteps && (
            <button
              type="button"
              onClick={() => navigate(`/app/recipes/${recipe.id}/cook`)}
              className="
                w-full inline-flex items-center justify-center gap-2 rounded-xl
                bg-[#F28C28] px-4 py-2.5 text-sm font-semibold text-white
                hover:bg-[#d9761e] active:bg-[#c06917]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-1
              "
            >
              <ChefHat className="h-4 w-4" aria-hidden />
              {t('recipes.detail.startCooking')}
            </button>
          )}

          {/* Photo — hidden entirely if image fails to load */}
          {!photoFailed && (
            <div className="w-full h-44 rounded-[12px] overflow-hidden bg-[#F9F7F2]">
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setPhotoFailed(true)}
              />
            </div>
          )}

          {/* Tags */}
          {(recipe.tags ?? []).length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {(recipe.tags ?? []).map(tag => (
                <Badge key={tag} variant={TAG_COLOR[tag] ?? 'gray'}>
                  {t(`recipes.tags.${tag}`, { defaultValue: tag })}
                </Badge>
              ))}
            </div>
          )}

          {/* Timing row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.prep')}</p>
              <p className="text-sm font-bold text-[#1A1A1A]">{recipe.prepTimeMinutes}m</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.cook')}</p>
              <p className="text-sm font-bold text-[#1A1A1A]">{recipe.cookTimeMinutes}m</p>
            </div>
            <div className="bg-[#F9F7F2] rounded-[10px] p-2.5 text-center">
              <p className="text-[10px] text-gray-400 mb-0.5">{t('recipes.detail.servings')}</p>
              <p className="text-sm font-bold text-[#1A1A1A]">{recipe.servings}</p>
            </div>
          </div>

          {/* Macros */}
          {recipe.macros && (
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { labelKey: 'recipes.detail.kcal', value: recipe.macros.kcal },
                { labelKey: 'recipes.detail.protein', value: recipe.macros.protein },
                { labelKey: 'recipes.detail.fat', value: recipe.macros.fat },
                { labelKey: 'recipes.detail.carbs', value: recipe.macros.carbs },
              ].map(({ labelKey, value }) => (
                <div key={labelKey} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                  <span className="sr-only">{t(labelKey)}: {Number(value).toFixed(0)} {t('recipes.detail.perServing')}</span>
                  <p className="text-xs font-bold text-[#1A1A1A]" aria-hidden="true">{Number(value).toFixed(0)}</p>
                  <p className="text-[10px] text-gray-400" aria-hidden="true">{t(labelKey)} {t('recipes.detail.perServing')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Változatok / Variants — shown when the recipe is part of a family.
              Siblings are computed client-side from the recipes catalogue (the
              dialog opens from the Receptek list which already has the data,
              so no extra fetch). Clicking a sibling swaps the dialog content
              to that variant via onSelectVariant — the dialog stays open and
              the user can navigate variants without losing context. */}
          {recipe.familyId && allRecipes && (() => {
            const siblings = allRecipes
              .filter(r => r.familyId === recipe.familyId && r.id !== recipe.id)
              .sort((a, b) => {
                const orderA = a.dietTier ? DIET_TIER_ORDER[a.dietTier] : 99
                const orderB = b.dietTier ? DIET_TIER_ORDER[b.dietTier] : 99
                if (orderA !== orderB) return orderA - orderB
                return (a.variantLabel ?? '').localeCompare(b.variantLabel ?? '')
              })
            if (siblings.length === 0) return null
            return (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {recipe.familyName ? t('recipeFamily.sameFamilyHeader', { family: recipe.familyName }) : t('recipeFamily.variants')}
                </p>
                <div className="space-y-2">
                  {siblings.map(sibling => {
                    const sName = sibling.translations?.[lang]?.name ?? sibling.name
                    const divisor = sibling.servings > 0 ? sibling.servings : 1
                    const kcalPer = sibling.macros ? Number(sibling.macros.kcal) / divisor : null
                    const proteinPer = sibling.macros ? Number(sibling.macros.protein) / divisor : null
                    return (
                      <div
                        key={sibling.id}
                        className="flex items-center gap-3 p-3 bg-[#F9F7F2] rounded-[12px]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A] leading-tight truncate">
                            {sibling.variantLabel ?? sName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {sibling.dietTier && <DietTierBadge tier={sibling.dietTier} />}
                            {kcalPer !== null && (
                              <span className="text-xs text-gray-400 tabular-nums">
                                {Math.round(kcalPer)} kcal
                              </span>
                            )}
                            {proteinPer !== null && (
                              <span className="text-xs text-gray-400 tabular-nums">
                                {proteinPer.toFixed(1)}g P
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectVariant?.(sibling)}
                          className="
                            shrink-0 text-xs font-semibold text-[#F28C28]
                            hover:text-[#c06917] transition-colors
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] rounded
                          "
                        >
                          {t('recipeFamily.viewVariant')}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {t('recipes.detail.ingredients')}
              </p>
              <ul className="space-y-1">
                {recipe.ingredients.map(ing => (
                  <li key={ing.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1A1A]">{ingredientMap.get(ing.ingredientId) ?? ing.ingredientId}</span>
                    <span className="text-gray-500 tabular-nums">{ing.amount} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t('recipes.detail.steps')}
            </p>
            {steps.length === 0 ? (
              <p className="text-sm text-gray-400">{t('recipes.detail.noSteps')}</p>
            ) : (
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-[#F28C28] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#1A1A1A] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── MT badge hover menu ───────────────────────────────────────────────────

function MtBadgeMenu({
  label, tooltip, approveLabel, editLabel, approvePending, onApprove, onEdit,
}: {
  label: string
  tooltip: string
  approveLabel: string
  editLabel: string
  approvePending: boolean
  onApprove: () => void
  onEdit: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        title={tooltip}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 cursor-default select-none"
      >
        {label}
      </span>
      {open && (
        <div className="absolute left-0 top-full z-20 pt-1 min-w-max">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              {editLabel}
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onApprove() }}
              disabled={approvePending}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#4F7942] hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-3 w-3" />
              {approveLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Translation edit dialog ───────────────────────────────────────────────

function RecipeTranslationDialog({
  open, recipe, onOpenChange, onSubmit, isPending,
}: {
  open: boolean
  recipe?: Recipe
  onOpenChange: (o: boolean) => void
  onSubmit: (v: RecipeTranslations) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const { register, handleSubmit, reset } = useForm({
    values: {
      enName: recipe?.translations?.en?.name ?? recipe?.name ?? '',
      enSteps: recipe?.translations?.en?.steps?.join('\n') ?? recipe?.steps?.join('\n') ?? '',
      huName: recipe?.translations?.hu?.name ?? recipe?.name ?? '',
      huSteps: recipe?.translations?.hu?.steps?.join('\n') ?? recipe?.steps?.join('\n') ?? '',
    },
  })

  function onSubmitForm(v: { enName: string; enSteps: string; huName: string; huSteps: string }) {
    const split = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
    onSubmit({
      en: { name: v.enName, steps: split(v.enSteps) },
      hu: { name: v.huName, steps: split(v.huSteps) },
    })
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) { reset(); onOpenChange(false) } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('recipes.machineTranslated.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                🇬🇧 {t('recipes.machineTranslated.enSection')}
              </p>
              <div className="space-y-1">
                <Label>{t('recipes.machineTranslated.name')}</Label>
                <Input {...register('enName')} />
              </div>
              <div className="space-y-1">
                <Label>{t('recipes.machineTranslated.steps')}</Label>
                <Textarea {...register('enSteps')} rows={4} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                🇭🇺 {t('recipes.machineTranslated.huSection')}
              </p>
              <div className="space-y-1">
                <Label>{t('recipes.machineTranslated.name')}</Label>
                <Input {...register('huName')} />
              </div>
              <div className="space-y-1">
                <Label>{t('recipes.machineTranslated.steps')}</Label>
                <Textarea {...register('huSteps')} rows={4} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Recipe family picker (W10) ────────────────────────────────────────────
// Shown inside RecipeFormDialog (edit mode only) so admins can assign/unassign
// a recipe to a family and set the variant label.

function RecipeFamilyPicker({ recipe }: { recipe: Recipe }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [variantHu, setVariantHu] = useState(recipe.variantLabel ?? '')
  const [variantEn, setVariantEn] = useState('')
  const [selectedFamilyId, setSelectedFamilyId] = useState(recipe.familyId ?? '')

  // Fetching a list of families — uses the known family IDs from a broader list.
  // Placeholder: in production, wire to GET /api/recipe-families once a list
  // endpoint exists. For now we just show the current assignment.
  const { data: currentFamily } = useQuery<RecipeFamily | null>({
    queryKey: ['recipe-family', recipe.familyId],
    queryFn: () => recipe.familyId ? recipeFamiliesService.get(recipe.familyId) : Promise.resolve(null),
    enabled: !!recipe.familyId,
    staleTime: 30_000,
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      recipeFamiliesService.assign(recipe.id, {
        familyId: selectedFamilyId,
        variantLabel: variantHu || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes'] })
      void qc.invalidateQueries({ queryKey: ['recipe', recipe.id] })
      toast({ title: t('admin.recipes.familyPicker.assignSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.recipes.familyPicker.assignError'), variant: 'destructive' })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: () => recipeFamiliesService.unassign(recipe.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recipes'] })
      void qc.invalidateQueries({ queryKey: ['recipe', recipe.id] })
      setSelectedFamilyId('')
      setVariantHu('')
      setVariantEn('')
      toast({ title: t('admin.recipes.familyPicker.unassignSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.recipes.familyPicker.unassignError'), variant: 'destructive' })
    },
  })

  return (
    <div className="border border-dashed border-gray-200 rounded-[12px] p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {t('admin.recipes.familyPicker.label')}
      </p>

      {/* Current assignment status */}
      {recipe.familyId && currentFamily ? (
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{currentFamily.name}</p>
            {recipe.variantLabel && (
              <p className="text-xs text-gray-400 mt-0.5">{recipe.variantLabel}</p>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={unassignMutation.isPending}
            onClick={() => unassignMutation.mutate()}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
          >
            {unassignMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            {t('admin.recipes.familyPicker.unassign')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Family ID input — until the list endpoint ships, accept a raw UUID */}
          <div>
            <Label htmlFor="family-id-input" className="text-xs">
              {t('admin.recipes.familyPicker.label')} (UUID)
            </Label>
            <Input
              id="family-id-input"
              value={selectedFamilyId}
              onChange={e => setSelectedFamilyId(e.target.value)}
              placeholder={t('admin.recipes.familyPicker.placeholder')}
              className="text-sm"
            />
          </div>

          {/* Variant label inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="variant-hu" className="text-xs">
                {t('admin.recipes.familyPicker.variantLabelHu')}
              </Label>
              <Input
                id="variant-hu"
                value={variantHu}
                onChange={e => setVariantHu(e.target.value)}
                placeholder="pl. tofuval"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="variant-en" className="text-xs">
                {t('admin.recipes.familyPicker.variantLabelEn')}
              </Label>
              <Input
                id="variant-en"
                value={variantEn}
                onChange={e => setVariantEn(e.target.value)}
                placeholder="e.g. with tofu"
                className="text-sm"
              />
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={!selectedFamilyId.trim() || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            {assignMutation.isPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            {t('common.save')}
          </Button>
        </div>
      )}

    </div>
  )
}

// ── Recipe form dialog ─────────────────────────────────────────────────────

export function RecipeFormDialog({
  open, recipe, ingredientMap, onOpenChange, onSubmit, isPending, error,
  titleOverride, headerSlot, extraSubmitDisabled, submitLabelOverride,
}: {
  open: boolean
  recipe?: Recipe
  ingredientMap: Map<string, string>
  onOpenChange: (o: boolean) => void
  onSubmit: (v: FormValues) => void
  isPending: boolean
  error?: string
  /** Overrides the default "Új recept" / "Recept szerkesztése" dialog title. */
  titleOverride?: string
  /** Rendered above the form body — used by the AI import flow to show the unmatched-lines
   *  banner and the healthify accordion without coupling that logic into this dialog. */
  headerSlot?: React.ReactNode
  /** When true, the Save button is disabled even if the form is otherwise valid. Used by the
   *  import flow to block save while unresolved unmatched ingredient lines remain. */
  extraSubmitDisabled?: boolean
  /** Overrides the default submit-button label. */
  submitLabelOverride?: string
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [ingSearchOpen, setIngSearchOpen] = useState(false)

  // ── Image upload state ────────────────────────────────────────────────────
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageDragOver, setImageDragOver] = useState(false)
  // local preview URL so the dialog reflects the upload immediately
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null)

  // Reset local preview when a different recipe is opened
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalImageUrl(null)
  }, [recipe?.id])

  const currentPhotoUrl = localImageUrl ?? (recipe ? recipePhotoUrl(recipe) : null)

  async function handleImageFile(file: File) {
    if (!IMAGE_ACCEPTED.includes(file.type)) {
      toast({ title: t('recipes.image.errorNotImage'), variant: 'destructive' })
      return
    }
    if (file.size > IMAGE_MAX_SIZE) {
      toast({ title: t('recipes.image.errorTooLarge'), variant: 'destructive' })
      return
    }
    if (!recipe) return
    setImageUploading(true)
    try {
      const updated = await recipesService.uploadImage(recipe.id, file)
      // Update all relevant query caches
      qc.setQueryData<Recipe[]>(['recipes'], prev =>
        prev?.map(r => r.id === updated.id ? updated : r) ?? prev
      )
      qc.setQueryData<Recipe>(['recipe', recipe.id], updated)
      setLocalImageUrl(updated.imageUrl)
      toast({ title: t('recipes.image.uploadSuccess'), variant: 'success' })
    } catch {
      toast({ title: t('recipes.image.uploadError'), variant: 'destructive' })
    } finally {
      setImageUploading(false)
    }
  }

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
    e.target.value = ''
  }

  function onImageDrop(e: React.DragEvent) {
    e.preventDefault()
    setImageDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: defaultValues(recipe, ingredientMap),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })
  const selectedTags = useWatch({ control, name: 'tags' })
  const watchFreezable = useWatch({ control, name: 'freezableAfterPrep' })
  const ingredientIds = fields.map(f => f.ingredientId)

  function toggleTag(tag: RecipeTag) {
    const current = selectedTags ?? []
    setValue('tags', current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titleOverride ?? (recipe ? t('recipes.form.editTitle') : t('recipes.form.newTitle'))}</DialogTitle>
        </DialogHeader>

        {headerSlot}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[70dvh] pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>{t('recipes.form.name')}</Label>
              <Input {...register('name')} placeholder={t('recipes.form.namePlaceholder')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t('recipes.form.prepTime')}</Label>
              <Input type="number" min="1" {...register('prepTimeMinutes')} />
            </div>
            <div className="space-y-1">
              <Label>{t('recipes.form.cookTime')}</Label>
              <Input type="number" min="1" {...register('cookTimeMinutes')} />
            </div>
            <div className="space-y-1">
              <Label>{t('recipes.form.servings')}</Label>
              <Input type="number" min="1" {...register('servings')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('recipes.form.steps')} <span className="text-gray-400 font-normal text-xs">{t('recipes.form.stepsHint')}</span></Label>
            <Textarea {...register('steps')} rows={4} placeholder={t('recipes.form.stepsPlaceholder')} />
          </div>

          <div className="space-y-1">
            <Label>{t('recipes.form.garnish')} <span className="text-gray-400 font-normal text-xs">{t('recipes.form.garnishHint')}</span></Label>
            <Textarea {...register('garnish')} rows={2} placeholder={t('recipes.form.garnishPlaceholder')} />
          </div>

          <div>
            <Label className="mb-2 block">{t('recipes.form.tags')}</Label>
            <div className="flex gap-2 flex-wrap">
              {TAGS.map(tag => (
                <button
                  key={tag} type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-colors ${
                    selectedTags?.includes(tag)
                      ? 'bg-[#F28C28] text-white border-[#F28C28]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#F28C28]'
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Prep preferences — drive the batch scheduler */}
          <div className="rounded-[12px] border border-gray-200 p-3 space-y-3 bg-[#F9F7F2]">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              {t('recipes.form.prepPrefs.title')}
            </p>
            <p className="text-xs text-gray-500 -mt-1">{t('recipes.form.prepPrefs.subtitle')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('recipes.form.prepPrefs.holdDaysRefrigerated')}</Label>
                <Input type="number" min="0" max="14" {...register('holdDaysRefrigerated')} />
                <p className="text-[10px] text-gray-400">{t('recipes.form.prepPrefs.holdDaysRefrigeratedHint')}</p>
              </div>
              <div className="space-y-1">
                <Label>{t('recipes.form.prepPrefs.prepLeadTimeHours')}</Label>
                <Input type="number" min="0" max="72" {...register('prepLeadTimeHours')} />
                <p className="text-[10px] text-gray-400">{t('recipes.form.prepPrefs.prepLeadTimeHoursHint')}</p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] cursor-pointer">
              <input
                type="checkbox"
                {...register('freezableAfterPrep')}
                className="h-4 w-4 rounded border-gray-300 accent-[#4F7942]"
              />
              {t('recipes.form.prepPrefs.freezableAfterPrep')}
            </label>

            {watchFreezable && (
              <div className="space-y-1 max-w-[50%]">
                <Label>{t('recipes.form.prepPrefs.holdDaysFrozen')}</Label>
                <Input type="number" min="0" max="365" {...register('holdDaysFrozen')} />
                <p className="text-[10px] text-gray-400">{t('recipes.form.prepPrefs.holdDaysFrozenHint')}</p>
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>{t('recipes.form.ingredients')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setIngSearchOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> {t('recipes.form.add')}
              </Button>
            </div>
            {errors.ingredients && (
              <p className="text-xs text-red-500 mb-1">{errors.ingredients.message ?? errors.ingredients.root?.message}</p>
            )}

            {fields.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center border border-dashed rounded-[12px]">
                {t('recipes.form.noIngredients')}
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2 bg-[#F9F7F2] rounded-[12px] px-3 py-2">
                    <span className="flex-1 text-sm font-medium text-[#1A1A1A] truncate">
                      {field.ingredientName}
                    </span>
                    <Input
                      type="number" step="any" min="0.001"
                      {...register(`ingredients.${idx}.amount`)}
                      className="w-20 h-8 text-sm"
                    />
                    <Controller name={`ingredients.${idx}.unit`} control={control} render={({ field: f }) => (
                      <Select {...f} className="w-20 h-8 text-sm">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </Select>
                    )} />
                    <button type="button" onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500 transition-colors" aria-label={t('recipes.removeIngredient')}>
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipe family assignment (W10 — admin only) */}
          {recipe && (
            <RecipeFamilyPicker recipe={recipe} />
          )}

          {/* Image upload */}
          <div>
            <Label className="mb-2 block">{t('recipes.image.sectionLabel')}</Label>
            {recipe ? (
              <div className="space-y-2">
                {/* Current image preview */}
                {currentPhotoUrl && (
                  <div className="w-full h-32 rounded-[12px] overflow-hidden bg-[#F9F7F2]">
                    <img
                      src={currentPhotoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                {/* Drop zone / upload button */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={IMAGE_ACCEPTED.join(',')}
                  className="sr-only"
                  aria-label={t('recipes.image.uploadButton')}
                  onChange={onImageChange}
                />
                <button
                  type="button"
                  disabled={imageUploading}
                  onClick={() => imageInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setImageDragOver(true) }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={onImageDrop}
                  className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-[12px] py-3 text-sm transition-colors ${
                    imageDragOver
                      ? 'border-[#4F7942] bg-green-50 text-[#4F7942]'
                      : 'border-gray-200 text-gray-500 hover:border-[#4F7942] hover:text-[#4F7942]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {imageUploading
                    ? <Spinner className="h-4 w-4" />
                    : <Upload className="h-4 w-4" />
                  }
                  <span>
                    {imageUploading
                      ? t('recipes.image.uploading')
                      : recipe.imageUrl || localImageUrl
                        ? t('recipes.image.replaceButton')
                        : t('recipes.image.uploadButton')
                    }
                  </span>
                </button>
                <p className="text-[11px] text-gray-400">{t('recipes.image.dragHint')}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-3 px-3 bg-[#F9F7F2] rounded-[12px]">
                {t('recipes.image.saveFirst')}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-[12px] px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('recipes.form.cancel')}</Button>
            <Button type="submit" disabled={isPending || extraSubmitDisabled}>
              {isPending
                ? <Spinner className="h-4 w-4" />
                : (submitLabelOverride ?? (recipe ? t('recipes.form.save') : t('recipes.form.create')))}
            </Button>
          </div>
        </form>

        <IngredientSearchDialog
          open={ingSearchOpen}
          onOpenChange={setIngSearchOpen}
          excludeIds={ingredientIds}
          onSelect={ing => {
            append({ ingredientId: ing.id, ingredientName: ing.name, amount: 100, unit: 'G' })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
