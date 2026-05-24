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
import { ChevronLeft, MoreHorizontal, Check, Plus, Pause, Play, Square, Pencil, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { todayIsoLocal, dateToIsoLocal } from '@/lib/utils'
import type { Schedule, ScheduleStatus } from '@/types'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MemberChip, OverflowChip } from '@/components/plan/MemberChip'
import { MEMBER_COLORS } from '@/components/plan/memberColors'
import { TemplateGrid } from '@/components/plan/TemplateGrid'
import { TemplateCellPicker } from '@/components/plan/TemplateCellPicker'
import { PrepSlotPicker } from '@/components/plan/PrepSlotPicker'
import {
  parsePrepSlotDragId,
  parsePrepCellDropId,
} from '@/components/plan/prepLaneDnd'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { PlanMacroSummary } from '@/components/plan/PlanMacroSummary'
import { TemplateDriftBanner } from '@/components/plan/TemplateDriftBanner'
import { aggregateTargets, dailyTotals, weeklyAverage, targetsFromLive, targetsForMember, preferredSlotsByMember } from '@/lib/planMacros'
import { RecipePalette } from '@/components/plan/RecipePalette'
import { TrashDropZone, TRASH_DROP_ID } from '@/components/plan/TrashDropZone'
import { PlanSidePanel } from '@/components/plan/PlanSidePanel'
import type { TemplateCellPickerResult } from '@/components/plan/TemplateCellPicker'
import type { PrepSlotPickerResult } from '@/components/plan/PrepSlotPicker'
import { planTemplateService } from '@/services/plans'
import { recipesService } from '@/services/recipes'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { familyService } from '@/services/family'
import { templatePrepSlotsService } from '@/services/templatePrepSlots'
import { schedulesService } from '@/services/schedules'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { getRecipeName } from '@/lib/i18nRecipe'
import { toast } from '@/components/ui/toast'
import type { MealType, TemplateMeal } from '@/types'

const MAX_HEADER_CHIPS = 4

// ── Tab type ─────────────────────────────────────────────────────────────

type PlanDetailTab = 'template' | 'runs'

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
  const [activeTab, setActiveTab] = useState<PlanDetailTab>('template')
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [fillConfirmOpen, setFillConfirmOpen] = useState(false)
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false)
  // Pending palette-drop onto a filled slot — drives the replace-confirm dialog.
  const [paletteReplace, setPaletteReplace] = useState<
    { recipeId: string; target: TemplateMeal; targetRecipeName: string; sourceRecipeName: string } | null
  >(null)
  const [fillMode, setFillMode] = useState<FillMode>('empty')
  // Drag-and-drop transient state — drives DragOverlay + drop preview.
  const [dragSourceId, setDragSourceId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  // Prep-slot picker state — null = closed; set = open on (dayIndex, scheduledWindow).
  const [prepPickerCell, setPrepPickerCell] = useState<{
    dayIndex: number
    scheduledWindow: 'MORNING' | 'EVENING'
  } | null>(null)
  // True while a prep-slot chip is being dragged (drives PrepLaneRow styling).
  const [isPrepSlotDragging, setIsPrepSlotDragging] = useState(false)
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
    queryKey: USERS_ME_QUERY_KEY,
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

  // Fetch the family when the plan is family-owned so we can resolve member
  // display names (anything else falls back to the current user's name or a
  // short UUID).
  const { data: family } = useQuery({
    queryKey: ['family', plan?.familyId],
    queryFn: () => familyService.getFamily(plan!.familyId!),
    enabled: !!plan?.familyId,
    staleTime: 60_000,
  })

  // Live goal-derived targets for the current user. Used to patch a frozen
  // preferences_snapshot that was taken before the user set their goal.
  const { data: liveTargets } = useQuery({
    queryKey: ['my-targets'],
    queryFn: usersService.getTargets,
    staleTime: 60_000,
  })

  // Prep slots for this plan template — populated/reconciled server-side by
  // the PrepScheduler (KALMIO-262) whenever a template_meal changes.
  const { data: prepSlots = [] } = useQuery({
    queryKey: ['template-prep-slots', id],
    queryFn: () => templatePrepSlotsService.list(id!),
    enabled: !!id && !!plan,
    staleTime: 30_000,
  })

  // Schedules that include this plan — drives the Runs tab (KALMIO-306) and the
  // TemplateDriftBanner (KALMIO-323). Always fetched so the banner appears on template tab too.
  const { data: allSchedules = [] } = useQuery({
    queryKey: ['schedules'],
    queryFn: schedulesService.list,
    staleTime: 30_000,
    enabled: !!id && !!plan,
  })
  // Filter to schedules that reference this plan template.
  const planSchedules = allSchedules.filter(s => id && s.planIds.includes(id))
  // First ACTIVE schedule for this plan — used by TemplateDriftBanner (KALMIO-323).
  const activeSchedule = planSchedules.find(s => s.status === 'ACTIVE') ?? null

  // Prep-hold violations for this template — fetched from the Prep-H endpoint
  // (KALMIO-265). Used to render PrepHoldViolationBanner above offending cells.
  const { data: prepHoldViolations = [] } = useQuery({
    queryKey: ['prep-hold-violations', 'template', id] as const,
    queryFn: () =>
      api
        .get<Array<{ templateMealId: string; templatePrepSlotId: string; dayGap: number; fridgeWindow: number; recipeId: string }>>(
          `/api/plans/${id}/prep-hold-violations`,
        )
        .then(r => r.data),
    enabled: !!id && !!plan,
    staleTime: 30_000,
  })

  // Build a Set of violating templateMealIds for O(1) lookup in TemplateGrid.
  const violatingMealIds = new Set(prepHoldViolations.map(v => v.templateMealId))

  // Build recipe name + lookup map (lookup is used for macro rollups below)
  const recipeNames: Record<string, string> = {}
  const recipesById: Record<string, typeof recipes[number]> = {}
  for (const r of recipes) {
    recipeNames[r.id] = getRecipeName(r, lang)
    recipesById[r.id] = r
  }

  // Build member name lookup
  const familyDisplayName: Record<string, string> = {}
  if (family) {
    for (const m of family.members) {
      familyDisplayName[m.userId] = m.displayName
    }
  }
  const memberNames: Record<string, string> = {}
  if (plan) {
    plan.memberIds.forEach((uid, idx) => {
      if (uid === currentUserId && me) {
        const full = [me.firstName, me.lastName].filter(Boolean).join(' ')
        memberNames[uid] = full || me.email || t('plan.detail.memberFallback', { index: idx + 1 })
      } else if (familyDisplayName[uid]) {
        memberNames[uid] = familyDisplayName[uid]
      } else {
        // Family hasn't loaded the row yet OR the member was removed —
        // either way, show a friendly label so the user never sees a UUID.
        memberNames[uid] = t('plan.detail.memberFallback', { index: idx + 1 })
      }
    })
  }

  // ── Mutations ────────────────────────────────────────────────────────────

  const upsertMutation = useMutation({
    mutationFn: (vars: {
      body: Parameters<typeof planTemplateService.upsertTemplateMeal>[1]
      existingId: string | null
    }) => planTemplateService.upsertTemplateMeal(id!, vars.body, vars.existingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      // PrepScheduler reconciles prep slots server-side after every meal change.
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      toast({ title: t('plan.detail.cell.saved'), variant: 'success' })
      setActiveCell(null)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  // In-place servings stepper on a meal card. PUTs the existing template_meal
  // with the same coords and recipe, only the servings number changes.
  const servingsMutation = useMutation({
    mutationFn: (vars: { cell: TemplateMeal; servings: number }) =>
      planTemplateService.upsertTemplateMeal(
        id!,
        {
          dayIndex: vars.cell.dayIndex,
          mealType: vars.cell.mealType,
          memberId: vars.cell.memberId,
          recipeId: vars.cell.recipeId,
          offPlanMealTemplateId: vars.cell.offPlanMealTemplateId,
          servings: vars.servings,
        },
        vars.cell.id,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  const clearMutation = useMutation({
    mutationFn: (templateMealId: string) =>
      planTemplateService.clearTemplateMeal(id!, templateMealId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      setActiveCell(null)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const copyMutation = useMutation({
    mutationFn: () => planTemplateService.copy(id!),
    onSuccess: (copy) => {
      void qc.invalidateQueries({ queryKey: ['plan-template'] })
      void qc.invalidateQueries({ queryKey: ['plan-templates'] })
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

  const solveMutation = useMutation({
    mutationFn: (mode: FillMode) =>
      planTemplateService.solve(id!, mode === 'empty' ? 'EMPTY' : 'ALL'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      toast({ title: t('plan.detail.fillSuccess'), variant: 'success' })
      setFillConfirmOpen(false)
    },
    onError: () => {
      toast({ title: t('plan.detail.fillFailed'), variant: 'destructive' })
      setFillConfirmOpen(false)
    },
  })

  // Drag-and-drop ───────────────────────────────────────────────────────────
  //
  // Sensor with an 8 px activation distance so a tap-to-edit still works on
  // the grip area, and a keyboard sensor for accessibility.
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  // Atomic swap of two filled cells via the dedicated backend endpoint.
  const swapMutation = useMutation({
    mutationFn: (vars: { firstId: string; secondId: string }) =>
      planTemplateService.swapTemplateMeals(id!, vars.firstId, vars.secondId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // Move a single meal to a new (day, slot, member) coord set when the drop
  // target is empty — reuses the existing PUT upsert endpoint.
  const moveMutation = useMutation({
    mutationFn: (vars: {
      mealId: string
      dayIndex: number
      mealType: MealType
      memberId: string
      recipeId: string | null
      offPlanMealTemplateId: string | null
      servings: number
    }) => planTemplateService.upsertTemplateMeal(
      id!,
      {
        dayIndex: vars.dayIndex,
        mealType: vars.mealType,
        memberId: vars.memberId,
        recipeId: vars.recipeId,
        offPlanMealTemplateId: vars.offPlanMealTemplateId,
        servings: vars.servings,
      },
      vars.mealId,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // ── Prep-slot mutations ──────────────────────────────────────────────────

  const prepUpsertMutation = useMutation({
    mutationFn: (vars: { dayIndex: number; scheduledWindow: 'MORNING' | 'EVENING'; recipeId: string; servingsToMake: number; feedsTemplateMealIds: string[] }) =>
      templatePrepSlotsService.upsert(id!, {
        recipeId: vars.recipeId,
        dayIndex: vars.dayIndex,
        scheduledWindow: vars.scheduledWindow,
        feedsTemplateMealIds: vars.feedsTemplateMealIds,
        servingsToMake: vars.servingsToMake,
        servingsToFreeze: 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      setPrepPickerCell(null)
      toast({ title: t('plan.detail.cell.saved'), variant: 'success' })
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const prepPatchMutation = useMutation({
    mutationFn: (vars: { slotId: string; dayIndex: number; scheduledWindow: 'MORNING' | 'EVENING' }) =>
      templatePrepSlotsService.patch(vars.slotId, {
        dayIndex: vars.dayIndex,
        scheduledWindow: vars.scheduledWindow,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      toast({ title: t('plan.prep.actions.moved'), variant: 'success' })
    },
    onError: () => {
      // Rollback: re-fetch to restore server state.
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const prepRemoveMutation = useMutation({
    mutationFn: (slotId: string) => templatePrepSlotsService.remove(slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    setDragSourceId(activeId)
    setDragOverId(null)
    // Track whether a prep-slot chip is being dragged (drives prep-lane styling).
    setIsPrepSlotDragging(parsePrepSlotDragId(activeId) !== null)
  }

  function handleDragOver(event: DragOverEvent) {
    setDragOverId(event.over ? String(event.over.id) : null)
  }

  // Drop a palette item into a cell — creates a fresh template_meal with the
  // chosen recipe at the target coords. Palette source remains in place.
  const copyToCellMutation = useMutation({
    mutationFn: (vars: {
      recipeId: string
      dayIndex: number
      mealType: MealType
      memberId: string
    }) => planTemplateService.upsertTemplateMeal(id!, {
      dayIndex: vars.dayIndex,
      mealType: vars.mealType,
      memberId: vars.memberId,
      recipeId: vars.recipeId,
      offPlanMealTemplateId: null,
      servings: 1,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  // User confirmed they want to overwrite a filled slot from the palette.
  // PUT the existing template_meal so its recipeId becomes the new one —
  // the row's id and member coords stay the same.
  const replaceFromPaletteMutation = useMutation({
    mutationFn: (vars: { target: TemplateMeal; recipeId: string }) =>
      planTemplateService.upsertTemplateMeal(
        id!,
        {
          dayIndex: vars.target.dayIndex,
          mealType: vars.target.mealType,
          memberId: vars.target.memberId,
          recipeId: vars.recipeId,
          offPlanMealTemplateId: null,
          servings: Number(vars.target.servings),
        },
        vars.target.id,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      // KALMIO-271: invalidate prep slots so the prep lane reflects the new
      // recipe's batchability immediately, without waiting for stale-time expiry.
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      setPaletteReplace(null)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
      setPaletteReplace(null)
    },
  })

  // Drop a cell onto the trash — clears it.
  const trashMutation = useMutation({
    mutationFn: (templateMealId: string) =>
      planTemplateService.clearTemplateMeal(id!, templateMealId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  function handleDragEnd(event: DragEndEvent) {
    setDragSourceId(null)
    setDragOverId(null)
    setIsPrepSlotDragging(false)
    if (!plan) return
    if (!event.over) return

    const sourceId = String(event.active.id)
    const dropId = String(event.over.id)

    // ── Prep-slot drag: prep-slot:{slotId} → prep-cell:* OR trash ──
    const prepSlotId = parsePrepSlotDragId(sourceId)
    if (prepSlotId !== null) {
      // Trash drop deletes the slot.
      if (dropId === TRASH_DROP_ID) {
        prepRemoveMutation.mutate(prepSlotId)
        return
      }
      const target = parsePrepCellDropId(dropId)
      if (!target) return
      const slot = prepSlots.find(s => s.id === prepSlotId)
      if (!slot) return
      // No-op if dropped on same cell.
      if (slot.dayIndex === target.dayIndex && slot.scheduledWindow === target.scheduledWindow) return
      prepPatchMutation.mutate({ slotId: prepSlotId, dayIndex: target.dayIndex, scheduledWindow: target.scheduledWindow })
      return
    }

    // Trash takes precedence — clear the source cell.
    if (dropId === TRASH_DROP_ID) {
      if (sourceId.startsWith('palette:')) return
      // sourceId is a template_meal id when dragging an in-grid cell.
      const sourceMeal = plan.templateMeals.find(m => m.id === sourceId)
      if (sourceMeal) trashMutation.mutate(sourceMeal.id)
      return
    }

    // Beyond trash we only deal with cell drop targets.
    if (!dropId.startsWith('cell:')) return
    const [, dayStr, slotStr, memberId] = dropId.split(':')
    const targetDay = Number(dayStr)
    const targetSlot = slotStr as MealType

    // Palette drag → copy the chosen recipe into the target. If the slot is
    // already filled we surface a confirm dialog instead of overwriting silently.
    if (sourceId.startsWith('palette:')) {
      const recipeId = sourceId.slice('palette:'.length)
      const occupant = plan.templateMeals.find(m =>
        m.dayIndex === targetDay && m.mealType === targetSlot && m.memberId === memberId
      )
      if (occupant) {
        const sourceRecipeName =
          recipeNames[recipeId] ?? recipeId.slice(0, 8)
        const targetRecipeName =
          occupant.recipeId
            ? (recipeNames[occupant.recipeId] ?? occupant.recipeId.slice(0, 8))
            : t('plan.detail.cell.emptyLabel')
        setPaletteReplace({
          recipeId,
          target: occupant,
          sourceRecipeName,
          targetRecipeName,
        })
        return
      }
      copyToCellMutation.mutate({
        recipeId, dayIndex: targetDay, mealType: targetSlot, memberId,
      })
      return
    }

    const sourceMeal = plan.templateMeals.find(m => m.id === sourceId)
    if (!sourceMeal) return

    // No-op if dropped on its own slot.
    if (
      sourceMeal.dayIndex === targetDay &&
      sourceMeal.mealType === targetSlot &&
      sourceMeal.memberId === memberId
    ) {
      return
    }

    const targetMeal = plan.templateMeals.find(m =>
      m.dayIndex === targetDay && m.mealType === targetSlot && m.memberId === memberId
    )

    if (targetMeal) {
      swapMutation.mutate({ firstId: sourceMeal.id, secondId: targetMeal.id })
    } else {
      moveMutation.mutate({
        mealId: sourceMeal.id,
        dayIndex: targetDay,
        mealType: targetSlot,
        memberId,
        recipeId: sourceMeal.recipeId,
        offPlanMealTemplateId: sourceMeal.offPlanMealTemplateId,
        servings: Number(sourceMeal.servings),
      })
    }
  }

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

  // Bulk clear: wipe every template_meal row on this plan.
  const clearAllMutation = useMutation({
    mutationFn: () => planTemplateService.clearAllTemplateMeals(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-template', id] })
      qc.invalidateQueries({ queryKey: ['template-prep-slots', id] })
      toast({ title: t('plan.detail.clearAllSuccess'), variant: 'success' })
      setClearAllConfirmOpen(false)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
      setClearAllConfirmOpen(false)
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
    <div className="max-w-6xl mx-auto px-4 pb-10">
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
                        setClearAllConfirmOpen(true)
                      }}
                      className="text-red-500"
                    >
                      {t('plan.detail.actions.clearAll')}
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

      {/* Template drift banner — shown when an active schedule's snapshot is stale (KALMIO-323) */}
      {activeSchedule && id && (
        <TemplateDriftBanner planId={id} scheduleId={activeSchedule.id} />
      )}

      {/* Tab bar — Template | Futtatások (KALMIO-306) */}
      <div
        role="tablist"
        aria-label={plan.name}
        className="flex gap-1 mb-6 border-b border-[#e5e7eb]"
      >
        {(['template', 'runs'] as PlanDetailTab[]).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]
              ${activeTab === tab
                ? 'border-[#4f46e5] text-[#4f46e5]'
                : 'border-transparent text-[#6b7280] hover:text-[#1A1A1A] hover:border-[#d1d5db]'}
            `}
          >
            {tab === 'template'
              ? t('plan.detail.tabs.template')
              : t('plan.detail.tabs.runs.label')}
          </button>
        ))}
      </div>

      {/* Runs tab panel (KALMIO-306) */}
      {activeTab === 'runs' && (
        <div
          role="tabpanel"
          id="tabpanel-runs"
          aria-labelledby="tab-runs"
          className="pb-10"
        >
          <PlanRunsTab planId={id!} schedules={planSchedules} />
        </div>
      )}

      {/* Template tab panel */}
      {activeTab === 'template' && (
        <div role="tabpanel" id="tabpanel-template" aria-labelledby="tab-template">

      {/* Macro summary + per-day rollup vs targets */}
      {(() => {
        const daily = dailyTotals(plan, recipesById)
        const weekly = weeklyAverage(daily)
        const liveOverride = targetsFromLive(liveTargets ?? null)
        const overrides = liveOverride ? { [currentUserId]: liveOverride } : {}
        const targets = aggregateTargets(plan, overrides)
        // Per-member slot kcal target = that member's daily kcal / # slots.
        // Resolved per-member so a family plan where some members lack goals
        // still renders bars for the members who DO have goals.
        const slotsCount = plan.mealSlotsCovered.length
        const slotKcalTargetByMember: Record<string, number | null> = {}
        for (const uid of plan.memberIds) {
          const memberTarget = targetsForMember(plan, uid, overrides)
          slotKcalTargetByMember[uid] =
            memberTarget.kcal != null && slotsCount > 0
              ? memberTarget.kcal / slotsCount
              : null
        }
        const memberPreferredSlots = preferredSlotsByMember(plan)
        // Source meal currently being dragged (drives the floating overlay
        // and the swap-preview rendering in target cells).
        const draggedMeal = dragSourceId
          ? plan.templateMeals.find(m => m.id === dragSourceId) ?? null
          : null
        const draggedRecipe = draggedMeal?.recipeId
          ? recipesById[draggedMeal.recipeId]
          : undefined

        // Meal currently sitting in the hovered drop target — drives the
        // source cell's "what you'll get back after swap" preview. Null when
        // hovering over an empty cell or over the source itself.
        let dragOverMeal: TemplateMeal | null = null
        if (dragOverId && dragOverId.startsWith('cell:')) {
          const [, dayStr, slotStr, memberStr] = dragOverId.split(':')
          const overDay = Number(dayStr)
          const overSlot = slotStr as MealType
          dragOverMeal = plan.templateMeals.find(m =>
            m.dayIndex === overDay && m.mealType === overSlot && m.memberId === memberStr
          ) ?? null
          if (dragOverMeal && draggedMeal && dragOverMeal.id === draggedMeal.id) {
            dragOverMeal = null
          }
        }
        const dragOverRecipe = dragOverMeal?.recipeId
          ? recipesById[dragOverMeal.recipeId]
          : undefined
        const dragOverRecipeName = dragOverMeal?.recipeId
          ? (recipeNames[dragOverMeal.recipeId] ?? dragOverMeal.recipeId.slice(0, 8))
          : null

        return (
          <DndContext
            sensors={dndSensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => { setDragSourceId(null); setDragOverId(null); setIsPrepSlotDragging(false) }}
          >
            {/* Macro summary spans full width across all three columns. */}
            <PlanMacroSummary weekly={weekly} targets={targets} />

            {/*
              3-column responsive layout:
                ≥ lg: palette (left) · plan grid (center) · side panel (right)
                < lg: palette and side panel stack above/below the grid so the
                      grid stays the primary view on tablet/mobile.
            */}
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
              <aside className="order-2 lg:order-1">
                <RecipePalette plan={plan} recipesById={recipesById} lang={lang} />
              </aside>
              <div className="order-1 lg:order-2 min-w-0">
                <TemplateGrid
                  plan={plan}
                  memberNames={memberNames}
                  recipeNames={recipeNames}
                  recipesById={recipesById}
                  daily={daily}
                  targets={targets}
                  slotKcalTargetByMember={slotKcalTargetByMember}
                  preferredSlotsByMember={memberPreferredSlots}
                  dragSourceId={dragSourceId}
                  dragOverId={dragOverId}
                  dragOverMeal={dragOverMeal}
                  dragOverRecipe={dragOverRecipe}
                  dragOverRecipeName={dragOverRecipeName}
                  onCellClick={handleCellClick}
                  onServingsChange={(cell, servings) =>
                    servingsMutation.mutate({ cell, servings })
                  }
                  prepSlots={prepSlots}
                  isPrepSlotDragging={isPrepSlotDragging}
                  onPrepAddClick={(dayIndex, scheduledWindow) =>
                    setPrepPickerCell({ dayIndex, scheduledWindow })
                  }
                  onPrepDelete={(slotId) => prepRemoveMutation.mutate(slotId)}
                  planId={id!}
                  violatingMealIds={violatingMealIds}
                />
              </div>
              <aside className="order-3">
                <PlanSidePanel plan={plan} recipesById={recipesById} />
              </aside>
            </div>

            {/* Follow-cursor floating preview — handles both cell drags and
                palette drags so the user sees the same lift-and-drop feedback
                regardless of origin. */}
            <DragOverlay dropAnimation={null}>
              {draggedMeal ? (
                <DragGhost
                  recipeName={
                    draggedMeal.recipeId
                      ? (recipeNames[draggedMeal.recipeId] ?? draggedMeal.recipeId.slice(0, 8))
                      : t('plan.detail.cell.emptyLabel')
                  }
                  recipe={draggedRecipe}
                  servings={Number(draggedMeal.servings)}
                />
              ) : dragSourceId?.startsWith('palette:') ? (() => {
                const recipeId = dragSourceId.slice('palette:'.length)
                const recipe = recipesById[recipeId]
                if (!recipe) return null
                return (
                  <DragGhost
                    recipeName={recipeNames[recipeId] ?? recipeId.slice(0, 8)}
                    recipe={recipe}
                    servings={1}
                  />
                )
              })() : dragSourceId?.startsWith('prep-slot:') ? (() => {
                const slotId = dragSourceId.slice('prep-slot:'.length)
                const slot = prepSlots.find(s => s.id === slotId)
                if (!slot) return null
                const recipeName = recipeNames[slot.recipeId] ?? slot.recipeId.slice(0, 8)
                return (
                  <div
                    className="
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px]
                      bg-[#F0EDE6] text-[#1A1A1A] text-xs font-medium
                      shadow-xl ring-2 ring-[#4f46e5] cursor-grabbing
                    "
                    style={{ transform: 'rotate(-2deg)' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 bg-[#4f46e5]" aria-hidden />
                    <span className="truncate max-w-[140px]">{recipeName}</span>
                    <span className="shrink-0 tabular-nums text-[10.5px] text-[#6b7280]" aria-hidden>
                      {Number(slot.servingsToMake)}×
                    </span>
                  </div>
                )
              })() : null}
            </DragOverlay>

            {/* Floating trash zone — only visible while dragging an existing cell. */}
            <TrashDropZone
              visible={dragSourceId != null && !dragSourceId.startsWith('palette:')}
            />
          </DndContext>
        )
      })()}

      {/* Prep slot picker modal */}
      {prepPickerCell && (
        <PrepSlotPicker
          open={prepPickerCell != null}
          onConfirm={(result: PrepSlotPickerResult) => {
            if (!prepPickerCell) return
            // KALMIO-272 follow-up: picker doesn't yet collect which template_meal rows
            // this slot feeds — backend requires non-empty feeds_template_meal_ids.
            // Manual create from the picker will 400 until that UX is built.
            prepUpsertMutation.mutate({
              dayIndex: prepPickerCell.dayIndex,
              scheduledWindow: prepPickerCell.scheduledWindow,
              recipeId: result.recipe.id,
              servingsToMake: result.servingsToMake,
              feedsTemplateMealIds: [],
            })
          }}
          onClose={() => setPrepPickerCell(null)}
          isSaving={prepUpsertMutation.isPending}
        />
      )}

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

      {/* Palette → filled slot replace confirm */}
      <Dialog
        open={paletteReplace != null}
        onOpenChange={(open) => {
          if (replaceFromPaletteMutation.isPending) return
          if (!open) setPaletteReplace(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('plan.detail.palette.replaceTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280] mb-5">
            {t('plan.detail.palette.replaceBody', {
              source: paletteReplace?.sourceRecipeName ?? '',
              target: paletteReplace?.targetRecipeName ?? '',
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPaletteReplace(null)}
              disabled={replaceFromPaletteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => paletteReplace && replaceFromPaletteMutation.mutate({
                target: paletteReplace.target,
                recipeId: paletteReplace.recipeId,
              })}
              disabled={replaceFromPaletteMutation.isPending || paletteReplace == null}
            >
              {replaceFromPaletteMutation.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                t('plan.detail.palette.replaceOk')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear-all confirm dialog */}
      <Dialog open={clearAllConfirmOpen} onOpenChange={(open) => {
        if (clearAllMutation.isPending) return
        setClearAllConfirmOpen(open)
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('plan.detail.actions.clearAllConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6b7280] mb-5">
            {t('plan.detail.actions.clearAllConfirmBody', {
              count: plan.templateMeals.length,
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setClearAllConfirmOpen(false)}
              disabled={clearAllMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending || plan.templateMeals.length === 0}
            >
              {clearAllMutation.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                t('plan.detail.actions.clearAllConfirmOk')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
      <Dialog
        open={fillConfirmOpen}
        onOpenChange={(open) => {
          // Block dismiss while the solver is running so the user sees clear progress.
          if (solveMutation.isPending) return
          setFillConfirmOpen(open)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('plan.detail.actions.fillConfirmTitle')}</DialogTitle>
          </DialogHeader>
          {solveMutation.isPending ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-[#6b7280] text-center">
                {t('plan.detail.actions.fillProgress')}
              </p>
            </div>
          ) : (
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
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFillConfirmOpen(false)}
              disabled={solveMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => solveMutation.mutate(fillMode)}
              disabled={solveMutation.isPending}
            >
              {solveMutation.isPending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                t('plan.detail.actions.fillConfirmOk')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      )}
    </div>
  )
}

// ── Plan Runs tab ─────────────────────────────────────────────────────────
//
// Shows schedules that reference this plan template. Reuses the schedule card
// from the Schedules page — rendered inline, filtered to this plan's ID.
// KALMIO-306

function statusBadgeVariant(status: ScheduleStatus): 'green' | 'amber' | 'gray' {
  if (status === 'ACTIVE') return 'green'
  if (status === 'PAUSED') return 'amber'
  return 'gray'
}

function cadenceLabel(cadenceDays: number, t: ReturnType<typeof useTranslation>['t']): string {
  if (cadenceDays === 7) return t('schedules.cadence.weekly')
  if (cadenceDays === 14) return t('schedules.cadence.biweekly')
  return t('schedules.cadence.custom', { count: cadenceDays })
}

interface PlanRunsTabProps {
  planId: string
  schedules: Schedule[]
}

function PlanRunsTab({ planId, schedules }: PlanRunsTabProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#6b7280]">
          {schedules.length === 0
            ? t('plan.detail.tabs.runs.noRuns')
            : null}
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(`/app/schedules/new?planId=${planId}`)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" aria-hidden />
          {t('plan.detail.tabs.runs.newRunCta')}
        </Button>
      </div>

      {schedules.length > 0 && (
        <div className="flex flex-col gap-3">
          {schedules.map(s => (
            <RunCard key={s.id} schedule={s} />
          ))}
        </div>
      )}
    </div>
  )
}

function RunCard({ schedule }: { schedule: Schedule }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [materializeOpen, setMaterializeOpen] = useState(false)
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)

  const { mutate: doPause, isPending: isPausing } = useMutation({
    mutationFn: () => schedulesService.pause(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.pauseSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doResume, isPending: isResuming } = useMutation({
    mutationFn: () => schedulesService.resume(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.resumeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const { mutate: doEnd, isPending: isEnding } = useMutation({
    mutationFn: () => schedulesService.delete(schedule.id),
    onSuccess: () => {
      toast({ title: t('schedules.actions.endSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
    },
    onError: () => toast({ title: t('schedules.actions.actionError'), variant: 'destructive' }),
  })

  const isActive = schedule.status === 'ACTIVE'
  const isPaused = schedule.status === 'PAUSED'
  const isEnded = schedule.status === 'ENDED'
  const isBusy = isPausing || isResuming || isEnding

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A1A] truncate leading-tight">{schedule.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {cadenceLabel(schedule.cadenceDays, t)} &middot;{' '}
              {t('schedules.card.plans_other', { count: schedule.planIds.length })}
            </p>
          </div>
          <Badge variant={statusBadgeVariant(schedule.status)}>
            {t(`schedules.status.${schedule.status}`)}
          </Badge>
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          <p>
            {t('schedules.wizard.startDate')}:{' '}
            <span className="text-[#1A1A1A] font-medium">{schedule.startDate}</span>
            {schedule.endDate ? (
              <> &ndash; <span className="text-[#1A1A1A] font-medium">{schedule.endDate}</span></>
            ) : null}
          </p>
          <p>
            {schedule.lastMaterializedDate
              ? t('schedules.card.lastMaterialized', { date: schedule.lastMaterializedDate })
              : t('schedules.card.neverMaterialized')}
          </p>
        </div>

        {!isEnded && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50">
            <button
              onClick={() => navigate(`/app/schedules/${schedule.id}`)}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              {t('schedules.actions.edit')}
            </button>

            {isActive && (
              <button
                onClick={() => doPause()}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                type="button"
              >
                <Pause className="h-3.5 w-3.5" aria-hidden />
                {isPausing ? '…' : t('schedules.actions.pause')}
              </button>
            )}

            {isPaused && (
              <button
                onClick={() => doResume()}
                disabled={isBusy}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
                type="button"
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                {isResuming ? '…' : t('schedules.actions.resume')}
              </button>
            )}

            <button
              onClick={() => setMaterializeOpen(true)}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-[#4f46e5] hover:text-[#3730a3] transition-colors disabled:opacity-50"
              type="button"
            >
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {t('schedules.actions.materialize')}
            </button>

            <button
              onClick={() => setEndConfirmOpen(true)}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 ml-auto"
              type="button"
            >
              <Square className="h-3.5 w-3.5" aria-hidden />
              {isEnding ? '…' : t('schedules.actions.end')}
            </button>
          </div>
        )}
      </div>

      {/* Materialize dialog */}
      <RunMaterializeDialog
        schedule={schedule}
        open={materializeOpen}
        onOpenChange={setMaterializeOpen}
      />

      <ConfirmDialog
        open={endConfirmOpen}
        onOpenChange={setEndConfirmOpen}
        title={t('confirm.delete.schedule.title')}
        description={t('confirm.delete.schedule.body')}
        destructiveLabel={t('confirm.delete.schedule.confirm')}
        cancelLabel={t('confirm.delete.schedule.cancel')}
        onConfirm={() => doEnd()}
        isPending={isEnding}
      />
    </>
  )
}

function RunMaterializeDialog({
  schedule,
  open,
  onOpenChange,
}: {
  schedule: Schedule
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const defaultThrough = (() => {
    const d = new Date()
    d.setDate(d.getDate() + schedule.cadenceDays)
    return dateToIsoLocal(d)
  })()

  const [throughDate, setThroughDate] = useState(defaultThrough)

  const { mutate: doMaterialize, isPending } = useMutation({
    mutationFn: () => schedulesService.materialize(schedule.id, throughDate),
    onSuccess: () => {
      toast({ title: t('schedules.actions.materializeSuccess') })
      void qc.invalidateQueries({ queryKey: ['schedules'] })
      void qc.invalidateQueries({ queryKey: ['planned-meals'] })
      onOpenChange(false)
    },
    onError: () => {
      toast({ title: t('schedules.actions.actionError'), variant: 'destructive' })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('schedules.actions.materialize')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="run-through-date">
              {t('schedules.detail.materializeThroughLabel')}
            </Label>
            <Input
              id="run-through-date"
              type="date"
              value={throughDate}
              min={todayIsoLocal()}
              onChange={e => setThroughDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => doMaterialize()}
              disabled={isPending || !throughDate}
              type="button"
            >
              {isPending
                ? t('schedules.wizard.submitting')
                : t('schedules.actions.materializeSubmit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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

// ── Drag overlay ghost card ───────────────────────────────────────────────

/**
 * Floating preview of the meal being dragged. Renders inside @dnd-kit's
 * <DragOverlay> so it follows the cursor without re-layouting the grid.
 */
function DragGhost({
  recipeName,
  recipe,
  servings,
}: {
  recipeName: string
  recipe: import('@/types').Recipe | undefined
  servings: number
}) {
  let kcal = 0
  let protein = 0
  let fat = 0
  let carbs = 0
  if (recipe?.macros && recipe.servings > 0) {
    const factor = servings / recipe.servings
    if (Number.isFinite(factor) && factor > 0) {
      kcal = recipe.macros.kcal * factor
      protein = recipe.macros.protein * factor
      fat = recipe.macros.fat * factor
      carbs = recipe.macros.carbs * factor
    }
  }
  return (
    <div
      className="
        flex flex-col gap-1 px-3 py-2 rounded-[12px]
        bg-[#F0EDE6] text-[#1A1A1A] text-xs font-medium
        shadow-xl ring-2 ring-[#4f46e5] cursor-grabbing
        w-full h-full
      "
      style={{ transform: 'rotate(-2deg)' }}
    >
      <div className="flex items-center gap-1.5 min-w-0 w-full">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#4f46e5]" aria-hidden />
        <span className="truncate">{recipeName}</span>
      </div>
      {kcal > 0 && (
        <p className="text-[10.5px] text-[#6b7280] tabular-nums leading-tight text-left">
          <span className="font-semibold text-[#1A1A1A]">{Math.round(kcal)}</span>
          <span className="ml-0.5">kcal</span>
          <span className="mx-1 text-[#d1d5db]" aria-hidden>·</span>
          {Math.round(protein)}P
          <span className="mx-0.5 text-[#d1d5db]" aria-hidden>·</span>
          {Math.round(fat)}F
          <span className="mx-0.5 text-[#d1d5db]" aria-hidden>·</span>
          {Math.round(carbs)}C
        </p>
      )}
    </div>
  )
}
