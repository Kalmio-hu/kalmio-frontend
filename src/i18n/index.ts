import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './en.json'
import hu from './hu.json'
// Kalmio Move has its own namespace so the nutrition catalogue stays untouched
// and the feature can be lifted out later (movement-prd.md D8 rule 10).
import moveEn from '@/features/move/i18n/move.en.json'
import moveHu from '@/features/move/i18n/move.hu.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en, move: moveEn },
      hu: { translation: hu, move: moveHu },
    },
    ns: ['translation', 'move'],
    defaultNS: 'translation',
    fallbackLng: 'hu',
    detection: {
      order: ['cookie', 'localStorage'],
      lookupCookie: 'kalmio-lang',
      caches: ['cookie'],
      cookieMinutes: 525_600, // 1 year
    },
    interpolation: { escapeValue: false },
  })

export default i18n
