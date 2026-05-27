/**
 * PlanCreate — single-page form for creating a plan template (meal-planning-v2).
 *
 * Layout (top → bottom):
 *   1. Plan name (edit-in-place, auto-filled by the planner)
 *   2. Members (avatar chips + "Invite" deep-link to /app/family)
 *   3. Length (1/7/14 quick-picks + custom 1–28)
 *   4. Summary
 *   5. Two CTAs — "Let the planner fill it" (auto-solve) / "Start empty"
 *
 * Meal slots are derived as the union of selected members' preferredMealTypes
 * from their profile — there is no slot picker on this page. If no member has
 * any preferences set, falls back to LUNCH + DINNER.
 *
 * On submit: POST /api/plans (CreatePlanTemplateRequest).
 *   Auto-fill CTA  → additionally POST /api/plans/{id}/solve?mode=ALL.
 *   Empty CTA      → navigates straight to /app/plans/{id}.
 */
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Pencil, UserPlus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { familyService } from '@/services/family'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { planTemplateService } from '@/services/plans'
import { useAuthStore } from '@/store/auth'
import { generateTemplateName } from './planUtils'
import type { MealType, CreatePlanTemplateRequest } from '@/types'

const FAMILY_ID_KEY = 'kalmio_family_id'

const DURATION_PRESETS = [1, 7, 14]

type SubmitMode = 'AUTO' | 'EMPTY'

const BRAND_GREEN = '#4F7942'

export function PlanCreate() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? '')
  const familyId = localStorage.getItem(FAMILY_ID_KEY)

  const initialMemberIds =
    (location.state as { initialMemberIds?: string[] } | null)?.initialMemberIds ?? null

  const { data: family } = useQuery({
    queryKey: ['family', familyId],
    queryFn: () => familyService.getFamily(familyId!),
    enabled: !!familyId,
    staleTime: 60_000,
  })

  const { data: me } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    staleTime: 60_000,
  })

  const myDisplayName = me
    ? ([me.firstName, me.lastName].filter(Boolean).join(' ') || me.email)
    : t('family.memberRow.you')

  interface DisplayMember {
    userId: string
    displayName: string
    firstName: string | null
    lastName: string | null
    email: string | null
    avatarUrl: string | null
    preferredMealTypes: MealType[]
    isSelf: boolean
  }

  // All members visible on this page: every family member, with self first.
  const allMembers = useMemo<DisplayMember[]>(() => {
    if (!family) {
      return [{
        userId: currentUserId,
        displayName: myDisplayName,
        firstName: me?.firstName ?? null,
        lastName: me?.lastName ?? null,
        email: me?.email ?? null,
        avatarUrl: me?.avatarUrl ?? null,
        preferredMealTypes: (me?.mealPlanPreferences?.selectedMealTypes ?? []) as MealType[],
        isSelf: true,
      }]
    }
    return family.members.map<DisplayMember>((m) => {
      const isSelf = m.userId === currentUserId
      return {
        userId: m.userId,
        displayName: isSelf ? myDisplayName : (m.displayName ?? m.userId.slice(0, 8)),
        firstName: isSelf ? me?.firstName ?? null : null,
        lastName: isSelf ? me?.lastName ?? null : null,
        email: isSelf ? me?.email ?? null : null,
        avatarUrl: isSelf ? me?.avatarUrl ?? null : null,
        preferredMealTypes: (m.preferredMealTypes ?? []) as MealType[],
        isSelf,
      }
    })
  }, [family, currentUserId, me, myDisplayName])

  // Default: include everyone (matches the old PlanPreferencesForm behavior).
  // If the caller pre-selected members via route state, honor that instead.
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    initialMemberIds ?? [currentUserId],
  )

  // Once the family loads, if the user has not interacted yet (selection is
  // still the bare [self] default), expand to include all family members.
  const [userTouchedMembers, setUserTouchedMembers] = useState(false)
  const effectiveSelected = useMemo(() => {
    if (userTouchedMembers || initialMemberIds) return selectedMemberIds
    return allMembers.map((m) => m.userId)
  }, [userTouchedMembers, initialMemberIds, selectedMemberIds, allMembers])

  function toggleMember(userId: string) {
    setUserTouchedMembers(true)
    const base = effectiveSelected
    if (userId === currentUserId) return // self cannot be deselected
    setSelectedMemberIds(
      base.includes(userId) ? base.filter((id) => id !== userId) : [...base, userId],
    )
  }

  // Length
  const [lengthDays, setLengthDays] = useState(7)

  // Plan name
  const [editingName, setEditingName] = useState(false)
  const [planName, setPlanName] = useState('')

  const memberDisplayNames = effectiveSelected.map((id) => {
    const m = allMembers.find((sm) => sm.userId === id)
    return m?.displayName ?? id
  })
  const autoName = generateTemplateName(memberDisplayNames, t)
  const displayName = planName || autoName

  // Derived meal slots — union of selected members' preferred meal types.
  // Falls back to LUNCH + DINNER if no member has preferences set.
  const mealSlots = useMemo<MealType[]>(() => {
    const union = new Set<MealType>()
    for (const uid of effectiveSelected) {
      const m = allMembers.find((sm) => sm.userId === uid)
      if (!m) continue
      for (const mt of m.preferredMealTypes) union.add(mt)
    }
    return union.size > 0 ? Array.from(union) : ['LUNCH', 'DINNER']
  }, [effectiveSelected, allMembers])

  const [submitMode, setSubmitMode] = useState<SubmitMode | null>(null)

  const solveMut = useMutation({
    mutationFn: (planId: string) => planTemplateService.solve(planId, 'ALL'),
  })

  const createMut = useMutation({
    mutationFn: (req: CreatePlanTemplateRequest) => planTemplateService.create(req),
    onSuccess: async (plan) => {
      qc.invalidateQueries({ queryKey: ['plan-templates'] })
      if (submitMode === 'AUTO') {
        try {
          await solveMut.mutateAsync(plan.id)
        } catch {
          toast({ title: t('plan.wizard.solveFailed'), variant: 'destructive' })
          navigate(`/app/plans/${plan.id}`)
          return
        }
      }
      toast({ title: t('plan.wizard.created') })
      navigate(`/app/plans/${plan.id}`)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  function submit(mode: SubmitMode) {
    setSubmitMode(mode)
    const req: CreatePlanTemplateRequest = {
      name: planName || autoName,
      memberIds: effectiveSelected,
      mealSlotsCovered: mealSlots,
      lengthDays,
    }
    createMut.mutate(req)
  }

  const isPending = createMut.isPending || solveMut.isPending
  const canSubmit = effectiveSelected.length > 0 && lengthDays >= 1 && lengthDays <= 28

  const sectionCardClass =
    'bg-white rounded-2xl border border-[#e5e4e7] shadow-sm p-5'

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      <Header
        title={t('plan.wizard.title')}
        actions={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-[#6b7280] hover:text-[#1A1A1A] flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
        }
      />

      <div className="flex flex-col gap-4 mt-2">
        {/* 1. Plan name (top) */}
        <section className={sectionCardClass}>
          <Label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            {t('plan.wizard.planName')}
          </Label>
          {editingName ? (
            <div className="flex gap-2 mt-2">
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder={autoName}
                autoFocus
                maxLength={200}
              />
              <Button variant="secondary" size="sm" onClick={() => setEditingName(false)}>
                {t('common.save')}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!planName) setPlanName(autoName)
                setEditingName(true)
              }}
              className="mt-2 flex items-center gap-2 text-base text-[#1A1A1A] hover:text-[#4F7942] text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942] rounded"
            >
              <span className="font-medium">{displayName || t('plan.wizard.autoNamePlaceholder')}</span>
              <Pencil className="w-3.5 h-3.5 text-[#9ca3af]" aria-hidden />
            </button>
          )}
          <p className="text-xs text-[#9ca3af] mt-2">{t('plan.wizard.nameHint')}</p>
        </section>

        {/* 2. Who */}
        <section className={sectionCardClass}>
          <Label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            {t('plan.wizard.whoLabel')}
          </Label>
          <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label={t('plan.wizard.membersLabel')}>
            {allMembers.map((m) => {
              const isIncluded = effectiveSelected.includes(m.userId)
              return (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => toggleMember(m.userId)}
                  disabled={m.isSelf}
                  aria-pressed={isIncluded}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full border transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]',
                    isIncluded
                      ? 'border-[#4F7942] bg-white'
                      : 'border-gray-200 bg-gray-50 opacity-60',
                    m.isSelf ? 'cursor-default' : 'cursor-pointer hover:border-[#4F7942]/80',
                  )}
                  title={m.isSelf ? t('plan.wizard.whoSelfHint') : undefined}
                >
                  <div className="relative">
                    <UserAvatar
                      firstName={m.firstName}
                      lastName={m.lastName}
                      email={m.email}
                      avatarUrl={m.avatarUrl}
                      size="sm"
                    />
                    {isIncluded && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                        style={{ backgroundColor: BRAND_GREEN }}
                      >
                        <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="1,5 4,9 11,1" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A] max-w-[140px] truncate">
                    {m.displayName}
                  </span>
                </button>
              )
            })}

            {/* Invite — deep-links to the family page */}
            <button
              type="button"
              onClick={() => navigate('/app/family')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#4F7942] hover:text-[#4F7942] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]"
            >
              <UserPlus className="h-4 w-4" />
              {t('plan.wizard.inviteMember')}
            </button>
          </div>
          <p className="text-xs text-[#9ca3af] mt-3">{t('plan.wizard.whoSelfHint')}</p>
          {effectiveSelected.length === 0 && (
            <p className="text-xs text-red-600 mt-2" role="alert">{t('plan.wizard.atLeastOneMember')}</p>
          )}
        </section>

        {/* 3. Length */}
        <section className={sectionCardClass}>
          <Label className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            {t('plan.wizard.lengthLabel')}
          </Label>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {DURATION_PRESETS.map((d) => {
              const selected = lengthDays === d
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLengthDays(d)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]',
                    selected
                      ? 'text-white border-transparent'
                      : 'bg-white text-[#1A1A1A] border-[#e5e4e7] hover:border-[#4F7942]',
                  )}
                  style={selected ? { backgroundColor: BRAND_GREEN } : undefined}
                >
                  {t('plan.wizard.durationDays', { count: d })}
                </button>
              )
            })}
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={28}
                value={lengthDays}
                onChange={(e) => setLengthDays(Math.max(1, Math.min(28, Number(e.target.value))))}
                className="w-16 text-center"
                aria-label={t('plan.wizard.durationCustom')}
              />
              <span className="text-sm text-[#6b7280]">{t('plan.wizard.days')}</span>
            </div>
          </div>
        </section>

        {/* 4. Summary */}
        <section className="rounded-2xl bg-[#f9fafb] border border-[#e5e4e7] px-5 py-4 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide">
            {t('plan.wizard.summaryLabel')}
          </p>
          <p className="text-sm text-[#1A1A1A]">
            <span className="font-medium">{t('plan.wizard.summaryName')}</span>{' '}
            {displayName}
          </p>
          <p className="text-sm text-[#1A1A1A]">
            <span className="font-medium">{t('plan.wizard.summaryLength')}</span>{' '}
            {t('plan.wizard.durationDays', { count: lengthDays })}
          </p>
          <p className="text-sm text-[#1A1A1A]">
            <span className="font-medium">{t('plan.wizard.summarySlots')}</span>{' '}
            {mealSlots.map((mt) => t(`plan.mealTypes.${mt}`, mt)).join(', ')}{' '}
            <span className="text-xs text-[#9ca3af]">{t('plan.wizard.summarySlotsFromProfile')}</span>
          </p>
          <p className="text-sm text-[#1A1A1A]">
            <span className="font-medium">{t('plan.wizard.summaryMembers')}</span>{' '}
            {memberDisplayNames.join(', ')}
          </p>
        </section>

        {/* 5. CTAs */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 mt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => submit('EMPTY')}
            disabled={!canSubmit || isPending}
          >
            {isPending && submitMode === 'EMPTY' ? (
              <>
                <Spinner className="w-4 h-4" />
                {t('plan.wizard.creating')}
              </>
            ) : (
              t('plan.wizard.submitEmpty')
            )}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => submit('AUTO')}
            disabled={!canSubmit || isPending}
          >
            {isPending && submitMode === 'AUTO' ? (
              <>
                <Spinner className="w-4 h-4" />
                {solveMut.isPending ? t('plan.wizard.solving') : t('plan.wizard.creating')}
              </>
            ) : (
              t('plan.wizard.submitAuto')
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
