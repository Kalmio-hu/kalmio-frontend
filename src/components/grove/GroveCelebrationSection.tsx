/**
 * GroveCelebrationSection — KALMIO-145 / E6.6
 *
 * Rendered below the grove map on /app/grove for graduated users.
 * Contains:
 *  1. CertificateDownloadCard — download HU or EN graduation PDF
 *  2. PremiumTrialOfferCard   — 14-day premium trial CTA; hidden until W14
 *     (`PremiumFeatureGate` gates on the `premium_enabled` PostHog flag +
 *     `VITE_PREMIUM_ENABLED` build-time kill switch).  When either is off the
 *     slot collapses entirely so no dead CTA is visible. (KALMIO-288)
 *
 * Mobile-first stacked layout; side-by-side from sm breakpoint.
 */

import { useTranslation } from 'react-i18next'
import { CertificateDownloadCard } from './CertificateDownloadCard'
import { PremiumTrialOfferCard } from './PremiumTrialOfferCard'
import { PremiumFeatureGate } from '@/components/premium/PremiumFeatureGate'

export function GroveCelebrationSection() {
  const { t } = useTranslation()

  return (
    <section aria-label={t('grove.celebration.sectionLabel')} className="mt-6">
      <h2 className="sr-only">{t('grove.celebration.sectionLabel')}</h2>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Certificate download takes more horizontal space */}
        <div className="flex-1">
          <CertificateDownloadCard />
        </div>

        {/* Premium trial offer — only rendered when commerce funnel is live (W14). */}
        <PremiumFeatureGate>
          <div className="flex-1">
            <PremiumTrialOfferCard />
          </div>
        </PremiumFeatureGate>
      </div>
    </section>
  )
}
