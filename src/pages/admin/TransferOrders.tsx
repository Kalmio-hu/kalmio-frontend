/**
 * Admin — Founding Member bank-transfer orders (/app/admin/founding-member/transfers).
 *
 * Lists orders by status (GET /api/admin/founding-member/transfer-orders?status=). An admin
 * matches the bank statement's közlemény to the reference and confirms the order (grants the
 * membership, or leaves a guest order claimable, and issues the invoice) or cancels it. Both
 * actions ask for an inline confirmation first.
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { adminService } from '@/services/admin'
import { formatLocalDate } from '@/lib/utils'
import type { TransferOrderAdminDto, TransferOrderStatus } from '@/types'

const FILTERS: (TransferOrderStatus | 'ALL')[] = ['PENDING', 'SUCCEEDED', 'CANCELLED', 'EXPIRED', 'ALL']

const STATUS_BADGE: Record<TransferOrderStatus, 'amber' | 'green' | 'gray' | 'red'> = {
  PENDING: 'amber',
  SUCCEEDED: 'green',
  CANCELLED: 'gray',
  EXPIRED: 'red',
}

type PendingAction = { reference: string; action: 'confirm' | 'cancel' } | null

export function TransferOrders() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const lang = i18n.language?.startsWith('hu') ? 'hu' : 'en'
  const [filter, setFilter] = useState<TransferOrderStatus | 'ALL'>('PENDING')
  const [pending, setPending] = useState<PendingAction>(null)

  const queryKey = ['admin', 'transfer-orders', filter] as const
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => adminService.listTransferOrders(filter === 'ALL' ? undefined : filter),
  })

  const act = useMutation({
    mutationFn: ({ reference, action }: { reference: string; action: 'confirm' | 'cancel' }) =>
      action === 'confirm' ? adminService.confirmTransferOrder(reference) : adminService.cancelTransferOrder(reference),
    onSuccess: (updated: TransferOrderAdminDto, vars) => {
      setPending(null)
      void qc.invalidateQueries({ queryKey: ['admin', 'transfer-orders'] })
      void qc.invalidateQueries({ queryKey: ['admin-stats'] })
      toast({
        title: t(vars.action === 'confirm' ? 'admin.transferOrders.confirmed' : 'admin.transferOrders.cancelled', {
          reference: updated.reference,
        }),
      })
    },
    onError: () => toast({ title: t('admin.transferOrders.actionError'), variant: 'destructive' }),
  })

  const fmt = (iso: string | null) =>
    iso ? formatLocalDate(iso, lang, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div>
      <Header title={t('admin.transferOrders.title')} subtitle={t('admin.transferOrders.subtitle')} />

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label={t('admin.transferOrders.filterLabel')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => {
              setFilter(f)
              setPending(null)
            }}
            className={[
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filter === f ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#1A1A1A]/70 border-gray-200 hover:border-gray-300',
            ].join(' ')}
          >
            {t(`admin.transferOrders.filter.${f}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : isError ? (
        <p className="text-sm text-red-600">{t('admin.transferOrders.loadError')}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-gray-500">{t('admin.transferOrders.empty')}</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {orders.map((o) => {
            const isPendingAction = pending?.reference === o.reference
            return (
              <Card key={o.reference}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-[#1A1A1A]">{o.reference}</p>
                      <p className="text-sm text-[#1A1A1A]">
                        {o.billingName ?? '—'}
                        <span className="text-gray-400"> · {o.email ?? '—'}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('admin.transferOrders.meta', {
                          amount: o.amountHuf,
                          created: fmt(o.createdAt),
                          due: fmt(o.dueDate),
                        })}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {o.userId ? t('admin.transferOrders.account') : t('admin.transferOrders.guest')}
                        {o.confirmedAt && ` · ${t('admin.transferOrders.confirmedAt', { date: fmt(o.confirmedAt) })}`}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[o.status]}>{t(`admin.transferOrders.status.${o.status}`)}</Badge>
                  </div>

                  {o.status === 'PENDING' && !isPendingAction && (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={() => setPending({ reference: o.reference, action: 'confirm' })}>
                        {t('admin.transferOrders.confirm')}
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setPending({ reference: o.reference, action: 'cancel' })}>
                        {t('admin.transferOrders.cancel')}
                      </Button>
                    </div>
                  )}

                  {isPendingAction && pending && (
                    <div
                      className={[
                        'rounded-xl border px-4 py-3 space-y-3',
                        pending.action === 'confirm' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
                      ].join(' ')}
                    >
                      <p className="text-sm text-[#1A1A1A]">
                        {t(pending.action === 'confirm' ? 'admin.transferOrders.confirmPrompt' : 'admin.transferOrders.cancelPrompt', {
                          reference: o.reference,
                          amount: o.amountHuf,
                        })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={pending.action === 'confirm' ? 'primary' : 'danger'}
                          disabled={act.isPending}
                          onClick={() => act.mutate(pending)}
                        >
                          {act.isPending ? <Spinner /> : null}
                          {t(pending.action === 'confirm' ? 'admin.transferOrders.confirmYes' : 'admin.transferOrders.cancelYes')}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPending(null)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
