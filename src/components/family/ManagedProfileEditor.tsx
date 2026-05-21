import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserPreferencesDto } from '@/types'
import { blankPreferences } from '@/services/family'

export interface ManagedProfileFormValues {
  displayName: string
  vegetarian: boolean
  vegan: boolean
  pescatarian: boolean
  glutenFree: boolean
  dairyFree: boolean
  lactoseFree: boolean
  milkProteinFree: boolean
  eggFree: boolean
  nutFree: boolean
  peanutFree: boolean
  soyFree: boolean
  fishFree: boolean
  shellfishFree: boolean
  sesameFree: boolean
  halal: boolean
  kosher: boolean
  keto: boolean
  lowGi: boolean
  lowFodmap: boolean
  paleo: boolean
  kcalTarget: string
  proteinTargetG: string
  carbsTargetG: string
  fatTargetG: string
  portionSizeMultiplier: string
  prepToleranceMinutes: string
}

function prefsToForm(
  displayName: string,
  prefs: Partial<UserPreferencesDto>,
): ManagedProfileFormValues {
  return {
    displayName,
    vegetarian: prefs.vegetarian ?? false,
    vegan: prefs.vegan ?? false,
    pescatarian: prefs.pescatarian ?? false,
    glutenFree: prefs.glutenFree ?? false,
    dairyFree: prefs.dairyFree ?? false,
    lactoseFree: prefs.lactoseFree ?? false,
    milkProteinFree: prefs.milkProteinFree ?? false,
    eggFree: prefs.eggFree ?? false,
    nutFree: prefs.nutFree ?? false,
    peanutFree: prefs.peanutFree ?? false,
    soyFree: prefs.soyFree ?? false,
    fishFree: prefs.fishFree ?? false,
    shellfishFree: prefs.shellfishFree ?? false,
    sesameFree: prefs.sesameFree ?? false,
    halal: prefs.halal ?? false,
    kosher: prefs.kosher ?? false,
    keto: prefs.keto ?? false,
    lowGi: prefs.lowGi ?? false,
    lowFodmap: prefs.lowFodmap ?? false,
    paleo: prefs.paleo ?? false,
    kcalTarget: prefs.kcalTarget != null ? String(prefs.kcalTarget) : '',
    proteinTargetG: prefs.proteinTargetG != null ? String(prefs.proteinTargetG) : '',
    carbsTargetG: prefs.carbsTargetG != null ? String(prefs.carbsTargetG) : '',
    fatTargetG: prefs.fatTargetG != null ? String(prefs.fatTargetG) : '',
    portionSizeMultiplier:
      prefs.portionSizeMultiplier != null ? String(prefs.portionSizeMultiplier) : '',
    prepToleranceMinutes:
      prefs.prepToleranceMinutes != null ? String(prefs.prepToleranceMinutes) : '',
  }
}

function formToPrefs(values: ManagedProfileFormValues): UserPreferencesDto {
  const base = blankPreferences()
  return {
    ...base,
    // Allergens are expressed through the typed dietary-free flags below (glutenFree,
    // dairyFree, eggFree, …). The free-text allergens array stays empty here.
    allergens: [],
    vegetarian: values.vegetarian,
    vegan: values.vegan,
    pescatarian: values.pescatarian,
    glutenFree: values.glutenFree,
    dairyFree: values.dairyFree,
    lactoseFree: values.lactoseFree,
    milkProteinFree: values.milkProteinFree,
    eggFree: values.eggFree,
    nutFree: values.nutFree,
    peanutFree: values.peanutFree,
    soyFree: values.soyFree,
    fishFree: values.fishFree,
    shellfishFree: values.shellfishFree,
    sesameFree: values.sesameFree,
    halal: values.halal,
    kosher: values.kosher,
    keto: values.keto,
    lowGi: values.lowGi,
    lowFodmap: values.lowFodmap,
    paleo: values.paleo,
    kcalTarget: values.kcalTarget ? parseFloat(values.kcalTarget) : null,
    proteinTargetG: values.proteinTargetG ? parseFloat(values.proteinTargetG) : null,
    carbsTargetG: values.carbsTargetG ? parseInt(values.carbsTargetG, 10) : null,
    fatTargetG: values.fatTargetG ? parseInt(values.fatTargetG, 10) : null,
    portionSizeMultiplier: values.portionSizeMultiplier
      ? parseFloat(values.portionSizeMultiplier)
      : null,
    prepToleranceMinutes: values.prepToleranceMinutes
      ? parseInt(values.prepToleranceMinutes, 10)
      : null,
  }
}

interface Props {
  /** When provided the editor is in edit mode and the name field is read-only. */
  initialDisplayName?: string
  initialPrefs?: Partial<UserPreferencesDto>
  /** Whether to show the displayName field (hidden in edit-only prefs view). */
  showNameField?: boolean
  isPending: boolean
  onSubmit: (displayName: string, prefs: UserPreferencesDto) => void
  onCancel: () => void
  submitLabel?: string
}

const DIETARY_FLAGS: Array<{ key: keyof ManagedProfileFormValues; i18nKey: string }> = [
  { key: 'vegetarian', i18nKey: 'family.prefs.vegetarian' },
  { key: 'vegan', i18nKey: 'family.prefs.vegan' },
  { key: 'pescatarian', i18nKey: 'family.prefs.pescatarian' },
  { key: 'glutenFree', i18nKey: 'family.prefs.glutenFree' },
  { key: 'dairyFree', i18nKey: 'family.prefs.dairyFree' },
  { key: 'lactoseFree', i18nKey: 'family.prefs.lactoseFree' },
  { key: 'milkProteinFree', i18nKey: 'family.prefs.milkProteinFree' },
  { key: 'eggFree', i18nKey: 'family.prefs.eggFree' },
  { key: 'nutFree', i18nKey: 'family.prefs.nutFree' },
  { key: 'peanutFree', i18nKey: 'family.prefs.peanutFree' },
  { key: 'soyFree', i18nKey: 'family.prefs.soyFree' },
  { key: 'fishFree', i18nKey: 'family.prefs.fishFree' },
  { key: 'shellfishFree', i18nKey: 'family.prefs.shellfishFree' },
  { key: 'sesameFree', i18nKey: 'family.prefs.sesameFree' },
  { key: 'halal', i18nKey: 'family.prefs.halal' },
  { key: 'kosher', i18nKey: 'family.prefs.kosher' },
  { key: 'keto', i18nKey: 'family.prefs.keto' },
  { key: 'lowGi', i18nKey: 'family.prefs.lowGi' },
  { key: 'lowFodmap', i18nKey: 'family.prefs.lowFodmap' },
  { key: 'paleo', i18nKey: 'family.prefs.paleo' },
]

export function ManagedProfileEditor({
  initialDisplayName = '',
  initialPrefs = {},
  showNameField = true,
  isPending,
  onSubmit,
  onCancel,
  submitLabel,
}: Props) {
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } = useForm<ManagedProfileFormValues>({
    defaultValues: prefsToForm(initialDisplayName, initialPrefs),
  })

  function handleFormSubmit(values: ManagedProfileFormValues) {
    onSubmit(values.displayName, formToPrefs(values))
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {showNameField && (
        <div className="space-y-1.5">
          <Label htmlFor="mp-displayName">{t('family.managedProfile.displayName')}</Label>
          <Input
            id="mp-displayName"
            {...register('displayName', {
              required: t('common.required'),
              maxLength: { value: 50, message: t('family.managedProfile.nameMaxLength') },
            })}
            placeholder={t('family.managedProfile.displayNamePlaceholder')}
            autoComplete="off"
          />
          {errors.displayName && (
            <p className="text-xs text-red-600" role="alert">{errors.displayName.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#1A1A1A]">{t('family.prefs.dietaryFlags')}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {DIETARY_FLAGS.map(({ key, i18nKey }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register(key as keyof ManagedProfileFormValues)}
                className="h-4 w-4 rounded border-gray-300 text-[#F28C28] focus:ring-[#F28C28]"
              />
              <span className="text-sm text-[#1A1A1A]">{t(i18nKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#1A1A1A]">{t('family.prefs.macroTargets')}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="mp-kcal" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.kcalTarget')}
            </Label>
            <Input
              id="mp-kcal"
              type="number"
              min={0}
              {...register('kcalTarget')}
              placeholder="2000"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-protein" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.proteinTarget')}
            </Label>
            <Input
              id="mp-protein"
              type="number"
              min={0}
              {...register('proteinTargetG')}
              placeholder="80"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-carbs" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.carbsTarget')}
            </Label>
            <Input
              id="mp-carbs"
              type="number"
              min={0}
              {...register('carbsTargetG')}
              placeholder="250"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-fat" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.fatTarget')}
            </Label>
            <Input
              id="mp-fat"
              type="number"
              min={0}
              {...register('fatTargetG')}
              placeholder="70"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-prep" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.prepTolerance')}
            </Label>
            <Input
              id="mp-prep"
              type="number"
              min={0}
              {...register('prepToleranceMinutes')}
              placeholder="30"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mp-portion" className="text-xs text-[#6b6b6b]">
              {t('family.prefs.portionSize')}
            </Label>
            <Input
              id="mp-portion"
              type="number"
              min={0.1}
              step={0.1}
              {...register('portionSizeMultiplier')}
              placeholder="1.0"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? t('common.save') + '…' : (submitLabel ?? t('common.save'))}
        </Button>
      </div>
    </form>
  )
}
