/**
 * Route elements for Kalmio Move (contract §2). Every page is React.lazy so the
 * nutrition bundle does not grow (D8 rule 10). App.tsx mounts:
 *   /app/move/start               → <MoveStartRoute />   (outside OnboardingGate)
 *   /app/move/session/:sessionId  → <MovePlayerRoute />  (full screen, outside both shells)
 *   /app/move/*                   → <MoveRoutes />       (the shell with its four destinations)
 *   /move                         → <MoveLandingRoute /> (public)
 *   /app/admin/move/review        → <MoveReviewQueueRoute /> via src/pages/admin/MoveReviewQueue.tsx
 */
import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import { MOVE_HOME } from './lib/constants'

const MoveShell = lazy(() => import('./shell/MoveShell').then((m) => ({ default: m.MoveShell })))
const MoveToday = lazy(() => import('./pages/MoveToday').then((m) => ({ default: m.MoveToday })))
const MoveWeek = lazy(() => import('./pages/MoveWeek').then((m) => ({ default: m.MoveWeek })))
const MoveLibrary = lazy(() => import('./pages/MoveLibrary').then((m) => ({ default: m.MoveLibrary })))
const MoveProgress = lazy(() => import('./pages/MoveProgress').then((m) => ({ default: m.MoveProgress })))
const MoveSettings = lazy(() => import('./pages/MoveSettings').then((m) => ({ default: m.MoveSettings })))
const MoveHelper = lazy(() => import('./pages/MoveHelper').then((m) => ({ default: m.MoveHelper })))
const MoveSheet = lazy(() => import('./pages/MoveSheet').then((m) => ({ default: m.MoveSheet })))
const MoveDevices = lazy(() => import('./pages/MoveDevices').then((m) => ({ default: m.MoveDevices })))
const MoveStart = lazy(() => import('./pages/MoveStart').then((m) => ({ default: m.MoveStart })))
const MovePlayer = lazy(() => import('./pages/MovePlayer').then((m) => ({ default: m.MovePlayer })))
const MoveLanding = lazy(() => import('./pages/MoveLanding').then((m) => ({ default: m.MoveLanding })))
const MoveReviewQueuePage = lazy(() =>
  import('./pages/admin/MoveReviewQueuePage').then((m) => ({ default: m.MoveReviewQueuePage })),
)

function Fallback() {
  return (
    <div className="min-h-[40vh] w-full flex items-center justify-center" role="status">
      <Spinner className="border-[#2A9D8F]" />
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Fallback />}>{children}</Suspense>
}

/** The Move shell and its destinations; mount at `/app/move/*`. */
export function MoveRoutes() {
  return (
    <Routes>
      <Route element={<Lazy><MoveShell /></Lazy>}>
        <Route index element={<Lazy><MoveToday /></Lazy>} />
        <Route path="week" element={<Lazy><MoveWeek /></Lazy>} />
        <Route path="library" element={<Lazy><MoveLibrary /></Lazy>} />
        <Route path="progress" element={<Lazy><MoveProgress /></Lazy>} />
        <Route path="settings" element={<Lazy><MoveSettings /></Lazy>} />
        <Route path="helper" element={<Lazy><MoveHelper /></Lazy>} />
        <Route path="sheet" element={<Lazy><MoveSheet /></Lazy>} />
        <Route path="devices" element={<Lazy><MoveDevices /></Lazy>} />
        <Route path="*" element={<Navigate to={MOVE_HOME} replace />} />
      </Route>
    </Routes>
  )
}

export function MoveStartRoute() {
  return <Lazy><MoveStart /></Lazy>
}

export function MovePlayerRoute() {
  return <Lazy><MovePlayer /></Lazy>
}

export function MoveLandingRoute() {
  return <Lazy><MoveLanding /></Lazy>
}

export function MoveReviewQueueRoute() {
  return <Lazy><MoveReviewQueuePage /></Lazy>
}
