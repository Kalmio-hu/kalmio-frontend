import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { capture } from '@/lib/analytics'
import { dashboardService } from '@/services/dashboard'
import { planService } from '@/services/plans'
import type { OffPlanMealCard } from '@/types'

interface LogOffPlanMealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealType?: string
  date: string
  /** When opened from a MealCard, skip the planned meal to avoid double-counting */
  planId?: string
  mealId?: string
  /** When set, the modal edits this off-plan entry instead of creating a new one. */
  editing?: OffPlanMealCard
}

export function LogOffPlanMealModal({
  open,
  onOpenChange,
  mealType,
  date,
  planId,
  mealId,
  editing,
}: LogOffPlanMealModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isEditing = editing !== undefined

  const [displayName, setDisplayName] = useState('')
  const [kcal, setKcal] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [fatG, setFatG] = useState('')
  const [carbG, setCarbG] = useState('')

  // Reset form state during render when the modal opens (or switches between log/edit
  // contexts), per React's "Adjusting State When a Prop Changes" recipe — avoids the
  // cascading-render problems of resetting in an effect.
  const formKey = open ? (editing?.id ?? 'new') : 'closed'
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (open) {
      setDisplayName(editing?.displayName ?? '')
      setKcal(editing?.macros ? String(editing.macros.kcal) : '')
      setProteinG(editing?.macros ? String(editing.macros.protein) : '')
      setFatG(editing?.macros ? String(editing.macros.fat) : '')
      setCarbG(editing?.macros ? String(editing.macros.carbs) : '')
    }
  }

  function resetForm() {
    setDisplayName('')
    setKcal('')
    setProteinG('')
    setFatG('')
    setCarbG('')
  }

  const saveMeal = useMutation({
    mutationFn: async () => {
      const payload = {
        displayName: displayName.trim(),
        kcal: Number(kcal),
        proteinG: proteinG !== '' ? Number(proteinG) : undefined,
        fatG: fatG !== '' ? Number(fatG) : undefined,
        carbG: carbG !== '' ? Number(carbG) : undefined,
      }
      if (isEditing && editing) {
        await dashboardService.updateOffPlanMeal(editing.id, {
          mealType: editing.mealType,
          ...payload,
        })
      } else {
        await dashboardService.logOffPlanMeal({
          date,
          mealType,
          ...payload,
        })
        // Mark the original planned meal as SKIPPED so it doesn't also count toward the daily total.
        if (planId && mealId) {
          await planService.updateMeal(planId, mealId, { status: 'SKIPPED' })
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard', date] })
      void queryClient.invalidateQueries({ queryKey: ['macros', date] })
      capture(isEditing ? 'off_plan_meal_edited' : 'off_plan_meal_logged')
      toast({
        title: t(
          isEditing
            ? 'dashboard.meals.logOtherModal.saved'
            : 'dashboard.meals.logOtherModal.logged',
        ),
      })
      onOpenChange(false)
      resetForm()
    },
    onError: () => {
      toast({ title: t('dashboard.meals.errorUpdating'), variant: 'destructive' })
    },
  })

  const canSubmit = displayName.trim() !== '' && kcal !== ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              isEditing
                ? 'dashboard.meals.logOtherModal.titleEdit'
                : 'dashboard.meals.logOtherModal.title',
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">
              {t('dashboard.meals.logOtherModal.name')}
              <span className="text-red-500 ml-0.5" aria-hidden>*</span>
            </label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Kcal */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">
              {t('dashboard.meals.logOtherModal.kcal')}
              <span className="text-red-500 ml-0.5" aria-hidden>*</span>
            </label>
            <Input
              type="number"
              min={0}
              value={kcal}
              onChange={e => setKcal(e.target.value)}
            />
          </div>

          {/* Optional macros — 3-column grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {t('dashboard.meals.logOtherModal.protein')}
              </label>
              <Input
                type="number"
                min={0}
                value={proteinG}
                onChange={e => setProteinG(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {t('dashboard.meals.logOtherModal.fat')}
              </label>
              <Input
                type="number"
                min={0}
                value={fatG}
                onChange={e => setFatG(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">
                {t('dashboard.meals.logOtherModal.carbs')}
              </label>
              <Input
                type="number"
                min={0}
                value={carbG}
                onChange={e => setCarbG(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { onOpenChange(false); resetForm() }}
            disabled={saveMeal.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => saveMeal.mutate()}
            disabled={!canSubmit || saveMeal.isPending}
          >
            {saveMeal.isPending ? (
              <>
                <Spinner className="mr-2 h-3.5 w-3.5" />
                {t(
                  isEditing
                    ? 'dashboard.meals.logOtherModal.saving'
                    : 'dashboard.meals.logOtherModal.logging',
                )}
              </>
            ) : (
              t(
                isEditing
                  ? 'dashboard.meals.logOtherModal.save'
                  : 'dashboard.meals.logOtherModal.log',
              )
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
