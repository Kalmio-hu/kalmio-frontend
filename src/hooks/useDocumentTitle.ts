import { isMoveHost } from '@/lib/hosts'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Sets document.title reactively from the i18n key `meta.tabTitle`.
 * Call once at the root of the component tree (App.tsx).
 * Re-runs whenever the active locale changes.
 */
export function useDocumentTitle() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = isMoveHost() ? t('meta.moveTabTitle') : t('meta.tabTitle')
  }, [t, i18n.language])
}
