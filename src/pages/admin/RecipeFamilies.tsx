/**
 * RecipeFamilies — admin page for managing recipe families (W10).
 *
 * Route: /app/admin/recipe-families
 *
 * Features:
 *   - List all families with HU name, EN name, description, member count.
 *   - Client-side search by name.
 *   - Create: name (HU + EN), description (HU + EN).
 *   - Rename / re-describe via row-level edit.
 *   - Delete with confirmation — disabled when member count > 0.
 *
 * Pattern mirrors pages/admin/ContentReview.tsx.
 */
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { recipeFamiliesService } from '@/services/recipeFamilies'
import type {
  RecipeFamily,
  CreateRecipeFamilyRequest,
  UpdateRecipeFamilyRequest,
  RecipeFamilyTranslations,
} from '@/types'

// ── Query key ─────────────────────────────────────────────────────────────

const FAMILIES_QUERY_KEY = ['admin-recipe-families'] as const

// ── Helpers ───────────────────────────────────────────────────────────────

function getHuName(f: RecipeFamily): string {
  return f.translations?.hu?.name ?? f.name
}

function getEnName(f: RecipeFamily): string {
  return f.translations?.en?.name ?? ''
}

function getHuDesc(f: RecipeFamily): string {
  return f.translations?.hu?.description ?? f.description ?? ''
}

function getEnDesc(f: RecipeFamily): string {
  return f.translations?.en?.description ?? ''
}

function buildTranslations(
  huName: string,
  enName: string,
  huDesc: string,
  enDesc: string,
): RecipeFamilyTranslations {
  return {
    hu: { name: huName, description: huDesc || null },
    en: { name: enName || huName, description: enDesc || null },
  }
}

// ── Family form modal ─────────────────────────────────────────────────────

interface FamilyFormModalProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** When provided, the form is in edit mode. */
  family?: RecipeFamily
  onSubmit: (data: CreateRecipeFamilyRequest) => void
  isPending: boolean
}

function FamilyFormModal({ open, onOpenChange, family, onSubmit, isPending }: FamilyFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!family

  const [huName, setHuName] = useState(family ? getHuName(family) : '')
  const [enName, setEnName] = useState(family ? getEnName(family) : '')
  const [huDesc, setHuDesc] = useState(family ? getHuDesc(family) : '')
  const [enDesc, setEnDesc] = useState(family ? getEnDesc(family) : '')

  // Reset when a new family is passed in or the modal re-opens
  const resetForm = useCallback(() => {
    setHuName(family ? getHuName(family) : '')
    setEnName(family ? getEnName(family) : '')
    setHuDesc(family ? getHuDesc(family) : '')
    setEnDesc(family ? getEnDesc(family) : '')
  }, [family])

  function handleOpenChange(o: boolean) {
    if (o) resetForm()
    onOpenChange(o)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!huName.trim()) return
    onSubmit({
      name: huName.trim(),
      description: huDesc.trim() || null,
      translations: buildTranslations(
        huName.trim(),
        enName.trim(),
        huDesc.trim(),
        enDesc.trim(),
      ),
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('admin.recipeFamilies.editTitle')
              : t('admin.recipeFamilies.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hu-name">
                {t('admin.recipeFamilies.nameHu')}
                <span className="text-red-500 ml-0.5">*</span>
              </Label>
              <Input
                id="hu-name"
                value={huName}
                onChange={e => setHuName(e.target.value)}
                placeholder="pl. Zöldborsófőzelék"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="en-name">
                {t('admin.recipeFamilies.nameEn')}
              </Label>
              <Input
                id="en-name"
                value={enName}
                onChange={e => setEnName(e.target.value)}
                placeholder="e.g. Green pea stew"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hu-desc">
                {t('admin.recipeFamilies.descHu')}
              </Label>
              <Textarea
                id="hu-desc"
                value={huDesc}
                onChange={e => setHuDesc(e.target.value)}
                placeholder="Rövid leírás (opcionális)"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="en-desc">
                {t('admin.recipeFamilies.descEn')}
              </Label>
              <Textarea
                id="en-desc"
                value={enDesc}
                onChange={e => setEnDesc(e.target.value)}
                placeholder="Short description (optional)"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending || !huName.trim()}>
              {isPending ? <Spinner className="h-4 w-4" /> : null}
              {isEdit ? t('common.save') : t('admin.recipeFamilies.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export function RecipeFamilies() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editFamily, setEditFamily] = useState<RecipeFamily | null>(null)
  const [deleteFamily, setDeleteFamily] = useState<RecipeFamily | null>(null)

  // ── Data ──────────────────────────────────────────────────────────────────
  // NOTE: GET /api/recipe-families (list) does not exist yet — it ships with W4.
  // Until then, the page shows an empty list and lets the admin create families.
  // Once the list endpoint ships, replace the queryFn with the real call.
  const { data: families = [] as RecipeFamily[], isLoading } = useQuery<RecipeFamily[]>({
    queryKey: FAMILIES_QUERY_KEY,
    queryFn: (): Promise<RecipeFamily[]> => Promise.resolve([]),
    staleTime: 30_000,
  })

  // Client-side filter
  const filtered = families.filter(f => {
    const q = search.toLowerCase()
    return (
      getHuName(f).toLowerCase().includes(q) ||
      getEnName(f).toLowerCase().includes(q)
    )
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: CreateRecipeFamilyRequest) => recipeFamiliesService.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
      setCreateOpen(false)
      toast({ title: t('admin.recipeFamilies.createSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.recipeFamilies.createError'), variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRecipeFamilyRequest }) =>
      recipeFamiliesService.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
      setEditFamily(null)
      toast({ title: t('admin.recipeFamilies.updateSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.recipeFamilies.updateError'), variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipeFamiliesService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FAMILIES_QUERY_KEY })
      setDeleteFamily(null)
      toast({ title: t('admin.recipeFamilies.deleteSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('admin.recipeFamilies.deleteError'), variant: 'destructive' })
    },
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title={t('admin.recipeFamilies.title')}
        subtitle={t('admin.recipeFamilies.subtitle')}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('admin.recipeFamilies.searchPlaceholder')}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={t('common.clear')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('admin.recipeFamilies.create')}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gray-400">
            {search
              ? t('admin.recipeFamilies.noResults')
              : t('admin.recipeFamilies.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(family => {
            const memberCount = family.members?.length ?? 0
            const canDelete = memberCount === 0
            return (
              <Card key={family.id}>
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                          {getHuName(family)}
                        </p>
                        {getEnName(family) && (
                          <span className="text-xs text-gray-400 truncate">
                            / {getEnName(family)}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500 font-medium">
                          {t('admin.recipeFamilies.memberCount', { count: memberCount })}
                        </span>
                      </div>
                      {(getHuDesc(family) || getEnDesc(family)) && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {getHuDesc(family) || getEnDesc(family)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditFamily(family)}
                        aria-label={t('common.edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!canDelete || deleteMutation.isPending}
                        onClick={() => setDeleteFamily(family)}
                        title={!canDelete ? t('admin.recipeFamilies.deleteDisabledTooltip') : undefined}
                        className={!canDelete ? 'opacity-40 cursor-not-allowed' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <FamilyFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(body) => createMutation.mutate(body)}
        isPending={createMutation.isPending}
      />

      {/* Edit modal */}
      {editFamily && (
        <FamilyFormModal
          key={editFamily.id}
          open={!!editFamily}
          onOpenChange={(o) => { if (!o) setEditFamily(null) }}
          family={editFamily}
          onSubmit={(body) => updateMutation.mutate({ id: editFamily.id, body })}
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deleteFamily}
        onOpenChange={(o) => { if (!o) setDeleteFamily(null) }}
        title={t('admin.recipeFamilies.deleteConfirmTitle')}
        description={t('admin.recipeFamilies.deleteConfirmDesc', {
          name: deleteFamily ? getHuName(deleteFamily) : '',
        })}
        destructiveLabel={t('common.delete')}
        onConfirm={() => {
          if (deleteFamily) deleteMutation.mutate(deleteFamily.id)
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
