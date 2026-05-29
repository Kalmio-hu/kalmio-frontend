/**
 * ReceiptScanPage — KALMIO-329
 *
 * Full-page receipt scanning flow. Accessed via /app/cart/:cartId/receipt.
 *
 * Phases:
 *   1. PICK    — camera / file picker to select the receipt photo.
 *   2. UPLOAD  — upload + OCR in progress (spinner).
 *   3. CONFIRM — ReceiptMatchConfirm screen for the user to review matches.
 *   4. DONE    — success feedback + navigation back to cart.
 *
 * The page is self-contained: it calls the shoppingCartService methods directly
 * and does not share state with other pages beyond navigation.
 */
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { ReceiptMatchConfirm } from '@/components/shopping/ReceiptMatchConfirm'
import { shoppingCartService } from '@/services/shoppingCartService'
import type { CartReceiptConfirmRequest, ReceiptMatchLine, ReceiptScanResponse } from '@/types'

type Phase = 'pick' | 'upload' | 'confirm' | 'done'

const ACCEPT = 'image/jpeg,image/png,image/heic,image/heif,image/webp'
const MAX_BYTES = 10 * 1024 * 1024

export default function ReceiptScanPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { cartId } = useParams<{ cartId: string }>()

  const [phase, setPhase] = useState<Phase>('pick')
  const [scanResult, setScanResult] = useState<ReceiptScanResponse | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [retailer, setRetailer] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File selection ────────────────────────────────────────────────────────

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cartId) return

    if (file.size > MAX_BYTES) {
      toast({ title: t('shopping.receipt.fileTooLarge'), variant: 'destructive' })
      return
    }

    setPhase('upload')
    try {
      const result = await shoppingCartService.scanReceipt(cartId, file)
      setRetailer(result.retailer)
      setScanResult(result)
      setPhase('confirm')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 402) {
        navigate('/app/founding-member')
      } else if (status === 429) {
        toast({ title: t('shopping.receipt.rateLimited'), variant: 'destructive' })
      } else if (status === 503) {
        toast({ title: t('shopping.receipt.ocrUnavailable'), variant: 'destructive' })
      } else {
        toast({ title: t('shopping.receipt.scanError'), variant: 'destructive' })
      }
      setPhase('pick')
    }
  }

  // ── Confirm ───────────────────────────────────────────────────────────────

  async function handleConfirm(lines: ReceiptMatchLine[]) {
    if (!cartId) return
    setConfirming(true)
    try {
      const req: CartReceiptConfirmRequest = { retailer: retailer ?? null, lines }
      const { savedCount: count } = await shoppingCartService.confirmReceipt(cartId, req)
      setSavedCount(count)
      setPhase('done')
    } catch {
      toast({ title: t('shopping.receipt.confirmError'), variant: 'destructive' })
    } finally {
      setConfirming(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#f9fafb] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e5e7eb]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-[#4f46e5] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
          aria-label={t('common.back')}
        >
          ← {t('common.back')}
        </button>
        <h1 className="text-base font-semibold text-[#111827]">
          {t('shopping.receipt.title')}
        </h1>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-6 gap-6 max-w-md mx-auto w-full">

        {/* Phase: PICK */}
        {phase === 'pick' && (
          <div className="w-full flex flex-col items-center gap-4">
            <div
              className="w-full rounded-2xl border-2 border-dashed border-[#d1d5db] bg-white flex flex-col items-center justify-center gap-3 py-12 px-6 cursor-pointer hover:border-[#6366f1] transition-colors"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              aria-label={t('shopping.receipt.pickArea')}
            >
              {/* Camera icon */}
              <svg
                className="w-12 h-12 text-[#9ca3af]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
              <p className="text-sm font-medium text-[#374151]">
                {t('shopping.receipt.pickInstruction')}
              </p>
              <p className="text-xs text-[#9ca3af]">
                {t('shopping.receipt.pickHint')}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              capture="environment"
              className="sr-only"
              onChange={handleFileSelected}
            />

            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="w-full">
              {t('common.cancel')}
            </Button>
          </div>
        )}

        {/* Phase: UPLOAD */}
        {phase === 'upload' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Spinner className="w-10 h-10 text-[#4f46e5]" />
            <p className="text-sm text-[#374151] text-center">
              {t('shopping.receipt.scanning')}
            </p>
          </div>
        )}

        {/* Phase: CONFIRM */}
        {phase === 'confirm' && scanResult && (
          <div className="w-full bg-white rounded-2xl border border-[#e5e7eb] p-4">
            <ReceiptMatchConfirm
              scanResult={scanResult}
              onConfirm={handleConfirm}
              confirming={confirming}
              onCancel={() => navigate(-1)}
            />
          </div>
        )}

        {/* Phase: DONE */}
        {phase === 'done' && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center">
              <svg
                className="w-8 h-8 text-[#059669]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#111827]">
              {t('shopping.receipt.doneTitle', { count: savedCount })}
            </p>
            <p className="text-sm text-[#6b7280]">
              {t('shopping.receipt.doneSubtitle')}
            </p>
            <Button onClick={() => navigate(-1)} className="w-full max-w-xs">
              {t('common.close')}
            </Button>
          </div>
        )}

      </main>
    </div>
  )
}
