import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/ui/toast'
import { retailService, RETAIL_PROVIDERS_QUERY_KEY } from '@/services/retail'

export interface ManualConnect {
  providerId: string
  providerCode: string
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
  try {
    const u = new URL(s.startsWith('http') ? s : `http://x/?${s.replace(/^\?/, '')}`)
    const code = u.searchParams.get('code')
    const state = u.searchParams.get('state')
    return code && state ? { code, state } : null
  } catch {
    return null
  }
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
        window.open(res.authorizeUrl, '_blank', 'noopener')
        setManual({ providerId, providerCode: res.providerCode })
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
