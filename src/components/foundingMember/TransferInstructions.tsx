/**
 * TransferInstructions — what to put on the bank transfer for a Founding Member order.
 *
 * Shown after POST /api/founding-member/transfer-order(/guest) and whenever an open order is
 * restored. Beneficiary, account number / IBAN (when configured), the exact amount, the
 * reference as közlemény (copyable), the due date and the díjbekérő link. Dark surface.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, FileText } from 'lucide-react'
import { formatLocalDate } from '@/lib/utils'
import type { TransferOrderDto } from '@/types'

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => undefined)
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t('transferOrder.copyAria', { label })}
      className="inline-flex items-center gap-1 text-xs font-medium text-[#F28C28] hover:text-[#ffa54d] transition-colors shrink-0"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t('transferOrder.copied') : t('transferOrder.copy')}
    </button>
  )
}

function Row({ label, value, copy, emphasise }: { label: string; value: string; copy?: boolean; emphasise?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-t border-white/10 first:border-t-0">
      <div className="min-w-0">
        <p className="text-white/50 text-xs mb-0.5">{label}</p>
        <p className={emphasise ? 'text-white text-lg font-semibold font-mono break-all' : 'text-white text-sm break-all'}>
          {value}
        </p>
      </div>
      {copy && <CopyButton value={value} label={label} />}
    </div>
  )
}

export function TransferInstructions({ order }: { order: TransferOrderDto }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language?.startsWith('hu') ? 'hu' : 'en'
  const dueDate = formatLocalDate(order.dueDate, lang, { year: 'numeric', month: 'long', day: 'numeric' })
  const hasAccount = !!order.accountNumber || !!order.iban

  return (
    <section aria-label={t('transferOrder.title')} className="text-left">
      <h2 className="text-white text-lg font-semibold mb-1">{t('transferOrder.title')}</h2>
      <p className="text-white/60 text-sm leading-relaxed mb-4">{t('transferOrder.intro', { date: dueDate })}</p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-1">
        <Row label={t('transferOrder.beneficiary')} value={order.beneficiary} />
        {order.accountNumber && <Row label={t('transferOrder.accountNumber')} value={order.accountNumber} copy />}
        {order.iban && <Row label={t('transferOrder.iban')} value={order.iban} copy />}
        <Row label={t('transferOrder.amount')} value={t('transferOrder.amountValue', { amount: order.amountHuf })} />
        <Row label={t('transferOrder.reference')} value={order.reference} copy emphasise />
        <Row label={t('transferOrder.dueDate')} value={dueDate} />
      </div>

      <p className="text-white/60 text-xs leading-relaxed mt-3">{t('transferOrder.referenceNote')}</p>
      {!hasAccount && (
        <p className="text-white/60 text-xs leading-relaxed mt-2">{t('transferOrder.accountPending')}</p>
      )}

      {order.proformaUrl && (
        <a
          href={order.proformaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#F28C28] hover:text-[#ffa54d] underline underline-offset-2"
        >
          <FileText className="h-4 w-4" />
          {t('transferOrder.proforma')}
        </a>
      )}
    </section>
  )
}
