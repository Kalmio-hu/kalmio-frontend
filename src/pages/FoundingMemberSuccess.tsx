/**
 * FoundingMemberSuccess — W14 post-checkout return page
 *
 * Mounted at /app/founding-member/success. Barion redirects buyers here after
 * the hosted payment page completes (regardless of outcome — both success and
 * cancellation route through the same URL).
 *
 * Strategy:
 *   - Poll /api/users/me every 2 seconds for up to ~30 seconds, watching for
 *     `foundingMember === true`. The webhook race is real: Barion may redirect
 *     the buyer before the server-to-server webhook lands.
 *   - While waiting, show a "we're activating your access" message.
 *   - Once `foundingMember` flips, show the granted state and a back-to-app link.
 *   - If we hit the polling ceiling without the flag flipping, show the "your bank
 *     is slow" copy with a manual refresh button.
 *
 * Wrapped in {@link PremiumFeatureGate} for consistency with the buy page.
 */

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usersService, USERS_ME_QUERY_KEY } from '@/services/users'
import { PremiumFeatureGate } from '@/components/premium/PremiumFeatureGate'

const POLL_INTERVAL_MS = 2_000
const POLL_TIMEOUT_MS = 30_000

function FoundingMemberSuccessInner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Track whether we're still inside the polling window.
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  const me = useQuery({
    queryKey: USERS_ME_QUERY_KEY,
    queryFn: usersService.getMe,
    refetchInterval: (query) => {
      // Stop polling as soon as the flag flips, or when the timeout elapses.
      if (query.state.data?.foundingMember) return false
      if (!isPolling) return false
      return POLL_INTERVAL_MS
    },
    refetchOnWindowFocus: true,
  })

  const isGranted = me.data?.foundingMember === true

  function handleManualRefresh() {
    setIsPolling(true)
    setTimeout(() => setIsPolling(false), POLL_TIMEOUT_MS)
    queryClient.invalidateQueries({ queryKey: USERS_ME_QUERY_KEY })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16 bg-[#111]">
      <section className="max-w-md w-full text-center">
        <p className="text-[#F28C28] font-semibold text-xs uppercase tracking-widest mb-4">
          {t('foundingMember.buy.label')}
        </p>
        <h1 className="text-3xl font-semibold text-white mb-6">
          {t('foundingMember.success.title')}
        </h1>

        {isGranted ? (
          <p className="text-white/80 text-base leading-relaxed mb-8">
            {t('foundingMember.success.granted')}
          </p>
        ) : isPolling ? (
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t('foundingMember.success.waiting')}
          </p>
        ) : (
          <p className="text-white/70 text-base leading-relaxed mb-8">
            {t('foundingMember.success.slow')}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          {isGranted ? (
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
            >
              {t('foundingMember.success.backToApp')}
            </button>
          ) : !isPolling ? (
            <button
              type="button"
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-2 bg-[#F28C28] hover:bg-[#e07820] text-white font-bold text-base px-8 py-4 rounded-full transition-colors"
            >
              {t('foundingMember.success.refresh')}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export function FoundingMemberSuccess() {
  const { t } = useTranslation()

  return (
    <PremiumFeatureGate
      fallback={
        <main className="min-h-screen flex items-center justify-center px-6 bg-[#111]">
          <p className="text-white/60 text-base text-center">
            {t('foundingMember.comingSoon')}
          </p>
        </main>
      }
    >
      <FoundingMemberSuccessInner />
    </PremiumFeatureGate>
  )
}
