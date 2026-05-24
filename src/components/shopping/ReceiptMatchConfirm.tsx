/**
 * ReceiptMatchConfirm — KALMIO-329
 *
 * Match-confirm screen shown after receipt scan completes. Displays all OCR-extracted
 * lines with their match status. The user can review auto-confirmed lines, resolve
 * unmatched lines by dismissing them, and commit the final list to the fridge.
 *
 * Auto-confirmed lines (CART_MATCH or CATALOG_MATCH) are pre-checked; UNMATCHED lines
 * appear dimmed with an option to exclude them. On commit the parent receives the
 * (possibly edited) line list and calls POST /receipt/confirm.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ReceiptMatchLine, ReceiptScanResponse } from '@/types'

interface ReceiptMatchConfirmProps {
  /** Scan response from POST /receipt/scan */
  scanResult: ReceiptScanResponse
  /** Called when the user confirms the list; receives the final lines for the POST /confirm body */
  onConfirm: (lines: ReceiptMatchLine[]) => void
  /** Whether the confirm mutation is in-flight */
  confirming: boolean
  /** Called when the user cancels the confirm screen */
  onCancel: () => void
}

export function ReceiptMatchConfirm({
  scanResult,
  onConfirm,
  confirming,
  onCancel,
}: ReceiptMatchConfirmProps) {
  const { t } = useTranslation()

  // Each line starts included if auto-confirmed, excluded if UNMATCHED.
  const [included, setIncluded] = useState<boolean[]>(
    () => scanResult.lines.map(l => l.autoConfirmed),
  )

  function toggleLine(idx: number) {
    setIncluded(prev => prev.map((v, i) => (i === idx ? !v : v)))
  }

  function handleConfirm() {
    const selectedLines = scanResult.lines.filter((_, i) => included[i])
    onConfirm(selectedLines)
  }

  const includedCount = included.filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-[#111827]">
          {t('shopping.receipt.confirmTitle')}
        </p>
        <p className="text-xs text-[#6b7280] mt-0.5">
          {t('shopping.receipt.confirmSubtitle', {
            retailer: scanResult.retailer,
            matched: scanResult.matchedCount,
            total: scanResult.lines.length,
          })}
        </p>
      </div>

      {/* Line list */}
      <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {scanResult.lines.map((line, idx) => {
          const isIncluded = included[idx]
          const isUnmatched = line.matchSource === 'UNMATCHED'
          return (
            <li
              key={idx}
              className={[
                'flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer select-none transition-colors',
                isIncluded
                  ? 'border-[#d1fae5] bg-[#f0fdf4]'
                  : 'border-[#e5e7eb] bg-[#f9fafb] opacity-50',
              ].join(' ')}
              onClick={() => toggleLine(idx)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleLine(idx) } }}
              aria-checked={isIncluded}
              role="checkbox"
              tabIndex={0}
            >
              {/* Checkbox */}
              <span
                className={[
                  'mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center',
                  isIncluded
                    ? 'border-[#059669] bg-[#059669]'
                    : 'border-[#d1d5db] bg-white',
                ].join(' ')}
                aria-hidden="true"
              >
                {isIncluded && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>

              {/* Line info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111827] truncate">
                  {line.ingredientName || line.rawText}
                </p>
                <p className="text-xs text-[#6b7280]">
                  {line.quantity} {line.unit.toLowerCase()}
                  {isUnmatched && (
                    <span className="ml-2 text-[#9ca3af]">
                      — {t('shopping.receipt.unmatched')}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#9ca3af] truncate" title={line.rawText}>
                  {line.rawText}
                </p>
              </div>

              {/* Match badge */}
              <span
                className={[
                  'flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5',
                  line.matchSource === 'CART_MATCH'
                    ? 'bg-[#d1fae5] text-[#065f46]'
                    : line.matchSource === 'CATALOG_MATCH'
                      ? 'bg-[#dbeafe] text-[#1e40af]'
                      : 'bg-[#f3f4f6] text-[#6b7280]',
                ].join(' ')}
              >
                {line.matchSource === 'CART_MATCH'
                  ? t('shopping.receipt.badgeCart')
                  : line.matchSource === 'CATALOG_MATCH'
                    ? t('shopping.receipt.badgeCatalog')
                    : t('shopping.receipt.badgeUnmatched')}
              </span>
            </li>
          )
        })}
      </ul>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={confirming || includedCount === 0}
          className="flex-1"
        >
          {confirming ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              {t('shopping.receipt.saving')}
            </span>
          ) : (
            t('shopping.receipt.confirmButton', { count: includedCount })
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={confirming}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
