import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resetConsent } from '@/lib/analytics'

interface Props {
  variant?: 'dark' | 'light'
}

export function LegalFooter({ variant = 'light' }: Props) {
  const { t } = useTranslation()

  function handleCookieSettings() {
    resetConsent()
    window.location.reload()
  }

  if (variant === 'dark') {
    return (
      <footer className="bg-[#1A1A1A] border-t border-white/10 py-8 px-6 text-center space-y-2">
        <p className="text-white/30 text-sm">
          {`© 2026 Kalmio · ${t('footer.operatorLabel')}: `}
          <Link
            to="/terms"
            aria-label={t('footer.impressum')}
            className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 rounded"
          >
            {t('footer.operatorName')}
          </Link>
        </p>
        <p className="text-white/30 text-sm">
          <Link
            to="/privacy"
            className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 rounded"
          >
            {t('footer.privacy')}
          </Link>
          {' · '}
          <Link
            to="/terms"
            className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 rounded"
          >
            {t('footer.terms')}
          </Link>
          {' · '}
          <a
            href="https://status.kalmio.hu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 rounded"
          >
            {t('footer.status')}
          </a>
          {' · '}
          <button
            type="button"
            onClick={handleCookieSettings}
            className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1 rounded cursor-pointer bg-transparent border-none p-0 text-sm"
          >
            {t('footer.cookieSettings')}
          </button>
        </p>
      </footer>
    )
  }

  return (
    <footer className="border-t border-[#1A1A1A]/8 py-6 px-6 text-center space-y-1.5">
      <p className="text-[#1A1A1A]/30 text-sm">
        {`© 2026 Kalmio · ${t('footer.operatorLabel')}: `}
        <Link
          to="/terms"
          aria-label={t('footer.impressum')}
          className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
        >
          {t('footer.operatorName')}
        </Link>
      </p>
      <p className="text-[#1A1A1A]/30 text-sm">
        <Link
          to="/privacy"
          className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
        >
          {t('footer.privacy')}
        </Link>
        {' · '}
        <Link
          to="/terms"
          className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
        >
          {t('footer.terms')}
        </Link>
        {' · '}
        <a
          href="https://status.kalmio.hu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded"
        >
          {t('footer.status')}
        </a>
        {' · '}
        <button
          type="button"
          onClick={handleCookieSettings}
          className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-1 rounded cursor-pointer bg-transparent border-none p-0 text-sm"
        >
          {t('footer.cookieSettings')}
        </button>
      </p>
    </footer>
  )
}
