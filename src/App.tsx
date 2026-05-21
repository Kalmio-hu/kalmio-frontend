import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminRoute } from '@/components/AdminRoute'
import { LandingPage } from '@/pages/LandingPage'
import { Auth } from '@/pages/Auth'
import { AuthCallback } from '@/pages/AuthCallback'
import { Dashboard } from '@/pages/Dashboard'
import { Recipes } from '@/pages/Recipes'
import { Ingredients } from '@/pages/Ingredients'
import { ShoppingList } from '@/pages/ShoppingList'
import { Fridge } from '@/pages/Fridge'
import { Grooming } from '@/pages/Grooming'
import { RetailProducts } from '@/pages/RetailProducts'
import { Settings } from '@/pages/Settings'
import { Profile } from '@/pages/Profile'
import { Preferences } from '@/pages/Preferences'
import { UserManagement } from '@/pages/admin/UserManagement'
import { IpVault } from '@/pages/admin/IpVault'
import { ContentReview } from '@/pages/admin/ContentReview'
import { InvestorVault } from '@/pages/InvestorVault'
import { BlogIndex } from '@/pages/BlogIndex'
import { BlogPost } from '@/pages/BlogPost'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { OAuthConsent } from '@/pages/OAuthConsent'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { restorePasskeySession, clearPasskeyToken } from '@/lib/passkeySession'
import { usersService } from '@/services/users'
import { Toaster } from '@/components/ui/toast'
import { OfflineBanner } from '@/components/OfflineBanner'
import { CookieConsent } from '@/components/CookieConsent'
import { initAnalytics, identify, resetIdentity, registerSuperProperties, pageView } from '@/lib/analytics'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PlantingPreview } from '@/pages/_preview/PlantingPreview'
import { DiofaPreview } from '@/pages/_preview/DiofaPreview'
import { TasteSwipePreview } from '@/pages/_preview/TasteSwipePreview'
import { Grove } from '@/pages/Grove'
import { FoundingMember } from '@/pages/FoundingMember'
import { FoundingMemberSuccess } from '@/pages/FoundingMemberSuccess'
import { Family } from '@/pages/Family'
import { Plans } from '@/pages/Plans'
import { PlanCreate } from '@/pages/PlanCreate'
import { PlanDetail } from '@/pages/PlanDetail'
import { Schedules } from '@/pages/Schedules'
import { ScheduleNew } from '@/pages/ScheduleNew'
import { ScheduleDetail } from '@/pages/ScheduleDetail'
import { OnboardingShell } from '@/pages/onboarding/OnboardingShell'
import { ConversationalOnboarding } from '@/pages/onboarding/ConversationalOnboarding'
import { OnboardingGate } from '@/components/OnboardingGate'
import { MemberView } from '@/pages/MemberView'
import { ShoppingCart } from '@/pages/ShoppingCart'
import { CookMode } from '@/pages/CookMode'
import { Calendar } from '@/pages/Calendar'

initAnalytics()

// Register ?_test_source=... as a sticky super-property so test sessions
// are flagged on every event throughout the browser session.
const _testSource = new URLSearchParams(window.location.search).get('_test_source')
if (_testSource) {
  registerSuperProperties({ test_source: _testSource })
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const setAppRole = useAuthStore((s) => s.setAppRole)
  const session = useAuthStore((s) => s.session)
  const impersonationToken = useAuthStore((s) => s.impersonationToken)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        clearPasskeyToken()
        setSession(session)
        // Associate the PostHog anonymous profile with the authenticated user.
        identify(session.user.id)
      } else if (event === 'INITIAL_SESSION') {
        const restored = restorePasskeySession()
        setSession(restored)
        if (restored) {
          identify(restored.user.id)
        }
      } else {
        clearPasskeyToken()
        setSession(null)
        // Reset PostHog so the next anonymous session starts fresh.
        resetIdentity()
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  useEffect(() => {
    if (session) {
      usersService.getMe()
        .then(user => setAppRole(user.role))
        .catch(() => setAppRole('USER'))
    } else {
      setAppRole(null)
    }
  }, [session, impersonationToken, setAppRole])

  return <>{children}</>
}

/**
 * Fires a manual `$pageview` event on every route change.
 * Must be rendered inside BrowserRouter so useLocation() is available.
 * capture_pageview is disabled in PostHog init — we own all page view tracking.
 */
function PageViewTracker() {
  const location = useLocation()
  const { i18n } = useTranslation()
  const session = useAuthStore((s) => s.session)

  useEffect(() => {
    pageView(location.pathname, i18n.resolvedLanguage ?? i18n.language, !!session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return null
}

export default function App() {
  useDocumentTitle()

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <OfflineBanner />
      <BrowserRouter>
        <PageViewTracker />
        <CookieConsent />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route element={<ProtectedRoute />}>
              {/* Full-screen onboarding flow — no AppShell sidebar/nav chrome.
                  These routes are intentionally OUTSIDE OnboardingGate so that
                  new users can reach them before completing the flow. */}
              <Route path="/app/onboarding" element={<OnboardingShell />} />
              {/* Conversational onboarding alternative — E11.7, premium-only */}
              <Route path="/app/onboarding/conversational" element={<ConversationalOnboarding />} />
              {/* OnboardingGate — redirects first-time users to /app/onboarding.
                  Passes through for users who have completed or skipped onboarding.
                  See src/components/OnboardingGate.tsx — KALMIO-45. */}
              <Route element={<OnboardingGate />}>
                {/* Cook mode is rendered OUTSIDE AppShell so it can claim every
                    pixel for the phone-propped-in-the-kitchen experience. */}
                <Route path="/app/recipes/:id/cook" element={<CookMode />} />
                <Route path="/app" element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="recipes" element={<Recipes />} />
                  <Route path="ingredients" element={<Ingredients />} />
                  <Route path="shopping-list" element={<ShoppingList />} />
                  <Route path="fridge" element={<Fridge />} />
                  <Route path="grooming" element={<Grooming />} />
                  <Route path="retail-products" element={<RetailProducts />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="preferences" element={<Preferences />} />
                  <Route path="grove" element={<Grove />} />
                  <Route path="founding-member" element={<FoundingMember />} />
                  <Route path="founding-member/success" element={<FoundingMemberSuccess />} />
                  <Route path="family" element={<Family />} />
                  <Route path="cart" element={<ShoppingCart />} />
                  <Route path="members/:memberId" element={<MemberView />} />
                  <Route path="plans" element={<Plans />} />
                  <Route path="plans/new" element={<PlanCreate />} />
                  <Route path="plans/:id" element={<PlanDetail />} />
                  <Route path="schedules" element={<Schedules />} />
                  <Route path="schedules/new" element={<ScheduleNew />} />
                  <Route path="schedules/:id" element={<ScheduleDetail />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="_preview/planting" element={<PlantingPreview />} />
                  <Route path="_preview/diofa" element={<DiofaPreview />} />
                  <Route path="_preview/taste-swipe" element={<TasteSwipePreview />} />
                  <Route element={<AdminRoute />}>
                    <Route path="admin/users" element={<UserManagement />} />
                    <Route path="admin/ip-vault" element={<IpVault />} />
                    <Route path="admin/content-review" element={<ContentReview />} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route path="/oauth/consent" element={<OAuthConsent />} />
            <Route path="/vault" element={<InvestorVault />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
