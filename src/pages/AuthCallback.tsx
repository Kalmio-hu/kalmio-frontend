import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { capture, identify, alias } from '@/lib/analytics'

const POST_AUTH_NEXT_KEY = 'kalmio_post_auth_next'

export function AuthCallback() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  // Guard so the exchange + navigate runs exactly once. Without this, React StrictMode
  // double-invokes the effect in dev: the first run reads & clears the stashed redirect,
  // the second run reads nothing and re-navigates to /app — silently dropping the target.
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const run = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      // Try the explicit PKCE exchange. If the Supabase client already consumed the code
      // (detectSessionInUrl runs automatically on load), this errors — so we fall back to
      // getSession() rather than bouncing the user back to /auth.
      let session = null
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) session = data.session
      }
      if (!session) {
        const { data } = await supabase.auth.getSession()
        session = data.session
      }
      if (!session) {
        navigate('/auth', { replace: true })
        return
      }

      setSession(session)
      alias(session.user.id)
      identify(session.user.id)
      capture('signup_completed', { method: 'oauth' })

      // Destination: ?next (same-tab flows) → localStorage stash (OAuth / magic-link
      // redirects, which can't carry it in the exact-match callback URL) → /app.
      let dest = params.get('next')
      if (!dest) {
        try { dest = localStorage.getItem(POST_AUTH_NEXT_KEY) } catch { /* ignore */ }
      }
      try { localStorage.removeItem(POST_AUTH_NEXT_KEY) } catch { /* ignore */ }
      navigate(dest || '/app', { replace: true })
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafafa]">
      <Loader2 className="animate-spin text-energy-orange" size={36} />
      <p className="text-sm text-gray-400">Signing you in…</p>
    </div>
  )
}
