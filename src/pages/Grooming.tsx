import { useState, useEffect, useRef, useMemo } from 'react' // useRef: StrictMode guard
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { capture } from '@/lib/analytics'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { groomingService } from '@/services/grooming'
import type { FridgeItem, GroomingAction, GroomingDecision } from '@/types'

// ── Expiry helpers (mirrored from Fridge.tsx) ─────────────────────────────

type ExpiryStatus = 'fresh' | 'useSoon' | 'expired'

function getExpiryStatus(expiryDate: string | null, today: Date): ExpiryStatus {
  if (!expiryDate) return 'fresh'
  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 2) return 'useSoon'
  return 'fresh'
}

const EXPIRY_STATUS_ORDER: Record<ExpiryStatus, number> = {
  expired: 0,
  useSoon: 1,
  fresh: 2,
}

function sortByExpiry(items: FridgeItem[], today: Date): FridgeItem[] {
  return [...items].sort((a, b) => {
    const aStatus = getExpiryStatus(a.expiryDate, today)
    const bStatus = getExpiryStatus(b.expiryDate, today)
    const statusDiff = EXPIRY_STATUS_ORDER[aStatus] - EXPIRY_STATUS_ORDER[bStatus]
    if (statusDiff !== 0) return statusDiff
    if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate)
    if (a.expiryDate) return -1
    if (b.expiryDate) return 1
    return 0
  })
}

function defaultActionForItem(item: FridgeItem, today: Date): GroomingAction {
  return getExpiryStatus(item.expiryDate, today) === 'expired' ? 'DISCARD' : 'KEEP'
}

// ── Expiry badge ──────────────────────────────────────────────────────────

function ExpiryBadge({ expiryDate, today }: { expiryDate: string | null; today: Date }) {
  const { t, i18n } = useTranslation()
  if (!expiryDate) return null

  const exp = new Date(expiryDate)
  const diffDays = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const variant: 'green' | 'amber' | 'red' =
    diffDays < 0 ? 'red' : diffDays <= 2 ? 'amber' : 'green'

  let label: string
  if (diffDays === 0) {
    label = t('grooming.expiresToday')
  } else if (diffDays > 0) {
    label = t('grooming.expiresIn', { days: diffDays })
  } else {
    label = t('grooming.expiredDaysAgo', { days: Math.abs(diffDays) })
  }

  const dateStr = exp.toLocaleDateString(i18n.language === 'hu' ? 'hu-HU' : 'en-GB', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-xs text-gray-400">{dateStr}</span>
    </span>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: FridgeItem
  today: Date
  decision: GroomingDecision
  onChange: (decision: GroomingDecision) => void
}

function ItemRow({ item, today, decision, onChange }: ItemRowProps) {
  const { t } = useTranslation()

  function setAction(action: GroomingAction) {
    onChange({ ...decision, action, newAmount: action === 'ADJUST_QUANTITY' ? item.amount : undefined })
  }

  function setAmount(value: string) {
    const parsed = parseFloat(value)
    onChange({ ...decision, newAmount: isNaN(parsed) ? undefined : parsed })
  }

  const actions: { key: GroomingAction; label: string }[] = [
    { key: 'KEEP', label: t('grooming.keep') },
    { key: 'DISCARD', label: t('grooming.discard') },
    { key: 'ADJUST_QUANTITY', label: t('grooming.adjustQty') },
  ]

  return (
    <div className="flex flex-col gap-2 p-3 rounded-[12px] bg-[#F9F7F2]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-medium text-sm text-[#1A1A1A]">{item.ingredientName}</span>
          <ExpiryBadge expiryDate={item.expiryDate} today={today} />
          <span className="text-xs text-gray-400">
            {Number(item.amount).toFixed(item.unit === 'PIECE' ? 0 : 1)} {item.unit}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAction(key)}
              className={[
                'text-xs px-2.5 py-1.5 rounded-[8px] border transition-colors',
                decision.action === key
                  ? 'bg-[#4F7942] border-[#4F7942] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#4F7942] hover:text-[#4F7942]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {decision.action === 'ADJUST_QUANTITY' && (
        <div className="flex items-center gap-2 pl-1">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            className="w-28 h-8 text-sm"
            value={decision.newAmount ?? item.amount}
            onChange={e => setAmount(e.target.value)}
          />
          <span className="text-xs text-gray-400">{item.unit}</span>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export function Grooming() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [decisions, setDecisions] = useState<Record<string, GroomingDecision>>({})
  const [startError, setStartError] = useState(false)
  const [starting, setStarting] = useState(true)
  // Guard against StrictMode double-invocation — startedRef prevents a second
  // POST /api/grooming/start. No AbortController: aborting the first request
  // in cleanup would leave the component stuck in the loading state on remount.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    setStarting(true)
    groomingService.start()
      .then(res => {
        const sorted = sortByExpiry(res.fridgeItems, today)
        setSessionId(res.sessionId)
        setFridgeItems(sorted)
        const initial: Record<string, GroomingDecision> = {}
        for (const item of sorted) {
          initial[item.id] = {
            itemId: item.id,
            action: defaultActionForItem(item, today),
          }
        }
        setDecisions(initial)
      })
      .catch(() => setStartError(true))
      .finally(() => setStarting(false))
  }, [today])

  const completeMutation = useMutation({
    mutationFn: ({ sid, dec }: { sid: string; dec: GroomingDecision[] }) =>
      groomingService.complete(sid, dec),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['points'] })
      const kept = Object.values(decisions).filter(d => d.action === 'KEEP' || d.action === 'ADJUST_QUANTITY').length
      const discarded = Object.values(decisions).filter(d => d.action === 'DISCARD').length
      capture('grooming_session_completed', { items_kept: kept, items_discarded: discarded })
      navigate('/app/plans')
    },
  })

  function handleComplete() {
    if (!sessionId) return
    const dec = Object.values(decisions)
    completeMutation.mutate({ sid: sessionId, dec })
  }

  const kept = Object.values(decisions).filter(d => d.action === 'KEEP' || d.action === 'ADJUST_QUANTITY').length
  const discarded = Object.values(decisions).filter(d => d.action === 'DISCARD').length

  // ── Loading state ──────────────────────────────────────────────────────

  if (starting) {
    return (
      <div>
        <Header title={t('grooming.title')} />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Spinner className="h-6 w-6" />
          <p className="text-sm text-gray-500">{t('grooming.loading')}</p>
        </div>
      </div>
    )
  }

  // ── Start error ────────────────────────────────────────────────────────

  if (startError) {
    return (
      <div>
        <Header title={t('grooming.title')} />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-gray-500 mb-4">{t('grooming.error')}</p>
            <Button variant="secondary" onClick={() => navigate('/app/plans')}>
              {t('grooming.skipCta')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Empty fridge ───────────────────────────────────────────────────────

  if (fridgeItems.length === 0) {
    return (
      <div>
        <Header title={t('grooming.title')} />
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <p className="text-sm text-gray-500 mb-4">{t('grooming.emptyFridge')}</p>
            <Button onClick={() => navigate('/app/plans')}>
              {t('grooming.skipCta')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main grooming list ─────────────────────────────────────────────────

  return (
    <div className="pb-28">
      <Header title={t('grooming.title')} />

      <div className="space-y-2">
        {fridgeItems.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            today={today}
            decision={decisions[item.id] ?? { itemId: item.id, action: 'KEEP' }}
            onChange={dec => setDecisions(prev => ({ ...prev, [item.id]: dec }))}
          />
        ))}
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-4">
        <span className="text-sm text-gray-500">
          {t('grooming.summary', { kept, discarded })}
        </span>
        <Button
          onClick={handleComplete}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
          {t('grooming.planCta')}
        </Button>
      </div>

      {completeMutation.isError && (
        <p className="mt-4 text-sm text-red-500 text-center">{t('grooming.error')}</p>
      )}
    </div>
  )
}
