import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Fingerprint, Trash2, LogOut, ChevronRight, Key, Copy, Check, Star, Bell, BellOff, GripVertical, RotateCcw } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
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
import { usersService, type UpdateSettingsRequest, USERS_ME_QUERY_KEY, USERS_STAGE_QUERY_KEY } from '@/services/users'
import { notificationService, NOTIFICATION_PREFS_QUERY_KEY } from '@/services/notificationService'
import { DiofaNameField } from '@/components/settings/DiofaNameField'
import { listPasskeys, registerPasskey, deletePasskey, type PasskeyInfo } from '@/services/passkey'
import { apiKeysService, type ApiKey, type ApiKeyCreated } from '@/services/apiKeys'
import { useAuthStore } from '@/store/auth'
import { formatLocalDate } from '@/lib/utils'
import { capture } from '@/lib/analytics'
import shoppingCategoryOrderService, { SHOPPING_CATEGORY_ORDER_QUERY_KEY } from '@/services/shoppingCategoryOrder'
import type { ShoppingCategory } from '@/types'

interface FormValues {
  languagePreference: string
}

// ── Shopping Category Order section (KALMIO-373) ───────────────────────────

/** The natural enum order — used for "Reset to default". */
const DEFAULT_CATEGORY_ORDER: ShoppingCategory[] = [
  'PRODUCE', 'BAKERY', 'DAIRY', 'MEAT', 'FISH', 'DELI', 'FROZEN',
  'PANTRY', 'CANNED', 'CONDIMENTS', 'BEVERAGES', 'SNACKS',
  'HOUSEHOLD', 'PERSONAL_CARE', 'OTHER',
]

interface SortableCategoryItemProps {
  id: ShoppingCategory
  label: string
  index: number
}

function SortableCategoryItem({ id, label, index }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-3',
        'min-h-[44px] select-none',
        isDragging ? 'shadow-md ring-1 ring-gray-200' : '',
      ].join(' ')}
    >
      {/* drag handle — minimum 44×44 touch target */}
      <button
        type="button"
        className="flex items-center justify-center h-11 w-11 -ml-2 shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1A1A1A] rounded-lg touch-none"
        aria-label={label}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} aria-hidden="true" />
      </button>
      <span className="text-xs text-gray-400 w-5 shrink-0 tabular-nums text-right select-none">
        {index + 1}
      </span>
      <span className="text-sm font-medium text-[#1A1A1A] flex-1 min-w-0 truncate">
        {label}
      </span>
    </li>
  )
}

function ShoppingCategoryOrderSection() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: SHOPPING_CATEGORY_ORDER_QUERY_KEY,
    queryFn: shoppingCategoryOrderService.getOrder,
    staleTime: 30_000,
  })

  /**
   * User-driven reordering override.
   * - `null`  → no user changes yet; display the server order (or default)
   * - array   → the user has reordered; display this instead
   * "Reset to default" sets this to the DEFAULT array.
   * After a successful save the override stays (the server echoes it back).
   * We deliberately do NOT sync this from server data inside an effect to
   * avoid the react-hooks/set-state-in-effect lint rule.
   */
  const [override, setOverride] = useState<ShoppingCategory[] | null>(null)

  const serverOrder = data?.order as ShoppingCategory[] | undefined
  const displayOrder = override ?? serverOrder ?? DEFAULT_CATEGORY_ORDER

  const saveMutation = useMutation({
    mutationFn: (order: ShoppingCategory[]) =>
      shoppingCategoryOrderService.updateOrder({ order }),
    onMutate: async (order) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: SHOPPING_CATEGORY_ORDER_QUERY_KEY })
      const previous = qc.getQueryData(SHOPPING_CATEGORY_ORDER_QUERY_KEY)
      qc.setQueryData(SHOPPING_CATEGORY_ORDER_QUERY_KEY, { order })
      return { previous }
    },
    onSuccess: (saved) => {
      qc.setQueryData(SHOPPING_CATEGORY_ORDER_QUERY_KEY, saved)
      // Clear the local override so future server revalidations show through
      setOverride(null)
      toast({ title: t('settings.categoryOrder.saveSuccess'), variant: 'success' })
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(SHOPPING_CATEGORY_ORDER_QUERY_KEY, context.previous)
      }
      // Distinguish validation errors (HTTP 400) from other failures
      const status = (_err as { response?: { status?: number } })?.response?.status
      const key = status === 400
        ? 'settings.categoryOrder.validationError'
        : 'settings.categoryOrder.saveError'
      toast({ title: t(key), variant: 'destructive' })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: SHOPPING_CATEGORY_ORDER_QUERY_KEY })
    },
  })

  // Touch sensor with 250ms delay to avoid accidental drags on scroll
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = displayOrder.indexOf(active.id as ShoppingCategory)
    const newIndex = displayOrder.indexOf(over.id as ShoppingCategory)
    if (oldIndex === -1 || newIndex === -1) return
    setOverride(arrayMove(displayOrder, oldIndex, newIndex))
  }

  const handleReset = () => {
    setOverride(DEFAULT_CATEGORY_ORDER)
  }

  const handleSave = () => {
    saveMutation.mutate(displayOrder)
  }

  return (
    <div className="space-y-4 max-w-lg mt-6">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-[#1A1A1A]">
              {t('settings.categoryOrder.title')}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('settings.categoryOrder.description')}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : isError ? (
            <p className="text-xs text-red-500">{t('settings.categoryOrder.saveError')}</p>
          ) : (
            <>
              <p className="text-xs text-gray-400">{t('settings.categoryOrder.instruction')}</p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={displayOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2" aria-label={t('settings.categoryOrder.title')}>
                    {displayOrder.map((cat, i) => (
                      <SortableCategoryItem
                        key={cat}
                        id={cat}
                        index={i}
                        label={t(`shopNow.categories.${cat}`)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1A1A1A]"
                  aria-label={t('settings.categoryOrder.reset')}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  {t('settings.categoryOrder.reset')}
                </Button>

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-midnight-black hover:bg-midnight-black/90 text-white rounded-xl"
                >
                  {saveMutation.isPending
                    ? t('settings.categoryOrder.saving')
                    : t('settings.categoryOrder.save')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
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

  const [passkeyAdding, setPasskeyAdding] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PasskeyInfo | null>(null)
  const [customName, setCustomName] = useState('')

  // ── API Keys state ─────────────────────────────────────────────────────────
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreated | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Passkeys query ─────────────────────────────────────────────────────────
  const { data: passkeys = [], isLoading: passkeysLoading } = useQuery<PasskeyInfo[]>({
    queryKey: ['passkeys'],
    queryFn: listPasskeys,
  })

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
      await qc.invalidateQueries({ queryKey: ['passkeys'] })
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
      await qc.invalidateQueries({ queryKey: ['passkeys'] })
      toast({ title: t('settings.security.removeSuccess'), variant: 'success' })
    } catch {
      setPasskeyError(t('settings.security.removeError'))
      toast({ title: t('settings.security.removeError'), variant: 'destructive' })
    } finally {
      setRemovingId(null)
    }
  }

  const { data: settings, isLoading } = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
  })

  const { data: stageData } = useQuery({
    queryKey: USERS_STAGE_QUERY_KEY,
    queryFn: usersService.getMyStage,
    staleTime: 30_000,
  })

  const isFiatalPlus =
    stageData?.currentStage === 'FIATAL' || stageData?.currentStage === 'TERMO'

  const { register, handleSubmit, reset } = useForm<FormValues>()

  useEffect(() => {
    if (settings) {
      reset({
        languagePreference: settings.languagePreference ?? i18n.resolvedLanguage ?? 'hu',
      })
    }
  }, [settings, reset, i18n.resolvedLanguage])

  const mutation = useMutation({
    mutationFn: (body: UpdateSettingsRequest) => usersService.updateSettings(body),
    onSuccess: (data) => {
      qc.setQueryData(USERS_ME_QUERY_KEY, data)
      setAppRole(data.role)
      if (data.languagePreference) {
        i18n.changeLanguage(data.languagePreference)
      }
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({
      languagePreference: values.languagePreference || null,
    })
  }

  // ── Notification preferences (KALMIO-316) ─────────────────────────────────
  const { data: notifPrefs, isLoading: notifPrefsLoading } = useQuery({
    queryKey: NOTIFICATION_PREFS_QUERY_KEY,
    queryFn: notificationService.getPreferences,
    staleTime: 30_000,
    retry: false,
  })

  const resumeMutation = useMutation({
    mutationFn: () => notificationService.resumeNotifications(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_PREFS_QUERY_KEY })
    },
    onError: () => {
      toast({ title: t('common.errorGeneric'), variant: 'destructive' })
    },
  })

  // Use Europe/Budapest timezone so "today" matches what the backend considers the current
  // calendar day. UTC .toISOString() can be off by a day in the 22:00–00:00 UTC window.
  const todayIso = (() => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const y = parts.find(p => p.type === 'year')!.value
    const m = parts.find(p => p.type === 'month')!.value
    const d = parts.find(p => p.type === 'day')!.value
    return `${y}-${m}-${d}`
  })()
  const isQuietToday = notifPrefs?.quietUntilDate === todayIso

  // ── Member since display ───────────────────────────────────────────────────
  const memberSince = settings?.createdAt
    ? formatLocalDate(settings.createdAt, i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })
    : null

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        {/* Card 1 — Language */}
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

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t('common.save') + '…' : t('common.save')}
        </Button>
      </form>

      {mutation.isError && (
        <p className="text-sm text-red-500 mt-2">{t('settings.saveError')}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600 mt-2">{t('settings.saveSuccess')}</p>
      )}

      {/* Card 2 — Security */}
      <div className="space-y-4 max-w-lg mt-6">
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

      {/* Card 3 — API & Connections */}
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

      {/* Card 4 — Status */}
      <div className="max-w-lg mt-6">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">{t('settings.status.title')}</h2>

            {/* Founding Member badge */}
            {settings?.foundingMember ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
                      role="status"
                      aria-label={t('settings.foundingMemberBadge.title')}
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
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {settings.foundingMemberPurchasedAt
                      ? new Intl.DateTimeFormat(i18n.language === 'hu' ? 'hu-HU' : 'en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }).format(new Date(settings.foundingMemberPurchasedAt)) + '.'
                      : t('settings.foundingMemberBadge.title')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className="text-sm text-gray-500">{t('settings.status.freeTier')}</p>
            )}

            {/* Member since */}
            {memberSince && (
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-400">{t('settings.status.memberSince')}</span>
                <span className="text-xs font-medium text-[#1A1A1A]">{memberSince}</span>
              </div>
            )}

            {/* Diófa name — FIATAL+ only */}
            {isFiatalPlus && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">{t('settings.diofaName.sectionTitle')}</p>
                <DiofaNameField currentName={settings?.diofaName ?? null} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card 5 — Notifications (KALMIO-316) */}
      <div className="space-y-4 max-w-lg mt-6">
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-400 shrink-0" aria-hidden="true" />
              <h2 className="font-semibold text-sm text-[#1A1A1A]">
                {t('settings.notifications.title')}
              </h2>
            </div>

            {notifPrefsLoading ? (
              <div className="flex justify-center py-2"><Spinner /></div>
            ) : isQuietToday ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <BellOff size={14} className="text-amber-600 shrink-0" aria-hidden="true" />
                  <p className="text-sm text-amber-800">
                    {t('settings.notifications.quietTodayActive')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={resumeMutation.isPending}
                  onClick={() => resumeMutation.mutate()}
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 text-xs w-full"
                >
                  {resumeMutation.isPending ? <Spinner /> : null}
                  {t('settings.notifications.resume')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#34C759] shrink-0" aria-hidden="true" />
                <p className="text-sm text-[#6B6460]">
                  {t('settings.notifications.active')}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              {t('settings.notifications.hint')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card 6 — Shopping Category Order (KALMIO-373) */}
      <ShoppingCategoryOrderSection />

      {/* Sign-out — mobile only */}
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
