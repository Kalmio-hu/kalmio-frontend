import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { useForm, Controller, useFieldArray, type Resolver } from 'react-hook-form'
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
import { retailService } from '@/services/retail'
import { ingredientsService } from '@/services/ingredients'
import { useAuthStore } from '@/store/auth'
import type { RetailProduct, RetailProvider, Ingredient } from '@/types'

const UNITS = ['G', 'ML', 'PIECE'] as const

const mappingSchema = z.object({
  ingredientId: z.string().min(1, 'Required'),
  matchConfidence: z.coerce.number().min(0).max(1),
})

const schema = z.object({
  providerId: z.string().min(1, 'Required'),
  externalProductId: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  brand: z.string().optional(),
  packageSize: z.coerce.number().positive(),
  unit: z.enum(['G', 'ML', 'PIECE']),
  price: z.coerce.number().positive(),
  remoteUrl: z.string().optional(),
  ingredientMappings: z.array(mappingSchema),
})
type FormValues = z.infer<typeof schema>

function toRequest(v: FormValues) {
  return {
    providerId: v.providerId,
    externalProductId: v.externalProductId,
    name: v.name,
    brand: v.brand || null,
    packageSize: v.packageSize,
    unit: v.unit,
    price: v.price,
    remoteUrl: v.remoteUrl || null,
    ingredientMappings: v.ingredientMappings,
  }
}

function toUpdateRequest(v: FormValues) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { providerId: _p, ...rest } = toRequest(v)
  return rest
}

function defaultValues(product?: RetailProduct, defaultProviderId?: string): FormValues {
  return {
    providerId: product?.providerId ?? defaultProviderId ?? '',
    externalProductId: product?.externalProductId ?? '',
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    packageSize: product?.packageSize ?? 100,
    unit: product?.unit ?? 'G',
    price: product?.price ?? 0,
    remoteUrl: product?.remoteUrl ?? '',
    ingredientMappings: product?.ingredientMappings?.map(m => ({
      ingredientId: m.ingredientId,
      matchConfidence: Number(m.matchConfidence),
    })) ?? [],
  }
}

export function RetailProducts() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState<RetailProduct | null | 'new'>(null)
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<{ id: string; name: string } | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['retail-products'],
    queryFn: () => retailService.listProducts(),
  })
  const { data: providers = [] } = useQuery({
    queryKey: ['retail-providers'],
    queryFn: retailService.listProviders,
  })
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: ingredientsService.list,
  })

  const providerById = Object.fromEntries(providers.map(p => [p.id, p]))

  const createMutation = useMutation({
    mutationFn: retailService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['retail-products'] }); setEditTarget(null) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnType<typeof toUpdateRequest> }) =>
      retailService.update(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['retail-products'] }); setEditTarget(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: retailService.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['retail-products'] }),
  })

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.externalProductId.toLowerCase().includes(search.toLowerCase())
  )

  const defaultProviderId = providers[0]?.id ?? ''

  return (
    <div>
      <Header
        title={t('retail.title')}
        subtitle={t('retail.subtitle', { count: products.length })}
        actions={isAdmin ? (
          <Button onClick={() => setEditTarget('new')}>
            <Plus className="h-4 w-4" /> {t('retail.addProduct')}
          </Button>
        ) : undefined}
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('retail.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-gray-400">{t('retail.noResults')}</CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(product => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[#1A1A1A]">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-gray-400">{product.brand}</p>
                    )}
                  </div>
                  <Badge variant="gray">{product.unit}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center mb-3">
                  {[
                    { label: t('retail.price'), value: `${Number(product.price).toLocaleString()} Ft`, color: '#F28C28' },
                    { label: t('retail.packageSize'), value: `${product.packageSize} ${product.unit}`, color: '#1A1A1A' },
                    { label: t('retail.mappings'), value: String(product.ingredientMappings?.length ?? 0), color: '#4F7942' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#F9F7F2] rounded-[8px] p-1.5">
                      <p className="text-xs font-bold" style={{ color }}>{value}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {providerById[product.providerId] && (
                  <p className="text-xs text-gray-400 mb-3">{providerById[product.providerId].name}</p>
                )}

                {isAdmin && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditTarget(product)}>
                      <Pencil className="h-3.5 w-3.5" /> {t('retail.edit')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => {
                      setDeleteConfirmProduct({ id: product.id, name: product.name })
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RetailProductFormDialog
        open={editTarget !== null}
        product={editTarget === 'new' ? undefined : editTarget ?? undefined}
        providers={providers}
        ingredients={ingredients}
        defaultProviderId={defaultProviderId}
        onOpenChange={open => { if (!open) setEditTarget(null) }}
        onSubmit={values => {
          if (editTarget === 'new') {
            createMutation.mutate(toRequest(values))
          } else if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, body: toUpdateRequest(values) })
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmProduct !== null}
        onOpenChange={open => { if (!open) setDeleteConfirmProduct(null) }}
        title={t('confirm.delete.retailProduct.title')}
        description={t('confirm.delete.retailProduct.body')}
        destructiveLabel={t('confirm.delete.retailProduct.confirm')}
        cancelLabel={t('confirm.delete.retailProduct.cancel')}
        onConfirm={() => {
          if (deleteConfirmProduct) deleteMutation.mutate(deleteConfirmProduct.id)
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}

// ── Form dialog ────────────────────────────────────────────────────────────

function RetailProductFormDialog({
  open, product, providers, ingredients, defaultProviderId, onOpenChange, onSubmit, isPending,
}: {
  open: boolean
  product?: RetailProduct
  providers: RetailProvider[]
  ingredients: Ingredient[]
  defaultProviderId: string
  onOpenChange: (o: boolean) => void
  onSubmit: (v: FormValues) => void
  isPending: boolean
}) {
  const { t } = useTranslation()
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: defaultValues(product, defaultProviderId),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredientMappings' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? t('retail.form.editTitle') : t('retail.form.newTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1">
            <Label>{t('retail.form.provider')} *</Label>
            <Controller name="providerId" control={control} render={({ field }) => (
              <Select {...field}>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            )} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>{t('retail.form.name')}</Label>
              <Input {...register('name')} placeholder={t('retail.form.namePlaceholder')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('retail.form.externalProductId')}</Label>
              <Input {...register('externalProductId')} placeholder={t('retail.form.externalProductIdPlaceholder')} />
              {errors.externalProductId && <p className="text-xs text-red-500">{errors.externalProductId.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('retail.form.brand')}</Label>
              <Input {...register('brand')} placeholder={t('retail.form.brandPlaceholder')} />
            </div>
            <div className="space-y-1">
              <Label>{t('retail.form.remoteUrl')}</Label>
              <Input {...register('remoteUrl')} placeholder={t('retail.form.remoteUrlPlaceholder')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>{t('retail.form.packageSize')}</Label>
              <Input type="number" step="0.01" min="0.01" {...register('packageSize')} />
              {errors.packageSize && <p className="text-xs text-red-500">{errors.packageSize.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('retail.form.unit')}</Label>
              <Controller name="unit" control={control} render={({ field }) => (
                <Select {...field}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>{t('retail.form.price')}</Label>
              <Input type="number" step="0.01" min="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#1A1A1A]">{t('retail.form.ingredientMappings')}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => append({ ingredientId: ingredients[0]?.id ?? '', matchConfidence: 1 })}
              >
                <Plus className="h-3.5 w-3.5" /> {t('retail.form.addMapping')}
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">{t('retail.form.noMappings')}</p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Controller
                        name={`ingredientMappings.${idx}.ingredientId`}
                        control={control}
                        render={({ field: f }) => (
                          <Select {...f}>
                            {ingredients.map(i => (
                              <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                          </Select>
                        )}
                      />
                    </div>
                    <div className="w-24 space-y-0">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.0–1.0"
                        {...register(`ingredientMappings.${idx}.matchConfidence`)}
                        className="text-sm"
                      />
                    </div>
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t('retail.form.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner className="h-4 w-4" /> : product ? t('retail.form.save') : t('retail.form.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
