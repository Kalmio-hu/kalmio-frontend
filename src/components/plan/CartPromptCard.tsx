/**
 * CartPromptCard — KALMIO-319
 *
 * Non-blocking inline card shown after plan generation completes.
 * Offers three actions:
 *   1. Add automatically — calls POST /api/shopping-cart/generate for the
 *      plan's window, shows an item-count confirmation.
 *   2. Adjust manually — navigates to /app/cart so the user edits before saving.
 *   3. Dismiss — no cart created.
 *
 * Receipt stub: disabled button labelled "Add from receipt — coming soon"
 * (KALMIO-303, Wave 3).
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { shoppingCartService } from '@/services/shoppingCartService'

interface CartPromptCardProps {
  /** ISO date "YYYY-MM-DD" — start of the newly-created schedule window. */
  windowStart: string
  /** ISO date "YYYY-MM-DD" — end of the window; null = open-ended (backend defaults). */
  windowEnd: string | null
  /** Called when the user dismisses or completes the prompt so the parent can close. */
  onDone: () => void
}

type PromptPhase = 'idle' | 'added'

export function CartPromptCard({ windowStart, windowEnd, onDone }: CartPromptCardProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [phase, setPhase] = useState<PromptPhase>('idle')
  const [addedCount, setAddedCount] = useState(0)

  const addMutation = useMutation({
    mutationFn: () =>
      shoppingCartService.generate({
        windowStart,
        windowEnd: windowEnd ?? undefined,
      }),
    onSuccess: data => {
      const count = data.lineItems.length
      setAddedCount(count)
      setPhase('added')
      void queryClient.invalidateQueries({ queryKey: ['shopping-cart'] })
    },
    onError: () => {
      toast({ title: t('plan.run.cartPrompt.addError'), variant: 'destructive' })
    },
  })

  function handleAdjustManually() {
    onDone()
    navigate('/app/cart')
  }

  function handleDismiss() {
    onDone()
  }

  function handleDone() {
    onDone()
  }

  // ── Confirmation phase ──────────────────────────────────────────────────────
  if (phase === 'added') {
    return (
      <div
        role="status"
        className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex flex-col gap-3"
      >
        <p className="text-sm text-green-900 font-medium">
          {t('plan.run.cartPrompt.added', { count: addedCount })}
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleDone} className="flex-1">
            {t('common.close')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { onDone(); navigate('/app/cart') }}
            className="flex-1 text-green-700 hover:bg-green-100"
          >
            {t('plan.run.cartPrompt.viewCart')}
          </Button>
        </div>
      </div>
    )
  }

  // ── Idle phase (initial prompt) ─────────────────────────────────────────────
  return (
    <div
      role="complementary"
      aria-label={t('plan.run.cartPrompt.heading')}
      className="rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 flex flex-col gap-3"
    >
      <p className="text-sm font-medium text-[#374151]">
        {t('plan.run.cartPrompt.heading')}
      </p>

      <div className="flex flex-col gap-2">
        {/* Primary: add automatically */}
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending}
          className="w-full"
        >
          {addMutation.isPending
            ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-4 h-4" />
                {t('plan.run.cartPrompt.adding')}
              </span>
            )
            : t('plan.run.cartPrompt.addAuto')}
        </Button>

        {/* Secondary: adjust manually */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleAdjustManually}
          disabled={addMutation.isPending}
          className="w-full"
        >
          {t('plan.run.cartPrompt.adjustManually')}
        </Button>

        {/* Receipt OCR stub — Wave 3 / KALMIO-303 */}
        <Button
          size="sm"
          variant="ghost"
          disabled
          className="w-full text-[#9ca3af] cursor-not-allowed"
          aria-disabled="true"
        >
          {t('plan.run.cartPrompt.receiptStub')}
        </Button>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={handleDismiss}
        className="text-xs text-[#9ca3af] text-left hover:text-[#6b7280] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4f46e5] rounded"
      >
        {t('plan.run.cartPrompt.dismiss')}
      </button>
    </div>
  )
}
