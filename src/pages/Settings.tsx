import { useEffect, useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { Fingerprint, Trash2, LogOut, ChevronRight, Key, Copy, Check, Star } from 'lucide-react'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ForbiddenIngredientsPicker } from '@/components/ForbiddenIngredientsPicker'
import { usersService, type UpdateSettingsRequest } from '@/services/users'
import { DiofaNameField } from '@/components/settings/DiofaNameField'
import { listPasskeys, registerPasskey, deletePasskey, type PasskeyInfo } from '@/services/passkey'
import { apiKeysService, type ApiKey, type ApiKeyCreated } from '@/services/apiKeys'
import { useAuthStore } from '@/store/auth'
import { formatLocalDate } from '@/lib/utils'
import { capture } from '@/lib/analytics'

interface FormValues {
  languagePreference: string
  days: string
  kcalTarget: string
  proteinTarget: string
  carbsTargetG: string
  fatTargetG: string
  budgetMax: string
  prepTimeMax: string
  maxRecipeRepetitions: string
  prefersFreezing: boolean
  preferredPrepDayOfWeek: string // '' = no preference, otherwise '1'..'7'
}

function deviceLabel(): string {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/iPad/.test(ua)) return 'iPad'
  if (/Android/.test(ua)) return 'Android'
  if (/Mac OS/.test(ua)) return 'Mac'
  if (/Windows/.test(ua)) return 'Windows PC'
  return 'My Device'
}

export function Settings() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const setAppRole = useAuthStore((s) => s.setAppRole)
  const signOut = useAuthStore((s) => s.signOut)

  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([])
  const [passkeysLoading, setPasskeysLoading] = useState(true)
  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PasskeyInfo | null>(null)
  const [customName, setCustomName] = useState('')

  // ── Forbidden ingredients state ────────────────────────────────────────────
  const [forbiddenIngredientIds, setForbiddenIngredientIds] = useState<string[]>([])
  const forbiddenPrefilled = useRef(false)

  // ── API Keys state ─────────────────────────────────────────────────────────
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreated | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPasskeys = useCallback(async () => {
    setPasskeysLoading(true)
    try {
      const data = await listPasskeys()
      setPasskeys(data)
    } catch {
      setPasskeys([])
    } finally {
      setPasskeysLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPasskeys() }, [loadPasskeys])

  // ── API Keys queries & mutations ───────────────────────────────────────────
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: apiKeysService.list,
  })

  const createKeyMutation = useMutation({
    mutationFn: (name: string) => apiKeysService.create(name),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      setShowKeyForm(false)
      setNewKeyName('')
      setRevealedKey(created)
      setCopiedKey(false)
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  const revokeKeyMutation = useMutation({
    mutationFn: (id: number) => apiKeysService.revoke(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['api-keys'] })
      const previous = qc.getQueryData<ApiKey[]>(['api-keys'])
      qc.setQueryData<ApiKey[]>(['api-keys'], (old) => (old ?? []).filter((k) => k.id !== id))
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(['api-keys'], context.previous)
      }
      toast({ title: t('settings.apiKeys.revokeError'), variant: 'destructive' })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const revokeAllKeysMutation = useMutation({
    mutationFn: () => apiKeysService.revokeAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['api-keys'] })
      const previous = qc.getQueryData<ApiKey[]>(['api-keys'])
      qc.setQueryData<ApiKey[]>(['api-keys'], [])
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['api-keys'], context.previous)
      toast({ title: t('settings.apiKeys.revokeAllError'), variant: 'destructive' })
    },
    onSuccess: () => { setConfirmRevokeAll(false) },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }) },
  })

  const handleCopyKey = () => {
    if (!revealedKey) return
    navigator.clipboard.writeText(revealedKey.plaintext).then(() => {
      setCopiedKey(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopiedKey(false), 2000)
    })
  }

  const addPasskey = async () => {
    setPasskeyAdding(true)
    setPasskeyError(null)
    try {
      const name = customName.trim() || deviceLabel()
      await registerPasskey(name)
      setCustomName('')
      await loadPasskeys()
      capture('passkey_registered')
      toast({ title: t('settings.security.addSuccess'), variant: 'success' })
    } catch (err) {
      console.error('[passkey] registration failed:', err)
      setPasskeyError(t('settings.security.addError'))
      toast({ title: t('settings.security.addError'), variant: 'destructive' })
    } finally {
      setPasskeyAdding(false)
    }
  }

  const confirmRemovePasskey = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setRemovingId(id)
    setDeleteTarget(null)
    setPasskeyError(null)
    try {
      await deletePasskey(id)
      await loadPasskeys()
      toast({ title: t('settings.security.removeSuccess'), variant: 'success' })
    } catch {
      setPasskeyError(t('settings.security.removeError'))
      toast({ title: t('settings.security.removeError'), variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  })

  const { data: stageData } = useQuery({
    queryKey: ['me', 'stage'],
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
  })

  const isFiatalPlus =
    stageData?.currentStage === 'FIATAL' || stageData?.currentStage === 'TERMO'

  const { register, handleSubmit, reset, setValue, control } = useForm<FormValues>()

  useEffect(() => {
    if (settings) {
      reset({
        languagePreference: settings.languagePreference ?? i18n.resolvedLanguage ?? 'hu',
        days: settings.mealPlanPreferences?.days?.toString() ?? '',
        kcalTarget: settings.mealPlanPreferences?.kcalTarget?.toString() ?? '',
        proteinTarget: settings.mealPlanPreferences?.proteinTarget?.toString() ?? '',
        carbsTargetG: settings.carbsTargetG?.toString() ?? '',
        fatTargetG: settings.fatTargetG?.toString() ?? '',
        budgetMax: settings.mealPlanPreferences?.budgetMax?.toString() ?? '',
        prepTimeMax: settings.mealPlanPreferences?.prepTimeMax?.toString() ?? '',
        maxRecipeRepetitions: settings.mealPlanPreferences?.maxRecipeRepetitions?.toString() ?? '',
        prefersFreezing: settings.prefersFreezing,
        preferredPrepDayOfWeek: settings.preferredPrepDayOfWeek?.toString() ?? '',
      })
      // Pre-fill forbidden ingredients once (on first load)
      if (!forbiddenPrefilled.current) {
        forbiddenPrefilled.current = true
        const saved = settings.mealPlanPreferences?.forbiddenIngredientIds
        if (saved && saved.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setForbiddenIngredientIds(saved)
        }
      }
    }
  }, [settings, reset, i18n.resolvedLanguage])

  const mutation = useMutation({
    mutationFn: (body: UpdateSettingsRequest) => usersService.updateSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(['me'], data)
      setAppRole(data.role)
      if (data.languagePreference) {
        i18n.changeLanguage(data.languagePreference)
      }
    },
  })

  const onSubmit = (values: FormValues) => {
    const prefs = {
      days: values.days ? parseInt(values.days) : undefined,
      kcalTarget: values.kcalTarget ? parseFloat(values.kcalTarget) : undefined,
      proteinTarget: values.proteinTarget ? parseFloat(values.proteinTarget) : undefined,
      budgetMax: values.budgetMax ? parseFloat(values.budgetMax) : undefined,
      prepTimeMax: values.prepTimeMax ? parseInt(values.prepTimeMax) : undefined,
      maxRecipeRepetitions: values.maxRecipeRepetitions ? parseInt(values.maxRecipeRepetitions) : undefined,
      forbiddenIngredientIds: forbiddenIngredientIds.length > 0 ? forbiddenIngredientIds : undefined,
    }
    const hasPrefs = Object.values(prefs).some(v => v !== undefined)
    mutation.mutate({
      languagePreference: values.languagePreference || null,
      mealPlanPreferences: hasPrefs ? prefs : null,
      prefersFreezing: values.prefersFreezing,
      preferredPrepDayOfWeek: values.preferredPrepDayOfWeek
        ? parseInt(values.preferredPrepDayOfWeek, 10)
        : null,
      carbsTargetG: values.carbsTargetG ? parseInt(values.carbsTargetG, 10) : null,
      fatTargetG: values.fatTargetG ? parseInt(values.fatTargetG, 10) : null,
    })
  }

  // ── Implied macro preview ──────────────────────────────────────────────────
  const watchedKcal = useWatch({ control, name: 'kcalTarget' })
  const watchedProtein = useWatch({ control, name: 'proteinTarget' })
  const watchedCarbs = useWatch({ control, name: 'carbsTargetG' })
  const watchedFat = useWatch({ control, name: 'fatTargetG' })

  const kcalNum = watchedKcal ? parseFloat(watchedKcal) : null
  const proteinNum = watchedProtein ? parseFloat(watchedProtein) : null
  const carbsNum = watchedCarbs ? parseFloat(watchedCarbs) : null
  const fatNum = watchedFat ? parseFloat(watchedFat) : null

  // Compute implied macros: if kcal + 2 of 3 macros are set, infer the third
  // protein: 4 kcal/g, carbs: 4 kcal/g, fat: 9 kcal/g
  let impliedProteinG: number | null = null
  let impliedProteinPct: number | null = null
  let impliedCarbsG: number | null = null
  let impliedCarbsPct: number | null = null
  let impliedFatG: number | null = null
  let impliedFatPct: number | null = null

  if (kcalNum != null && kcalNum > 0) {
    const proteinKcal = proteinNum != null ? proteinNum * 4 : null
    const carbsKcal = carbsNum != null ? carbsNum * 4 : null
    const fatKcal = fatNum != null ? fatNum * 9 : null

    const setCount = [proteinKcal, carbsKcal, fatKcal].filter(v => v != null).length

    if (setCount === 2) {
      // Infer the missing one
      if (proteinKcal == null && carbsKcal != null && fatKcal != null) {
        const remaining = kcalNum - carbsKcal - fatKcal
        if (remaining >= 0) {
          impliedProteinG = Math.round(remaining / 4)
          impliedProteinPct = Math.round((remaining / kcalNum) * 100)
        }
      } else if (carbsKcal == null && proteinKcal != null && fatKcal != null) {
        const remaining = kcalNum - proteinKcal - fatKcal
        if (remaining >= 0) {
          impliedCarbsG = Math.round(remaining / 4)
          impliedCarbsPct = Math.round((remaining / kcalNum) * 100)
        }
      } else if (fatKcal == null && proteinKcal != null && carbsKcal != null) {
        const remaining = kcalNum - proteinKcal - carbsKcal
        if (remaining >= 0) {
          impliedFatG = Math.round(remaining / 9)
          impliedFatPct = Math.round((remaining / kcalNum) * 100)
        }
      }
    }
  }

  const hasImplied = impliedProteinG != null || impliedCarbsG != null || impliedFatG != null

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div>
      <Header
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      {/* Profile link — visible on mobile (desktop uses sidebar chip) */}
      <Link
        to="/app/profile"
        className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors max-w-lg md:hidden mb-6"
      >
        <UserAvatar
          firstName={settings?.firstName}
          lastName={settings?.lastName}
          email={settings?.email}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A] truncate">
            {settings?.firstName
              ? [settings.firstName, settings.lastName].filter(Boolean).join(' ')
              : (settings?.email ?? t('profile.title'))}
          </p>
          <p className="text-xs text-gray-400 truncate">{t('profile.editProfile')}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
      </Link>

      {/* Founding Member badge — shown only when the flag is set */}
      {settings?.foundingMember && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 max-w-lg mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <Star
                  size={16}
                  className="text-amber-500 shrink-0"
                  aria-hidden="true"
                  fill="currentColor"
                />
                <span className="text-sm font-medium text-amber-800">
                  {t('settings.foundingMemberBadge.label')}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {settings.foundingMemberPurchasedAt
                ? new Intl.DateTimeFormat('hu-HU', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).format(new Date(settings.foundingMemberPurchasedAt)) + '.'
                : t('settings.foundingMemberBadge.title')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Suggested targets card — only shown when backend has computed values */}
      {(settings?.suggestedKcalTarget != null || settings?.suggestedProteinTarget != null) && (
        <div className="max-w-lg mb-6 rounded-xl border border-[#4F7942]/30 bg-[#F3F8F2] px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-[#4F7942] uppercase tracking-wider">
            {t('settings.suggestion.title')}
          </p>
          {settings.suggestedKcalTarget != null && (
            <p className="text-sm text-[#1A1A1A]">
              {t('settings.suggestion.kcal', { n: Math.round(settings.suggestedKcalTarget) })}
            </p>
          )}
          {settings.suggestedProteinTarget != null && (
            <p className="text-sm text-[#1A1A1A]">
              {t('settings.suggestion.protein', { n: Math.round(settings.suggestedProteinTarget) })}
            </p>
          )}
          <p className="text-[10px] text-gray-500">{t('settings.suggestion.hint')}</p>
          <button
            type="button"
            onClick={() => {
              if (settings.suggestedKcalTarget != null) {
                setValue('kcalTarget', String(Math.round(settings.suggestedKcalTarget)))
              }
              if (settings.suggestedProteinTarget != null) {
                setValue('proteinTarget', String(Math.round(settings.suggestedProteinTarget)))
              }
            }}
            className="mt-1 rounded-lg bg-[#4F7942] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#4F7942]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F7942]/50"
          >
            {t('settings.suggestion.accept')}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        {/* Language */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.language')}</h2>
            <div>
              <Label>{t('settings.languageLabel')}</Label>
              <Select {...register('languagePreference')} className="mt-1">
                <option value="hu">Magyar</option>
                <option value="en">English</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Meal plan defaults */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.mealPlanDefaults')}</h2>
            <p className="text-xs text-gray-400">{t('settings.mealPlanDefaultsHint')}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.days')}</Label>
                <Input type="number" min={1} max={14} {...register('days')} className="mt-1" placeholder="7" />
              </div>
            </div>

            <div>
              <Label>{t('mealPlan.form.kcalTarget')}</Label>
              <Input type="number" min={0} {...register('kcalTarget')} className="mt-1" placeholder="2000" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.proteinTarget')}</Label>
                <Input type="number" min={0} {...register('proteinTarget')} className="mt-1" placeholder="150" />
              </div>
              <div>
                <Label>{t('settings.macroTargets.carbsTargetG')}</Label>
                <Input type="number" min={0} max={2000} {...register('carbsTargetG')} className="mt-1" placeholder="250" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('settings.macroTargets.fatTargetG')}</Label>
                <Input type="number" min={0} max={1000} {...register('fatTargetG')} className="mt-1" placeholder="70" />
              </div>
              <div>
                <Label>{t('mealPlan.form.budgetMax')}</Label>
                <Input type="number" min={0} {...register('budgetMax')} className="mt-1" />
              </div>
            </div>

            {/* Implied macro preview — shown when kcal + exactly 2 of 3 macros are filled */}
            {hasImplied && (
              <div className="rounded-lg border border-[#4F7942]/20 bg-[#F3F8F2] px-3 py-2.5 space-y-0.5">
                <p className="text-[10px] font-semibold text-[#4F7942] uppercase tracking-wide mb-1">
                  {t('settings.macroTargets.impliedTitle')}
                </p>
                {impliedProteinG != null && (
                  <p className="text-xs text-[#1A1A1A]">
                    {t('settings.macroTargets.impliedProtein', { g: impliedProteinG, pct: impliedProteinPct })}
                  </p>
                )}
                {impliedCarbsG != null && (
                  <p className="text-xs text-[#1A1A1A]">
                    {t('settings.macroTargets.impliedCarbs', { g: impliedCarbsG, pct: impliedCarbsPct })}
                  </p>
                )}
                {impliedFatG != null && (
                  <p className="text-xs text-[#1A1A1A]">
                    {t('settings.macroTargets.impliedFat', { g: impliedFatG, pct: impliedFatPct })}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('mealPlan.form.prepTimeMax')}</Label>
                <Input type="number" min={0} {...register('prepTimeMax')} className="mt-1" />
              </div>
              <div>
                <Label>{t('mealPlan.form.maxRepeats')}</Label>
                <Input type="number" min={1} {...register('maxRecipeRepetitions')} className="mt-1" />
              </div>
            </div>

            {/* Forbidden ingredients */}
            <div>
              <Label>{t('plan.forbiddenIngredients.label')}</Label>
              <div className="mt-2">
                <ForbiddenIngredientsPicker
                  value={forbiddenIngredientIds}
                  onChange={setForbiddenIngredientIds}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prep preferences */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.prepPrefs.title')}</h2>
            <p className="text-xs text-gray-400">{t('settings.prepPrefs.subtitle')}</p>

            <label className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A] cursor-pointer">
              <input
                type="checkbox"
                {...register('prefersFreezing')}
                className="h-4 w-4 rounded border-gray-300 accent-[#4F7942]"
              />
              {t('settings.prepPrefs.prefersFreezing')}
            </label>
            <p className="text-[10px] text-gray-400 -mt-2 ml-6">{t('settings.prepPrefs.prefersFreezingHint')}</p>

            <div>
              <Label>{t('settings.prepPrefs.preferredPrepDayOfWeek')}</Label>
              <Select {...register('preferredPrepDayOfWeek')} className="mt-1">
                <option value="">{t('settings.prepPrefs.noPreference')}</option>
                <option value="1">{t('common.weekdays.monday')}</option>
                <option value="2">{t('common.weekdays.tuesday')}</option>
                <option value="3">{t('common.weekdays.wednesday')}</option>
                <option value="4">{t('common.weekdays.thursday')}</option>
                <option value="5">{t('common.weekdays.friday')}</option>
                <option value="6">{t('common.weekdays.saturday')}</option>
                <option value="7">{t('common.weekdays.sunday')}</option>
              </Select>
              <p className="text-[10px] text-gray-400 mt-1">{t('settings.prepPrefs.preferredPrepDayOfWeekHint')}</p>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('common.save') + '…' : t('common.save')}
        </Button>
      </form>

      {/* ── Diófa tree naming — FIATAL+ only ── */}
      {isFiatalPlus && (
        <div className="max-w-lg mt-6">
          <h2 className="font-semibold text-sm text-[#1A1A1A] mb-3">{t('settings.diofaName.sectionTitle')}</h2>
          <DiofaNameField currentName={settings?.diofaName ?? null} />
        </div>
      )}

      {/* ── Security ── */}
      <div className="space-y-4 max-w-lg mt-2">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.security.title')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('settings.security.passkeysHint')}</p>
            </div>

            {passkeysLoading ? (
              <div className="flex justify-center py-2"><Spinner /></div>
            ) : passkeys.length === 0 ? (
              <p className="text-xs text-gray-400">{t('settings.security.noPasskeys')}</p>
            ) : (
              <ul className="space-y-2">
                {passkeys.map((pk) => (
                  <li key={pk.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Fingerprint size={15} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{pk.friendlyName || t('settings.security.unnamedPasskey')}</p>
                        <p className="text-xs text-gray-400">
                          {t('settings.security.registeredOn', {
                            date: formatLocalDate(pk.createdAt, i18n.language),
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removingId === pk.id}
                      onClick={() => setDeleteTarget(pk)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      {removingId === pk.id ? <Spinner /> : <Trash2 size={14} />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <Input
                placeholder={t('settings.security.namePlaceholder')}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="text-sm"
                maxLength={50}
              />
              <Button
                type="button"
                onClick={addPasskey}
                disabled={passkeyAdding}
                className="w-full gap-2 bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl"
              >
                {passkeyAdding ? <Spinner /> : <Fingerprint size={15} />}
                {passkeyAdding ? t('settings.security.adding') : t('settings.security.addPasskey')}
              </Button>
            </div>

            {passkeyError && <p className="text-xs text-red-500">{passkeyError}</p>}
          </CardContent>
        </Card>

      </div>

      {mutation.isError && (
        <p className="text-sm text-red-500 mt-2">{t('settings.saveError')}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600 mt-2">{t('settings.saveSuccess')}</p>
      )}

      {/* ── API & Connections ── */}
      <div className="space-y-4 max-w-lg mt-6">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.apiKeys.title')}</h2>
              {apiKeys.length >= 2 && !confirmRevokeAll && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRevokeAll(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                >
                  {t('settings.apiKeys.revokeAll')}
                </Button>
              )}
            </div>

            {confirmRevokeAll && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
                <p className="flex-1 text-xs text-red-700">
                  {t('settings.apiKeys.revokeAllConfirm', { count: apiKeys.length })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRevokeAll(false)}
                  className="text-xs"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={revokeAllKeysMutation.isPending}
                  onClick={() => revokeAllKeysMutation.mutate()}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100 text-xs"
                >
                  {t('settings.apiKeys.revokeAllConfirmButton')}
                </Button>
              </div>
            )}

            {apiKeysLoading ? (
              <div className="flex justify-center py-2"><Spinner /></div>
            ) : apiKeys.length === 0 && !revealedKey ? (
              <p className="text-xs text-gray-400">{t('settings.apiKeys.noKeys')}</p>
            ) : (
              <ul className="space-y-2">
                {apiKeys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Key size={15} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{key.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{key.keyPrefix}…</p>
                        <p className="text-xs text-gray-400">
                          {t('settings.apiKeys.createdOn', {
                            date: formatLocalDate(key.createdAt, i18n.language),
                          })}
                          {' · '}
                          {key.lastUsedAt
                            ? t('settings.apiKeys.lastUsed', {
                                date: formatLocalDate(key.lastUsedAt, i18n.language),
                              })
                            : t('settings.apiKeys.neverUsed')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokeKeyMutation.isPending}
                      onClick={() => revokeKeyMutation.mutate(key.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0 text-xs"
                    >
                      {t('settings.apiKeys.revoke')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {/* Revealed key after creation */}
            {revealedKey && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-xs font-medium text-amber-800">{t('settings.apiKeys.reveal.warning')}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-white border border-amber-200 rounded-lg px-3 py-2 break-all text-[#1A1A1A]">
                    {revealedKey.plaintext}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyKey}
                    className="shrink-0 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                    aria-label={t('settings.apiKeys.reveal.copy')}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    <span className="ml-1 text-xs">
                      {copiedKey ? t('settings.apiKeys.reveal.copied') : t('settings.apiKeys.reveal.copy')}
                    </span>
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealedKey(null)}
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 text-xs w-full"
                >
                  {t('settings.apiKeys.reveal.dismiss')}
                </Button>
              </div>
            )}

            {/* Inline key creation form */}
            {showKeyForm ? (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="new-api-key-name">{t('settings.apiKeys.form.label')}</Label>
                  <Input
                    id="new-api-key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder={t('settings.apiKeys.form.placeholder')}
                    className="mt-1 text-sm"
                    maxLength={80}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newKeyName.trim()) createKeyMutation.mutate(newKeyName.trim())
                      }
                      if (e.key === 'Escape') {
                        setShowKeyForm(false)
                        setNewKeyName('')
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowKeyForm(false); setNewKeyName('') }}
                    disabled={createKeyMutation.isPending}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl"
                    disabled={!newKeyName.trim() || createKeyMutation.isPending}
                    onClick={() => createKeyMutation.mutate(newKeyName.trim())}
                  >
                    {createKeyMutation.isPending
                      ? t('settings.apiKeys.form.submitting')
                      : t('settings.apiKeys.form.submit')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => { setShowKeyForm(true); setRevealedKey(null) }}
                className="w-full gap-2 bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl"
              >
                <Key size={15} />
                {t('settings.apiKeys.generateButton')}
              </Button>
            )}

            <p className="text-xs text-gray-400">{t('settings.apiKeys.hint')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-lg mt-6 md:hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200"
        >
          <LogOut size={15} />
          {t('common.signOut')}
        </Button>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.security.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.security.confirmDeleteDesc', {
                name: deleteTarget?.friendlyName || t('settings.security.unnamedPasskey'),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmRemovePasskey}
              disabled={!!removingId}
            >
              {removingId ? <Spinner /> : t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
