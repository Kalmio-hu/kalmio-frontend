import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Loader2, Fingerprint, Mail, CheckCircle2, ArrowLeft, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { buildSessionFromAccessToken, persistPasskeyToken } from '@/lib/passkeySession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authenticateWithPasskeyDiscoverable, authenticateWithPasskey } from '@/services/passkey'
import { GoogleLogo } from '@/assets/GoogleLogo'
import { ProviderButton } from '@/components/auth/ProviderButton'
import { useAuthStore } from '@/store/auth'
import { capture, identify, alias } from '@/lib/analytics'
import { mapAuthError } from '@/lib/authErrors'
import { isValidEmail } from '@/lib/validators'

// RFC-5321-friendly schema: accepts + . _ % - in the local part.
// z.string().email() in Zod v4 also accepts these, but we use an
// explicit .refine() so the validator is testable in isolation and
// the intent is unambiguous to future readers.
const emailSchema = z.object({
  email: z
    .string()
    .min(1)
    .refine(isValidEmail, { message: 'invalid_email_format' }),
})
type EmailForm = z.infer<typeof emailSchema>

type Step = { mode: 'home' } | { mode: 'sent'; email: string }

const RESEND_DELAY_S = 30

export function Auth() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // `returnTo` comes from the expired-session redirect; `next` is the legacy param.
  // Guard against open-redirect: only accept same-origin relative paths (must start
  // with exactly one `/`; `//evil.com` is rejected because it starts with `//`).
  // Also reject `/auth*` so a captured-while-on-auth path can't loop us back here.
  const returnTo = searchParams.get('returnTo')
  const raw = returnTo ?? searchParams.get('next')
  const isSafePath = !!raw
    && raw.startsWith('/')
    && !raw.startsWith('//')
    && !raw.startsWith('/auth')
  const nextPath = isSafePath ? raw : '/app'
  const isExpiredSession = searchParams.get('expired') === '1'
  const setSession = useAuthStore((s) => s.setSession)

  const [step, setStep] = useState<Step>({ mode: 'home' })
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [showEmailFallback, setShowEmailFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // OTP state
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(RESEND_DELAY_S)
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  // ── Helpers ───────────────────────────────────────────────────────────────

  const storeSessionFromToken = (accessToken: string) => {
    persistPasskeyToken(accessToken)
    const session = buildSessionFromAccessToken(accessToken)
    setSession(session)
    alias(session.user.id)
    identify(session.user.id)
    capture('signup_completed', { method: 'passkey' })
  }

  // Start the resend countdown when we are in the sent step.
  // We do NOT call setResendCountdown here to avoid lint set-state-in-effect;
  // the countdown is reset to RESEND_DELAY_S by the callers (sendMagicLink / resendCode)
  // before transitioning to the sent step.
  useEffect(() => {
    if (step.mode !== 'sent') return
    const id = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(id)
          return 0
        }
        return c - 1
      })
    }, 1000)
    resendTimerRef.current = id
    return () => clearInterval(id)
  }, [step.mode])

  // ── Passkey flows ─────────────────────────────────────────────────────────

  // KALMIO-425: passkey safety timeout. The WebAuthn prompt can sit indefinitely
  // if the user looks away or the browser's native dialog doesn't surface (some
  // OS configurations) — at which point every login button stays disabled and
  // the user is stuck. A 90-second hard timeout releases the loading state so
  // the user can fall back to email/Google.
  const passkeyTimeoutRef = useRef<number | null>(null)
  function clearPasskeyTimeout() {
    if (passkeyTimeoutRef.current != null) {
      window.clearTimeout(passkeyTimeoutRef.current)
      passkeyTimeoutRef.current = null
    }
  }
  function startPasskeyTimeout() {
    clearPasskeyTimeout()
    passkeyTimeoutRef.current = window.setTimeout(() => {
      setPasskeyLoading(false)
      setShowEmailFallback(true)
      setError(t('auth.passkeyTimeout'))
    }, 90_000)
  }

  /** Primary: discoverable credential — browser picks from all enrolled passkeys */
  const signInWithPasskeyDiscoverable = async () => {
    setPasskeyLoading(true)
    startPasskeyTimeout()
    setError(null)
    capture('signup_started', { method: 'passkey' })
    try {
      const result = await authenticateWithPasskeyDiscoverable()
      storeSessionFromToken(result.accessToken)
      navigate(nextPath, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      // User cancelled or no passkey available — reveal the email fallback quietly
      if (msg.includes('NotAllowedError') || msg.includes('cancelled') || msg.includes('timed out')) {
        setShowEmailFallback(true)
      } else {
        setError(t('auth.passkeyError'))
        setShowEmailFallback(true)
      }
    } finally {
      clearPasskeyTimeout()
      setPasskeyLoading(false)
    }
  }

  /** Fallback: email-targeted passkey when user types their email first */
  const signInWithPasskeyForEmail = async (email: string) => {
    setPasskeyLoading(true)
    startPasskeyTimeout()
    setError(null)
    try {
      const result = await authenticateWithPasskey(email)
      storeSessionFromToken(result.accessToken)
      navigate(nextPath, { replace: true })
    } catch {
      setError(t('auth.passkeyError'))
    } finally {
      clearPasskeyTimeout()
      setPasskeyLoading(false)
    }
  }

  /**
   * Explicit "use another method" escape hatch from the passkey loading state.
   * WebAuthn may keep running in the background (its result is discarded by the
   * timeout), but the UI is unlocked so the user can try email or Google.
   */
  function abandonPasskey() {
    clearPasskeyTimeout()
    setPasskeyLoading(false)
    setShowEmailFallback(true)
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    capture('signup_started', { method: 'google' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // If signInWithOAuth succeeds, Supabase redirects the browser; this line
    // is only reached on failure (e.g. provider not configured).
    if (error) {
      setError(t(mapAuthError(error)))
      setGoogleLoading(false)
    }
  }

  // ── Magic link ────────────────────────────────────────────────────────────

  const sendMagicLink = async ({ email }: EmailForm) => {
    setEmailLoading(true)
    setError(null)
    capture('signup_started', { method: 'email' })
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setEmailLoading(false)
    if (error) { setError(t(mapAuthError(error))); return }
    setOtpCode('')
    setResendCountdown(RESEND_DELAY_S)
    setStep({ mode: 'sent', email })
  }

  // ── OTP verify ────────────────────────────────────────────────────────────

  const verifyOtp = async () => {
    if (step.mode !== 'sent') return
    setOtpLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      type: 'email',
      email: step.email,
      token: otpCode.trim(),
    })
    setOtpLoading(false)
    if (error) {
      setError(t(mapAuthError(error)))
      return
    }
    // Session is set by the Supabase onAuthStateChange listener that already
    // exists in the app shell — navigation happens via the existing auth callback.
    capture('signin_completed', { method: 'otp' })
    navigate(nextPath, { replace: true })
  }

  const resendCode = async () => {
    if (step.mode !== 'sent' || resendCountdown > 0) return
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: step.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(t(mapAuthError(error))); return }
    // Reset the countdown; the running useEffect interval will continue ticking
    // from the new value once React processes this state update.
    if (resendTimerRef.current) clearInterval(resendTimerRef.current)
    setResendCountdown(RESEND_DELAY_S)
    const id = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(id)
          return 0
        }
        return c - 1
      })
    }, 1000)
    resendTimerRef.current = id
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── Left: Hero ── */}
      <div className="hidden lg:block relative overflow-hidden bg-midnight-black">
        <img
          src="/assets/images/auth-hero.png"
          alt=""
          className="absolute inset-0 w-full object-cover opacity-60"
        />
        <div className="relative flex flex-col justify-end h-full p-12 bg-gradient-to-t from-midnight-black/80 via-transparent to-transparent">
          <p className="font-headline text-4xl font-bold text-white leading-snug max-w-xs whitespace-pre-line">
            {t('auth.heroQuote')}
          </p>
          <p className="mt-3 text-white/55 text-sm">{t('auth.heroSub')}</p>
        </div>
      </div>

      {/* ── Right: Card ── */}
      <div className="flex items-center justify-center bg-[#fafafa] p-6 lg:p-12">
        <div className="w-full max-w-md">

          <div className="mb-8">
            <Link to="/" aria-label={t('auth.backToHome')} className="inline-block">
              <img
                src="/assets/images/logo-dark.png"
                alt="Kalmio"
                className="h-9 object-contain object-left"
              />
            </Link>
            <p className="mt-1.5 text-xs text-gray-400 tracking-wide">{t('auth.tagline')}</p>
          </div>

          {isExpiredSession && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {t('auth.errors.sessionExpired')}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Home ── */}
            {step.mode === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div>
                  <h1 className="font-headline text-2xl font-bold text-midnight-black">
                    {t('auth.headline')}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">{t('auth.subheadline')}</p>
                </div>

                {/* Primary CTA: passkey (no email needed) */}
                <Button
                  type="button"
                  onClick={signInWithPasskeyDiscoverable}
                  disabled={passkeyLoading || googleLoading || emailLoading}
                  className="w-full h-12 rounded-2xl bg-midnight-black hover:bg-midnight-black/90 text-white gap-3 text-base font-semibold"
                >
                  {passkeyLoading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <Fingerprint size={18} />}
                  {passkeyLoading ? t('auth.passkeyVerifying') : t('auth.continueWithPasskey')}
                </Button>

                {/* KALMIO-425: visible escape while the WebAuthn prompt is up so the
                    user is never stranded if the OS dialog hangs or their authenticator
                    is unavailable. Clicking abandons the in-progress attempt and
                    reveals the email/Google alternatives. */}
                {passkeyLoading && (
                  <button
                    type="button"
                    onClick={abandonPasskey}
                    className="w-full text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors py-1"
                  >
                    {t('auth.passkeyAbandon')}
                  </button>
                )}

                {/* Google OAuth */}
                <ProviderButton
                  onClick={signInWithGoogle}
                  disabled={passkeyLoading || emailLoading}
                  loading={googleLoading}
                  loadingLabel={t('auth.googleLoading')}
                  label={t('auth.continueWithGoogle')}
                  icon={<GoogleLogo size={18} />}
                />

                {/* "Use email instead" — subtle link, expands the email fallback */}
                <AnimatePresence>
                  {!showEmailFallback && (
                    <motion.button
                      key="show-email"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      type="button"
                      onClick={() => setShowEmailFallback(true)}
                      disabled={passkeyLoading || googleLoading || emailLoading}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail size={13} />
                      {t('auth.useEmailInstead')}
                      <ChevronDown size={12} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Email fallback — slides in */}
                <AnimatePresence>
                  {showEmailFallback && (
                    <motion.div
                      key="email-fallback"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 uppercase tracking-widest">{t('auth.or')}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      <form onSubmit={form.handleSubmit(sendMagicLink)} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="auth-email" className="text-sm font-medium">
                            {t('auth.emailLabel')}
                          </Label>
                          <Input
                            id="auth-email"
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            autoComplete="email webauthn"
                            autoFocus
                            className="h-11 rounded-xl"
                            {...form.register('email')}
                          />
                          {form.formState.errors.email && (
                            <p className="text-xs text-red-500">{t('auth.invalidEmail')}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {/* Passkey for this specific email */}
                          <Button
                            type="button"
                            disabled={passkeyLoading || googleLoading || emailLoading}
                            onClick={() => {
                              const email = form.getValues('email')
                              if (email && !form.formState.errors.email) {
                                signInWithPasskeyForEmail(email)
                              } else {
                                form.trigger('email')
                              }
                            }}
                            className="flex-1 h-11 rounded-xl bg-midnight-black hover:bg-midnight-black/90 text-white gap-2 text-sm font-medium"
                          >
                            {passkeyLoading
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Fingerprint size={15} />}
                            {passkeyLoading ? t('auth.passkeyVerifying') : t('auth.passkeyForEmail')}
                          </Button>

                          {/* Magic link */}
                          <Button
                            type="submit"
                            disabled={emailLoading || passkeyLoading || googleLoading}
                            className="flex-1 h-11 rounded-xl bg-energy-orange hover:bg-energy-orange/90 text-white gap-2 text-sm font-medium"
                          >
                            {emailLoading
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Mail size={15} />}
                            {t('auth.continueWithEmail')}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  {t('auth.noPassword')}
                </p>
              </motion.div>
            )}

            {/* ── Sent ── */}
            {step.mode === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5 py-6"
              >
                <div className="text-center">
                  <CheckCircle2 className="mx-auto text-vital-green" size={52} />
                  <h2 className="mt-4 font-headline text-xl font-bold text-midnight-black">
                    {t('auth.checkEmail')}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                    {t('auth.checkEmailHint', { email: step.email })}
                  </p>
                </div>

                {/* OTP input section */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {t('auth.orEnterCode')}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      value={otpCode}
                      onChange={(e) => {
                        // Allow only digits
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && otpCode.length === 8) verifyOtp()
                      }}
                      placeholder={t('auth.codePlaceholder')}
                      className="h-11 rounded-xl flex-1 text-center font-mono text-lg tracking-widest"
                      aria-label={t('auth.orEnterCode')}
                      autoFocus
                    />
                    <Button
                      type="button"
                      disabled={otpLoading || otpCode.length !== 8}
                      onClick={verifyOtp}
                      className="h-11 rounded-xl bg-midnight-black hover:bg-midnight-black/90 text-white px-4 text-sm font-medium whitespace-nowrap"
                    >
                      {otpLoading
                        ? <Loader2 size={15} className="animate-spin" />
                        : t('auth.verifyCode')}
                    </Button>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}

                  {/* Resend link — visible after 30 s */}
                  <div className="text-center">
                    {resendCountdown > 0 ? (
                      <p className="text-xs text-gray-400">
                        {t('auth.requestNewCode')} ({resendCountdown}s)
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendCode}
                        className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
                      >
                        {t('auth.requestNewCode')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => { setStep({ mode: 'home' }); setError(null); setOtpCode('') }}
                    className="text-sm text-gray-500 gap-2"
                  >
                    <ArrowLeft size={14} />
                    {t('auth.tryDifferentEmail')}
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
