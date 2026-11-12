/**
 * CookieConsent — necessary / statistics / marketing banner.
 *
 * Wording follows Barion's recommended Hungarian consent text, adapted to our links. Three
 * paths: "Elfogadom" (everything), "Elutasítom" (only necessary) and "További beállítások"
 * (per-category toggles). The decision is stored with a timestamp (lib/consent.ts) and asked
 * again after 12 months with the saved choices preselected. The footer's "Sütibeállítások"
 * link reopens the banner on the settings view.
 *
 * Statistics → PostHog (lib/analytics.ts). Marketing → Barion Pixel grantConsent / rejectConsent.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import { applyStatisticsConsent } from '@/lib/analytics'
import { grantConsent, rejectConsent } from '@/lib/barionPixel'
import {
  needsConsentDecision,
  onCookieSettingsRequested,
  preselectedChoices,
  readConsentRecord,
  saveConsent,
  type ConsentChoices,
} from '@/lib/consent'

function applyChoices(choices: ConsentChoices) {
  saveConsent(choices)
  applyStatisticsConsent(choices.statistics)
  if (choices.marketing) grantConsent()
  else rejectConsent()
}

interface ToggleRowProps {
  id: string
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (next: boolean) => void
  note?: string
}

function ToggleRow({ id, title, description, checked, disabled, onChange, note }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-t border-[#1A1A1A]/8 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-sm font-semibold text-[#1A1A1A]">
          {title}
          {note && <span className="ml-2 text-xs font-normal text-[#4F7942]">{note}</span>}
        </p>
        <p className="text-xs text-[#1A1A1A]/60 leading-relaxed mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={[
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors mt-0.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1A1A1A]',
          checked ? 'bg-[#4F7942]' : 'bg-gray-300',
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(() => needsConsentDecision(readConsentRecord()))
  const [showSettings, setShowSettings] = useState(false)
  const [choices, setChoices] = useState<ConsentChoices>(() => preselectedChoices(readConsentRecord()))
  const cardRef = useRef<HTMLDivElement>(null)

  // Footer "Sütibeállítások" → reopen on the settings view with the saved choices.
  useEffect(
    () =>
      onCookieSettingsRequested(() => {
        setChoices(preselectedChoices(readConsentRecord()))
        setShowSettings(true)
        setVisible(true)
      }),
    [],
  )

  // KALMIO-421: while the banner is visible, expose its measured height as a
  // CSS custom property so scrollable containers (AppShell main, the
  // onboarding shell, etc.) can leave room at the bottom and the user can
  // actually scroll to the last form button.
  useEffect(() => {
    if (!visible) {
      document.documentElement.style.removeProperty('--consent-banner-h')
      return
    }
    const el = cardRef.current
    if (!el) return
    const setVar = () => {
      const h = el.getBoundingClientRect().height
      document.documentElement.style.setProperty('--consent-banner-h', `${Math.ceil(h) + 16}px`)
    }
    setVar()
    const ro = new ResizeObserver(setVar)
    ro.observe(el)
    window.addEventListener('resize', setVar)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', setVar)
      document.documentElement.style.removeProperty('--consent-banner-h')
    }
  }, [visible, showSettings])

  if (!visible) return null

  function close(next: ConsentChoices) {
    applyChoices(next)
    setChoices(next)
    setShowSettings(false)
    setVisible(false)
  }

  const linkClass = 'text-[#1A1A1A] underline underline-offset-2 hover:text-[#F28C28] transition-colors'

  return (
    <div
      role="region"
      aria-label={t('common.cookieConsentRegion')}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none"
    >
      <div
        ref={cardRef}
        className="pointer-events-auto w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl shadow-xl px-6 py-5"
      >
        <p className="text-sm text-[#1A1A1A]/80 leading-relaxed">
          <Trans
            i18nKey="consent.body"
            components={{
              cookies: <Link to="/privacy#cookies" className={linkClass} />,
              privacy: <Link to="/privacy" className={linkClass} />,
            }}
          />
        </p>

        {showSettings && (
          <div className="mt-4 rounded-xl border border-[#1A1A1A]/10 px-4 py-1" aria-label={t('consent.settingsTitle')} role="group">
            <ToggleRow
              id="consent-necessary"
              title={t('consent.categories.necessary.title')}
              description={t('consent.categories.necessary.description')}
              checked
              disabled
              note={t('consent.alwaysOn')}
            />
            <ToggleRow
              id="consent-statistics"
              title={t('consent.categories.statistics.title')}
              description={t('consent.categories.statistics.description')}
              checked={choices.statistics}
              onChange={(v) => setChoices((c) => ({ ...c, statistics: v }))}
            />
            <ToggleRow
              id="consent-marketing"
              title={t('consent.categories.marketing.title')}
              description={t('consent.categories.marketing.description')}
              checked={choices.marketing}
              onChange={(v) => setChoices((c) => ({ ...c, marketing: v }))}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => close({ statistics: true, marketing: true })}
            className="bg-[#F28C28] hover:bg-[#e07820] text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
          >
            {t('consent.accept')}
          </button>
          <button
            type="button"
            onClick={() => close({ statistics: false, marketing: false })}
            className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 text-[#1A1A1A]/70 hover:text-[#1A1A1A] text-sm font-medium px-5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-2"
          >
            {t('consent.decline')}
          </button>
          {showSettings ? (
            <button
              type="button"
              onClick={() => close(choices)}
              className="border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 text-[#1A1A1A] text-sm font-medium px-5 py-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-2"
            >
              {t('consent.save')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
            >
              {t('consent.moreSettings')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
