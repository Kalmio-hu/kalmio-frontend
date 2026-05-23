import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

export function OAuthConsent() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionToken = searchParams.get('session')
  const { session, initialized } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized) return
    if (!session) {
      // Redirect to auth, come back here after login
      navigate(`/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`, { replace: true })
    }
  }, [initialized, session, navigate])

  if (!sessionToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <p className="text-sm text-gray-500">{t('oauthConsent.invalidRequest')}</p>
      </div>
    )
  }

  const handleAuthorize = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<{ redirectUrl: string }>('/oauth/authorize/confirm', {
        sessionToken,
      })
      window.location.href = data.redirectUrl
    } catch {
      setError(t('oauthConsent.authFailed'))
      setLoading(false)
    }
  }

  const handleDeny = () => {
    window.close()
    navigate('/', { replace: true })
  }

  if (!initialized || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="animate-spin text-energy-orange" size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-energy-orange/10 flex items-center justify-center">
            <ShieldCheck size={28} className="text-energy-orange" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('oauthConsent.title')}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t('oauthConsent.description')}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
          {t('oauthConsent.signedInAs')} <span className="font-medium text-gray-900">{session.user?.email}</span>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAuthorize}
            disabled={loading}
            className="w-full"
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {t('oauthConsent.authorize')}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDeny}
            disabled={loading}
            className="w-full text-gray-500"
          >
            <X size={14} className="mr-1" />
            {t('oauthConsent.cancel')}
          </Button>
        </div>
      </div>
    </div>
  )
}
