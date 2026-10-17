import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/ui/toast'
import { retailService, RETAIL_PROVIDERS_QUERY_KEY } from '@/services/retail'

export interface ManualConnect {
  providerId: string
  providerCode: string
  /** The partner's login page; opened from a button in the dialog so mobile browsers allow it. */
  authorizeUrl: string
}

/** True when the partner will redirect straight back into this app. */
function redirectsHere(redirectUri: string): boolean {
  try {
    return new URL(redirectUri).origin === window.location.origin
  } catch {
    return false
  }
}

/** Extracts `code` and `state` from a pasted callback address. */
export function parseCallbackUrl(raw: string): { code: string; state: string } | null {
  const s = raw.trim()
  if (!s) return null
  // Phones copy the address without its scheme ("localhost:5173/…?code=…"), so read the two
  // parameters straight out of the text instead of trusting the URL shape.
  const code = /(?:^|[?&#\s])code=([^&#\s]+)/.exec(s)?.[1]
  const state = /(?:^|[?&#\s])state=([^&#\s]+)/.exec(s)?.[1]
  if (code && state) return { code: decodeURIComponent(code), state: decodeURIComponent(state) }
  return null
}

/**
 * Linking a retail partner account (OAuth through the partner's identity server).
 *
 * Two shapes, decided by the redirect URI the backend registered:
 * - it points at this app → full-page redirect; `/app/retail/connect/callback` finishes.
 * - it points elsewhere (Kifli only allows localhost for self-registered clients) → the authorize
 *   page opens in a new tab and the user pastes the resulting address into the manual dialog.
 */
export function useRetailConnect() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [manual, setManual] = useState<ManualConnect | null>(null)

  const start = useMutation({
    mutationFn: (providerId: string) => retailService.connect(providerId),
    onSuccess: (res, providerId) => {
      if (redirectsHere(res.redirectUri)) {
        window.location.assign(res.authorizeUrl)
      } else {
        // No window.open here: after an awaited request it is no longer a user gesture, and
        // Safari (and iOS PWAs) silently block it. The dialog carries the login link instead.
        setManual({ providerId, providerCode: res.providerCode, authorizeUrl: res.authorizeUrl })
      }
    },
    onError: () => toast({ title: t('settings.retailProviders.connectError'), variant: 'destructive' }),
  })

  const finish = useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => retailService.connectCallback(code, state),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RETAIL_PROVIDERS_QUERY_KEY })
      setManual(null)
    },
    onError: () => toast({ title: t('retailConnect.error'), variant: 'destructive' }),
  })

  const disconnect = useMutation({
    mutationFn: (providerId: string) => retailService.disconnect(providerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: RETAIL_PROVIDERS_QUERY_KEY })
      toast({ title: t('settings.retailProviders.disconnected') })
    },
    onError: () => toast({ title: t('common.errorGeneric'), variant: 'destructive' }),
  })

  return { start, finish, disconnect, manual, setManual }
}
