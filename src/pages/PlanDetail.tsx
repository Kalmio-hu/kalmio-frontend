/**
 * PlanDetail — template editor for a plan template (meal-planning-v2).
 *
 * Route: /app/plans/:id
 *
 * Shows:
 * - Header: plan name, slot/member/length chips, status badge, "..." action menu.
 * - TemplateGrid: days × slots × members, each cell editable via TemplateCellPicker.
 * - Action menu: Copy, Snapshot refresh, Archive (with confirm dialog).
 *
 * Data flow:
 * - useQuery(['plan-template', id]) → planTemplateService.getById
 * - useMutation → planTemplateService.upsertTemplateMeal (invalidates above query)
 * - useMutation → planTemplateService.copy / archive / refreshSnapshot
 */
import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, MoreHorizontal, Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MemberChip, OverflowChip } from '@/components/plan/MemberChip'
import { MEMBER_COLORS } from '@/components/plan/memberColors'
import { TemplateGrid } from '@/components/plan/TemplateGrid'
import { TemplateCellPicker } from '@/components/plan/TemplateCellPicker'
import type { TemplateCellPickerResult } from '@/components/plan/TemplateCellPicker'
import { planTemplateService } from '@/services/plans'
import { recipesService } from '@/services/recipes'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/store/auth'
import { getRecipeName } from '@/lib/i18nRecipe'
import { toast } from '@/components/ui/toast'
import type { MealType, TemplateMeal } from '@/types'

const MAX_HEADER_CHIPS = 4

// ── Active cell state ────────────────────────────────────────────────────

interface ActiveCell {
  dayIndex: number
  mealType: MealType
  memberId: string
  existing: TemplateMeal | null
}

// ── Fill-confirm dialog state ─────────────────────────────────────────────

type FillMode = 'empty' | 'all'

export function PlanDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? '')
  const lang = (i18n.resolvedLanguage === 'hu' ? 'hu' : 'en') as 'hu' | 'en'

  // ── Local UI state ───────────────────────────────────────────────────────
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [fillConfirmOpen, setFillConfirmOpen] = useState(false)
  const [fillMode, setFillMode] = useState<FillMode>('empty')
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Data fetching ────────────────────────────────────────────────────────

  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['plan-template', id],
    queryFn: () => planTemplateService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  // Fetch all recipes so we can show names in filled cells
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesService.list,
    staleTime: 5 * 60_000,
    enabled: !!plan,
  })

  // Build recipe name lookup
  const recipeNames: Record<string, string> = {}
  for (const r of recipes) {
    recipeNames[r.id] = getRecipeName(r, lang)
  }

  // Build member name lookup
  const memberNames: Record<string, string> = {}
  if (plan && me) {
    for (const uid of plan.memberIds) {
      if (uid === currentUserId) {
        const full = [me.firstName, me.lastName].filter(Boolean).join(' ')
        memberNames[uid] = full || me.email || uid.slice(0, 8)
      } else {
        memberNames[uid] = uid.slice(0, 8)
      }
    }
  }

  // ── Mutations ────────────────────────────────────────────────────────────

  const upsertMutation = useMutation({
    mutationFn: (vars: {
      body: Parameters<typeof planTemplateService.upsertTemplateMeal>[1]
      existingId: string | null
    }) => planTemplateService.upsertTemplateMeal(id!, vars.body, vars.existingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      toast({ title: t('plan.detail.cell.saved'), variant: 'success' })
      setActiveCell(null)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const clearMutation = useMutation({
    mutationFn: (templateMealId: string) =>
      planTemplateService.clearTemplateMeal(id!, templateMealId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      setActiveCell(null)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => planTemplateService.copy(id!),
    onSuccess: (copy) => {
      qc.invalidateQueries({ queryKey: ['plan-template'] })
      toast({ title: t('plan.detail.copySuccess'), variant: 'success' })
      navigate(`/app/plans/${copy.id}`)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const snapshotMutation = useMutation({
    mutationFn: () => planTemplateService.refreshSnapshot(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      toast({ title: t('plan.detail.snapshotRefreshSuccess'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => planTemplateService.archive(id!),
    onSuccess: () => {
      toast({ title: t('plan.detail.archiveSuccess'), variant: 'success' })
      navigate('/app/plans')
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  // ── Cell handlers ────────────────────────────────────────────────────────

  function handleCellClick(
    dayIndex: number,
    mealType: MealType,
    memberId: string,
    existing: TemplateMeal | null,
  ) {
    setActiveCell({ dayIndex, mealType, memberId, existing })
  }

  function handlePickerConfirm(result: TemplateCellPickerResult) {
    if (!activeCell) return
    const body = {
      dayIndex: activeCell.dayIndex,
      mealType: activeCell.mealType,
      memberId: activeCell.memberId,
      recipeId: result.recipe.id,
      offPlanMealTemplateId: null,
      servings: result.servings,
    }
    upsertMutation.mutate({ body, existingId: activeCell.existing?.id ?? null })
  }

  function handlePickerClear() {
    if (!activeCell?.existing?.id) {
      setActiveCell(null)
      return
    }
    clearMutation.mutate(activeCell.existing.id)
  }

  // ── Loading / error states ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" aria-live="polite" aria-busy="true">
        <Spinner />
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
      </div>
    )
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const visibleMembers = plan.memberIds.slice(0, MAX_HEADER_CHIPS)
  const overflow = plan.memberIds.length - MAX_HEADER_CHIPS

  const pickerCurrentRecipeId =
    activeCell?.existing?.recipeId ?? null
  const pickerCurrentServings =
    activeCell?.existing?.servings ?? 1
  const pickerCanClear =
    activeCell?.existing != null &&
    (activeCell.existing.recipeId != null || activeCell.existing.offPlanMealTemplateId != null)

  const isMutating =
    upsertMutation.isPending || clearMutation.isPending

  // ── Status badge ─────────────────────────────────────────────────────────

  const statusLabel =
    t(`plan.detail.statusBadge.${plan.status}`, { defaultValue: plan.status })

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-[#e5e7eb] text-[#6b7280]',
    ACTIVE: 'bg-[#dcfce7] text-[#15803d]',
    ARCHIVED: 'bg-[#fef9c3] text-[#854d0e]',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      {/* Page header */}
      <Header
        title={plan.name}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/app/plans')}
              className="text-sm text-[#6b7280] hover:text-[#1A1A1A] flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              aria-label={t('common.back')}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              {t('common.back')}
            </button>

            {/* "..." action menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-label={t('plan.detail.actions.menuAria')}
                aria-expanded={menuOpen}
                className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]"
              >
                <MoreHorizontal className="w-4 h-4" aria-hidden />
              </button>

              {menuOpen && (
                <>
                  {/* Dismiss overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 z-20 w-48 rounded-[12px] border border-[#e5e7eb] bg-white shadow-lg py-1 focus:outline-none">
                    <MenuButton
                      onClick={() => {
                        setMenuOpen(false)
                        setFillConfirmOpen(true)
                      }}
                    >
                      {t('plan.detail.actions.fill')}
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        setMenuOpen(false)
                        copyMutation.mutate()
                      }}
                      disabled={copyMutation.isPending}
                    >
                      {t('plan.detail.actions.copy')}
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        setMenuOpen(false)
                        snapshotMutation.mutate()
                      }}
                      disabled={snapshotMutation.isPending}
                    >
                      {t('plan.detail.actions.snapshotRefresh')}
                    </MenuButton>
                    <MenuButton
                      onClick={() => {
                        setMenuOpen(false)
                        setArchiveConfirmOpen(true)
                      }}
                      className="text-red-500"
                    >
                      {t('plan.detail.actions.archive')}
                    </MenuButton>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Plan meta chips */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Status badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[plan.status] ?? statusColor.DRAFT}`}
        >
          {statusLabel}
        </span>

        {/* Length chip */}
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#6b7280]">
          {t('plan.detail.lengthChip_other', { count: plan.lengthDays })}
        </span>

        {/* Shopping cadence chip */}
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3f4f6] text-[#6b7280]">
          {t('plan.detail.cadenceChip', { days: plan.shoppingCadenceDays })}
        </span>

        {/* Meal slot chips */}
        {plan.mealSlotsCovered.map(slot => (
          <span
            key={slot}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#ede9fe] text-[#4f46e5]"
          >
            {t(`plan.mealTypes.${slot}`, { defaultValue: slot })}
          </span>
        ))}

        {/* Member chips */}
        <div
          className="flex items-center gap-1 ml-auto"
          aria-label={t('plan.detail.membersChipAria')}
        >
          {visibleMembers.map((uid, i) => (
            <MemberChip
              key={uid}
              name={memberNames[uid] ?? uid}
              colorClass={MEMBER_COLORS[i % MEMBER_COLORS.length]}
              size="sm"
            />
          ))}
          {overflow > 0 && <OverflowChip count={overflow} size="sm" />}
        </div>
      </div>

      {/* Template grid */}
      <TemplateGrid
        plan={plan}
        memberNames={memberNames}
        recipeNames={recipeNames}
        onCellClick={handleCellClick}
      />

      {/* Cell picker modal */}
      {activeCell && (
        <TemplateCellPicker
          open={activeCell != null}
          currentRecipeId={pickerCurrentRecipeId}
          currentServings={pickerCurrentServings}
          onConfirm={handlePickerConfirm}
          onClear={handlePickerClear}
          onClose={() => setActiveCell(null)}
          canClear={pickerCanClear}
          isSaving={isMutating}
        />
      )}

      {/* Archive confirm dialog */}
      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('plan.detail.actions.archiveConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280] mb-5">
            {t('plan.detail.actions.archiveConfirmBody')}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setArchiveConfirmOpen(false)}
              disabled={archiveMutation.isPending}
            >
              {t('plan.detail.actions.archiveConfirmCancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setArchiveConfirmOpen(false)
                archiveMutation.mutate()
              }}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                t('plan.detail.actions.archiveConfirmOk')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fill confirm dialog */}
      <Dialog open={fillConfirmOpen} onOpenChange={setFillConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('plan.detail.actions.fillConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mb-5">
            {(['empty', 'all'] as FillMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setFillMode(mode)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] border text-left
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
                  ${fillMode === mode
                    ? 'border-[#4f46e5] bg-[#4f46e5]/5'
                    : 'border-[#e5e7eb] hover:bg-[#f9f7f2]'}
                `}
              >
                <span className="flex-1 text-sm text-[#1A1A1A]">
                  {mode === 'empty'
                    ? t('plan.detail.actions.fillConfirmEmpty')
                    : t('plan.detail.actions.fillConfirmAll')}
                </span>
                {fillMode === mode && (
                  <Check className="h-4 w-4 text-[#4f46e5] shrink-0" aria-hidden />
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFillConfirmOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setFillConfirmOpen(false)
                // Solver fill is a future ticket (A6/A7) — no-op for now.
                toast({ title: t('common.comingSoon') })
              }}
            >
              {t('plan.detail.actions.fillConfirmOk')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Shared menu-item button ───────────────────────────────────────────────

function MenuButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#f3f4f6]
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4f46e5]
        ${className}
      `}
    >
      {children}
    </button>
  )
}
