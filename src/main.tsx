import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
