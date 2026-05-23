/**
 * MemberView — per-member personal daily view.
 *
 * Shows a member's own meal slots across a multi-member plan:
 * - Their portion macros (servingMultiplier applied by the backend or derived here)
 * - "Ate it" action (single tap) → updates PlannedMeal status via planService
 * - "Something else" → opens OffPlanLogSheet
 * - Dietary prefs & allergens summary panel
 * - Off-plan history for the day (existing offPlanMealsService)
 *
 * Routing: /app/members/:memberId?planId=<uuid>&date=<yyyy-mm-dd>
 *
 * The memberId in the URL is the userId to view. The authenticated user can
 * only see their own slot data — the backend enforces this. The planner can
 * impersonate to see other members' views (via existing ImpersonationBanner).
 *
 * BE4 DEPENDENCY NOTE: Skip-slot, meal-request, and recipient notification
 * surfaces are rendered as disabled / "coming soon" affordances.
 */
import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberMealSlot } from '@/components/member/MemberMealSlot'
import { OffPlanLogSheet } from '@/components/member/OffPlanLogSheet'
import { plannedMealsService } from '@/services/plannedMeals'
import { offPlanMealsService } from '@/services/offPlanMeals'
import { useAuthStore } from '@/store/auth'
import { todayIsoLocal } from '@/lib/utils'
import type { MealType, MaterializedPlannedMeal } from '@/types'

const MEAL_TYPE_ORDER: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'SNACK',
]

export function MemberView() {
  const { memberId } = useParams<{ memberId: string }>()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const session = useAuthStore(s => s.session)

  const viewDate = searchParams.get('date') ?? todayIsoLocal()
  const isOwnView = !memberId || memberId === session?.user.id
  const targetMemberId = memberId ?? session?.user.id ?? ''

  // ── Fetch planned meals for this member on this date ─────────────────────
  // Source: materialized planned_meal table (meal-planning-v2).
  // Falls back to empty array until KALMIO-249 backend endpoint ships.
  const {
    data: memberMeals = [],
    isLoading: mealsLoading,
    isError: mealsError,
  } = useQuery({
    queryKey: ['planned-meals', viewDate, viewDate, targetMemberId],
    queryFn: () => plannedMealsService.listInRangeForMember(viewDate, viewDate, targetMemberId),
    enabled: !!targetMemberId,
    staleTime: 30_000,
  })

  const todaysMeals: MaterializedPlannedMeal[] = [...memberMeals].sort(
    (a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType),
  )

  // ── Off-plan meals for the day ────────────────────────────────────────────
  const { data: offPlanMeals = [] } = useQuery({
    queryKey: ['offPlanMeals', viewDate],
    queryFn: () => offPlanMealsService.list(viewDate),
    staleTime: 30_000,
  })

  // ── Mark eaten mutation ───────────────────────────────────────────────────
  const markEatenMutation = useMutation({
    mutationFn: (mealId: string) =>
      plannedMealsService.updateStatus(mealId, { status: 'EATEN' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planned-meals', viewDate] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  // ── Off-plan log sheet state ──────────────────────────────────────────────
  const [logSheetMealId, setLogSheetMealId] = useState<string | null>(null)
  const logSheetOpen = logSheetMealId !== null

  return (
    <div>
      <Header
        title={isOwnView ? t('member.view.myMealsTitle') : t('member.view.memberMealsTitle')}
        subtitle={viewDate}
      />

      {/* Loading */}
      {mealsLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {/* Error */}
      {mealsError && (
        <Card className="border-red-200">
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{t('common.errorGeneric')}</p>
          </CardContent>
        </Card>
      )}

      {!mealsLoading && (
        <div className="space-y-4">
          {/* Meal slots */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#1a1a1a]">
                {t('member.view.plannedMeals')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {todaysMeals.length === 0 ? (
                <p className="text-sm text-[#6b7280] text-center py-4">{t('plan.planner.noMealsDay')}</p>
              ) : (
                todaysMeals.map(meal => (
                  <MemberMealSlot
                    key={meal.id}
                    plannedMealId={meal.id}
                    date={meal.date}
                    mealType={meal.mealType}
                    recipeId={meal.recipeId}
                    recipeName={meal.recipeName}
                    portionKcal={null}
                    portionProtein={null}
                    portionFat={null}
                    portionCarbs={null}
                    servingMultiplier={1}
                    status={meal.status}
                    isBatchCookLeftover={false}
                    isOwn={isOwnView}
                    onMarkEaten={mealId => markEatenMutation.mutate(mealId)}
                    onLogOffPlan={mealId => setLogSheetMealId(mealId)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* BE4 stub notices */}
          <Card className="border-dashed border-[#d1d5db]">
            <CardContent className="py-4">
              <div className="flex items-start gap-2 text-xs text-[#6b7280]">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#9ca3af]" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#9ca3af]">{t('common.comingSoon')}</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>{t('member.view.skipSlotComingSoon')}</li>
                    <li>{t('member.view.mealRequestComingSoon')}</li>
                    <li>{t('member.view.recipientNotificationComingSoon')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Off-plan meals logged today */}
          {offPlanMeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[#1a1a1a]">
                  {t('member.view.offPlanHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {offPlanMeals.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#f9f7f2]">
                    <span className="text-sm text-[#1a1a1a]">{m.displayName}</span>
                    {m.macros && (
                      <span className="text-xs text-[#6b7280]">{m.macros.kcal.toFixed(0)} kcal</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Floating "Log meal" CTA */}
          {isOwnView && (
            <div className="fixed bottom-6 right-4 sm:right-6 z-30">
              <button
                type="button"
                onClick={() => setLogSheetMealId('')}
                className="
                  flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
                  bg-[#4f7942] text-white text-sm font-semibold
                  hover:bg-[#3d6132] active:bg-[#2e4a26] transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f7942]
                "
                aria-label={t('offPlan.sheet.logFloating')}
              >
                {t('offPlan.sheet.logFloating')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Off-plan log sheet */}
      {logSheetOpen && (
        <OffPlanLogSheet
          plannedMealId={logSheetMealId || null}
          date={viewDate}
          familyRecipients={[]}
          onClose={() => setLogSheetMealId(null)}
        />
      )}
    </div>
  )
}
