import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, CheckCircle, Archive, SendHorizonal, Undo2 } from 'lucide-react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/toast'
import { ingredientsService } from '@/services/ingredients'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/store/auth'
import type { Ingredient, IngredientCategory, IngredientTranslations } from '@/types'

const CATEGORIES: IngredientCategory[] = ['PROTEIN', 'CARB', 'FAT', 'VEGGIE', 'SPICE']
const CATEGORY_COLOR: Record<string, 'green' | 'orange' | 'gray' | 'black'> = {
  PROTEIN: 'orange', CARB: 'black', FAT: 'gray', VEGGIE: 'green', SPICE: 'gray',
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  aliases: z.string(),
  category: z.enum(['PROTEIN', 'CARB', 'FAT', 'VEGGIE', 'SPICE']),
  kcal: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  density: z.coerce.number().optional().nullable(),
  gramsPerPiece: z.coerce.number().optional().nullable(),
  pantryItem: z.boolean(),
  vegetarian: z.boolean(),
  vegan: z.boolean(),
  pescatarian: z.boolean(),
  glutenFree: z.boolean(),
  dairyFree: z.boolean(),
  lactoseFree: z.boolean(),
  milkProteinFree: z.boolean(),
  eggFree: z.boolean(),
  nutFree: z.boolean(),
  peanutFree: z.boolean(),
  soyFree: z.boolean(),
  fishFree: z.boolean(),
  shellfishFree: z.boolean(),
  sesameFree: z.boolean(),
  halal: z.boolean(),
  kosher: z.boolean(),
  keto: z.boolean(),
  lowGi: z.boolean(),
  lowFodmap: z.boolean(),
  paleo: z.boolean(),
})
export type FormValues = z.infer<typeof schema>

// eslint-disable-next-line react-refresh/only-export-components
export function toRequest(v: FormValues) {
  return {
    name: v.name,
    aliases: v.aliases.split(',').map(s => s.trim()).filter(Boolean),
    category: v.category,
    macros: { kcal: v.kcal, protein: v.protein, fat: v.fat, carbs: v.carbs },
    constraints: {
      vegetarian: v.vegetarian, vegan: v.vegan, pescatarian: v.pescatarian,
      glutenFree: v.glutenFree, dairyFree: v.dairyFree, lactoseFree: v.lactoseFree,
      milkProteinFree: v.milkProteinFree, eggFree: v.eggFree, nutFree: v.nutFree,
      peanutFree: v.peanutFree, soyFree: v.soyFree, fishFree: v.fishFree,
      shellfishFree: v.shellfishFree, sesameFree: v.sesameFree, halal: v.halal,
      kosher: v.kosher, keto: v.keto, lowGi: v.lowGi, lowFodmap: v.lowFodmap, paleo: v.paleo,
    },
    density: v.density ?? null,
    gramsPerPiece: v.gramsPerPiece ?? null,
    pantryItem: v.pantryItem,
  }
}

function defaultValues(ing?: Ingredient): FormValues {
  return {
    name: ing?.name ?? '',
    aliases: ing?.aliases?.join(', ') ?? '',
    category: ing?.category ?? 'PROTEIN',
    kcal: ing?.macros.kcal ?? 0,
    protein: ing?.macros.protein ?? 0,
    fat: ing?.macros.fat ?? 0,
    carbs: ing?.macros.carbs ?? 0,
    density: ing?.density ?? null,
    gramsPerPiece: ing?.gramsPerPiece ?? null,
    pantryItem: ing?.pantryItem ?? false,
    vegetarian: ing?.constraints.vegetarian ?? false,
    vegan: ing?.constraints.vegan ?? false,
    pescatarian: ing?.constraints.pescatarian ?? false,
    glutenFree: ing?.constraints.glutenFree ?? false,
    dairyFree: ing?.constraints.dairyFree ?? false,
    lactoseFree: ing?.constraints.lactoseFree ?? false,
    milkProteinFree: ing?.constraints.milkProteinFree ?? false,
    eggFree: ing?.constraints.eggFree ?? false,
    nutFree: ing?.constraints.nutFree ?? false,
    peanutFree: ing?.constraints.peanutFree ?? false,
    soyFree: ing?.constraints.soyFree ?? false,
    fishFree: ing?.constraints.fishFree ?? false,
    shellfishFree: ing?.constraints.shellfishFree ?? false,
    sesameFree: ing?.constraints.sesameFree ?? false,
    halal: ing?.constraints.halal ?? false,
    kosher: ing?.constraints.kosher ?? false,
    keto: ing?.constraints.keto ?? false,
    lowGi: ing?.constraints.lowGi ?? false,
    lowFodmap: ing?.constraints.lowFodmap ?? false,
    paleo: ing?.constraints.paleo ?? false,
  }
}

export function Ingredients() {
  const qc = useQueryClient()
  const { t, i18n } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const session = useAuthStore((s) => s.session)
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'en' | 'hu'
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<Ingredient | null | 'new'>(null)
  const [translationTarget, setTranslationTarget] = useState<Ingredient | null>(null)
  const [deleteConfirmIngredient, setDeleteConfirmIngredient] = useState<{ id: string; name: string } | null>(null)

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
  })
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: usersService.getMe, enabled: !!session })

  const createMutation = useMutation({
    mutationFn: ingredientsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      setEditTarget(null)
      toast({ title: t('myContent.ingredients.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.ingredients.submitError'), variant: 'destructive' })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toRequest> }) =>
      ingredientsService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: ingredientsService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
  const approveMutation = useMutation({
    mutationFn: ingredientsService.approveTranslation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
  const updateTranslationMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: IngredientTranslations }) =>
      ingredientsService.updateTranslation(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ingredients'] }); setTranslationTarget(null) },
  })
  const submitMutation = useMutation({
    mutationFn: (id: string) => ingredientsService.submitForReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast({ title: t('myContent.ingredients.submitSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.ingredients.submitError'), variant: 'destructive' })
    },
  })
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => ingredientsService.withdrawFromReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      toast({ title: t('myContent.ingredients.withdrawSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('myContent.ingredients.withdrawError'), variant: 'destructive' })
    },
  })

  const filtered = ingredients.filter(i => {
    if (!search) return true
    const displayName = i.translations?.[lang]?.name ?? i.name
    const displayAliases = i.translations?.[lang]?.aliases ?? i.aliases ?? []
    return displayName.toLowerCase().includes(search.toLowerCase()) ||
      displayAliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
  })

  return (
    <div>
      <Header
        title={t('ingredients.title')}
        subtitle={t('ingredients.subtitle', { count: ingredients.length })}
        actions={session ? (
          <Button onClick={() => setEditTarget('new')}>
            <Plus className="h-4 w-4" /> {t('ingredients.addIngredient')}
          </Button>
        ) : undefined}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('ingredients.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-400">{t('ingredients.noResults')}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ing => {
            const displayName = ing.translations?.[lang]?.name ?? ing.name
            const displayAliases = ing.translations?.[lang]?.aliases ?? ing.aliases
            const isOwner = !!user?.id && ing.createdByUserId === user.id
            const canModify = isAdmin
            const ownerActionsPending = submitMutation.isPending || withdrawMutation.isPending
            return (
              <Card key={ing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-[#1A1A1A]">{displayName}</p>
                        {isOwner && ing.visibility === 'PUBLIC' && (
                          <Badge variant="green">{t('myContent.status.mine')}</Badge>
                        )}
                        {ing.visibility === 'PENDING_REVIEW' && (
                          <Badge variant="amber">{t('myContent.status.pendingReview')}</Badge>
                        )}
                        {ing.visibility === 'PRIVATE' && (
                          <Badge variant="gray">{t('myContent.status.private')}</Badge>
                        )}
                        {ing.machineTranslated && isAdmin && (
                          <MtBadgeMenu
                            label={t('ingredients.machineTranslated.badge')}
                            tooltip={t('ingredients.machineTranslated.tooltip')}
                            approveLabel={t('ingredients.machineTranslated.approve')}
                            editLabel={t('ingredients.machineTranslated.edit')}
                            approvePending={approveMutation.isPending}
                            onApprove={() => approveMutation.mutate(ing.id)}
                            onEdit={() => setTranslationTarget(ing)}
                          />
                        )}
                      </div>
                      {displayAliases?.length > 0 && (
                        <p className="text-xs text-gray-400">{displayAliases.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {ing.pantryItem && (
                        <span
                          title={t('ingredients.pantryItem.tooltip')}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700"
                        >
                          <Archive className="h-2.5 w-2.5" />
                          {t('ingredients.pantryItem.badge')}
                        </span>
                      )}
                      <Badge variant={CATEGORY_COLOR[ing.category] ?? 'gray'}>{ing.category}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center mb-3">
                    {[
                      { label: 'kcal', value: ing.macros.kcal, color: '#F28C28' },
                      { label: 'P', value: ing.macros.protein, color: '#F28C28' },
                      { label: 'F', value: ing.macros.fat, color: '#4F7942' },
                      { label: 'C', value: ing.macros.carbs, color: '#1A1A1A' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                        <p className="text-xs font-bold" style={{ color }}>{Number(value).toFixed(0)}</p>
                        <p className="text-[10px] text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {canModify && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditTarget(ing)}>
                        <Pencil className="h-3.5 w-3.5" /> {t('ingredients.edit')}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => {
                        setDeleteConfirmIngredient({ id: ing.id, name: displayName })
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Owner review actions for private / pending ingredients */}
                  {isOwner && ing.visibility !== 'PUBLIC' && (
                    <div className="mt-2 flex justify-end">
                      {ing.visibility === 'PRIVATE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={ownerActionsPending}
                          onClick={() => submitMutation.mutate(ing.id)}
                        >
                          <SendHorizonal className="h-3.5 w-3.5" />
                          {t('myContent.ingredients.submit')}
                        </Button>
                      )}
                      {ing.visibility === 'PENDING_REVIEW' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={ownerActionsPending}
                          onClick={() => withdrawMutation.mutate(ing.id)}
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          {t('myContent.ingredients.withdraw')}
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

      <IngredientFormDialog
        open={editTarget !== null}
        ingredient={editTarget === 'new' ? undefined : editTarget ?? undefined}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          const body = toRequest(values)
          if (editTarget === 'new') {
            createMutation.mutate(body)
          } else if (editTarget) {
            updateMutation.mutate({ id: (editTarget as Ingredient).id, body })
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <IngredientTranslationDialog
        open={translationTarget !== null}
        ingredient={translationTarget ?? undefined}
        onOpenChange={open => { if (!open) setTranslationTarget(null) }}
        onSubmit={body => {
          if (translationTarget) updateTranslationMutation.mutate({ id: translationTarget.id, body })
        }}
        isPending={updateTranslationMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmIngredient !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmIngredient(null) }}
        title={t('confirm.delete.ingredient.title')}
        description={t('confirm.delete.ingredient.body')}
        destructiveLabel={t('confirm.delete.ingredient.confirm')}
        cancelLabel={t('confirm.delete.ingredient.cancel')}
        onConfirm={() => {
          if (deleteConfirmIngredient) deleteMutation.mutate(deleteConfirmIngredient.id)
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
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
      className="relative"
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

function IngredientTranslationDialog({
  open, ingredient, onOpenChange, onSubmit, isPending,
}: {
  open: boolean
  ingredient?: Ingredient
  onOpenChange: (o: boolean) => void
  onSubmit: (v: IngredientTranslations) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const { register, handleSubmit, reset } = useForm({
    values: {
      enName: ingredient?.translations?.en?.name ?? ingredient?.name ?? '',
      enAliases: ingredient?.translations?.en?.aliases?.join(', ') ?? ingredient?.aliases?.join(', ') ?? '',
      huName: ingredient?.translations?.hu?.name ?? ingredient?.name ?? '',
      huAliases: ingredient?.translations?.hu?.aliases?.join(', ') ?? ingredient?.aliases?.join(', ') ?? '',
    },
  })

  function onSubmitForm(v: { enName: string; enAliases: string; huName: string; huAliases: string }) {
    const split = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
    onSubmit({
      en: { name: v.enName, aliases: split(v.enAliases) },
      hu: { name: v.huName, aliases: split(v.huAliases) },
    })
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) { reset(); onOpenChange(false) } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ingredients.machineTranslated.editTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                🇬🇧 {t('ingredients.machineTranslated.enSection')}
              </p>
              <div className="space-y-1">
                <Label>{t('ingredients.machineTranslated.name')}</Label>
                <Input {...register('enName')} />
              </div>
              <div className="space-y-1">
                <Label>{t('ingredients.machineTranslated.aliases')}</Label>
                <Input {...register('enAliases')} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                🇭🇺 {t('ingredients.machineTranslated.huSection')}
              </p>
              <div className="space-y-1">
                <Label>{t('ingredients.machineTranslated.name')}</Label>
                <Input {...register('huName')} />
              </div>
              <div className="space-y-1">
                <Label>{t('ingredients.machineTranslated.aliases')}</Label>
                <Input {...register('huAliases')} />
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

// ── Form dialog ────────────────────────────────────────────────────────────

export function IngredientFormDialog({
  open, ingredient, onOpenChange, onSubmit, isPending,
}: {
  open: boolean
  ingredient?: Ingredient
  onOpenChange: (o: boolean) => void
  onSubmit: (v: FormValues) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: defaultValues(ingredient),
  })

  const DIETARY_GROUPS = [
    {
      label: t('dietary.groups.lifestyle'),
      items: [
        { name: 'vegetarian' as const, label: t('ingredients.dietary.vegetarian') },
        { name: 'vegan' as const, label: t('ingredients.dietary.vegan') },
        { name: 'pescatarian' as const, label: t('ingredients.dietary.pescatarian') },
      ],
    },
    {
      label: t('dietary.groups.allergens'),
      items: [
        { name: 'glutenFree' as const, label: t('ingredients.dietary.glutenFree') },
        { name: 'dairyFree' as const, label: t('ingredients.dietary.dairyFree') },
        { name: 'lactoseFree' as const, label: t('ingredients.dietary.lactoseFree') },
        { name: 'milkProteinFree' as const, label: t('ingredients.dietary.milkProteinFree') },
        { name: 'eggFree' as const, label: t('ingredients.dietary.eggFree') },
        { name: 'nutFree' as const, label: t('ingredients.dietary.nutFree') },
        { name: 'peanutFree' as const, label: t('ingredients.dietary.peanutFree') },
        { name: 'soyFree' as const, label: t('ingredients.dietary.soyFree') },
        { name: 'fishFree' as const, label: t('ingredients.dietary.fishFree') },
        { name: 'shellfishFree' as const, label: t('ingredients.dietary.shellfishFree') },
        { name: 'sesameFree' as const, label: t('ingredients.dietary.sesameFree') },
      ],
    },
    {
      label: t('dietary.groups.religious'),
      items: [
        { name: 'halal' as const, label: t('ingredients.dietary.halal') },
        { name: 'kosher' as const, label: t('ingredients.dietary.kosher') },
      ],
    },
    {
      label: t('dietary.groups.metabolic'),
      items: [
        { name: 'keto' as const, label: t('ingredients.dietary.keto') },
        { name: 'lowGi' as const, label: t('ingredients.dietary.lowGi') },
        { name: 'lowFodmap' as const, label: t('ingredients.dietary.lowFodmap') },
        { name: 'paleo' as const, label: t('ingredients.dietary.paleo') },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ingredient ? t('ingredients.form.editTitle') : t('ingredients.form.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.name')}</Label>
              <Input {...register('name')} placeholder={t('ingredients.form.namePlaceholder')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.aliases')} <span className="text-gray-400 font-normal">{t('ingredients.form.aliasesHint')}</span></Label>
              <Input {...register('aliases')} placeholder={t('ingredients.form.aliasesPlaceholder')} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('ingredients.form.category')}</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select {...field}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              )} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">
              {t('ingredients.form.macros')} <span className="text-xs text-gray-400 font-normal">{t('ingredients.form.macrosHint')}</span>
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(['kcal', 'protein', 'fat', 'carbs'] as const).map(f => (
                <div key={f} className="space-y-1">
                  <Label className="text-xs capitalize">{f}</Label>
                  <Input type="number" step="0.1" min="0" {...register(f)} className="text-sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('ingredients.form.density')} <span className="text-gray-400 font-normal text-xs">{t('ingredients.form.densityHint')}</span></Label>
              <Input type="number" step="0.01" min="0" {...register('density')} className="w-32" />
            </div>
            <div className="space-y-1">
              <Label>{t('ingredients.form.gramsPerPiece')} <span className="text-gray-400 font-normal text-xs">{t('ingredients.form.gramsPerPieceHint')}</span></Label>
              <Input type="number" step="1" min="0" {...register('gramsPerPiece')} className="w-32" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-2">{t('ingredients.form.dietaryFlags')}</p>
            <div className="space-y-3">
              {DIETARY_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{group.label}</p>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                    {group.items.map(({ name, label }) => (
                      <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" {...register(name)} className="accent-[#F28C28] h-4 w-4 rounded" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('pantryItem')} className="accent-[#4F7942] h-4 w-4 rounded" />
              <span className="font-medium text-[#1A1A1A]">{t('ingredients.form.pantryItem')}</span>
              <span className="text-xs text-gray-400">{t('ingredients.form.pantryItemHint')}</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('ingredients.form.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : ingredient ? t('ingredients.form.save') : t('ingredients.form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
