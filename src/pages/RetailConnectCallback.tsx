import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { retailService } from '@/services/retail'
import { capture } from '@/lib/analytics'

/**
 * Landing page for the partner OAuth redirect (`/app/retail/connect/callback?code=…&state=…`).
 * Exchanges the code through the backend, then returns to the shopping list.
 */
export function RetailConnectCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ran = useRef(false)
  // Read the redirect parameters once; a missing code/state is an error from the first render.
  const [params] = useState(() => {
    const q = new URLSearchParams(window.location.search)
    return { code: q.get('code'), state: q.get('state') }
  })
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>(() => (params.code && params.state ? 'working' : 'error'))
  const [provider, setProvider] = useState<string>('')

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const { code, state } = params
    if (!code || !state) return
    retailService.connectCallback(code, state)
      .then((res) => {
        setProvider(res.providerCode ?? '')
        setStatus('ok')
        capture('retail_account_connected', { provider: res.providerCode })
        setTimeout(() => navigate('/app/shopping-list', { replace: true }), 1500)
      })
      .catch(() => setStatus('error'))
  }, [navigate, params])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2] px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <h1 className="text-xl font-headline font-bold text-[#1A1A1A]">{t('retailConnect.title')}</h1>
        {status === 'working' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#4F7942]" aria-hidden />
            <p className="text-sm text-[#6B6460]">{t('retailConnect.working')}</p>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="h-8 w-8 mx-auto text-[#4F7942]" aria-hidden />
            <p className="text-sm text-[#1A1A1A]">{t('retailConnect.success', { provider: provider === 'KIFLI' ? 'Kifli' : provider })}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertTriangle className="h-8 w-8 mx-auto text-red-600" aria-hidden />
            <p className="text-sm text-red-700">{t('retailConnect.error')}</p>
          </>
        )}
        <Link to="/app/shopping-list" className="inline-block text-sm text-[#4F7942] underline-offset-2 hover:underline">
          {t('retailConnect.back')}
        </Link>
      </div>
    </div>
  )
}
