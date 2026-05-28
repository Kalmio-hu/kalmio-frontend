import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import './index.css'
import './i18n'
import App from './App.tsx'
import { PersistingShell } from '@/components/PersistingShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistingShell>
      <App />
    </PersistingShell>
  </StrictMode>,
)

// Hide the native splash screen once React has painted its first frame.
// The HTML preloader (#kalmio-preloader) takes over seamlessly — both use
// #1A1A1A so the transition is invisible. requestAnimationFrame waits for
// the first real paint before dismissing, preventing any white flash.
requestAnimationFrame(() => {
  void SplashScreen.hide({ fadeOutDuration: 200 })
})
