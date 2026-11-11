import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { LegalFooter } from './LegalFooter'
import { ImpersonationBanner } from '@/components/ImpersonationBanner'
import { CsemeteWelcomeMoment } from '@/components/onboarding/CsemeteWelcomeMoment'
import { useCsemeteWelcomeMoment } from '@/hooks/useCsemeteWelcomeMoment'
import { PremiumTasterRevealBanner } from '@/components/premium/PremiumTasterRevealBanner'
import { usePremiumTaster } from '@/hooks/usePremiumTaster'
import { useMoveStatus } from '@/features/move'

export function AppShell() {
  const { shouldShow: showCsemeteWelcome, dismiss: dismissCsemeteWelcome } =
    useCsemeteWelcomeMoment()

  const {
    shouldShow: showPremiumTaster,
    tasterStage,
    dismiss: dismissPremiumTaster,
  } = usePremiumTaster()

  // "The application opens in the space used last" (movement-prd.md D8 rule 4).
  const { status: moveStatus, setLastSpace } = useMoveStatus()
  useEffect(() => {
    if (moveStatus.enabled && moveStatus.spaceActive && moveStatus.lastSpace !== 'NUTRITION') {
      void setLastSpace('NUTRITION')
    }
  }, [moveStatus.enabled, moveStatus.spaceActive, moveStatus.lastSpace, setLastSpace])

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#F9F7F2] pb-20 md:pb-0">
        <ImpersonationBanner />
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
        <LegalFooter variant="light" />
      </main>
      <MobileNav />

      {/* Csemete welcome moment — shown once per user after MAG → CSEMETE */}
      {showCsemeteWelcome && (
        <CsemeteWelcomeMoment onDismiss={dismissCsemeteWelcome} />
      )}

      {/* Premium taster reveal — shown once per stage transition (SUHANG / FIATAL / TERMO) */}
      {showPremiumTaster && tasterStage && (
        <PremiumTasterRevealBanner
          stage={tasterStage}
          onDismiss={dismissPremiumTaster}
        />
      )}
    </div>
  )
}
